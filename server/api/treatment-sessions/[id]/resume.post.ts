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

    const body = await readValidatedBody(event, resumeActionSchema.parse)

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

    if (!session.pauseStartTime) {
      throw createError({
        statusCode: 400,
        message: 'Treatment session is not paused'
      })
    }

    const [updated] = await db
      .update(treatmentSessions)
      .set({
        totalPausedSeconds: (session.totalPausedSeconds || 0) + body.pauseDurationSeconds,
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

    return successResponse(updated, 'Session reprise')
  } catch (error: unknown) {
    handleApiError(error, 'Failed to resume treatment session')
  }
})
