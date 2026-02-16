import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { appointments } from '~~/server/database/schema/appointment'
import {
  calendarDateSchema,
  appointmentTypeSchema,
  appointmentStatusSchema,
  locationSchema,
  type Location
} from './base.types'

z.config(fr())

// =============================================================================
// Appointment Schemas and Types
// =============================================================================
export const appointmentCreateSchema = createInsertSchema(appointments, {
  patientId: z.string(),
  organizationId: z.string().min(1),
  therapistId: z.string(),
  roomId: z.uuidv7().optional(),
  date: calendarDateSchema,
  location: locationSchema.default('clinic'),
  status: appointmentStatusSchema.default('scheduled'),
  type: appointmentTypeSchema.optional(),
  duration: z.int()
})

export const appointmentUpdateSchema = appointmentCreateSchema.partial()

export const appointmentSchema = createSelectSchema(appointments, {
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
  actualStartTime: z.string().optional(),
  actualDurationSeconds: z.number().optional(),
  totalPausedSeconds: z.number().optional(),
  pauseStartTime: z.string().optional(),
  tags: z.string().optional()
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
export type AppointmentCreate = z.infer<typeof appointmentCreateSchema>
export type AppointmentUpdate = z.infer<typeof appointmentUpdateSchema>
export type AppointmentQuery = z.infer<typeof appointmentQuerySchema>

// Planning types
export interface PlanningSettings {
  sessionsToPlan: number
  frequency: number
  duration: number
  startDate: string
  preferredDays: string[]
  location: Location
}
