import { eq, and } from 'drizzle-orm'
import { appointments } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const { organizationId } = await requireAuthWithOrg(event)

  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Appointment ID is required' })
  }

  const [appointment] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
    .limit(1)

  if (!appointment) {
    throw createError({ statusCode: 404, message: 'Rendez-vous non trouvé' })
  }

  if (appointment.status === 'finished') {
    throw createError({ statusCode: 400, message: "Impossible d'annuler une séance terminée" })
  }
  if (appointment.status === 'cancelled') {
    throw createError({ statusCode: 400, message: 'Le rendez-vous est déjà annulé' })
  }

  const [updated] = await db
    .update(appointments)
    .set({
      status: 'cancelled',
      primaryConcern: null,
      sessionNotes: null,
      observations: null,
      painLevelBefore: null,
      painLevelAfter: null,
      actualStartTime: null,
      actualDurationSeconds: null,
      totalPausedSeconds: null,
      pauseStartTime: null,
      extendedDurationMinutes: 0,
      priceCents: 0,
      cancelledAt: new Date()
    })
    .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Échec de la mise à jour' })
  }

  return successResponse(updated, 'Session annulée')
})
