import { z } from 'zod'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { treatmentSessions } from '~~/server/database/schema/treatment-session'
import type { Appointment } from './appointment.type'

// =============================================================================
// Treatment Session Schemas and Types
// =============================================================================

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

export const treatmentSessionSchema = createSelectSchema(treatmentSessions).omit({
  createdAt: true,
  updatedAt: true
})

export const treatmentSessionUpdateSchema = treatmentSessionCreateSchema.partial()

// Type inference
export type TreatmentSession = z.infer<typeof treatmentSessionSchema> & {
  patientName?: string | null
  therapistName?: string | null
  appointment?: Appointment | null
}
export type TreatmentSessionCreate = z.infer<typeof treatmentSessionCreateSchema>
export type TreatmentSessionUpdate = z.infer<typeof treatmentSessionUpdateSchema>
