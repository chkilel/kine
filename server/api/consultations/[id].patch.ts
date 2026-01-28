import { eq, and } from 'drizzle-orm'
import { consultations, appointments } from '~~/server/database/schema'
import {
  startActionSchema,
  pauseActionSchema,
  resumeActionSchema,
  endActionSchema,
  updateTagsActionSchema,
  extendActionSchema
} from '~~/shared/types/consultation-action'

type ConsultationActionType = 'start' | 'pause' | 'resume' | 'end' | 'updateTags' | 'extend' | 'updateStep'

function detectActionBySchema(body: ConsultationPatchBody): ConsultationActionType {
  if (resumeActionSchema.safeParse(body).success) return 'resume'
  if (pauseActionSchema.safeParse(body).success) return 'pause'
  if (endActionSchema.safeParse(body).success) return 'end'
  if (startActionSchema.safeParse(body).success) return 'start'
  if (updateTagsActionSchema.safeParse(body).success) return 'updateTags'
  if (extendActionSchema.safeParse(body).success) return 'extend'
  if (body.sessionStep) return 'updateStep'

  throw new Error('No valid action detected')
}

function validateActionState(action: ConsultationActionType, appointment: any, consultation: any) {
  switch (action) {
    case 'start':
      if (appointment.status === 'linked_to_consultation') throw new Error('La session est déjà en cours')
      if (appointment.status === 'cancelled' || appointment.status === 'no_show')
        throw new Error('Le rendez-vous a été annulé')
      if (consultation) throw new Error('Une consultation existe déjà pour ce rendez-vous')
      break
    case 'pause':
      if (!consultation) throw new Error("La consultation n'existe pas")
      if (consultation.status !== 'in_progress') throw new Error("La session n'est pas en cours")
      if (consultation.pauseStartTime) throw new Error('La session est déjà en pause')
      break
    case 'resume':
      if (!consultation) throw new Error("La consultation n'existe pas")
      if (!consultation.pauseStartTime) throw new Error("La session n'est pas en pause")
      break
    case 'end':
      if (!consultation) throw new Error("La session n'a pas été démarrée")
      break
    case 'updateTags':
    case 'extend':
    case 'updateStep':
      break
  }
}

function getSuccessMessage(action: ConsultationActionType) {
  const messages: Record<ConsultationActionType, string> = {
    start: 'Session démarrée',
    pause: 'Session mise en pause',
    resume: 'Session reprise',
    end: 'Session terminée',
    updateTags: 'Tags mis à jour',
    extend: 'Durée étendue',
    updateStep: 'Étape mise à jour'
  }
  return messages[action]
}

type UpdateStepAction = {
  appointmentId: string
  sessionStep?: string
}

type ConsultationPatchBody = any

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID requis'
      })
    }

    const { organizationId } = await requireAuth(event)
    const body = await readValidatedBody(event, (schema: any) => schema.parse(body))

    // Get appointment
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.organizationId, organizationId)))
      .limit(1)

    if (!appointment) {
      throw createError({
        statusCode: 404,
        message: 'Rendez-vous introuvable'
      })
    }

    // Get consultation if exists
    const [consultation] = await db.select().from(consultations).where(eq(consultations.appointmentId, id)).limit(1)

    const actionType = detectActionBySchema(body)
    validateActionState(actionType, appointment, consultation)

    let updateData: any
    let responseData: any = {}

    switch (actionType) {
      case 'start': {
        const validated = startActionSchema.parse(body)

        // Create consultation record
        const [newConsultation] = await db
          .insert(consultations)
          .values({
            appointmentId: id,
            patientId: appointment.patientId,
            therapistId: appointment.therapistId,
            treatmentPlanId: appointment.treatmentPlanId,
            sessionStep: 'active-session',
            status: 'in_progress',
            actualStartTime: validated.actualStartTime,
            actualDurationSeconds: 0,
            totalPausedSeconds: 0,
            pauseStartTime: null
          })
          .returning()

        // Update appointment to link to consultation
        await db
          .update(appointments)
          .set({
            status: 'linked_to_consultation',
            consultationId: newConsultation.id
          })
          .where(and(eq(appointments.id, id), eq(appointments.organizationId, organizationId)))

        responseData = newConsultation
        break
      }

      case 'pause': {
        const validated = pauseActionSchema.parse(body)
        updateData = {
          pauseStartTime: validated.pauseStartTime
        }
        break
      }

      case 'resume': {
        const validated = resumeActionSchema.parse(body)
        updateData = {
          totalPausedSeconds: (consultation.totalPausedSeconds || 0) + validated.pauseDurationSeconds,
          pauseStartTime: null
        }
        break
      }

      case 'end': {
        const validated = endActionSchema.parse(body)
        const tagsValue = validated.tags && validated.tags.length > 0 ? JSON.stringify(validated.tags) : null
        updateData = {
          status: 'completed',
          sessionStep: 'summary',
          painLevelAfter: validated.painLevelAfter,
          tags: tagsValue,
          notes: validated.notes,
          actualDurationSeconds: validated.actualDurationSeconds,
          totalPausedSeconds: consultation.totalPausedSeconds,
          pauseStartTime: null
        }
        break
      }

      case 'updateTags': {
        const validated = updateTagsActionSchema.parse(body)
        const tagsValue = validated.tags && validated.tags.length > 0 ? JSON.stringify(validated.tags) : null
        updateData = {
          tags: tagsValue
        }
        break
      }

      case 'extend': {
        const validated = extendActionSchema.parse(body)
        updateData = {
          extendedDurationMinutes: (consultation.extendedDurationMinutes || 0) + validated.extendedDurationMinutes
        }
        break
      }

      case 'updateStep': {
        const validated = body as UpdateStepAction
        updateData = {
          sessionStep: validated.sessionStep
        }
        break
      }

      default:
        throw new Error(`Unknown action: ${actionType}`)
    }

    // Update consultation
    const [updatedConsultation] = await db
      .update(consultations)
      .set(updateData)
      .where(eq(consultations.id, consultation.id))
      .returning()

    return successResponse(updatedConsultation || {}, getSuccessMessage(actionType))
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la mise à jour de la consultation')
  }
})
