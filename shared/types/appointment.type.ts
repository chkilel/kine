import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'
import { appointments } from '~~/server/database/schema/appointment'
import type { TreatmentSession } from '../types/treatment-session.type'

// =============================================================================
// Appointment Schemas and Types
// =============================================================================
const appointmentSchemaShape = {
  confirmedAt: z.coerce.date().nullable(),
  cancelledAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
}
export const appointmentSchema = createSelectSchema(appointments, appointmentSchemaShape)

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
  treatmentPlan?: {
    id: string
    title: string
    pricing: { clinic: number; home: number; telehealth: number }
  } | null
}

export type AppointmentCreate = z.infer<typeof appointmentCreateSchema>
export type AppointmentUpdate = z.infer<typeof appointmentUpdateSchema>
export type AppointmentQuery = z.infer<typeof appointmentQuerySchema>
export type AppointmentStatusUpdate = z.infer<typeof appointmentStatusUpdateSchema>
