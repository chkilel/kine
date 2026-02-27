import { z } from 'zod'
import { createSelectSchema } from 'drizzle-zod'
import { treatmentSessions } from '~~/server/database/schema/treatment-session'
import type { Appointment } from './appointment.type'

// =============================================================================
// Treatment Session Schemas and Types
// =============================================================================

export const treatmentSessionResponseSchema = createSelectSchema(treatmentSessions, {
  id: z.uuidv7(),
  organizationId: z.string(),
  appointmentId: z.string(),
  patientId: z.string(),
  treatmentPlanId: z.string().nullable().optional(),
  therapistId: z.string(),
  primaryConcern: z.string().nullable().optional(),
  treatmentSummary: z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
  nextSteps: z.string().nullable().optional(),
  painLevelBefore: z.number().int().min(0).max(10).nullable().optional(),
  painLevelAfter: z.number().int().min(0).max(10).nullable().optional(),
  status: treatmentSessionStatusSchema,
  actualStartTime: timeFormatSchema.nullable().optional(),
  actualDurationSeconds: z.number().int().min(0).nullable().optional(),
  totalPausedSeconds: z.number().int().min(0).nullable().optional(),
  pauseStartTime: timeFormatSchema.nullable().optional(),
  extendedDurationMinutes: z.number().int().min(0).nullable(),
  tags: z.string().nullable().optional(),
  billed: calendarDateSchema.nullable().optional(),
  insuranceClaimed: z.boolean().nullable().optional(),
  cost: z.number().int().min(0).nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

// Type inference
export type TreatmentSession = Omit<z.infer<typeof treatmentSessionResponseSchema>, 'createdAt' | 'updatedAt'> & {
  patientName?: string | null
  therapistName?: string | null
  appointment?: Appointment | null
}
export type TreatmentSessionResponse = z.infer<typeof treatmentSessionResponseSchema> & {
  patientName?: string | null
  therapistName?: string | null
  appointment?: Appointment | null
}

// =============================================================================
// Treatment Session Action Schemas
// =============================================================================

export const startActionSchema = z
  .object({
    actualStartTime: timeFormatSchema,
    painLevelBefore: z.number().int().min(0).max(10)
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
  painLevelAfter: z.number().int().min(0).max(10)
})

export const updateTagsActionSchema = z.object({
  tags: z.array(z.string())
})

export const extendActionSchema = z.object({
  extendedDurationMinutes: z.number().int().min(1)
})

export const cancelActionSchema = z
  .object({
    action: z.literal('cancel')
  })
  .refine(
    (data) =>
      !(
        'actualStartTime' in data ||
        'painLevelBefore' in data ||
        'pauseStartTime' in data ||
        'pauseDurationSeconds' in data ||
        'actualDurationSeconds' in data ||
        'painLevelAfter' in data ||
        'notes' in data ||
        'tags' in data ||
        'extendedDurationMinutes' in data
      ),
    'Cancel action should not include other fields'
  )

export const updateClinicalNotesActionSchema = z.object({
  primaryConcern: z.string().optional(),
  treatmentSummary: z.string().optional(),
  observations: z.string().optional(),
  nextSteps: z.string().optional()
})

export const treatmentSessionPatchSchema = z.union([
  startActionSchema,
  pauseActionSchema,
  resumeActionSchema,
  endActionSchema,
  updateTagsActionSchema,
  extendActionSchema,
  cancelActionSchema,
  updateClinicalNotesActionSchema
])

// =============================================================================
// Treatment Session Create Schema
// =============================================================================

export const createTreatmentSessionSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  primaryConcern: z.string().optional(),
  treatmentSummary: z.string().optional()
})

// =============================================================================
// Treatment Session Query Schema
// =============================================================================

export const treatmentSessionQuerySchema = z.object({
  patientId: z.string().optional(),
  therapistId: z.string().optional(),
  appointmentId: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(TREATMENT_SESSION_STATUSES).optional(),
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
export type CancelAction = z.infer<typeof cancelActionSchema>
export type UpdateClinicalNotesAction = z.infer<typeof updateClinicalNotesActionSchema>

export type TreatmentSessionPatchBody =
  | StartAction
  | PauseAction
  | ResumeAction
  | EndAction
  | UpdateTagsAction
  | ExtendAction
  | CancelAction
  | UpdateClinicalNotesAction

export type TreatmentSessionActionType =
  | 'start'
  | 'pause'
  | 'resume'
  | 'end'
  | 'updateTags'
  | 'extend'
  | 'cancel'
  | 'updateClinicalNotes'

export type CreateTreatmentSession = z.infer<typeof createTreatmentSessionSchema>
export type TreatmentSessionQuery = z.infer<typeof treatmentSessionQuerySchema>
