import { z } from 'zod'
import { eq, and, ne } from 'drizzle-orm'
import { consultations, patients, users } from '~~/server/database/schema'

// POST /api/patients/[id]/consultations - Create new consultation
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')

  if (!patientId) {
    throw createError({
      statusCode: 400,
      message: 'Patient ID is required'
    })
  }

  // Get current user and organization from session
  const { organizationId } = await requireAuth(event)

  try {
    // Verify patient exists and belongs to organization
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.organizationId, organizationId), eq(patients.id, patientId)))
      .limit(1)

    if (!patient) {
      throw createError({
        statusCode: 404,
        message: 'Patient not found'
      })
    }

    // Get request body
    const body = await readBody(event)

    // Handle therapistId - if provided, validate it's a valid user ID
    let therapistId = body.therapistId
    if (therapistId) {
      // Check if therapistId is a valid user ID
      const [therapist] = await db.select().from(users).where(eq(users.id, therapistId)).limit(1)

      if (!therapist) {
        // If not a valid user ID, set to null
        throw createError({ message: 'Therapeute introuvable', statusCode: 500 })
      }

      // Fetch therapist's gap configuration
      const [therapistWithGap] = await db
        .select({ consultationGapMinutes: users.consultationGapMinutes })
        .from(users)
        .where(eq(users.id, therapistId))
        .limit(1)

      const gapMinutes = therapistWithGap?.consultationGapMinutes || 15

      // Fetch existing consultations for conflict check
      const existingConsultations = await db
        .select({
          startTime: consultations.startTime,
          endTime: consultations.endTime
        })
        .from(consultations)
        .where(
          and(
            eq(consultations.therapistId, therapistId),
            eq(consultations.date, body.date),
            ne(consultations.status, 'cancelled')
          )
        )

      // Calculate end time for new consultation
      const endTime = calculateEndTime(body.startTime!, body.duration!)

      // Check for conflicts using therapist's configured gap
      const hasConflict = existingConsultations.some((existing) =>
        hasTimeConflict(existing.startTime!, existing.endTime!, body.startTime!, endTime, gapMinutes)
      )

      if (hasConflict) {
        throw createError({
          statusCode: 409,
          message: 'Ce créneau est déjà réservé. Veuillez sélectionner un autre horaire.'
        })
      }
    }

    // Convert date to timestamp for database
    const consultationData = {
      ...body,
      organizationId: organizationId,
      date: body.date,
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
        message: 'Invalid consultation data',
        data: error.issues
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to create consultation'
    })
  }
})
