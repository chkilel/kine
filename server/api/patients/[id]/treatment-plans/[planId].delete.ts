import { eq, and } from 'drizzle-orm'
import { treatmentPlans } from '~~/server/database/schema'

// DELETE /api/patients/[id]/treatment-plans/[planId] - Delete treatment plan
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')
  const planId = getRouterParam(event, 'planId')

  // 1. Validate patient and plan ID
  if (!patientId || !planId) {
    throw createError({
      statusCode: 400,
      message: 'Patient ID and Plan ID are required'
    })
  }

  // 2. Require current user and organization from session
  const { organizationId } = await requireAuth(event)

  try {
    // Delete treatment plan
    await db
      .delete(treatmentPlans)
      .where(and(eq(treatmentPlans.organizationId, organizationId), eq(treatmentPlans.id, planId)))

    return {
      message: 'Treatment plan deleted successfully'
    }
  } catch (error) {
    handleApiError(error)
  }
})
