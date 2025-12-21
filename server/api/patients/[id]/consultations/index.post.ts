import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { consultations, patients, users } from '~~/server/database/schema'

// Create a simplified schema for API that matches database table
const consultationInsertSchema = consultationCreateSchema
  .pick({
    patientId: true,
    treatmentPlanId: true,
    date: true,
    startTime: true,
    duration: true,
    type: true,
    location: true,
    chiefComplaint: true,
    notes: true,
    treatmentSummary: true,
    observations: true,
    nextSteps: true,
    painLevelBefore: true,
    painLevelAfter: true,
    progressNotes: true,
    therapistId: true,
    status: true,
    billed: true,
    insuranceClaimed: true,
    cost: true
  })
  .partial({
    therapistId: true // Make therapistId truly optional
  })
import type { Session } from '~~/shared/types/auth.types'

// POST /api/patients/[id]/consultations - Create new consultation
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

  try {
    // Verify patient exists and belongs to organization
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.organizationId, activeOrganizationId), eq(patients.id, patientId)))
      .limit(1)

    if (!patient) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Patient not found'
      })
    }

    // Get request body
    const body = await readBody(event)

    // Parse and validate request body
    const validatedData = consultationInsertSchema.parse({
      ...body,
      patientId
    })

    // Handle therapistId - if provided, validate it's a valid user ID
    let therapistId = validatedData.therapistId
    if (therapistId) {
      // Check if therapistId is a valid user ID
      const [therapist] = await db.select().from(users).where(eq(users.id, therapistId)).limit(1)

      if (!therapist) {
        // If not a valid user ID, set to null
        throw createError({ message: 'Therapeute introuvable', statusCode: 500 })
      }
    }

    // Convert date to timestamp for database
    const consultationData = {
      ...validatedData,
      organizationId: activeOrganizationId,
      date: validatedData.date,
      therapistId // Use the processed therapistId (can be null or undefined)
    }

    // Create consultation
    const [newConsultation] = await db.insert(consultations).values(consultationData).returning()

    return {
      data: newConsultation,
      message: 'Consultation created successfully'
    }
  } catch (error: any) {
    console.error('Error creating consultation:', error)

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid consultation data',
        data: error.issues
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create consultation'
    })
  }
})
