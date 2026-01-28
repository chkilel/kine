import { eq, and, asc, gte, lte } from 'drizzle-orm'
import { appointments, consultations, rooms } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuth(event)

  try {
    const validatedQuery = await getValidatedQuery(event, consultationQuerySchema.parse)

    const conditions = []

    // Filter by therapist
    if (validatedQuery.therapistId) {
      conditions.push(eq(appointments.therapistId, validatedQuery.therapistId))
    }

    // Filter by patient
    if (validatedQuery.patientId) {
      conditions.push(eq(appointments.patientId, validatedQuery.patientId))
    }

    // Filter by treatment plan (in appointments)
    if (validatedQuery.treatmentPlanId) {
      conditions.push(eq(appointments.treatmentPlanId, validatedQuery.treatmentPlanId))
    }

    // Filter by status (appointment status)
    if (validatedQuery.status) {
      conditions.push(eq(appointments.status, validatedQuery.status))
    }

    // Filter by date range
    if (validatedQuery.date) {
      conditions.push(eq(appointments.date, validatedQuery.date))
    } else {
      if (validatedQuery.dateFrom) {
        conditions.push(gte(appointments.date, validatedQuery.dateFrom))
      }

      if (validatedQuery.dateTo) {
        conditions.push(lte(appointments.date, validatedQuery.dateTo))
      }
    }

    const results = await db
      .select({
        // Appointment fields (scheduling)
        id: appointments.id,
        organizationId: appointments.organizationId,
        patientId: appointments.patientId,
        treatmentPlanId: appointments.treatmentPlanId,
        therapistId: appointments.therapistId,
        roomId: appointments.roomId,
        date: appointments.date,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        duration: appointments.duration,
        type: appointments.type,
        location: appointments.location,
        status: appointments.status,
        confirmedAt: appointments.confirmedAt,
        cancelledAt: appointments.cancelledAt,
        consultationId: appointments.consultationId,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,

        // Consultation fields (clinical)
        chiefComplaint: consultations.chiefComplaint,
        notes: consultations.notes,
        treatmentSummary: consultations.treatmentSummary,
        observations: consultations.observations,
        nextSteps: consultations.nextSteps,
        painLevelBefore: consultations.painLevelBefore,
        painLevelAfter: consultations.painLevelAfter,
        progressNotes: consultations.progressNotes,
        sessionStep: consultations.sessionStep,
        consultationStatus: consultations.status,
        actualStartTime: consultations.actualStartTime,
        actualDurationSeconds: consultations.actualDurationSeconds,
        totalPausedSeconds: consultations.totalPausedSeconds,
        pauseStartTime: consultations.pauseStartTime,
        extendedDurationMinutes: consultations.extendedDurationMinutes,
        tags: consultations.tags,
        billed: consultations.billed,
        insuranceClaimed: consultations.insuranceClaimed,
        cost: consultations.cost,

        // Join fields
        roomName: rooms.name
      })
      .from(appointments)
      .leftJoin(consultations, eq(appointments.consultationId, consultations.id))
      .leftJoin(rooms, eq(appointments.roomId, rooms.id))
      .where(and(...conditions))
      .orderBy(asc(appointments.date), asc(appointments.startTime))

    // Merge results for backward compatibility
    const mergedResults = results.map((r) => ({
      ...r,
      // Use appointment ID as the primary ID
      status: r.status, // Appointment status (scheduled, confirmed, etc.)
      // If consultation exists, override with consultation status
      ...(r.consultationId ? { status: r.consultationStatus } : {})
    }))

    return mergedResults
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la récupération des consultations')
  }
})
