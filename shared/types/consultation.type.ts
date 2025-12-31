import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { consultations } from '~~/server/database/schema/consultation'
import {
  calendarDateSchema,
  consultationTypeSchema,
  consultationStatusSchema,
  locationSchema,
  type ConsultationLocation
} from './base.types'

z.config(fr())

// =============================================================================
// Consultation Schemas and Types
// =============================================================================
export const consultationCreateSchema = createInsertSchema(consultations, {
  patientId: z.string(),
  organizationId: z.string().min(1),
  therapistId: z.string(),
  roomId: z.uuidv7(),
  date: calendarDateSchema,
  location: locationSchema.default('clinic'),
  status: consultationStatusSchema.default('scheduled'),
  type: consultationTypeSchema.optional(),
  duration: z.int().optional()
})

export const consultationUpdateSchema = consultationCreateSchema.partial()

export const consultationSchema = createSelectSchema(consultations, {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export const consultationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  patientId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  status: consultationStatusSchema.optional(),
  type: consultationTypeSchema.optional(),
  dateFrom: calendarDateSchema.optional(),
  dateTo: calendarDateSchema.optional()
})

// Type inference
export type Consultation = z.infer<typeof consultationSchema>
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
