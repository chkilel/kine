import { eq, and } from 'drizzle-orm'
import { appointments } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const appointmentId = getRouterParam(event, 'id')

  if (!appointmentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Appointment ID is required'
    })
  }

  try {
    const { organizationId } = await requireAuthWithOrg(event)

    const [existingAppointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, appointmentId), eq(appointments.organizationId, organizationId)))
      .limit(1)

    if (!existingAppointment) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Rendez-vous introuvable'
      })
    }

    const body = await readValidatedBody(event, insurancePaymentInputSchema.parse)

    const [updatedAppointment] = await db
      .update(appointments)
      .set({
        coPayPaidCents: body.coPayPaidCents,
        insurancePaidCents: body.insurancePaidCents,
        updatedAt: new Date()
      })
      .where(eq(appointments.id, appointmentId))
      .returning()

    return updatedAppointment
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la mise à jour des paiements')
  }
})
