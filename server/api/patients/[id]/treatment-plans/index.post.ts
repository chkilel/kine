import { treatmentPlans, patients } from '~~/server/database/schema'
import { eq, and, isNull } from 'drizzle-orm'

// POST /api/patients/[id]/treatment-plans - Create new treatment plan
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')

  try {
    // 1. Validate patient ID
    if (!patientId) {
      throw createError({
        statusCode: 400,
        message: 'Patient ID is required'
      })
    }

    // 2. Validate input
    const body = await readValidatedBody(event, treatmentPlanCreateSchema.parse)

    // 3. Require current user and organization from session
    const { organizationId } = await requireAuth(event)

    // 4. Verify patient exists and belongs to the organization
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.organizationId, organizationId), isNull(patients.deletedAt)))
      .limit(1)

    if (!patient) {
      throw createError({
        statusCode: 404,
        message: 'Patient not found'
      })
    }

    // Use org ID from request body or fallback to session
    const validatedData = {
      ...body,
      organizationId
    }

    // Create treatment plan
    const [newTreatmentPlan] = await db.insert(treatmentPlans).values(validatedData).returning()

    return newTreatmentPlan
  } catch (error) {
    handleApiError(error)
  }
})
