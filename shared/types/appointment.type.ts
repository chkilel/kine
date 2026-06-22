import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'
import { appointments } from '~~/server/database/schema/appointment'

// =============================================================================
// Appointment Schemas and Types
// =============================================================================
const appointmentSchemaShape = {
  confirmedAt: z.coerce.date().nullable(),
  cancelledAt: z.coerce.date().nullable(),
  lockedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
}
export const appointmentSchema = createSelectSchema(appointments, appointmentSchemaShape).extend({
  roomName: z.string().nullable().optional(),
  planTitle: z.string().nullable().optional(),
  patientName: z.string().optional(),
  priceItem: priceItemSnapshotSchema
})

const appointmentCreateSchemaShape = {
  organizationId: z.string().min(1, 'Organization ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  treatmentPlanId: z.string().nullable().optional(),
  therapistId: z.string().min(1, 'Therapist ID is required'),
  roomId: z.string().nullable().optional(),
  date: calendarDateSchema,
  startTime: z.string(),
  endTime: z.string(),
  duration: z.int().min(1, 'Duration must be at least 1 minute'),
  type: z.string().min(1, 'Type is required'),
  location: locationSchema.default('clinic'),
  status: appointmentStatusSchema.default('scheduled'),
  confirmedAt: z.coerce.date().nullable().optional(),
  cancelledAt: z.coerce.date().nullable().optional(),
  noShowReason: z.string().nullable().optional()
}

export const appointmentCreateSchema = createInsertSchema(appointments, appointmentCreateSchemaShape).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lockedAt: true,
  lockedById: true,
  isLocked: true,
  priceCents: true,
  priceItem: true
})

export const appointmentUpdateSchema = createInsertSchema(appointments).partial()

export const appointmentStatusUpdateSchema = z.object({
  status: appointmentStatusSchema.optional(),
  confirmedAt: z.coerce.date().optional(),
  cancelledAt: z.coerce.date().optional(),
  noShowReason: z.string().optional()
})

/* export const appointmentQuerySchema = z.object({
  therapistId: z.string().optional(),
  patientId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  onlyIndependent: z.coerce.boolean().optional(),
  status: z
    .string()
    .transform((v) => v?.split(',').filter(Boolean))
    .optional(),
  type: z.string().optional(),
  dateFrom: calendarDateSchema.optional(),
  dateTo: calendarDateSchema.optional(),
  date: calendarDateSchema.optional(),
  withPayments: z.coerce.boolean().optional(),
  limit: z.coerce.number().optional()
}) */

export const appointmentQuerySchema = z
  .object({
    // =========================
    // Pagination
    // =========================
    limit: z.coerce.number().int().min(1).max(200).default(20).optional(),
    cursorDate: calendarDateSchema.optional(),
    cursorId: z.string().optional(),

    // =========================
    // Filters
    // =========================
    therapistId: z.string().optional(),
    patientId: z.string().optional(),
    treatmentPlanId: z.string().optional(),

    onlyIndependent: z.coerce.boolean().optional(),

    status: z
      .union([z.enum(APPOINTMENT_STATUSES), z.array(z.enum(APPOINTMENT_STATUSES))])
      .transform((val) => {
        if (!val) return undefined
        return Array.isArray(val) ? val : [val]
      })
      .optional(),

    type: z.string().optional(),

    // ---- Date filtering ----
    dateFrom: calendarDateSchema.optional(),
    dateTo: calendarDateSchema.optional(),

    // =========================
    // Includes (joins)
    // =========================
    withPlan: z.coerce.boolean().optional()
  })

  // =========================
  // Validation rules
  // =========================
  .refine(
    (data) => {
      // cursor must be complete
      if ((data.cursorDate && !data.cursorId) || (!data.cursorDate && data.cursorId)) {
        return false
      }
      return true
    },
    {
      message: 'cursorDate and cursorId must be provided together',
      path: ['cursorDate']
    }
  )
  .refine(
    (data) => {
      // enforce valid range
      if (data.dateFrom && data.dateTo) {
        return data.dateFrom <= data.dateTo
      }
      return true
    },
    {
      message: 'dateFrom must be <= dateTo',
      path: ['dateFrom']
    }
  )

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

export const extendActionSchema = z.object({
  extendedDurationMinutes: z.number().int().min(1)
})

export const updateClinicalNotesActionSchema = z.object({
  primaryConcern: z.string().optional(),
  sessionNotes: z.string().optional(),
  observations: z.string().optional()
})

export const updatePriceActionSchema = z.object({
  priceItemCode: z.string().min(1, 'Le code tarif est requis')
})

// Type inference
export type Appointment = z.infer<typeof appointmentSchema>

export type AppointmentDetail = z.infer<typeof appointmentSchema> & {
  confirmedAt: string
  cancelledAt: string
  createdAt: string
  updatedAt: string
  lockedAt: string
  roomName: string | null
  priceItem: PriceItemSnapshot | null
  treatmentPlan: {
    id: string
    title: string
    pricing: RateCent
  } | null
}

export type AppointmentWithPaymentStatus = Appointment & {
  paidCents: number
  paymentStatus: AppointmentPaymentStatus
  priceItemDescription: string | null
  paymentDetails: Array<{
    id: string
    amountCents: number
    receiptNumber: string
    method: PaymentMethod
    paidOn: string
  }>
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
export type ExtendAction = z.infer<typeof extendActionSchema>
export type UpdateClinicalNotesAction = z.infer<typeof updateClinicalNotesActionSchema>
export type UpdatePriceAction = z.infer<typeof updatePriceActionSchema>
