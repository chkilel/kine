import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { appointments } from '~~/server/database/schema/appointment'
import type { TreatmentSession } from '../types/treatment-session.type'

// =============================================================================
// Appointment Schemas and Types
// =============================================================================
export const appointmentCreateSchema = createInsertSchema(appointments, {
  organizationId: z.string().min(1, 'Organization ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  treatmentPlanId: z.string().nullable().optional(),
  therapistId: z.string().min(1, 'Therapist ID is required'),
  roomId: z.string().nullable().optional(),
  date: calendarDateSchema,
  startTime: z.string(),
  endTime: z.string(),
  duration: z.int().min(1, 'Duration must be at least 1 minute'),
  type: appointmentTypeSchema.optional(),
  location: locationSchema.default('clinic'),
  status: appointmentStatusSchema.default('scheduled'),
  confirmedAt: z.coerce.date().nullable().optional(),
  cancelledAt: z.coerce.date().nullable().optional(),
  noShowReason: z.string().nullable().optional()
})

export const appointmentUpdateSchema = appointmentCreateSchema.partial()

export const appointmentStatusUpdateSchema = z.object({
  status: appointmentStatusSchema.optional(),
  confirmedAt: z.coerce.date().optional(),
  cancelledAt: z.coerce.date().optional(),
  noShowReason: z.string().optional()
})

export const appointmentSchema = createSelectSchema(appointments, {
  id: z.string(),
  organizationId: z.string(),
  patientId: z.string(),
  treatmentPlanId: z.string().nullable(),
  therapistId: z.string(),
  roomId: z.string().nullable(),
  date: calendarDateSchema,
  startTime: z.string(),
  endTime: z.string(),
  duration: z.int(),
  type: appointmentTypeSchema.nullable(),
  location: locationSchema,
  status: appointmentStatusSchema,
  confirmedAt: z.coerce.date().nullable(),
  cancelledAt: z.coerce.date().nullable(),
  noShowReason: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export const appointmentQuerySchema = z.object({
  therapistId: z.string().optional(),
  patientId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  onlyIndependent: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  status: appointmentStatusSchema.optional(),
  type: appointmentTypeSchema.optional(),
  dateFrom: calendarDateSchema.optional(),
  dateTo: calendarDateSchema.optional(),
  date: calendarDateSchema.optional(),
  include: z.enum(['treatmentSession']).optional(),
  limit: z.coerce.number().optional()
})

export const therapistAppointmentsQuerySchema = z.object({
  therapistId: z.string(),
  date: calendarDateSchema
})

// Type inference
export type Appointment = z.infer<typeof appointmentSchema> & {
  roomName?: string | null
  patientName?: string | null
  planTitle?: string | null
}

export type AppointmentWithSession = z.infer<typeof appointmentSchema> & {
  roomName?: string | null
  patientName?: string | null
  planTitle?: string | null
  treatmentSession?: TreatmentSession | null
}

export type AppointmentCreate = z.infer<typeof appointmentCreateSchema>
export type AppointmentUpdate = z.infer<typeof appointmentUpdateSchema>
export type AppointmentQuery = z.infer<typeof appointmentQuerySchema>
export type AppointmentStatusUpdate = z.infer<typeof appointmentStatusUpdateSchema>

// Planning types
export interface PlanningSettings {
  sessionsToPlan: number
  frequency: number
  duration: number
  startDate: string
  preferredDays: string[]
  location: Location
}
