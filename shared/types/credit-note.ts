import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'

import { creditNotes } from '~~/server/database/schema/payment'
import { creditNoteTypeSchema, creditNoteStatusSchema } from './base.types'

export const creditNoteSchema = createSelectSchema(creditNotes, {
  createdAt: z.date(),
  updatedAt: z.date(),
  issuedAt: z.date().nullable(),
  cancelledAt: z.date().nullable()
})

export const creditNoteCreateSchema = createInsertSchema(creditNotes, {
  organizationId: z.string().min(1, "L'organisation est requise"),
  patientId: z.string().min(1, 'Le patient est requis'),
  type: creditNoteTypeSchema,
  status: creditNoteStatusSchema.default('draft'),
  amountCents: z.number().int().positive('Le montant doit être positif'),
  reason: z.string().min(1, 'La raison est requise'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional()
}).omit({
  id: true,
  issuedAt: true,
  issuedById: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true
})

export const creditNoteUpdateSchema = z.object({
  status: creditNoteStatusSchema.optional(),
  notes: z.string().optional()
})

export const creditNoteQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  patientId: z.string().optional(),
  status: creditNoteStatusSchema.optional(),
  type: creditNoteTypeSchema.optional()
})

export type CreditNote = z.infer<typeof creditNoteSchema>
export type CreditNoteCreate = z.infer<typeof creditNoteCreateSchema>
export type CreditNoteUpdate = z.infer<typeof creditNoteUpdateSchema>
export type CreditNoteQuery = z.infer<typeof creditNoteQuerySchema>
