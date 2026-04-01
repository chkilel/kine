import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { payments, paymentSessionItems } from '~~/server/database/schema/payment'

z.config(fr())

// =============================================================================
// Payment Schemas (Database)
// =============================================================================

export const paymentSchema = createSelectSchema(payments, {
  paidOn: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  voidedAt: z.date().nullable(),
  voidedById: z.string().nullable()
})

export const paymentCreateSchema = createInsertSchema(payments, {
  organizationId: z.string().min(1, "L'organisation est requise"),
  patientId: z.string().min(1, 'Le patient est requis'),
  recordedById: z.string().min(1, "L'utilisateur est requis"),
  amountCents: z.number().int().positive('Le montant doit être positif'),
  currency: z.string().default('MAD'),
  type: paymentTypeSchema.default('payment'),
  method: paymentMethodSchema.optional(),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
  paidOn: calendarDateSchema,
  voidedAt: z.date().nullable().optional(),
  voidedById: z.string().nullable().optional()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export const paymentUpdateSchema = paymentCreateSchema.partial()

// =============================================================================
// Payment Session Item Schemas (Database)
// =============================================================================

export const paymentSessionItemSchema = createSelectSchema(paymentSessionItems, {
  id: z.string(),
  paymentId: z.string(),
  treatmentSessionId: z.string(),
  amountCents: z.number()
})

export const paymentSessionItemCreateSchema = createInsertSchema(paymentSessionItems, {
  paymentId: z.string().min(1, 'Le paiement est requis'),
  treatmentSessionId: z.string().min(1, 'La séance est requise'),
  amountCents: z.number().int().positive('Le montant doit être positif')
}).omit({
  id: true
})

export const paymentSessionItemUpdateSchema = paymentSessionItemCreateSchema.partial()

// =============================================================================
// API Request/Response Schemas
// =============================================================================

export const paymentRequestBodySchema = z.object({
  patientId: z.string().min(1, 'Le patient est requis'),
  amountCents: z.number().int().positive('Le montant doit être positif'),
  type: paymentTypeSchema.default('payment'),
  method: paymentMethodSchema.optional(),
  notes: z.string().optional(),
  paidOn: calendarDateSchema.optional(),
  sessionItems: z
    .array(
      z.object({
        treatmentSessionId: z.string().min(1, 'La séance est requise'),
        amountCents: z.number().int().positive('Le montant doit être positif')
      })
    )
    .optional()
})

export const paymentResponseSchema = paymentSchema.extend({
  sessionItems: z.array(paymentSessionItemSchema).optional()
})

// =============================================================================
// Query Schemas
// =============================================================================

export const paymentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  organizationId: z.string().optional(),
  patientId: z.string().optional(),
  type: paymentTypeSchema.optional(),
  method: paymentMethodSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

// =============================================================================
// Type Inference
// =============================================================================

export type Payment = z.infer<typeof paymentSchema>
export type PaymentCreate = z.infer<typeof paymentCreateSchema>
export type PaymentUpdate = z.infer<typeof paymentUpdateSchema>
export type PaymentSessionItem = z.infer<typeof paymentSessionItemSchema>
export type PaymentSessionItemCreate = z.infer<typeof paymentSessionItemCreateSchema>
export type PaymentSessionItemUpdate = z.infer<typeof paymentSessionItemUpdateSchema>
export type PaymentRequestBody = z.infer<typeof paymentRequestBodySchema>
export type PaymentResponse = z.infer<typeof paymentResponseSchema>
export type PaymentQuery = z.infer<typeof paymentQuerySchema>

// =============================================================================
// Form Schemas
// =============================================================================

export const paymentFormSchema = z.object({
  type: paymentTypeSchema,
  method: paymentMethodSchema,
  amount: z.number().min(1, 'Le montant doit être supérieur à 0'),
  notes: z.string().optional()
})

export type PaymentForm = z.infer<typeof paymentFormSchema>
