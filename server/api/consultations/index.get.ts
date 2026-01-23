import { eq, and, asc, isNull, gte, lte } from 'drizzle-orm'
import { consultations, rooms } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuth(event)

  try {
    const validatedQuery = await getValidatedQuery(event, consultationQuerySchema.parse)

    const conditions = []

    conditions.push(eq(consultations.organizationId, organizationId))

    if (validatedQuery.therapistId) {
      conditions.push(eq(consultations.therapistId, validatedQuery.therapistId))
    }

    if (validatedQuery.patientId) {
      conditions.push(eq(consultations.patientId, validatedQuery.patientId))
    }

    if (validatedQuery.treatmentPlanId) {
      conditions.push(eq(consultations.treatmentPlanId, validatedQuery.treatmentPlanId))
    } else if (validatedQuery.onlyIndependent === true) {
      console.log('validatedQuery.onlyIndependent', validatedQuery.onlyIndependent)
      conditions.push(isNull(consultations.treatmentPlanId))
    }

    if (validatedQuery.status) {
      conditions.push(eq(consultations.status, validatedQuery.status))
    }

    if (validatedQuery.type) {
      conditions.push(eq(consultations.type, validatedQuery.type))
    }

    if (validatedQuery.date) {
      conditions.push(eq(consultations.date, validatedQuery.date))
    } else {
      if (validatedQuery.dateFrom) {
        conditions.push(gte(consultations.date, validatedQuery.dateFrom))
      }

      if (validatedQuery.dateTo) {
        conditions.push(lte(consultations.date, validatedQuery.dateTo))
      }
    }

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
        roomName: rooms.name,
        tags: consultations.tags,
        actualStartTime: consultations.actualStartTime,
        actualDurationSeconds: consultations.actualDurationSeconds,
        totalPausedSeconds: consultations.totalPausedSeconds,
        pauseStartTime: consultations.pauseStartTime
      })
      .from(consultations)
      .leftJoin(rooms, eq(consultations.roomId, rooms.id))
      .where(and(...conditions))
      .orderBy(asc(consultations.date))

    return consultationsList
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la récupération des consultations')
  }
})
