import { eq, and } from 'drizzle-orm'
import { consultations, rooms } from '~~/server/database/schema'
import type { Session } from '~~/shared/types/auth.types'

// GET /api/patients/[id]/consultations/[consultationId] - Get single consultation
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')
  const consultationId = getRouterParam(event, 'consultationId')

  if (!patientId || !consultationId) {
    throw createError({
      statusCode: 400,
      message: 'Patient ID and Consultation ID are required'
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
      message: 'Unauthorized'
    })
  }

  // Get active organization ID from session
  const activeOrganizationId = (session as Session)?.session?.activeOrganizationId
  if (!activeOrganizationId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden'
    })
  }

  try {
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
          eq(consultations.organizationId, activeOrganizationId),
          eq(consultations.id, consultationId),
          eq(consultations.patientId, patientId)
        )
      )
      .limit(1)

    if (!consultationData) {
      throw createError({
        statusCode: 404,
        message: 'Consultation not found'
      })
    }

    return consultationData
  } catch (error) {
    handleApiError(error)
  }
})
