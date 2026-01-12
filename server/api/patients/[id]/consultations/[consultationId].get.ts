import { eq, and } from 'drizzle-orm'
import { consultations, rooms } from '~~/server/database/schema'

// GET /api/patients/[id]/consultations/[consultationId] - Get single consultation
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')
  const consultationId = getRouterParam(event, 'consultationId')

  try {
    if (!patientId || !consultationId) {
      throw createError({
        statusCode: 400,
        message: 'ID de patient et ID de consultation requis'
      })
    }

    const { organizationId } = await requireAuth(event)

    // Fetch consultation with room name
    const [consultationData] = await db
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
      .where(
        and(
          eq(consultations.organizationId, organizationId),
          eq(consultations.id, consultationId),
          eq(consultations.patientId, patientId)
        )
      )
      .limit(1)

    if (!consultationData) {
      throw createError({
        statusCode: 404,
        message: 'Consultation introuvable'
      })
    }

    return consultationData
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la récupération de la consultation')
  }
})
