import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { appointments } from '~~/server/database/schema/appointment'
import { consultations } from '~~/server/database/schema/consultation'
import {
  calendarDateSchema,
  consultationTypeSchema,
  consultationStatusSchema,
  locationSchema,
  sessionStepSchema,
  appointmentStatusSchema,
  type ConsultationLocation
} from './base.types'

z.config(fr())

// =============================================================================
// Appointments Schemas and Types
// =============================================================================

export const appointmentCreateSchema = createInsertSchema(appointments, {
  patientId: z.string(),
  organizationId: z.string().min(1),
  therapistId: z.string(),
  roomId: z.uuidv7().optional(),
  date: calendarDateSchema,
  location: locationSchema.default('clinic'),
  status: appointmentStatusSchema.default('scheduled'),
  type: consultationTypeSchema.optional(),
  duration: z.int()
})

export const appointmentUpdateSchema = appointmentCreateSchema.partial()

export const appointmentSchema = createSelectSchema(appointments, {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

// =============================================================================
// Consultations Schemas and Types
// =============================================================================

export const consultationCreateSchema = createInsertSchema(consultations, {
  appointmentId: z.string(),
  patientId: z.string(),
  treatmentPlanId: z.string().optional(),
  therapistId: z.string(),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
  treatmentSummary: z.string().optional(),
  observations: z.string().optional(),
  nextSteps: z.string().optional(),
  painLevelBefore: z.number().int().min(0).max(10).optional(),
  painLevelAfter: z.number().int().min(0).max(10).optional(),
  progressNotes: z.string().optional(),
  sessionStep: sessionStepSchema.default('pre-session'),
  status: consultationStatusSchema.default('in_progress'),
  actualStartTime: z.string().optional(),
  actualDurationSeconds: z.number().int().min(0).optional(),
  totalPausedSeconds: z.number().int().min(0).optional(),
  pauseStartTime: z.string().optional(),
  extendedDurationMinutes: z.number().int().min(0).default(0),
  tags: z.string().optional(),
  billed: calendarDateSchema.optional(),
  insuranceClaimed: z.boolean().optional(),
  cost: z.number().int().min(0).optional()
})

export const consultationUpdateSchema = consultationCreateSchema.partial()

export const consultationSchema = createSelectSchema(consultations, {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

// =============================================================================
// Combined Query Schema (for backward compatibility)
// =============================================================================

export const consultationQuerySchema = z.object({
  therapistId: z.string().optional(),
  patientId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  status: consultationStatusSchema.optional(),
  consultationStatus: consultationStatusSchema.optional(),
  sessionStep: sessionStepSchema.optional(),
  type: consultationTypeSchema.optional(),
  date: calendarDateSchema.optional(),
  dateFrom: calendarDateSchema.optional(),
  dateTo: calendarDateSchema.optional(),
  actualStartTime: z.string().optional(),
  actualDurationSeconds: z.number().optional(),
  totalPausedSeconds: z.number().optional(),
  pauseStartTime: z.string().optional(),
  tags: z.string().optional()
})

export const therapistConsultationsQuerySchema = z.object({
  therapistId: z.string(),
  date: calendarDateSchema
})

// Type inference
export type Appointment = z.infer<typeof appointmentSchema> & {
  roomName?: string | null
}
export type AppointmentCreate = z.infer<typeof appointmentCreateSchema>
export type AppointmentUpdate = z.infer<typeof appointmentUpdateSchema>

export type Consultation = z.infer<typeof consultationSchema> & {
  roomName?: string | null
  patientName?: string | null
  planTitle?: string | null
}
export type ConsultationCreate = z.infer<typeof consultationCreateSchema>
export type ConsultationUpdate = z.infer<typeof consultationUpdateSchema>
export type ConsultationQuery = z.infer<typeof consultationQuerySchema>

// Planning types
export interface PlanningSettings {
  sessionsToPlan: number
  frequency: number
  duration: number
  startDate: string
  preferredDays: string[]
  location: ConsultationLocation
}
