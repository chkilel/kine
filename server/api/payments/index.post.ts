import { eq, and, sql, isNull, inArray } from 'drizzle-orm'
import { payments, appointmentPaymentItems, appointments } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { userId, organizationId } = await requireAuthWithOrg(event)

  const body = await readValidatedBody(event, paymentRequestBodySchema.parse)
  const { type, amountCents, method, appointmentItems, patientId } = body

  const requiresSessionItems = type === 'session_payment' || type === 'session_refund'
  const forbidsSessionItems = type === 'deposit_add' || type === 'deposit_refund'
  const hasSessionItems = appointmentItems && appointmentItems.length > 0
  const hasManySessionItems = appointmentItems && appointmentItems.length > 1

  if (requiresSessionItems) {
    if (!hasSessionItems) {
      throw createError({
        statusCode: 400,
        message: `Session items required for ${type} type`
      })
    }
    const sessionItemsTotal = appointmentItems.reduce((sum, item) => sum + item.amountCents, 0)
    if (sessionItemsTotal !== amountCents) {
      throw createError({ statusCode: 400, message: 'Session items total must equal payment amount' })
    }
  }

  if (forbidsSessionItems && hasSessionItems) {
    throw createError({
      statusCode: 400,
      message:
        type === 'deposit_refund'
          ? 'Session items not allowed for deposit_refund type (refunds apply to unused deposit credit only)'
          : 'Session items not allowed for deposit_add type'
    })
  }

  if (method === 'deposit') {
    if (type !== 'session_payment') {
      throw createError({ statusCode: 400, message: 'Deposit method can only be used with session_payment type' })
    }

    const result = await db
      .select({
        balance: sql<number>`
          SUM(CASE WHEN ${payments.type} = 'deposit_add' THEN ${payments.amountCents} ELSE 0 END)
          - SUM(CASE WHEN ${payments.type} = 'session_payment' AND ${payments.method} = 'deposit' THEN ${payments.amountCents} ELSE 0 END)
          - SUM(CASE WHEN ${payments.type} = 'deposit_refund' THEN ${payments.amountCents} ELSE 0 END)
        `
      })
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, organizationId),
          eq(payments.patientId, patientId),
          inArray(payments.type, ['deposit_add', 'session_payment', 'deposit_refund']),
          isNull(payments.voidedAt)
        )
      )

    const balance = result[0]?.balance ?? 0
    if (balance < amountCents) {
      throw createError({ statusCode: 409, message: 'Insufficient credit balance' })
    }

    if (hasManySessionItems) {
      const appointmentPrices = await db
        .select({ id: appointments.id, priceCents: appointments.priceCents })
        .from(appointments)
        .where(
          and(
            eq(appointments.organizationId, organizationId),
            inArray(
              appointments.id,
              appointmentItems.map((i) => i.appointmentId)
            )
          )
        )

      for (const item of appointmentItems) {
        const appt = appointmentPrices.find((a) => a.id === item.appointmentId)
        if (appt && item.amountCents < appt.priceCents) {
          throw createError({
            statusCode: 409,
            message: 'Credit payment must cover the full cost of each session'
          })
        }
      }
    }
  }

  const receiptNumber = await generateReceiptNumber(event, organizationId)

  const [payment] = await db
    .insert(payments)
    .values({
      organizationId,
      patientId,
      recordedById: userId,
      amountCents,
      type,
      method,
      notes: body.notes,
      paidOn: body.paidOn || getTodayAsString(),
      receiptNumber,
      currency: 'MAD'
    })
    .returning()

  if (!payment) throw createError({ statusCode: 500, message: 'Failed to create payment' })

  if (!hasSessionItems) return { payment, receiptNumber }

  try {
    await db.batch([
      db.insert(appointmentPaymentItems).values(
        appointmentItems.map((item) => ({
          paymentId: payment.id,
          appointmentId: item.appointmentId,
          amountCents: item.amountCents
        }))
      ),
      ...(requiresSessionItems
        ? [
            db
              .update(appointments)
              .set({ status: 'completed' })
              .where(
                and(
                  inArray(
                    appointments.id,
                    appointmentItems.map((i) => i.appointmentId)
                  ),
                  eq(appointments.status, 'finished')
                )
              )
          ]
        : [])
    ])
  } catch {
    await db.delete(payments).where(eq(payments.id, payment.id))
    throw createError({ statusCode: 500, message: 'Failed to record payment details, payment has been rolled back' })
  }

  return { payment, receiptNumber }
})
