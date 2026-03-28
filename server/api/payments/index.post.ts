import { eq, and, sql, isNull, inArray } from 'drizzle-orm'
import { payments, paymentSessionItems, treatmentSessions } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { userId, organizationId } = await requireAuthWithOrg(event)

  const body = await readValidatedBody(event, paymentRequestBodySchema.parse)
  const { type, amountCents, sessionItems, patientId } = body

  // Determine session item requirements based on payment type
  const requiresSessionItems = type === 'payment' || type === 'credit_usage'
  const forbidsSessionItems = type === 'deposit' || type === 'refund'
  const hasSessionItems = sessionItems && sessionItems.length > 0

  // Validate that payment and credit_usage types have required session items
  if (requiresSessionItems) {
    if (!hasSessionItems) {
      throw createError({ statusCode: 400, message: 'Session items required for payment and credit_usage types' })
    }
    const sessionItemsTotal = sessionItems.reduce((sum, item) => sum + item.amountCents, 0)
    if (sessionItemsTotal !== amountCents) {
      throw createError({ statusCode: 400, message: 'Session items total must equal payment amount' })
    }
  }

  // Validate that deposit and refund types don't have session items
  if (forbidsSessionItems && hasSessionItems) {
    throw createError({
      statusCode: 400,
      message:
        type === 'refund'
          ? 'Session items not allowed for refund type (refunds apply to unused deposit credit only)'
          : 'Session items not allowed for deposit type'
    })
  }

  // For credit_usage, check that patient has sufficient credit balance
  if (type === 'credit_usage') {
    const result = await db
      .select({
        balance: sql<number>`
          SUM(CASE WHEN \${payments.type} = 'deposit' THEN \${payments.amountCents} ELSE -\${payments.amountCents} END)
        `
      })
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, organizationId),
          eq(payments.patientId, patientId),
          inArray(payments.type, ['deposit', 'credit_usage']),
          isNull(payments.voidedAt)
        )
      )

    const balance = result[0]?.balance ?? 0
    if (balance < amountCents) {
      throw createError({ statusCode: 409, message: 'Insufficient credit balance' })
    }
  }

  // Generate unique receipt number for this organization
  const receiptNumber = await generateReceiptNumber(event, organizationId)

  // Create payment record in database
  const [payment] = await db
    .insert(payments)
    .values({
      organizationId,
      patientId,
      recordedById: userId,
      amountCents,
      type,
      method: body.method,
      notes: body.notes,
      paidOn: body.paidOn || getTodayAsString(),
      receiptNumber,
      currency: 'MAD'
    })
    .returning()

  if (!payment) throw createError({ statusCode: 500, message: 'Failed to create payment' })

  // If no session items, return early
  if (!hasSessionItems) return { payment, receiptNumber }

  try {
    // TODO: I need to test this with an intentional failure (e.g. a duplicate key) to confirm the throw behavior before relying on it in production for financial data.
    // Batch insert session items and update treatment session statuses
    await db.batch([
      db.insert(paymentSessionItems).values(
        sessionItems.map((item) => ({
          paymentId: payment.id,
          treatmentSessionId: item.treatmentSessionId,
          amountCents: item.amountCents
        }))
      ),
      ...(requiresSessionItems
        ? [
            db
              .update(treatmentSessions)
              .set({ status: 'completed' })
              .where(
                and(
                  inArray(
                    treatmentSessions.id,
                    sessionItems.map((i) => i.treatmentSessionId)
                  ),
                  eq(treatmentSessions.status, 'finished')
                )
              )
          ]
        : [])
    ])
  } catch (error) {
    // Rolle back payment
    await db.delete(payments).where(eq(payments.id, payment.id))
    throw createError({ statusCode: 500, message: 'Failed to record payment details, payment has been rolled back' })
  }

  return { payment, receiptNumber }
})
