import { z } from 'zod'
import { timeFormatSchema } from './base.types'

// =============================================================================
// Treatment Session Action Schemas
// =============================================================================

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

export const endActionSchema = z.object({
  actualDurationSeconds: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  painLevelAfter: z.number().int().min(0).max(10),
  notes: z.string().optional()
})

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

export const treatmentSessionPatchSchema = z.union([
  startActionSchema,
  pauseActionSchema,
  resumeActionSchema,
  endActionSchema,
  updateTagsActionSchema,
  extendActionSchema
])

// =============================================================================
// Treatment Session Create Schema
// =============================================================================

export const createTreatmentSessionSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  painLevelBefore: z.number().int().min(0).max(10)
})

// =============================================================================
// Treatment Session Query Schema
// =============================================================================

export const treatmentSessionQuerySchema = z.object({
  patientId: z.string().optional(),
  therapistId: z.string().optional(),
  appointmentId: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(['in_progress', 'completed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

// =============================================================================
// Type Exports
// =============================================================================

export type StartAction = z.infer<typeof startActionSchema>
export type PauseAction = z.infer<typeof pauseActionSchema>
export type ResumeAction = z.infer<typeof resumeActionSchema>
export type EndAction = z.infer<typeof endActionSchema>
export type UpdateTagsAction = z.infer<typeof updateTagsActionSchema>
export type ExtendAction = z.infer<typeof extendActionSchema>
export type TreatmentSessionPatchBody =
  | StartAction
  | PauseAction
  | ResumeAction
  | EndAction
  | UpdateTagsAction
  | ExtendAction

export type TreatmentSessionActionType = 'start' | 'pause' | 'resume' | 'end' | 'updateTags' | 'extend'

export type CreateTreatmentSession = z.infer<typeof createTreatmentSessionSchema>
export type TreatmentSessionQuery = z.infer<typeof treatmentSessionQuerySchema>
