import { eq, and } from 'drizzle-orm'
import { appointments, treatmentSessions } from '~~/server/database/schema'
import { createTreatmentSessionSchema } from '~~/shared/types/treatment-session'
import { getCurrentTimeHHMMSS } from '~~/shared/utils/time'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuth(event)

  try {
    const body = await readValidatedBody(event, createTreatmentSessionSchema.parse)
    const { appointmentId } = body

    // Fetch the appointment
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, appointmentId)))
      .limit(1)

    if (!appointment) {
      throw createError({
        statusCode: 404,
        message: 'Appointment not found'
      })
    }

    // Check if appointment is cancelled
    if (appointment.status === 'cancelled') {
      throw createError({
        statusCode: 400,
        message: 'Cannot create treatment session for cancelled appointment'
      })
    }

    // Check if treatment session already exists
    const [existingSession] = await db
      .select()
      .from(treatmentSessions)
      .where(eq(treatmentSessions.appointmentId, appointmentId))
      .limit(1)

    if (existingSession) {
      throw createError({
        statusCode: 409,
        message: 'Treatment session already exists for this appointment'
      })
    }

    // Create treatment session
    const actualStartTime = getCurrentTimeHHMMSS()

    const [treatmentSession] = await db
      .insert(treatmentSessions)
      .values({
        organizationId,
        appointmentId,
        patientId: appointment.patientId,
        therapistId: appointment.therapistId,
        treatmentPlanId: appointment.treatmentPlanId,
        status: 'in_progress',
        sessionStep: 'pre-session',
        actualStartTime,
        actualDurationSeconds: 0,
        totalPausedSeconds: 0,
        extendedDurationMinutes: 0
      })
      .returning()

    // Update appointment status to confirmed (keeps scheduling context)
    await db
      .update(appointments)
      .set({ status: 'confirmed' })
      .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, appointmentId)))

    setResponseStatus(event, 201)
    return successResponse(treatmentSession, 'Treatment session created successfully')
  } catch (error: unknown) {
    handleApiError(error, 'Failed to create treatment session')
  }
})
