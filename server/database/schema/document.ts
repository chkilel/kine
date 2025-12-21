import { v7 as uuidv7 } from 'uuid'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

import { creationAndUpdateTimestamps } from './columns.helpers'
import { organizations } from './organization'
import { users } from './auth'
import { patients } from './patient'
import { treatmentPlans } from './treatment-plan'
import { VALID_DOCUMENT_TYPES } from '../../../shared/utils/constants.document'

/**
 * ================================================================
 * PATIENT DOCUMENTS TABLE
 * ================================================================
 * Stores patient-related uploaded files.
 * Each document belongs to a patient and optionally a treatment plan.
 * Files are referenced by unique storageKey (e.g., S3 key).
 */
export const patientDocuments = sqliteTable(
  'patient_documents',
  {
    id: text().primaryKey().$defaultFn(uuidv7),
    patientId: text()
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }), // Related patient
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }), // Owning organization
    uploadedById: text()
      .notNull()
      .references(() => users.id), // User who uploaded the document
    treatmentPlanId: text().references(() => treatmentPlans.id, { onDelete: 'set null' }), // Optional link to a treatment plan — e.g., MRI related to specific plan

    // ---- File metadata ----
    fileName: text().notNull(), // Stored filename — e.g., "patient-123-xray-2024.pdf"
    originalFileName: text().notNull(), // Original filename from upload — e.g., "Chest X-Ray.pdf"
    mimeType: text().notNull(), // File type — e.g., "application/pdf", "image/jpeg"
    fileSize: integer().notNull(), // Size in bytes — e.g., 2048576 (2MB)
    storageKey: text().notNull().unique(), // Unique key for S3/storage — e.g., "orgs/org_123/patients/pat_456/doc_789.pdf"

    category: text({ enum: VALID_DOCUMENT_TYPES }).notNull(), // Document category for filtering
    description: text(), // Optional description — e.g., "MRI results showing improvement"

    // CreatedAt and UpdatedAt timestamps
    ...creationAndUpdateTimestamps
  },
  (table) => [
    // Patient's document list: WHERE organizationId = ? AND patientId = ? ORDER BY createdAt DESC
    // Use case: Patient profile page showing all documents
    index('idx_patient_documents_org_active_patient').on(table.organizationId, table.patientId),

    // Recent uploads: WHERE organizationId = ? ORDER BY createdAt DESC
    // Use case: "Recently uploaded documents" dashboard widget
    index('idx_patient_documents_org_active_uploaded_at').on(table.organizationId, table.createdAt),

    // Patient's documents for a specific treatment plan: WHERE organizationId = ? AND patientId = ? AND treatmentPlanId = ?
    // Use case: Viewing documents related to a specific treatment plan
    index('idx_patient_documents_org_active_patient_treatment_plan').on(
      table.organizationId,
      table.patientId,
      table.treatmentPlanId
    ),

    // ---- User activity tracking ----

    // Documents uploaded by specific user: WHERE organizationId = ? AND uploadedById = ?
    // Use case: Audit trail, "Who uploaded this?", user activity reports
    index('idx_patient_documents_org_active_uploader').on(table.organizationId, table.uploadedById)

    // ---- Storage management ----

    // Storage key is already UNIQUE, so it has an implicit index
    // Use case: Quick lookup when serving files: WHERE storageKey = ?
  ]
)

// ----------------------
// Drizzle Relations
// ----------------------

export const patientDocumentsRelations = relations(patientDocuments, ({ one }) => ({
  patient: one(patients, {
    fields: [patientDocuments.patientId],
    references: [patients.id]
  }),
  organization: one(organizations, {
    fields: [patientDocuments.organizationId],
    references: [organizations.id]
  }),
  uploadedBy: one(users, {
    fields: [patientDocuments.uploadedById],
    references: [users.id]
  }),
  treatmentPlan: one(treatmentPlans, {
    fields: [patientDocuments.treatmentPlanId],
    references: [treatmentPlans.id]
  })
}))
