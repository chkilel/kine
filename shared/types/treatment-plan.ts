import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { treatmentPlans } from '~~/server/database/schema/treatment-plan'

z.config(fr())

// =============================================================================
// Treatment Plan Schemas and Types
// =============================================================================

const treatmentPlanSchemaShape = {
  pricing: rateCentSchema,
  priceItem: priceItemSnapshotSchema.nullable(),
  notes: z.array(noteSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
}

export const treatmentPlanSchema = createSelectSchema(treatmentPlans, treatmentPlanSchemaShape)

const treatmentPlanCreateShape = {
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
  coverageStatus: insuranceCoverageSchema.optional(),
  insuranceProvider: z.string().optional(),
  pricing: rateCentSchema,
  priceItem: priceItemSnapshotSchema.optional(),
  notes: z.array(noteSchema).optional()
}

export const treatmentPlanCreateSchema = createInsertSchema(treatmentPlans, treatmentPlanCreateShape).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export const treatmentPlanUpdateSchema = createInsertSchema(treatmentPlans, {
  prescribingDoctor: z.string().min(1),
  prescriptionDate: calendarDateSchema,
  coverageStatus: insuranceCoverageSchema.optional(),
  insuranceProvider: z.string().optional(),

  therapistId: z.string().min(1),
  startDate: calendarDateSchema,
  numberOfSessions: z.number().min(1),
  sessionFrequency: z.number().optional(),
  status: treatmentPlanStatusSchema,

  title: z.string().min(3),
  diagnosis: z.string().min(3),
  objective: z.string().optional(),

  pricing: rateCentSchema,
  priceItem: priceItemSnapshotSchema.optional()
}).partial()

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
  completedAppointments: number
}
