import type { Session } from '~~/shared/types/auth.types'
import { treatmentPlans, patients } from '~~/server/database/schema'
import { eq, and, isNull } from 'drizzle-orm'

// PUT /api/patients/[id]/treatment-plans/[planId] - Update existing treatment plan
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')
  const planId = getRouterParam(event, 'planId')

  if (!patientId || !planId) {
    throw createError({
      statusCode: 400,
      message: 'Patient ID and Plan ID are required'
    })
  }

  // Get current user and organization from session
  const auth = createAuth(event)
  const session = await auth.api.getSession({
    headers: getHeaders(event) as any
  })

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  // Get active organization ID from session
  const activeOrganizationId = (session as Session)?.session?.activeOrganizationId
  if (!activeOrganizationId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden'
    })
  }

  // Verify patient exists and belongs to the organization
  const [patient] = await db
    .select()
    .from(patients)
    .where(
      and(eq(patients.id, patientId), eq(patients.organizationId, activeOrganizationId), isNull(patients.deletedAt))
    )
    .limit(1)

  if (!patient) {
    throw createError({
      statusCode: 404,
      message: 'Patient not found'
    })
  }

  // Verify treatment plan exists and belongs to the patient
  const [existingPlan] = await db
    .select()
    .from(treatmentPlans)
    .where(and(eq(treatmentPlans.id, planId), eq(treatmentPlans.patientId, patientId)))
    .limit(1)

  if (!existingPlan) {
    throw createError({
      statusCode: 404,
      message: 'Treatment plan not found'
    })
  }

  try {
    // Validate input
    const body = await readValidatedBody(event, treatmentPlanUpdateSchema.parse)

    // Update treatment plan
    const [updatedTreatmentPlan] = await db
      .update(treatmentPlans)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(treatmentPlans.id, planId))
      .returning()

    return updatedTreatmentPlan
  } catch (error: any) {
    console.error('Error updating treatment plan:', error)
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        message: 'Invalid treatment plan data',
        data: error.errors
      })
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to update treatment plan'
    })
  }
})
