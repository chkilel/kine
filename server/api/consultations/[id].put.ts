import { eq, and } from 'drizzle-orm'
import { appointments, consultations } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  try {
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID requis'
      })
    }

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.organizationId, organizationId)))
      .limit(1)

    if (!appointment) {
      throw createError({
        statusCode: 404,
        message: 'Consultation introuvable'
      })
    }

    // Get consultation if exists
    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, appointment.consultationId))
      .limit(1)

    const body = await readValidatedBody(event, (schema: any) => schema.parse(body))

    // Determine which table to update based on fields provided
    let appointmentFields: any = {}
    let consultationFields: any = {}

    // Check for appointment fields
    if (body.date !== undefined) appointmentFields.date = body.date
    if (body.startTime !== undefined) appointmentFields.startTime = body.startTime
    if (body.endTime !== undefined) appointmentFields.endTime = body.endTime
    if (body.duration !== undefined) appointmentFields.duration = body.duration
    if (body.type !== undefined) appointmentFields.type = body.type
    if (body.location !== undefined) appointmentFields.location = body.location
    if (body.status !== undefined) appointmentFields.status = body.status

    // Check for consultation fields
    if (body.notes !== undefined) consultationFields.notes = body.notes
    if (body.treatmentSummary !== undefined) consultationFields.treatmentSummary = body.treatmentSummary
    if (body.chiefComplaint !== undefined) consultationFields.chiefComplaint = body.chiefComplaint
    if (body.observations !== undefined) consultationFields.observations = body.observations
    if (body.nextSteps !== undefined) consultationFields.nextSteps = body.nextSteps
    if (body.painLevelBefore !== undefined) consultationFields.painLevelBefore = body.painLevelBefore
    if (body.painLevelAfter !== undefined) consultationFields.painLevelAfter = body.painLevelAfter
    if (body.progressNotes !== undefined) consultationFields.progressNotes = body.progressNotes
    if (body.tags !== undefined) consultationFields.tags = body.tags
    if (body.billed !== undefined) consultationFields.billed = body.billed
    if (body.insuranceClaimed !== undefined) consultationFields.insuranceClaimed = body.insuranceClaimed
    if (body.cost !== undefined) consultationFields.cost = body.cost

    // Update appointment if fields provided
    let result: any = {}
    if (Object.keys(appointmentFields).length > 0) {
      const [updatedAppointment] = await db
        .update(appointments)
        .set({ ...appointmentFields, updatedAt: Date.now() })
        .where(and(eq(appointments.id, id), eq(appointments.organizationId, organizationId)))
        .returning()

      result = updatedAppointment
    }

    // Update consultation if exists and fields provided
    if (consultation && Object.keys(consultationFields).length > 0) {
      const [updatedConsultation] = await db
        .update(consultations)
        .set({ ...consultationFields, updatedAt: Date.now() })
        .where(eq(consultations.id, consultation.id))
        .returning()

      result = updatedConsultation
    }

    return successResponse(result, 'Consultation mise à jour avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la mise à jour de la consultation')
  }
})
