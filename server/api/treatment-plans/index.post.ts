import { treatmentPlans, patients, organizations } from '~~/server/database/schema'
import { eq, and, isNull } from 'drizzle-orm'

// POST /api/treatment-plans - Create new treatment plan
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    // 1. Validate input
    const body = await readValidatedBody(event, treatmentPlanCreateSchema.parse)

    // 2. Require current user and organization from session
    const { organizationId } = await requireAuthWithOrg(event)

    // 3. Verify patient exists and belongs to the organization
    const [patient] = await db
      .select()
      .from(patients)
      .where(
        and(eq(patients.id, body.patientId), eq(patients.organizationId, organizationId), isNull(patients.deletedAt))
      )
      .limit(1)

    if (!patient) {
      throw createError({
        statusCode: 404,
        message: 'Patient introuvable'
      })
    }

    let pricing: RateCent

    //4. Determine pricing: use provided pricing or fall back to org defaults
    if (body.pricing) {
      pricing = body.pricing
    } else {
      const [organization] = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1)

      if (!organization) {
        throw createError({
          statusCode: 404,
          message: 'Organisation introuvable'
        })
      }
      pricing = organization.pricing.rateCent
    }

    // Use org ID from request body or fallback to session
    const validatedData = {
      ...body,
      organizationId,
      pricing
    }

    // Create treatment plan
    const [newTreatmentPlan] = await db.insert(treatmentPlans).values(validatedData).returning()

    return newTreatmentPlan
  } catch (error) {
    handleApiError(error, 'Erreur lors de la création du plan de traitement')
  }
})
