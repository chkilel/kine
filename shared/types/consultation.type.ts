import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { consultations } from '~~/server/database/schema/consultation'
import {
  calendarDateSchema,
  consultationTypeSchema,
  consultationStatusSchema,
  locationSchema,
  type ConsultationLocation,
  type ConsultationType,
  type ConsultationStatus
} from './base.types'

z.config(fr())

// =============================================================================
// Consultation Schemas and Types
// =============================================================================
export const consultationCreateSchema = createInsertSchema(consultations, {
  patientId: z.string(),
  organizationId: z.string().min(1),
  therapistId: z.string(),
  roomId: z.uuidv7().optional(),
  date: calendarDateSchema,
  location: locationSchema.default('clinic'),
  status: consultationStatusSchema.default('scheduled'),
  type: consultationTypeSchema.optional(),
  duration: z.int()
})

export const consultationUpdateSchema = consultationCreateSchema.partial()

export const consultationSchema = createSelectSchema(consultations, {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export const consultationQuerySchema = z.object({
  therapistId: z.string().optional(),
  patientId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  onlyIndependent: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  status: consultationStatusSchema.optional(),
  type: consultationTypeSchema.optional(),
  dateFrom: calendarDateSchema.optional(),
  dateTo: calendarDateSchema.optional(),
  date: calendarDateSchema.optional(),
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
export type Consultation = z.infer<typeof consultationSchema> & {
  roomName?: string | null
  patientName?: string | null
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
