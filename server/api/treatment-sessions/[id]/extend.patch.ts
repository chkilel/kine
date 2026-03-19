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

    const body = await readValidatedBody(event, extendActionSchema.parse)

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
        message: 'Can only extend a session that is in progress'
      })
    }

    const [updated] = await db
      .update(treatmentSessions)
      .set({
        extendedDurationMinutes: (session.extendedDurationMinutes || 0) + body.extendedDurationMinutes
      })
      .where(and(eq(treatmentSessions.organizationId, organizationId), eq(treatmentSessions.id, id)))
      .returning()

    if (!updated) {
      throw createError({
        statusCode: 404,
        message: 'Failed to update treatment session'
      })
    }

    return successResponse(updated, 'Durée étendue avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Failed to extend treatment session')
  }
})
