import { eq, and, asc, isNull } from 'drizzle-orm'
import { consultations, rooms } from '~~/server/database/schema'

// GET /api/patients/[id]/consultations - List patient consultations
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
    // Parse and validate query parameters
    const validatedQuery = await getValidatedQuery(event, consultationQuerySchema.parse)

    // Build base query conditions
    const baseConditions = and(eq(consultations.organizationId, organizationId), eq(consultations.patientId, patientId))

    // Apply additional filters
    let whereConditions = baseConditions

    if (validatedQuery.treatmentPlanId) {
      whereConditions = and(whereConditions, eq(consultations.treatmentPlanId, validatedQuery.treatmentPlanId))
    } else {
      // Independent consultations
      whereConditions = and(whereConditions, isNull(consultations.treatmentPlanId))
    }

    if (validatedQuery.status) {
      whereConditions = and(whereConditions, eq(consultations.status, validatedQuery.status))
    }

    if (validatedQuery.type) {
      whereConditions = and(whereConditions, eq(consultations.type, validatedQuery.type))
    }

    // Execute query with room join
    const consultationsList = await db
      .select({
        id: consultations.id,
        organizationId: consultations.organizationId,
        patientId: consultations.patientId,
        treatmentPlanId: consultations.treatmentPlanId,
        therapistId: consultations.therapistId,
        roomId: consultations.roomId,
        date: consultations.date,
        startTime: consultations.startTime,
        endTime: consultations.endTime,
        duration: consultations.duration,
        type: consultations.type,
        chiefComplaint: consultations.chiefComplaint,
        notes: consultations.notes,
        treatmentSummary: consultations.treatmentSummary,
        observations: consultations.observations,
        nextSteps: consultations.nextSteps,
        painLevelBefore: consultations.painLevelBefore,
        painLevelAfter: consultations.painLevelAfter,
        progressNotes: consultations.progressNotes,
        status: consultations.status,
        location: consultations.location,
        billed: consultations.billed,
        insuranceClaimed: consultations.insuranceClaimed,
        cost: consultations.cost,
        createdAt: consultations.createdAt,
        updatedAt: consultations.updatedAt,
        roomName: rooms.name
      })
      .from(consultations)
      .leftJoin(rooms, eq(consultations.roomId, rooms.id))
      .where(whereConditions)
      .orderBy(asc(consultations.date))

    return consultationsList
  } catch (error: any) {
    handleApiError(error)
  }
})
