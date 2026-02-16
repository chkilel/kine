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

    const [existingAppointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
      .limit(1)

    if (!existingAppointment) {
      throw createError({
        statusCode: 404,
        message: 'Rendez-vous introuvable'
      })
    }

    await db.delete(appointments).where(eq(appointments.id, id))

    return deletedResponse('Rendez-vous supprimé avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la suppression de la rendez-vous')
  }
})
