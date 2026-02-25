import { eq, and } from 'drizzle-orm'
import { appointments } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID de Rendez-vous requis'
      })
    }

    const { organizationId } = await requireAuth(event)
    const body = await readValidatedBody(event, appointmentStatusUpdateSchema.parse)

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
      .limit(1)

    if (!appointment) {
      throw createError({
        statusCode: 404,
        message: 'Appointment introuvable'
      })
    }

    // Build update data with timestamps based on status
    const updateData: AppointmentStatusUpdate = {}

    if (body.status) {
      updateData.status = body.status

      // Set timestamps based on status changes
      if (body.status === 'confirmed') {
        updateData.confirmedAt = new Date()
      } else if (body.status === 'cancelled') {
        updateData.cancelledAt = new Date()
      }
    }

    if (body.noShowReason !== undefined) {
      updateData.noShowReason = body.noShowReason
    }

    const [updated] = await db
      .update(appointments)
      .set(updateData)
      .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
      .returning()

    return successResponse(updated, 'Rendez-vous mis à jour avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la mise à jour du Rendez-vous')
  }
})
