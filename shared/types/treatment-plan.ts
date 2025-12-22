import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { calendarDateSchema, noteSchema, treatmentPlanStatusSchema } from './base.types'
import { treatmentPlans } from '~~/server/database/schema/treatment-plan'

z.config(fr())

// =============================================================================
// Treatment Plan Schemas and Types
// =============================================================================
export const treatmentPlanCreateSchema = createInsertSchema(treatmentPlans, {
  patientId: z.string().min(1),
  organizationId: z.string().min(1),
  therapistId: z.string().min(1),
  title: z.string().min(3),
  diagnosis: z.string().min(3),
  startDate: calendarDateSchema,
  numberOfSessions: z.number().min(1).optional(),
  sessionFrequency: z.number().optional(),
  status: treatmentPlanStatusSchema.default('planned'),
  notes: z.array(noteSchema).nullable()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export const treatmentPlanUpdateSchema = treatmentPlanCreateSchema.partial()
export const treatmentPlanSchema = createSelectSchema(treatmentPlans)

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
  therapist: {
    id: string
    firstName?: string
    lastName?: string | null
    email?: string
  } | null
  progress: number
  completedConsultations: number
}
