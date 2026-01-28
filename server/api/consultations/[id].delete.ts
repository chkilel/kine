import { eq, and } from 'drizzle-orm'
import { appointments, consultations } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID requis'
      })
    }

    const { organizationId } = await requireAuth(event)

    // Get consultation first
    const [consultation] = await db.select().from(consultations).where(eq(consultations.id, id)).limit(1)

    if (!consultation) {
      throw createError({
        statusCode: 404,
        message: 'Consultation introuvable'
      })
    }

    // Get linked appointment
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, consultation.appointmentId), eq(appointments.organizationId, organizationId)))
      .limit(1)

    if (appointment) {
      // Delete appointment
      await db.delete(appointments).where(eq(appointments.id, consultation.appointmentId))

      // Delete consultation (cascade will delete due to FK)
      await db.delete(consultations).where(eq(consultations.id, id))
    } else {
      throw createError({
        statusCode: 400,
        message: 'Impossible de supprimer: consultation introuvable'
      })
    }

    return successResponse({ id }, 'Consultation supprimée')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la suppression de la consultation')
  }
})
