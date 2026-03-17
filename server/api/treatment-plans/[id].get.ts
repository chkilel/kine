import { eq, and } from 'drizzle-orm'
import { treatmentPlans } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Treatment plan ID is required'
      })
    }

    const { organizationId } = await requireAuthWithOrg(event)

    const [treatmentPlan] = await db
      .select()
      .from(treatmentPlans)
      .where(and(eq(treatmentPlans.organizationId, organizationId), eq(treatmentPlans.id, id)))
      .limit(1)

    if (!treatmentPlan) {
      throw createError({
        statusCode: 404,
        message: 'Treatment plan not found'
      })
    }

    return treatmentPlan
  } catch (error: unknown) {
    handleApiError(error, 'Failed to fetch treatment plan')
  }
})
