import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { calendarDateSchema, noteSchema, treatmentPlanStatusSchema } from './base.types'
import { treatmentPlans } from '~~/server/database/schema/treatment-plan'
import { VALID_COVERAGE_STATUSES } from '~~/shared/utils/constants.treatement-plan'

z.config(fr())

// =============================================================================
// Treatment Plan Schemas and Types
// =============================================================================

export const treatmentPlanSchema = createSelectSchema(treatmentPlans, {
  id: z.string(),
  organizationId: z.string(),
  patientId: z.string(),
  therapistId: z.string(),
  title: z.string(),
  diagnosis: z.string(),
  objective: z.string().nullable(),
  startDate: calendarDateSchema,
  endDate: calendarDateSchema.nullable(),
  numberOfSessions: z.number().nullable(),
  sessionFrequency: z.number().nullable(),
  status: treatmentPlanStatusSchema,
  prescribingDoctor: z.string().nullable(),
  prescriptionDate: calendarDateSchema,
  coverageStatus: z.enum(VALID_COVERAGE_STATUSES).nullable(),
  insuranceInfo: z.string().nullable(),
  notes: z.array(noteSchema),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const treatmentPlanCreateSchema = createInsertSchema(treatmentPlans, {
  patientId: z.string().min(1),
  organizationId: z.string().min(1),
  therapistId: z.string().min(1),
  title: z.string().min(3),
  diagnosis: z.string().min(3),
  objective: z.string().optional(),
  startDate: calendarDateSchema,
  endDate: calendarDateSchema.nullable().optional(),
  prescribingDoctor: z.string().optional(),
  prescriptionDate: calendarDateSchema,
  numberOfSessions: z.number().min(1).optional(),
  sessionFrequency: z.number().optional(),
  status: treatmentPlanStatusSchema.default('planned'),
  insuranceInfo: z.string().optional(),
  coverageStatus: z.enum(VALID_COVERAGE_STATUSES).optional(),
  notes: z.array(noteSchema).nullable()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export const treatmentPlanUpdateSchema = treatmentPlanCreateSchema.partial()

// Query schemas

export const treatmentPlanQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  patientId: z.string().optional(),
  status: treatmentPlanStatusSchema.optional()
})

// Type inference

export type TreatmentPlan = z.infer<typeof treatmentPlanSchema>
export type TreatmentPlanCreate = z.infer<typeof treatmentPlanCreateSchema>
export type TreatmentPlanUpdate = z.infer<typeof treatmentPlanUpdateSchema>
export type TreatmentPlanQuery = z.infer<typeof treatmentPlanQuerySchema>

// Extended types/interfaces
export type TreatmentPlanWithProgress = TreatmentPlan & {
  progress: number
  completedConsultations: number
}
