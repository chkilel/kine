import { eq, and } from 'drizzle-orm'
import { treatmentSessions, appointments } from '~~/server/database/schema'

function detectActionBySchema(body: unknown): TreatmentSessionActionType {
  if (resumeActionSchema.safeParse(body).success) return 'resume'
  if (pauseActionSchema.safeParse(body).success) return 'pause'
  if (endActionSchema.safeParse(body).success) return 'end'
  if (startActionSchema.safeParse(body).success) return 'start'
  if (updateTagsActionSchema.safeParse(body).success) return 'updateTags'
  if (extendActionSchema.safeParse(body).success) return 'extend'
  if (cancelActionSchema.safeParse(body).success) return 'cancel'

  throw createError({
    statusCode: 400,
    message: 'No valid action detected'
  })
}

function validateActionState(action: TreatmentSessionActionType, session: TreatmentSession) {
  switch (action) {
    case 'start':
      if (session.status !== 'pre_session') {
        throw createError({
          statusCode: 400,
          message: 'Can only start a session from pre_session status'
        })
      }
      break
    case 'pause':
      if (session.status !== 'in_progress') {
        throw createError({
          statusCode: 400,
          message: 'Cannot pause session - session is not in progress'
        })
      }
      if (session.pauseStartTime) {
        throw createError({
          statusCode: 400,
          message: 'Treatment session is already paused'
        })
      }
      break
    case 'resume':
      if (!session.pauseStartTime) {
        throw createError({
          statusCode: 400,
          message: 'Treatment session is not paused'
        })
      }
      break
    case 'end':
      if (session.status !== 'in_progress') {
        throw createError({
          statusCode: 400,
          message: 'Session is already finished or completed'
        })
      }
      break
    case 'cancel':
      if (session.status === 'finished' || session.status === 'completed') {
        throw createError({
          statusCode: 400,
          message: 'Cannot cancel a finished or completed session'
        })
      }
      if (session.status === 'canceled') {
        throw createError({
          statusCode: 400,
          message: 'Session is already canceled'
        })
      }
      break
    case 'updateTags':
    case 'extend':
      // No state validation needed for these actions
      break
  }
}

function getSuccessMessage(action: TreatmentSessionActionType): string {
  const messages: Record<TreatmentSessionActionType, string> = {
    start: 'Session démarrée avec succès',
    pause: 'Session mise en pause',
    resume: 'Session reprise',
    end: 'Session terminée avec succès',
    updateTags: 'Tags mis à jour',
    extend: 'Durée étendue avec succès',
    cancel: 'Session annulée'
  }
  return messages[action]
}

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  try {
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Treatment session ID is required'
      })
    }

    const body = await readValidatedBody(event, treatmentSessionPatchSchema.parse)

    // Fetch the treatment session
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

    const actionType = detectActionBySchema(body)
    validateActionState(actionType, session)

    let updateData: Partial<TreatmentSession> = {}

    switch (actionType) {
      case 'start': {
        const validated = startActionSchema.parse(body)
        updateData = {
          status: 'in_progress',
          actualStartTime: validated.actualStartTime,
          painLevelBefore: validated.painLevelBefore,
          actualDurationSeconds: 0,
          totalPausedSeconds: 0,
          pauseStartTime: null
        }
        break
      }
      case 'pause': {
        const validated = pauseActionSchema.parse(body)
        updateData = {
          pauseStartTime: validated.pauseStartTime
        }
        break
      }
      case 'resume': {
        const validated = resumeActionSchema.parse(body)
        updateData = {
          totalPausedSeconds: (session.totalPausedSeconds || 0) + validated.pauseDurationSeconds,
          pauseStartTime: null
        }
        break
      }
      case 'end': {
        const validated = endActionSchema.parse(body)
        const tagsValue = validated.tags && validated.tags.length > 0 ? JSON.stringify(validated.tags) : null

        // Calculate final duration if not provided
        let finalDurationSeconds = validated.actualDurationSeconds
        if (finalDurationSeconds === undefined && session.actualStartTime) {
          const currentTime = getCurrentTimeHHMMSS()
          const elapsedSeconds = calculateTimeDifference(session.actualStartTime, currentTime)
          let totalPaused = session.totalPausedSeconds || 0

          // If currently paused, add current pause duration
          if (session.pauseStartTime) {
            const currentPauseDuration = calculateTimeDifference(session.pauseStartTime, currentTime)
            totalPaused += currentPauseDuration
          }

          finalDurationSeconds = Math.max(0, elapsedSeconds - totalPaused)
        }

        updateData = {
          status: 'finished',
          actualDurationSeconds: finalDurationSeconds,
          tags: tagsValue,
          painLevelAfter: validated.painLevelAfter,
          treatmentSummary: validated.notes,
          totalPausedSeconds: session.totalPausedSeconds,
          pauseStartTime: null
        }
        break
      }
      case 'updateTags': {
        const validated = updateTagsActionSchema.parse(body)
        const tagsValue = validated.tags && validated.tags.length > 0 ? JSON.stringify(validated.tags) : null
        updateData = {
          tags: tagsValue
        }
        break
      }
      case 'extend': {
        const validated = extendActionSchema.parse(body)
        updateData = {
          extendedDurationMinutes: (session.extendedDurationMinutes || 0) + validated.extendedDurationMinutes
        }
        break
      }
      case 'cancel': {
        updateData = {
          status: 'canceled',
          pauseStartTime: null
        }
        break
      }
    }

    const [updated] = await db
      .update(treatmentSessions)
      .set(updateData)
      .where(and(eq(treatmentSessions.organizationId, organizationId), eq(treatmentSessions.id, id)))
      .returning()

    if (!updated) {
      throw createError({
        statusCode: 404,
        message: 'Failed to update treatment session'
      })
    }

    // Auto-transition from finished to completed when billed field is set
    if (updated.status === 'finished' && updated.billed) {
      const [transitioned] = await db
        .update(treatmentSessions)
        .set({ status: 'completed' })
        .where(and(eq(treatmentSessions.organizationId, organizationId), eq(treatmentSessions.id, id)))
        .returning()

      // If session was ended, update appointment status as well
      if (actionType === 'end') {
        await db
          .update(appointments)
          .set({ status: 'completed' })
          .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, session.appointmentId)))
      }

      return successResponse(transitioned, getSuccessMessage(actionType))
    }

    // If session was ended, update appointment status as well
    if (actionType === 'end') {
      await db
        .update(appointments)
        .set({ status: 'completed' })
        .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, session.appointmentId)))
    }

    return successResponse(updated, getSuccessMessage(actionType))
  } catch (error: unknown) {
    handleApiError(error, 'Failed to update treatment session')
  }
})
