import { eq, and } from 'drizzle-orm'
import { consultations } from '~~/server/database/schema'

function detectActionBySchema(body: ConsultationPatchBody): ConsultationActionType {
  if (resumeActionSchema.safeParse(body).success) return 'resume'
  if (pauseActionSchema.safeParse(body).success) return 'pause'
  if (endActionSchema.safeParse(body).success) return 'end'
  if (startActionSchema.safeParse(body).success) return 'start'
  if (updateTagsActionSchema.safeParse(body).success) return 'updateTags'

  throw new Error('No valid action detected')
}

function validateActionState(action: ConsultationActionType, consultation: Consultation) {
  switch (action) {
    case 'start':
      if (consultation.status === 'in_progress') throw new Error('La session est déjà en cours')
      break
    case 'pause':
      if (consultation.status !== 'in_progress') throw new Error("La session n'est pas en cours")
      if (consultation.pauseStartTime) throw new Error('La session est déjà en pause')
      break
    case 'resume':
      if (!consultation.pauseStartTime) throw new Error("La session n'est pas en pause")
      break
    case 'end':
      if (!consultation.actualStartTime) throw new Error("La session n'a pas été démarrée")
      break
    case 'updateTags':
      break
  }
}

function getSuccessMessage(action: ConsultationActionType) {
  const messages: Record<ConsultationActionType, string> = {
    start: 'Session démarrée avec succès',
    pause: 'Session mise en pause',
    resume: 'Session reprise',
    end: 'Session terminée avec succès',
    updateTags: 'Tags mis à jour'
  }
  return messages[action]
}

// Event handler for PATCH /api/consultations/[id]
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID de consultation requis'
      })
    }

    const { organizationId } = await requireAuth(event)
    const body = await readValidatedBody(event, consultationPatchSchema.parse)

    const [consultation] = await db
      .select()
      .from(consultations)
      .where(and(eq(consultations.organizationId, organizationId), eq(consultations.id, id)))
      .limit(1)

    if (!consultation) {
      throw createError({
        statusCode: 404,
        message: 'Consultation introuvable'
      })
    }

    const actionType = detectActionBySchema(body)
    validateActionState(actionType, consultation)

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
          actualDurationSeconds: validated.actualDurationSeconds,
          tags: tagsValue,
          painLevelAfter: validated.painLevelAfter,
          notes: validated.notes,
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
    }

    const [updated] = await db
      .update(consultations)
      .set(updateData)
      .where(and(eq(consultations.organizationId, organizationId), eq(consultations.id, id)))
      .returning()

    return successResponse(updated, getSuccessMessage(actionType))
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la mise à jour de la consultation')
  }
})
