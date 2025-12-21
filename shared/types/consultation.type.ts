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
  treatmentPlanId: z.string().optional(),
  therapistId: z.string().optional(),
  date: calendarDateSchema,
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.number().min(1).optional(),
  type: consultationTypeSchema.optional(),
  location: locationSchema.default('clinic'),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
  treatmentSummary: z.string().optional(),
  observations: z.string().optional(),
  nextSteps: z.string().optional(),
  painLevelBefore: z.number().min(0).max(10).optional(),
  painLevelAfter: z.number().min(0).max(10).optional(),
  progressNotes: z.string().optional(),
  status: consultationStatusSchema.default('scheduled'),
  billed: z.boolean().default(false),
  insuranceClaimed: z.boolean().default(false),
  cost: z.number().min(0).optional()
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
