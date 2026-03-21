import { eq, and } from 'drizzle-orm'
import { treatmentSessions } from '~~/server/database/schema'
import { getCurrentTimeHHMMSS, calculateTimeDifference } from '~~/shared/utils/time'

function calculateFinalDuration(session: TreatmentSession, providedDuration?: number): number {
  if (providedDuration !== undefined) {
    return providedDuration
  }

  if (!session.actualStartTime) {
    throw createError({
      statusCode: 400,
      message: 'Cannot calculate duration: session has no start time'
    })
  }

  const currentTime = getCurrentTimeHHMMSS()
  const elapsedSeconds = calculateTimeDifference(session.actualStartTime, currentTime)
  let totalPaused = session.totalPausedSeconds || 0

  if (session.pauseStartTime) {
    const currentPauseDuration = calculateTimeDifference(session.pauseStartTime, currentTime)
    totalPaused += currentPauseDuration
  }

  return Math.max(0, elapsedSeconds - totalPaused)
}

export default defineEventHandler(async (event) => {
  const { organizationId } = await requireAuthWithOrg(event)

  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Treatment session ID is required'
      })
    }

    const body = await readValidatedBody(event, endActionSchema.parse)

    const [session] = await db
      .select()
      .from(treatmentSessions)
      .where(and(eq(treatmentSessions.organizationId, organizationId), eq(treatmentSessions.id, id)))
      .limit(1)

    if (!session) {
      throw createError({
        statusCode: 404,
        message: 'Treatment session not found'
      })
    }

    if (session.status !== 'in_progress') {
      throw createError({
        statusCode: 400,
        message: 'Session is already finished or completed'
      })
    }

    const finalDurationSeconds = calculateFinalDuration(session, body.actualDurationSeconds)

    const [updated] = await db
      .update(treatmentSessions)
      .set({
        status: 'finished',
        actualDurationSeconds: finalDurationSeconds,
        painLevelAfter: body.painLevelAfter,
        totalPausedSeconds: session.totalPausedSeconds,
        pauseStartTime: null
      })
      .where(and(eq(treatmentSessions.organizationId, organizationId), eq(treatmentSessions.id, id)))
      .returning()

    if (!updated) {
      throw createError({
        statusCode: 404,
        message: 'Failed to update treatment session'
      })
    }

    const finalSession = await handleAutoTransitionAndAppointmentUpdate(db, organizationId, id, session, 'end')

    return successResponse(finalSession, 'Session terminée avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Failed to end treatment session')
  }
})
