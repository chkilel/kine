import { eq, and, getTableColumns } from 'drizzle-orm'
import { appointments, consultations, rooms } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  try {
    const [appointment] = await db
      .select({
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
        updatedAt: appointments.updatedAt
      })
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.organizationId, organizationId)))
      .limit(1)

    if (!appointment) {
      throw createError({
        statusCode: 404,
        message: 'Consultation introuvable'
      })
    }

    const [consultation] = await db
      .select({
        ...getTableColumns(consultations)
      })
      .from(consultations)
      .where(eq(consultations.id, appointment.consultationId))
      .limit(1)

    const [room] = appointment.roomId
      ? await db
          .select({ name: rooms.name })
          .from(rooms)
          .where(and(eq(rooms.id, appointment.roomId), eq(rooms.organizationId, organizationId)))
          .limit(1)
      : null

    // Merge results for backward compatibility
    const result = {
      ...appointment,
      ...(consultation || {}),
      roomName: room?.name || null,
      // Override status with consultation status if exists
      ...(consultation ? { status: consultation.status } : {}),
      // Add missing fields for backward compatibility
      ...(consultation && !appointment.treatmentPlanId ? { treatmentPlanId: consultation.treatmentPlanId } : {}),
      ...(consultation && !appointment.patientId ? { patientId: consultation.patientId } : {}),
      ...(consultation && !appointment.therapistId ? { therapistId: consultation.therapistId } : {}),
      ...(consultation ? { consultationStatus: consultation.status } : {})
    }

    return successResponse(result, 'Détails de la consultation récupérés')
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la récupération de la consultation')
  }
})
