import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'
import { appointments } from '~~/server/database/schema/appointment'
import type { AppointmentPaymentStatus } from './base.types'

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
  noShowReason: z.string().nullable().optional(),
  insuranceCompanyId: z.string().nullable().optional()
}).omit({
  expectedCoPayCents: true,
  expectedInsuranceCents: true,
  coPayPaidCents: true,
  insurancePaidCents: true
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
  status: z
    .string()
    .transform((v) => v?.split(',').filter(Boolean))
    .optional(),
  type: appointmentTypeSchema.optional(),
  dateFrom: calendarDateSchema.optional(),
  dateTo: calendarDateSchema.optional(),
  date: calendarDateSchema.optional(),
  includePaymentStatus: z.coerce.boolean().optional(),
  limit: z.coerce.number().optional()
})

export const therapistAppointmentsQuerySchema = z.object({
  therapistId: z.string(),
  date: calendarDateSchema
})

// =============================================================================
// Appointment Action Schemas
// =============================================================================

export const startActionSchema = z
  .object({
    actualStartTime: timeFormatSchema,
    painLevelBefore: z.number().int().min(0).max(10)
  })
  .refine(
    (data) => !('actualDurationSeconds' in data || 'painLevelAfter' in data || 'notes' in data),
    'Invalid field combination for start action'
  )

export const pauseActionSchema = z.object({
  pauseStartTime: timeFormatSchema
})

export const resumeActionSchema = z.object({
  pauseDurationSeconds: z.number().int().min(0)
})

export const endActionSchema = z.object({
  actualDurationSeconds: z.number().int().min(0).optional(),
  painLevelAfter: z.number().int().min(0).max(10)
})

export const updateTagsActionSchema = z.object({
  tags: z.array(z.string())
})

export const extendActionSchema = z.object({
  extendedDurationMinutes: z.number().int().min(1)
})

export const updateClinicalNotesActionSchema = z.object({
  primaryConcern: z.string().optional(),
  treatmentSummary: z.string().optional(),
  observations: z.string().optional(),
  nextSteps: z.string().optional()
})

export const updatePriceActionSchema = z.object({
  priceCents: z.number().int().min(0)
})

// Type inference
export type Appointment = z.infer<typeof appointmentSchema> & {
  roomName?: string | null
  patientName?: string | null
  planTitle?: string | null
}

export type AppointmentWithPaymentStatus = Appointment & {
  paidCents: number
  paymentStatus: AppointmentPaymentStatus
}

export type AppointmentCreate = z.infer<typeof appointmentCreateSchema>
export type AppointmentUpdate = z.infer<typeof appointmentUpdateSchema>
export type AppointmentQuery = z.infer<typeof appointmentQuerySchema>
export type AppointmentStatusUpdate = z.infer<typeof appointmentStatusUpdateSchema>

// Action types
export type StartAction = z.infer<typeof startActionSchema>
export type PauseAction = z.infer<typeof pauseActionSchema>
export type ResumeAction = z.infer<typeof resumeActionSchema>
export type EndAction = z.infer<typeof endActionSchema>
export type UpdateTagsAction = z.infer<typeof updateTagsActionSchema>
export type ExtendAction = z.infer<typeof extendActionSchema>
export type UpdateClinicalNotesAction = z.infer<typeof updateClinicalNotesActionSchema>
export type UpdatePriceAction = z.infer<typeof updatePriceActionSchema>
