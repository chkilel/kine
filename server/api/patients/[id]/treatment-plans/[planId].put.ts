import { treatmentPlans, patients } from '~~/server/database/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { requireAuth } from '~~/server/utils/auth'
import { handleApiError } from '~~/server/utils/error'
import { successResponse } from '~~/server/utils/response'

// PUT /api/patients/[id]/treatment-plans/[planId] - Update existing treatment plan
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')
  const planId = getRouterParam(event, 'planId')

  try {
    if (!patientId || !planId) {
      throw createError({
        statusCode: 400,
        message: 'ID de patient et ID de plan de traitement requis'
      })
    }

    const { organizationId } = await requireAuth(event)

    // Verify patient exists and belongs to organization
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.organizationId, organizationId), isNull(patients.deletedAt)))
      .limit(1)

    if (!patient) {
      throw createError({
        statusCode: 404,
        message: 'Patient introuvable'
      })
    }

    // Verify treatment plan exists and belongs to patient
    const [existingPlan] = await db
      .select()
      .from(treatmentPlans)
      .where(and(eq(treatmentPlans.id, planId), eq(treatmentPlans.patientId, patientId)))
      .limit(1)

    if (!existingPlan) {
      throw createError({
        statusCode: 404,
        message: 'Plan de traitement introuvable'
      })
    }

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

    return successResponse(updatedTreatmentPlan, 'Plan de traitement mis à jour avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la mise à jour du plan de traitement')
  }
})
