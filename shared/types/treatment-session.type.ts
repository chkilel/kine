import { z } from 'zod'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { treatmentSessions } from '~~/server/database/schema/treatment-session'
import type { Appointment } from './appointment.type'
import {
  treatmentSessionStatusSchema,
  treatmentSessionStepSchema,
  calendarDateSchema,
  timeFormatSchema
} from './base.types'

// =============================================================================
// Treatment Session Schemas and Types
// =============================================================================

export const treatmentSessionResponseSchema = createSelectSchema(treatmentSessions, {
  id: z.uuidv7(),
  organizationId: z.string().min(1),
  appointmentId: z.string().min(1),
  patientId: z.string().min(1),
  treatmentPlanId: z.string().nullable().optional(),
  therapistId: z.string().min(1),
  primaryConcern: z.string().nullable().optional(),
  treatmentSummary: z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
  nextSteps: z.string().nullable().optional(),
  painLevelBefore: z.number().int().min(0).max(10).nullable().optional(),
  painLevelAfter: z.number().int().min(0).max(10).nullable().optional(),
  sessionStep: treatmentSessionStepSchema.default('pre-session'),
  status: treatmentSessionStatusSchema,
  actualStartTime: timeFormatSchema.nullable().optional(),
  actualDurationSeconds: z.number().int().min(0).nullable().optional(),
  totalPausedSeconds: z.number().int().min(0).nullable().optional(),
  pauseStartTime: timeFormatSchema.nullable().optional(),
  extendedDurationMinutes: z.number().int().min(0).default(0),
  tags: z.string().nullable().optional(),
  billed: calendarDateSchema.nullable().optional(),
  insuranceClaimed: z.boolean().default(false),
  cost: z.number().int().min(0).nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export const treatmentSessionCreateSchema = createInsertSchema(treatmentSessions, {
  organizationId: z.string().min(1),
  appointmentId: z.string().min(1),
  patientId: z.string().min(1),
  therapistId: z.string().min(1),
  treatmentPlanId: z.string().optional(),
  status: z.enum(['in_progress', 'completed']).default('in_progress'),
  sessionStep: z.enum(['pre-session', 'active-session', 'post-session', 'summary']).default('pre-session'),
  painLevelBefore: z.number().int().min(0).max(10).optional(),
  painLevelAfter: z.number().int().min(0).max(10).optional(),
  actualDurationSeconds: z.number().int().min(0).optional(),
  totalPausedSeconds: z.number().int().min(0).optional(),
  extendedDurationMinutes: z.number().int().min(0).default(0)
})

export const treatmentSessionUpdateSchema = treatmentSessionCreateSchema.partial()

export const treatmentSessionSchema = treatmentSessionResponseSchema.omit({
  createdAt: true,
  updatedAt: true
})

// Type inference
export type TreatmentSession = z.infer<typeof treatmentSessionSchema> & {
  patientName?: string | null
  therapistName?: string | null
}
export type TreatmentSessionCreate = z.infer<typeof treatmentSessionCreateSchema>
export type TreatmentSessionUpdate = z.infer<typeof treatmentSessionUpdateSchema>
export type TreatmentSessionResponse = z.infer<typeof treatmentSessionResponseSchema> & {
  patientName?: string | null
  therapistName?: string | null
  appointment?: Appointment | null
}
