import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { payments, paymentSessionItems } from '~~/server/database/schema/payment'
import { PAYMENT_TYPES, PAYMENT_METHODS } from '~~/shared/utils/constants.invoicing'

z.config(fr())

// =============================================================================
// Payment Type and Method Schemas
// =============================================================================

export const paymentTypeSchema = z.enum(PAYMENT_TYPES, { message: 'Type de paiement invalide' })
export type PaymentType = z.infer<typeof paymentTypeSchema>

export const paymentMethodSchema = z.enum(PAYMENT_METHODS, { message: 'Mode de paiement invalide' })
export type PaymentMethod = z.infer<typeof paymentMethodSchema>

// =============================================================================
// Payment Schemas (Database)
// =============================================================================

export const paymentSchema = createSelectSchema(payments, {
  id: z.string(),
  organizationId: z.string(),
  patientId: z.string(),
  recordedById: z.string(),
  amountCents: z.number(),
  currency: z.string(),
  type: paymentTypeSchema,
  method: paymentMethodSchema,
  receiptNumber: z.string().nullable(),
  notes: z.string().nullable(),
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
  method: paymentMethodSchema.default('cash'),
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
  method: paymentMethodSchema.default('cash'),
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

export const paymentFormSchemaFactory = (creditBalance = 0) =>
  z
    .object({
      type: paymentTypeSchema,
      method: paymentMethodSchema,
      amount: z.number().min(1, 'Le montant doit être supérieur à 0'),
      notes: z.string().optional()
    })
    .refine(
      (data) => {
        if (data.type === 'credit_usage') {
          return currencyToCents(data.amount) <= creditBalance
        }
        return true
      },
      { message: "Solde d'avance insuffisant", path: ['amount'] }
    )

export type PaymentForm = z.infer<ReturnType<typeof paymentFormSchemaFactory>>
