import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { patientDocuments } from '~~/server/database/schema/document'

z.config(fr())

// =============================================================================
// Patient Document Schemas and Types
// =============================================================================

// This is to fix the circular dependency between patient document and other types
const patientDocumentSchemaShape = {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
}
export const patientDocumentSchema = createSelectSchema(patientDocuments, patientDocumentSchemaShape)

export const patientDocumentCreateSchema = createInsertSchema(patientDocuments, {
  patientId: z.string().optional(),
  organizationId: z.string().min(1),
  uploadedById: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  fileName: z.string().min(1),
  originalFileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().min(0),
  storageKey: z.string().min(1),
  category: documentCategorySchema,
  description: z.string().optional()
})

export const patientDocumentUpdateSchema = patientDocumentCreateSchema.partial().omit({
  patientId: true,
  uploadedById: true,
  fileName: true,
  originalFileName: true,
  mimeType: true,
  fileSize: true,
  storageKey: true
})

export const patientDocumentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  patientId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  category: documentCategorySchema.optional(),
  uploadedById: z.string().optional()
})

// Type inference
export type PatientDocument = z.infer<typeof patientDocumentSchema>
export type PatientDocumentCreate = z.infer<typeof patientDocumentCreateSchema>
export type PatientDocumentUpdate = z.infer<typeof patientDocumentUpdateSchema>
export type PatientDocumentQuery = z.infer<typeof patientDocumentQuerySchema>
