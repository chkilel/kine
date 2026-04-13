import { eq, and, isNull, inArray, ne } from 'drizzle-orm'
import { payments, appointmentPaymentItems, appointments } from '~~/server/database/schema'

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
        .select({ appointmentId: appointmentPaymentItems.appointmentId })
        .from(appointmentPaymentItems)
        .where(eq(appointmentPaymentItems.paymentId, paymentId))
    ])

    const payment = paymentRows[0]
    if (!payment) {
      throw createError({ statusCode: 404, message: 'Payment not found' })
    }
    if (payment.voidedAt) {
      throw createError({ statusCode: 400, message: 'Payment is already voided' })
    }

    if (payment.type === 'session_refund' || payment.type === 'deposit_refund') {
      throw createError({ statusCode: 400, message: 'Refund payments cannot be voided' })
    }

    if (payment.type === 'deposit_add') {
      throw createError({
        statusCode: 400,
        message: 'Les avances ne peuvent pas être annulées. Utilisez la fonction de remboursement.'
      })
    }

    const appointmentIds = sessionItemRows.map((i) => i.appointmentId)

    const [, coveredRows] = await db.batch([
      db.update(payments).set({ voidedAt: new Date(), voidedById: userId }).where(eq(payments.id, paymentId)),

      ...(appointmentIds.length > 0
        ? [
            db
              .selectDistinct({ appointmentId: appointmentPaymentItems.appointmentId })
              .from(appointmentPaymentItems)
              .innerJoin(payments, eq(payments.id, appointmentPaymentItems.paymentId))
              .where(
                and(
                  inArray(appointmentPaymentItems.appointmentId, appointmentIds),
                  eq(payments.type, 'session_payment'),
                  isNull(payments.voidedAt),
                  ne(appointmentPaymentItems.paymentId, paymentId)
                )
              )
          ]
        : [])
    ])

    const stillCoveredIds = new Set((coveredRows ?? []).map((r) => r.appointmentId))
    const toRevert = appointmentIds.filter((id) => !stillCoveredIds.has(id))

    if (toRevert.length > 0) {
      await db.update(appointments).set({ status: 'finished' }).where(inArray(appointments.id, toRevert))
    }

    return { message: 'Payment voided successfully' }
  } catch (error) {
    handleApiError(error, "Erreur lors de l'annulation du paiement")
  }
})
