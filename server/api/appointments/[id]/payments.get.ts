import { eq, and, isNull } from 'drizzle-orm'
import { payments, appointmentPaymentItems, appointments } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const appointmentId = getRouterParam(event, 'id')
    if (!appointmentId) {
      throw createError({ statusCode: 400, message: 'Appointment ID required' })
    }

    const [appointment] = await db
      .select({ id: appointments.id, organizationId: appointments.organizationId })
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1)

    if (!appointment) {
      throw createError({ statusCode: 404, message: 'Rendez-vous introuvable' })
    }

    if (appointment.organizationId !== organizationId) {
      throw createError({ statusCode: 403, message: 'Accès refusé' })
    }

    const appointmentPayments = await db
      .select({
        id: payments.id,
        receiptNumber: payments.receiptNumber,
        type: payments.type,
        amountCents: payments.amountCents,
        method: payments.method,
        paidOn: payments.paidOn,
        notes: payments.notes,
        createdAt: payments.createdAt
      })
      .from(appointmentPaymentItems)
      .innerJoin(payments, eq(appointmentPaymentItems.paymentId, payments.id))
      .where(and(eq(appointmentPaymentItems.appointmentId, appointmentId), isNull(payments.voidedAt)))

    const ama = listResponse(appointmentPayments)
    return ama
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la récupération des paiements')
  }
})
