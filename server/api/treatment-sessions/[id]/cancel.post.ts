import { eq, and } from 'drizzle-orm'
import { treatmentSessions } from '~~/server/database/schema'

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

    const [updated] = await db
      .update(treatmentSessions)
      .set({
        status: 'canceled',
        primaryConcern: null,
        treatmentSummary: null,
        observations: null,
        nextSteps: null,
        painLevelBefore: null,
        painLevelAfter: null,
        actualStartTime: null,
        actualDurationSeconds: null,
        totalPausedSeconds: null,
        pauseStartTime: null,
        extendedDurationMinutes: 0,
        tags: null,
        billed: null,
        insuranceClaimed: false,
        cost: null
      })
      .where(and(eq(treatmentSessions.organizationId, organizationId), eq(treatmentSessions.id, id)))
      .returning()

    if (!updated) {
      throw createError({
        statusCode: 404,
        message: 'Failed to update treatment session'
      })
    }

    return successResponse(updated, 'Session annulée')
  } catch (error: unknown) {
    handleApiError(error, 'Failed to cancel treatment session')
  }
})
