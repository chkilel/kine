import { z } from 'zod'
import { createSelectSchema } from 'drizzle-orm/zod'
import { treatmentSessions } from '~~/server/database/schema/treatment-session'
import type { Appointment } from './appointment.type'
import type { Payment } from './invoicing'
import { timeFormatSchema, treatmentSessionStatusSchema } from './base.types'

// =============================================================================
// Treatment Session Schemas and Types
// =============================================================================

const treatmentSessionResponseShapeSchema = {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
}
export const treatmentSessionResponseSchema = createSelectSchema(treatmentSessions, treatmentSessionResponseShapeSchema)

// Type inference
export type TreatmentSession = Omit<z.infer<typeof treatmentSessionResponseSchema>, 'createdAt' | 'updatedAt'> & {
  patientName?: string | null
  therapistName?: string | null
  payments?: Payment[]
}

export type TreatmentSessionResponse = z.infer<typeof treatmentSessionResponseSchema> & {
  patientName?: string | null
  therapistName?: string | null
  appointment?: Appointment | null
  payments?: Payment[]
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

export const updateClinicalNotesActionSchema = z.object({
  primaryConcern: z.string().optional(),
  treatmentSummary: z.string().optional(),
  observations: z.string().optional(),
  nextSteps: z.string().optional()
})

export const updatePriceActionSchema = z.object({
  priceCent: z.number().int().min(1)
})

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
  status: treatmentSessionStatusSchema.optional(),
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
export type UpdateClinicalNotesAction = z.infer<typeof updateClinicalNotesActionSchema>
export type UpdatePriceAction = z.infer<typeof updatePriceActionSchema>

export type CreateTreatmentSession = z.infer<typeof createTreatmentSessionSchema>
export type TreatmentSessionQuery = z.infer<typeof treatmentSessionQuerySchema>
