import { eq, and } from 'drizzle-orm'
import { treatmentPlans } from '~~/server/database/schema'

// DELETE /api/treatment-plans/[id] - Delete treatment plan
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const planId = getRouterParam(event, 'id')

  try {
    // 1. Validate plan ID
    if (!planId) {
      throw createError({
        statusCode: 400,
        message: 'ID de plan de traitement requis'
      })
    }

    // 2. Require current user and organization from session
    const { organizationId } = await requireAuth(event)

    // 3. Check if plan exists and belongs to organization
    const [existingPlan] = await db
      .select()
      .from(treatmentPlans)
      .where(and(eq(treatmentPlans.id, planId), eq(treatmentPlans.organizationId, organizationId)))
      .limit(1)

    if (!existingPlan) {
      throw createError({
        statusCode: 404,
        message: 'Plan de traitement introuvable'
      })
    }

    // 4. Delete treatment plan
    await db
      .delete(treatmentPlans)
      .where(and(eq(treatmentPlans.id, planId), eq(treatmentPlans.organizationId, organizationId)))

    return deletedResponse('Plan de traitement supprimé avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la suppression du plan de traitement')
  }
})
