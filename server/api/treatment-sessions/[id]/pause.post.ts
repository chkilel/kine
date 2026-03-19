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

    const body = await readValidatedBody(event, pauseActionSchema.parse)

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
        message: 'Cannot pause session - session is not in progress'
      })
    }
    if (session.pauseStartTime) {
      throw createError({
        statusCode: 400,
        message: 'Treatment session is already paused'
      })
    }

    const [updated] = await db
      .update(treatmentSessions)
      .set({
        pauseStartTime: body.pauseStartTime
      })
      .where(and(eq(treatmentSessions.organizationId, organizationId), eq(treatmentSessions.id, id)))
      .returning()

    if (!updated) {
      throw createError({
        statusCode: 404,
        message: 'Failed to update treatment session'
      })
    }

    return successResponse(updated, 'Session mise en pause')
  } catch (error: unknown) {
    handleApiError(error, 'Failed to pause treatment session')
  }
})
