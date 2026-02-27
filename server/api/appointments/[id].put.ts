import { eq, and } from 'drizzle-orm'
import { appointments } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID de rendez-vous requis'
      })
    }

    const { organizationId } = await requireAuth(event)
    const body = await readValidatedBody(event, appointmentUpdateSchema.parse)

    const [existingAppointment] = await db  
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.organizationId, organizationId)))
      .limit(1)

    if (!existingAppointment) {
      throw createError({
        statusCode: 404,
        message: 'Rendez-vous introuvable'
      })
    }

    const [updatedAppointment] = await db.update(appointments).set(body).where(eq(appointments.id, id)).returning()

    return successResponse(updatedAppointment, 'Rendez-vous mis à jour avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la mise à jour de la rendez-vous')
  }
})
