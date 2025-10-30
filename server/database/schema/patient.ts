import { createId } from '@paralleldrive/cuid2'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { dateSchema, requiredDateSchema, timestamps, timestampsSoftDelete } from './columns.helpers'
import { organizations } from './organization'
import { users } from './auth'

// ----------------------
// Patients Table
// ----------------------
export const patients = sqliteTable(
  'patients',
  {
    id: text().primaryKey().$defaultFn(createId), // Unique patient ID, generated automatically — e.g., "pat_01HXYZ1234"
    organizationId: text().notNull(), // Foreign key to the clinic/organization — e.g., "org_01HABC7890"

    // Personal information
    firstName: text().notNull(), // Patient's first name — e.g., "John"
    lastName: text().notNull(), // Patient's last name — e.g., "Doe"
    dateOfBirth: requiredDateSchema, // Timestamp (ms) — e.g., 631152000000 for "1990-01-01"
    gender: text({ enum: ['male', 'female'] }), // Gender — either "male" or "female"
    email: text().unique(), // Optional — e.g., "john.doe@example.com"
    phone: text(), // Patient’s phone number — e.g., "+212612345678"
    address: text(), // Street address — e.g., "123 Main Street"
    city: text(), // City — e.g., "Casablanca"
    postalCode: text(), // Postal code — e.g., "20000"
    country: text(), // Country — e.g., "Morocco"

    // JSON fields for repetitive or complex data
    emergencyContacts: text({ mode: 'json' }), // Example: [{ "name": "Jane Doe", "phone": "+212612345678", "relationship": "Wife" }]
    medicalConditions: text({ mode: 'json' }), // Example: ["Hypertension", "Diabetes"]
    surgeries: text({ mode: 'json' }), // Example: ["Knee surgery - 2018", "Appendectomy - 2010"]
    allergies: text({ mode: 'json' }), // Example: ["Penicillin", "Pollen"]
    medications: text({ mode: 'json' }), // Example: ["Metformin", "Ibuprofen"]
    insuranceProvider: text(), // Optional insurance company name — e.g., "AXA Assurance"
    insuranceNumber: text(), // Optional insurance number — e.g., "INS-123456789"
    referralSource: text(), // Who referred the patient — e.g., "Dr. Smith" or "Online Ad"
    referralDate: dateSchema, // Timestamp (ms) — e.g., 1730246400000 for "2024-10-30"

    status: text({ enum: ['active', 'inactive', 'discharged'] })
      .notNull()
      .default('active'), // Status of the patient record — e.g., "active"
    notes: text(), // General notes about the patient — e.g., "Patient prefers morning appointments"

    // Created, Updated and Soft-delete timestamp (null if active)
    ...timestampsSoftDelete
  },
  (table) => [
    // ---- Primary filtering indexes (with deletedAt for active records) ----
    // Most common pattern: WHERE organizationId = ? AND deletedAt IS NULL AND [field] = ?
    index('idx_patients_org_active_first_name').on(table.organizationId, table.deletedAt, table.firstName),
    index('idx_patients_org_active_last_name').on(table.organizationId, table.deletedAt, table.lastName),
    index('idx_patients_org_active_email').on(table.organizationId, table.deletedAt, table.email),
    index('idx_patients_org_active_phone').on(table.organizationId, table.deletedAt, table.phone),
    index('idx_patients_org_active_status').on(table.organizationId, table.deletedAt, table.status),
    index('idx_patients_org_active_created_at').on(table.organizationId, table.deletedAt, table.createdAt),
    index('idx_patients_org_active_insurance').on(table.organizationId, table.deletedAt, table.insuranceProvider),

    // ---- Multi-field indexes (with deletedAt) ----
    // Full name search: WHERE organizationId = ? AND deletedAt IS NULL ORDER BY lastName, firstName
    index('idx_patients_org_active_name_search').on(
      table.organizationId,
      table.deletedAt,
      table.lastName,
      table.firstName
    ),
    // Active patients by date: WHERE organizationId = ? AND deletedAt IS NULL AND status = 'active' ORDER BY createdAt
    index('idx_patients_org_active_status_created').on(
      table.organizationId,
      table.deletedAt,
      table.status,
      table.createdAt
    ),
    // Insurance + status filtering: WHERE organizationId = ? AND deletedAt IS NULL AND insuranceProvider = ? AND status = ?
    index('idx_patients_org_active_insurance_status').on(
      table.organizationId,
      table.deletedAt,
      table.insuranceProvider,
      table.status
    ),

    // ---- Special cases: Soft delete management ----
    // For "trash" view - finding deleted records only
    index('idx_patients_org_deleted_only').on(table.organizationId, table.deletedAt) // Note: When deletedAt IS NOT NULL, this index helps find deleted records
  ]
)

// ----------------------
// Consultations Table
// ----------------------
export const consultations = sqliteTable(
  'consultations',
  {
    id: text().primaryKey().$defaultFn(createId), // Unique consultation ID — e.g., "cons_01HYZ4567"
    organizationId: text().notNull(), // Foreign key to the clinic/organization — e.g., "org_01HABC7890"
    patientId: text()
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }), // Reference to patient — foreign key to patients.id
    date: requiredDateSchema, // Consultation date (timestamp ms) — e.g., 1730332800000 for "2025-10-30"
    mainComplaint: text(), // The main reason for visit — e.g., "Lower back pain for 3 months"
    diagnosis: text(), // Clinician diagnosis — e.g., "Lumbar strain"
    treatment: text(), // Treatment plan — e.g., "Physiotherapy sessions twice a week, stretching exercises"
    notes: text(), // Free-form notes about the session — e.g., "Improving flexibility since last visit"
    ...timestamps
  },
  (table) => [
    // ---- Primary query patterns ----
    // Patient's consultation history: WHERE organizationId = ? AND patientId = ? ORDER BY date DESC
    index('idx_consultations_org_patient_date').on(table.organizationId, table.patientId, table.date),

    // All consultations by date range: WHERE organizationId = ? AND date BETWEEN ? AND ? ORDER BY date DESC
    index('idx_consultations_org_date').on(table.organizationId, table.date),

    // Recent consultations: WHERE organizationId = ? ORDER BY createdAt DESC
    index('idx_consultations_org_created_at').on(table.organizationId, table.createdAt),

    // ---- Lookup indexes ----
    // Find all consultations for a patient (regardless of org - useful for patient portal)
    index('idx_consultations_patient_date').on(table.patientId, table.date),

    // Date-based reporting: WHERE organizationId = ? AND date >= ? ORDER BY date, patientId
    index('idx_consultations_org_date_patient').on(table.organizationId, table.date, table.patientId)
  ]
)

// ----------------------
// Patient Documents table
// ----------------------
export const patientDocuments = sqliteTable(
  'patient_documents',
  {
    id: text().primaryKey().$defaultFn(createId), // Unique document ID — e.g., "doc_01HZA7890"
    patientId: text()
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }), // Foreign key to patient
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }), // Foreign key to organization
    uploadedById: text()
      .notNull()
      .references(() => users.id), // User who uploaded the document
    fileName: text().notNull(), // Stored filename — e.g., "patient-123-xray-2024.pdf"
    originalName: text().notNull(), // Original filename from upload — e.g., "Chest X-Ray.pdf"
    mimeType: text().notNull(), // File type — e.g., "application/pdf", "image/jpeg"
    fileSize: integer().notNull(), // Size in bytes — e.g., 2048576 (2MB)
    storageKey: text().notNull().unique(), // Unique key for S3/storage — e.g., "orgs/org_123/patients/pat_456/doc_789.pdf"
    category: text({ enum: ['referral', 'imaging', 'lab_results', 'treatment_notes', 'other'] }).notNull(), // Document category for filtering
    description: text(), // Optional description — e.g., "MRI results showing improvement"
    ...timestampsSoftDelete // Soft delete to run cleanup script for bucket files
  },
  (table) => [
    // ---- Primary access patterns (with deletedAt for active documents) ----

    // Patient's document list: WHERE organizationId = ? AND patientId = ? AND deletedAt IS NULL ORDER BY createdAt DESC
    // Use case: Patient profile page showing all documents
    index('idx_patient_documents_org_active_patient').on(table.organizationId, table.deletedAt, table.patientId),

    // Documents by category: WHERE organizationId = ? AND category = ? AND deletedAt IS NULL
    // Use case: Filtering "Show all imaging documents" across all patients
    index('idx_patient_documents_org_active_category').on(table.organizationId, table.deletedAt, table.category),

    // Recent uploads: WHERE organizationId = ? AND deletedAt IS NULL ORDER BY createdAt DESC
    // Use case: "Recently uploaded documents" dashboard widget
    index('idx_patient_documents_org_active_uploaded_at').on(table.organizationId, table.deletedAt, table.createdAt),

    // ---- Multi-field indexes (for combined filtering) ----

    // Patient's documents by category: WHERE organizationId = ? AND patientId = ? AND category = 'imaging' AND deletedAt IS NULL
    // Use case: "Show all X-rays for this patient"
    index('idx_patient_documents_org_active_patient_category').on(
      table.organizationId,
      table.deletedAt,
      table.patientId,
      table.category
    ),

    // Category with date sorting: WHERE organizationId = ? AND category = ? AND deletedAt IS NULL ORDER BY createdAt DESC
    // Use case: "Recent lab results" filtered by date range
    index('idx_patient_documents_org_active_category_uploaded').on(
      table.organizationId,
      table.deletedAt,
      table.category,
      table.createdAt
    ),

    // ---- User activity tracking ----

    // Documents uploaded by specific user: WHERE organizationId = ? AND uploadedById = ? AND deletedAt IS NULL
    // Use case: Audit trail, "Who uploaded this?", user activity reports
    index('idx_patient_documents_org_active_uploader').on(table.organizationId, table.deletedAt, table.uploadedById),

    // ---- Soft delete cleanup support ----

    // Find deleted documents for cleanup: WHERE organizationId = ? AND deletedAt IS NOT NULL AND deletedAt < ?
    // Use case: Cron job to delete files from S3 after 30 days of soft delete
    index('idx_patient_documents_org_deleted_at').on(table.organizationId, table.deletedAt)

    // ---- Storage management ----

    // Storage key is already UNIQUE, so it has an implicit index
    // Use case: Quick lookup when serving files: WHERE storageKey = ?
  ]
)
