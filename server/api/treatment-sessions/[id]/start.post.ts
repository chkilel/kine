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

    const body = await readValidatedBody(event, startActionSchema.parse)

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

    if (session.status && session.status !== 'pre_session') {
      throw createError({
        statusCode: 400,
        message: 'Can only start a session from pre_session status'
      })
    }

    const [updated] = await db
      .update(treatmentSessions)
      .set({
        status: 'in_progress',
        actualStartTime: body.actualStartTime,
        painLevelBefore: body.painLevelBefore
      })
      .where(and(eq(treatmentSessions.organizationId, organizationId), eq(treatmentSessions.id, id)))
      .returning()

    if (!updated) {
      throw createError({
        statusCode: 404,
        message: 'Failed to update treatment session'
      })
    }

    const finalSession = await handleAutoTransitionAndAppointmentUpdate(db, organizationId, id, session, 'start')

    return successResponse(finalSession, 'Session démarrée avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Failed to start treatment session')
  }
})
