import { z } from 'zod'
import { timeFormatSchema, sessionStepSchema } from './base.types'

export const startActionSchema = z
  .object({
    actualStartTime: timeFormatSchema
  })
  .refine(
    (data) => !('actualDurationSeconds' in data || 'painLevelAfter' in data || 'notes' in data),
    'Invalid field combination for start action'
  )

export const pauseActionSchema = z.object({
  pauseStartTime: timeFormatSchema
})

export const resumeActionSchema = z.object({
  pauseDurationSeconds: z.number().int().min(0)
})

export const endActionSchema = z
  .object({
    actualDurationSeconds: z.number().int().min(0).optional(),
    tags: z.array(z.string()).optional(),
    painLevelAfter: z.number().int().min(0).max(10).optional(),
    notes: z.string().optional()
  })
  .refine(
    (data) => data.actualDurationSeconds !== undefined || data.painLevelAfter !== undefined || data.notes !== undefined,
    'End action requires at least one of: actualDurationSeconds, painLevelAfter, notes'
  )

export const updateTagsActionSchema = z
  .object({
    tags: z.array(z.string())
  })
  .refine(
    (data) => !('actualDurationSeconds' in data || 'painLevelAfter' in data || 'notes' in data),
    'Use end action for tag updates with other fields'
  )

export const extendActionSchema = z.object({
  extendedDurationMinutes: z.number().int().min(1)
})

export const updateStepActionSchema = z.object({
  sessionStep: sessionStepSchema.optional()
})

export const consultationPatchSchema = z.union([
  startActionSchema,
  pauseActionSchema,
  resumeActionSchema,
  endActionSchema,
  updateTagsActionSchema,
  extendActionSchema,
  updateStepActionSchema
])

export type StartAction = z.infer<typeof startActionSchema>
export type PauseAction = z.infer<typeof pauseActionSchema>
export type ResumeAction = z.infer<typeof resumeActionSchema>
export type EndAction = z.infer<typeof endActionSchema>
export type UpdateTagsAction = z.infer<typeof updateTagsActionSchema>
export type ExtendAction = z.infer<typeof extendActionSchema>
export type UpdateStepAction = z.infer<typeof updateStepActionSchema>

export type ConsultationPatchBody =
  | StartAction
  | PauseAction
  | ResumeAction
  | EndAction
  | UpdateTagsAction
  | ExtendAction
  | UpdateStepAction

export type ConsultationActionType = 'start' | 'pause' | 'resume' | 'end' | 'updateTags' | 'extend' | 'updateStep'
