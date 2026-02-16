import { eq, and } from 'drizzle-orm'
import { appointments } from '~~/server/database/schema'
import { extendActionSchema } from '~~/shared/types/appointment-action'

function detectActionBySchema(body: AppointmentPatchBody): AppointmentActionType {
  if (resumeActionSchema.safeParse(body).success) return 'resume'
  if (pauseActionSchema.safeParse(body).success) return 'pause'
  if (endActionSchema.safeParse(body).success) return 'end'
  if (startActionSchema.safeParse(body).success) return 'start'
  if (updateTagsActionSchema.safeParse(body).success) return 'updateTags'
  if (extendActionSchema.safeParse(body).success) return 'extend'

  throw new Error('No valid action detected')
}

function validateActionState(action: AppointmentActionType, appointment: Appointment) {
  switch (action) {
    case 'start':
      if (appointment.status === 'in_progress') throw new Error('La session est déjà en cours')
      break
    case 'pause':
      if (appointment.status !== 'in_progress') throw new Error("La session n'est pas en cours")
      if (appointment.pauseStartTime) throw new Error('La session est déjà en pause')
      break
    case 'resume':
      if (!appointment.pauseStartTime) throw new Error("La session n'est pas en pause")
      break
    case 'end':
      if (!appointment.actualStartTime) throw new Error("La session n'a pas été démarrée")
      break
    case 'updateTags':
      break
  }
}

function getSuccessMessage(action: AppointmentActionType) {
  const messages: Record<AppointmentActionType, string> = {
    start: 'Session démarrée avec succès',
    pause: 'Session mise en pause',
    resume: 'Session reprise',
    end: 'Session terminée avec succès',
    updateTags: 'Tags mis à jour',
    extend: 'Durée étendue avec succès'
  }
  return messages[action]
}

// Event handler for PATCH /api/appointment/[id]
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID de Rendez-vous requis'
      })
    }

    const { organizationId } = await requireAuth(event)
    const body = await readValidatedBody(event, appointmentPatchSchema.parse)

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
      .limit(1)

    if (!appointment) {
      throw createError({
        statusCode: 404,
        message: 'Appointment introuvable'
      })
    }

    const actionType = detectActionBySchema(body)
    validateActionState(actionType, appointment)

    let updateData: any

    switch (actionType) {
      case 'start': {
        const validated = startActionSchema.parse(body)
        updateData = {
          status: 'in_progress',
          actualStartTime: validated.actualStartTime,
          actualDurationSeconds: 0,
          totalPausedSeconds: 0,
          pauseStartTime: null
        }
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
          totalPausedSeconds: (appointment.totalPausedSeconds || 0) + validated.pauseDurationSeconds,
          pauseStartTime: null
        }
        break
      }
      case 'end': {
        const validated = endActionSchema.parse(body)
        const tagsValue = validated.tags && validated.tags.length > 0 ? JSON.stringify(validated.tags) : null
        updateData = {
          status: 'completed',
          actualDurationSeconds: validated.actualDurationSeconds,
          tags: tagsValue,
          painLevelAfter: validated.painLevelAfter,
          notes: validated.notes,
          totalPausedSeconds: appointment.totalPausedSeconds,
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
          extendedDurationMinutes: (appointment.extendedDurationMinutes || 0) + validated.extendedDurationMinutes
        }
        break
      }
    }

    const [updated] = await db
      .update(appointments)
      .set(updateData)
      .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
      .returning()

    return successResponse(updated, getSuccessMessage(actionType))
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la mise à jour du Rendez-vous')
  }
})
