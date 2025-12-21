import type { Session } from '~~/shared/types/auth.types'
import { treatmentPlans, patients } from '~~/server/database/schema'
import { eq, and, isNull } from 'drizzle-orm'

// POST /api/patients/[id]/treatment-plans - Create new treatment plan
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')

  if (!patientId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Patient ID is required'
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
      statusMessage: 'Unauthorized'
    })
  }

  // Get active organization ID from session
  const activeOrganizationId = (session as Session)?.session?.activeOrganizationId
  if (!activeOrganizationId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
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
      statusMessage: 'Patient not found'
    })
  }

  try {
    // Validate input
    const body = await readValidatedBody(event, treatmentPlanCreateSchema.parse)

    // Use org ID from request body or fallback to session
    const validatedData = {
      ...body,
      organizationId: body.organizationId || activeOrganizationId
    }

    // Create treatment plan
    const [newTreatmentPlan] = await db.insert(treatmentPlans).values(validatedData).returning()

    return newTreatmentPlan
  } catch (error: any) {
    console.error('Error creating treatment plan:', error)
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid treatment plan data',
        data: error.errors
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create treatment plan'
    })
  }
})
