import { eq, sql } from 'drizzle-orm'
import { payments, appointmentPaymentItems, appointments } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { userId } = await requireAuthWithOrg(event)

  try {
    const paymentId = getRouterParam(event, 'id')
    if (!paymentId) {
      throw createError({ statusCode: 400, message: 'Payment ID required' })
    }

    const [paymentRows, appointmentItemRows] = await db.batch([
      db.select().from(payments).where(eq(payments.id, paymentId)).limit(1),
      db
        .select({
          appointmentId: appointmentPaymentItems.appointmentId,
          amountCents: appointmentPaymentItems.amountCents
        })
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

    // Void the payment and decrement cached paidCents for each affected appointment.
    // session_payment was added to the cache at creation, so subtract on void.
    await db.batch([
      db.update(payments).set({ voidedAt: new Date(), voidedById: userId }).where(eq(payments.id, paymentId)),
      ...appointmentItemRows.map((item) =>
        db
          .update(appointments)
          .set({
            paidCents: sql<number>`MAX(${appointments.paidCents} - ${item.amountCents}, 0)`
          })
          .where(eq(appointments.id, item.appointmentId))
      )
    ])

    return { message: 'Payment voided successfully' }
  } catch (error) {
    handleApiError(error, "Erreur lors de l'annulation du paiement")
  }
})
