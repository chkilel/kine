import { eq, and, isNull, inArray, ne } from 'drizzle-orm'
import { payments, paymentSessionItems, treatmentSessions } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { userId } = await requireAuthWithOrg(event)

  try {
    const paymentId = getRouterParam(event, 'id')
    if (!paymentId) {
      throw createError({ statusCode: 400, message: 'Payment ID required' })
    }

    const [paymentRows, sessionItemRows] = await db.batch([
      db.select().from(payments).where(eq(payments.id, paymentId)).limit(1),
      db
        .select({ treatmentSessionId: paymentSessionItems.treatmentSessionId })
        .from(paymentSessionItems)
        .where(eq(paymentSessionItems.paymentId, paymentId))
    ])

    const payment = paymentRows[0]
    if (!payment) {
      throw createError({ statusCode: 404, message: 'Payment not found' })
    }
    if (payment.voidedAt) {
      throw createError({ statusCode: 400, message: 'Payment is already voided' })
    }

    const sessionIds = sessionItemRows.map((i) => i.treatmentSessionId)

    const [, coveredRows] = await db.batch([
      db.update(payments).set({ voidedAt: new Date(), voidedById: userId }).where(eq(payments.id, paymentId)),

      ...(sessionIds.length > 0
        ? [
            db
              .selectDistinct({ treatmentSessionId: paymentSessionItems.treatmentSessionId })
              .from(paymentSessionItems)
              .innerJoin(payments, eq(payments.id, paymentSessionItems.paymentId))
              .where(
                and(
                  inArray(paymentSessionItems.treatmentSessionId, sessionIds),
                  eq(payments.type, 'payment'),
                  isNull(payments.voidedAt),
                  ne(paymentSessionItems.paymentId, paymentId)
                )
              )
          ]
        : [])
    ])

    const stillCoveredIds = new Set((coveredRows ?? []).map((r) => r.treatmentSessionId))
    const toRevert = sessionIds.filter((id) => !stillCoveredIds.has(id))

    if (toRevert.length > 0) {
      await db.update(treatmentSessions).set({ status: 'finished' }).where(inArray(treatmentSessions.id, toRevert))
    }

    return { message: 'Payment voided successfully' }
  } catch (error) {
    handleApiError(error, "Erreur lors de l'annulation du paiement")
  }
})
