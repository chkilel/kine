import { eq, and } from 'drizzle-orm'
import { appointments } from '~~/server/database/schema'
import { getCurrentTimeHHMMSS, calculateTimeDifference } from '~~/shared/utils/time'

function calculateFinalDuration(appointment: Appointment, providedDuration?: number): number {
  if (providedDuration !== undefined) {
    return providedDuration
  }

  if (!appointment.actualStartTime) {
    throw createError({ statusCode: 400, message: "Impossible de calculer la durée: pas d'heure de début" })
  }

  const currentTime = getCurrentTimeHHMMSS()
  const elapsedSeconds = calculateTimeDifference(appointment.actualStartTime, currentTime)
  let totalPaused = appointment.totalPausedSeconds || 0

  if (appointment.pauseStartTime) {
    const currentPauseDuration = calculateTimeDifference(appointment.pauseStartTime, currentTime)
    totalPaused += currentPauseDuration
  }

  return Math.max(0, elapsedSeconds - totalPaused)
}

export default defineEventHandler(async (event) => {
  const { organizationId } = await requireAuthWithOrg(event)

  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Appointment ID is required' })
  }

  const body = await readValidatedBody(event, endActionSchema.parse)

  const [appointment] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
    .limit(1)

  if (!appointment) {
    throw createError({ statusCode: 404, message: 'Rendez-vous non trouvé' })
  }

  if (appointment.status !== 'in_progress') {
    throw createError({ statusCode: 400, message: 'La séance est déjà terminée ou complétée' })
  }

  const finalDurationSeconds = calculateFinalDuration(appointment, body.actualDurationSeconds)

  const [updated] = await db
    .update(appointments)
    .set({
      status: 'finished',
      actualDurationSeconds: finalDurationSeconds,
      painLevelAfter: body.painLevelAfter,
      totalPausedSeconds: appointment.totalPausedSeconds,
      pauseStartTime: null
    })
    .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Échec de la mise à jour' })
  }

  return successResponse(updated, 'Session terminée avec succès')
})
