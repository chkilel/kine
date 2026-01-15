import { eq, and, asc, isNull, gte, lte } from 'drizzle-orm'
import { consultations, rooms } from '~~/server/database/schema'

// GET /api/patients/[id]/consultations - List patient consultations
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')

  if (!patientId) {
    throw createError({
      statusCode: 400,
      message: 'ID de patient requis'
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

    // Filter by treatment plan if specified
    if (validatedQuery.treatmentPlanId) {
      whereConditions = and(whereConditions, eq(consultations.treatmentPlanId, validatedQuery.treatmentPlanId))
    }
    // Otherwise, filter by onlyIndependent flag
    else if (validatedQuery.onlyIndependent === true) {
      console.log('validatedQuery.onlyIndependent', validatedQuery.onlyIndependent)
      // Show only independent consultations (not linked to any treatment plan)
      whereConditions = and(whereConditions, isNull(consultations.treatmentPlanId))
    }
    // If neither treatmentPlanId nor onlyIndependent is provided, show ALL consultations

    if (validatedQuery.status) {
      whereConditions = and(whereConditions, eq(consultations.status, validatedQuery.status))
    }

    if (validatedQuery.type) {
      whereConditions = and(whereConditions, eq(consultations.type, validatedQuery.type))
    }

    if (validatedQuery.dateFrom) {
      whereConditions = and(whereConditions, gte(consultations.date, validatedQuery.dateFrom))
    }

    if (validatedQuery.dateTo) {
      whereConditions = and(whereConditions, lte(consultations.date, validatedQuery.dateTo))
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
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la récupération des consultations du patient')
  }
})
