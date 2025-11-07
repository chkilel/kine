import type { Session } from '~~/shared/types/auth.types'
import { treatmentPlans, patients } from '~~/server/database/schema'
import { treatmentPlanCreateSchema } from '~~/shared/types/patient.types'
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
    // Read raw body first to preprocess dates
    const rawBody = await readBody(event)

    // Convert date strings to Date objects before validation
    const processedBody = {
      patientId,
      title: rawBody.title,
      diagnosis: rawBody.diagnosis,
      objective: rawBody.objective || undefined,
      startDate: rawBody.startDate ? new Date(rawBody.startDate) : new Date(),
      endDate: rawBody.endDate ? new Date(rawBody.endDate) : undefined,
      numberOfSessions: rawBody.numberOfSessions || undefined,
      sessionFrequency: rawBody.sessionFrequency || undefined,
      status: rawBody.status || 'planned',
      prescribingDoctor: rawBody.prescribingDoctor || undefined,
      therapist: rawBody.therapist || undefined,
      prescriptionDate: rawBody.prescriptionDate ? new Date(rawBody.prescriptionDate) : undefined,
      painLevel: rawBody.painLevel || undefined,
      coverageStatus: rawBody.coverageStatus || undefined,
      insuranceInfo: rawBody.insuranceInfo || undefined,
      notes: rawBody.notes || undefined
    }

    // Validate input
    const body = treatmentPlanCreateSchema.parse(processedBody)

    // Convert undefined to null for database insertion
    const validatedData = {
      ...body,
      organizationId: activeOrganizationId,
      objective: body.objective || null,
      endDate: body.endDate || null,
      numberOfSessions: body.numberOfSessions || null,
      sessionFrequency: body.sessionFrequency || null,
      prescribingDoctor: body.prescribingDoctor || null,
      therapist: body.therapistId || null,
      prescriptionDate: body.prescriptionDate || null,
      painLevel: body.painLevel || null,
      coverageStatus: body.coverageStatus || null,
      insuranceInfo: body.insuranceInfo || null,
      notes: body.notes || null
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
