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

    const body = await readValidatedBody(event, updateClinicalNotesActionSchema.parse)

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

    if (session.status === 'pre_session' && body.observations !== undefined) {
      throw createError({
        statusCode: 400,
        message: 'Cannot update observations in pre_session status'
      })
    }
    if ((session.status === 'pre_session' || session.status === 'in_progress') && body.nextSteps !== undefined) {
      throw createError({
        statusCode: 400,
        message: 'Cannot update next steps before session is finished'
      })
    }

    const [updated] = await db
      .update(treatmentSessions)
      .set({
        ...(body.primaryConcern !== undefined && { primaryConcern: body.primaryConcern }),
        ...(body.treatmentSummary !== undefined && { treatmentSummary: body.treatmentSummary }),
        ...(body.observations !== undefined && { observations: body.observations }),
        ...(body.nextSteps !== undefined && { nextSteps: body.nextSteps })
      })
      .where(and(eq(treatmentSessions.organizationId, organizationId), eq(treatmentSessions.id, id)))
      .returning()

    if (!updated) {
      throw createError({
        statusCode: 404,
        message: 'Failed to update treatment session'
      })
    }

    return successResponse(updated, 'Notes cliniques mises à jour')
  } catch (error: unknown) {
    handleApiError(error, 'Failed to update clinical notes')
  }
})
