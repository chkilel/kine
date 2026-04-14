import { treatmentPlans, insuranceCompanies } from '~~/server/database/schema'
import { eq, and, isNull } from 'drizzle-orm'

// PUT /api/treatment-plans/[id] - Update existing treatment plan
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const planId = getRouterParam(event, 'id')

  try {
    if (!planId) {
      throw createError({
        statusCode: 400,
        message: 'ID de plan de traitement requis'
      })
    }

    const { organizationId } = await requireAuthWithOrg(event)

    // Verify treatment plan exists and belongs to organization
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

    // Validate input
    const body = await readValidatedBody(event, treatmentPlanUpdateSchema.parse)

    // Validate insurance company if provided
    if (body.insuranceCompanyId !== undefined) {
      if (body.insuranceCompanyId === null) {
        // Allowing removal of insurance company
      } else {
        const [insuranceCompany] = await db
          .select()
          .from(insuranceCompanies)
          .where(
            and(
              eq(insuranceCompanies.id, body.insuranceCompanyId),
              eq(insuranceCompanies.organizationId, organizationId),
              isNull(insuranceCompanies.deletedAt)
            )
          )
          .limit(1)

        if (!insuranceCompany) {
          throw createError({
            statusCode: 400,
            message: "Compagnie d'assurance introuvable ou n'appartient pas à cette organisation"
          })
        }

        if (insuranceCompany.status !== 'active') {
          throw createError({
            statusCode: 400,
            message: "Seules les compagnies d'assurance actives peuvent être associées aux plans de traitement"
          })
        }
      }
    }

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
