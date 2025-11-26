import { createId } from '@paralleldrive/cuid2'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { dateSchema, requiredDateSchema, timestamps, timestampsSoftDelete } from './columns.helpers'
import { organizations } from './organization'
import { users } from './auth'

/**
 * ================================================================
 * PATIENTS TABLE
 * ================================================================
 * Stores core demographic and medical information.
 * A patient always belongs to one organization (clinic).
 * Records are soft-deleted for audit and data retention compliance.
 */
export const patients = sqliteTable(
  'patients',
  {
    id: text().primaryKey().$defaultFn(createId), // Unique patient ID, generated automatically — e.g., "pat_01HXYZ1234"
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }), // Foreign key to the clinic/organization — e.g., "org_01HABC7890"

    // Personal information
    firstName: text().notNull(), // Patient's first name — e.g., "John"
    lastName: text().notNull(), // Patient's last name — e.g., "Doe"
    dateOfBirth: requiredDateSchema(), // Timestamp (ms) — e.g., 631152000000 for "1990-01-01"
    gender: text({ enum: ['male', 'female'] }).notNull(), // Gender — either "male" or "female"
    email: text(), // Optional — e.g., "john.doe@example.com"
    phone: text().notNull(), // Patient’s phone number — e.g., "+212612345678"
    address: text(), // Street address — e.g., "123 Main Street"
    city: text(), // City — e.g., "Casablanca"
    postalCode: text(), // Postal code — e.g., "20000"
    country: text(), // Country — e.g., "Morocco"

    // ---- Medical information ----
    emergencyContacts: text({ mode: 'json' }), // Example: [{ "name": "Jane Doe", "phone": "+212612345678", "relationship": "Wife" }]
    medicalConditions: text({ mode: 'json' }), // Example: ["Hypertension", "Diabetes"]
    surgeries: text({ mode: 'json' }), // Example: ["Knee surgery - 2018", "Appendectomy - 2010"]
    allergies: text({ mode: 'json' }), // Example: ["Penicillin", "Pollen"]
    medications: text({ mode: 'json' }), // Example: ["Metformin", "Ibuprofen"]

    // ---- Insurance and referral ----
    insuranceProvider: text(), // Optional insurance company name — e.g., "AXA Assurance"
    insuranceNumber: text(), // Optional insurance number — e.g., "INS-123456789"
    referralSource: text(), // Who referred the patient — e.g., "Dr. Smith" or "Online Ad"

    // ---- Record management ----
    status: text({ enum: ['active', 'inactive', 'discharged', 'archived'] })
      .notNull()
      .default('active'), // Status of the patient record — e.g., "active"
    notes: text({ mode: 'json' }), // General patient notes, preferences, observations, additional context (e.g.,["Patient prefers morning appointments",...] )

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

    // ---- Special cases: Soft delete management ----
    // For "trash" view - finding deleted records only
    index('idx_patients_org_deleted_only').on(table.organizationId, table.deletedAt) // Note: When deletedAt IS NOT NULL, this index helps find deleted records
  ]
)

/**
 * ================================================================
 * TREATMENT PLANS TABLE
 * ================================================================
 * Defines a structured plan of care for a patient.
 * Each plan belongs to a patient and an organization, and is assigned to a therapist.
 */
export const treatmentPlans = sqliteTable(
  'treatment_plans',
  {
    id: text().primaryKey().$defaultFn(createId), // Unique treatment plan ID — e.g., "plan_01HZT8901"
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }), // Foreign key to the clinic/organization
    patientId: text()
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }), // Reference to patient

    therapistId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'set null' }), // Lead therapist (nullable on deletion)

    // ---- Clinical information ----
    title: text().notNull(), // Descriptive name of the treatment plan — e.g., "Post-operative knee rehabilitation plan"
    diagnosis: text().notNull(), // Main medical diagnosis — e.g., "Post-operative knee rehabilitation"
    objective: text(), // Goal or objective of treatment — e.g., "Restore full range of motion"

    startDate: requiredDateSchema(), // Start date (timestamp ms)
    endDate: dateSchema(), // End date (timestamp ms)
    numberOfSessions: integer(), // Total number of sessions prescribed — e.g., 12
    sessionFrequency: integer(), // Session frequency — e.g., 1,...,7

    status: text({ enum: ['planned', 'ongoing', 'completed', 'paused', 'cancelled'] })
      .notNull()
      .default('planned'), // Status of treatment plan — e.g., "ongoing"

    // Medical staff and prescription info
    prescribingDoctor: text(), // Doctor who prescribed the treatment — e.g., "Dr. Martin"
    prescriptionDate: dateSchema(), // Date when prescription was issued — e.g., 1730246400000 for "2024-10-30"

    // Clinical assessment
    painLevel: integer(), // Initial pain level (0-10 scale) — e.g., 6 for moderate pain

    // Insurance and coverage
    coverageStatus: text({
      enum: [
        'not_required',
        'not_provided',
        'to_verify',
        'awaiting_agreement',
        'covered',
        'partially_covered',
        'refused',
        'expired',
        'cancelled'
      ]
    }), // Insurance coverage status — e.g., "covered"
    insuranceInfo: text(), // Additional insurance details — e.g., "Mutuelle SantéPlus, N° POL123456"

    notes: text({ mode: 'json' }), // General notes about the treatment plan — e.g., "Focus on strengthening after surgery"

    // Created, Updated and Soft-delete timestamp (null if active)
    ...timestampsSoftDelete
  },
  (table) => [
    // ---- Primary filtering indexes (with deletedAt for active plans) ----
    index('idx_treatment_plans_org_active_patient').on(table.organizationId, table.deletedAt, table.patientId),
    index('idx_treatment_plans_org_active_status').on(table.organizationId, table.deletedAt, table.status),

    // ---- Medical staff filtering ----
    index('idx_treatment_plans_org_active_therapist').on(table.organizationId, table.deletedAt, table.therapistId),
    index('idx_treatment_plans_org_active_prescribing_doctor').on(
      table.organizationId,
      table.deletedAt,
      table.prescribingDoctor
    ),

    // ---- Date-based filtering ----
    index('idx_treatment_plans_org_active_start_date').on(table.organizationId, table.deletedAt, table.startDate),
    index('idx_treatment_plans_org_active_end_date').on(table.organizationId, table.deletedAt, table.endDate),

    // ---- Multi-field indexes for common queries ----
    // Find active treatment plans by therapist and status: WHERE organizationId = ? AND deletedAt IS NULL AND therapist = ? AND status = ?
    index('idx_treatment_plans_org_active_therapist_status').on(
      table.organizationId,
      table.deletedAt,
      table.therapistId,
      table.status
    ),

    // Find treatment plans by prescribing doctor: WHERE organizationId = ? AND deletedAt IS NULL AND prescribingDoctor = ? ORDER BY prescriptionDate DESC
    index('idx_treatment_plans_org_active_prescribing_doctor_date').on(
      table.organizationId,
      table.deletedAt,
      table.prescribingDoctor,
      table.prescriptionDate
    ),

    // Find treatment plans by coverage status: WHERE organizationId = ? AND deletedAt IS NULL AND coverageStatus = ? ORDER BY createdAt DESC
    index('idx_treatment_plans_org_active_coverage_created').on(
      table.organizationId,
      table.deletedAt,
      table.coverageStatus,
      table.createdAt
    )
  ]
)

/**
 * ================================================================
 * CONSULTATIONS TABLE
 * ================================================================
 * Represents each individual consultation or therapy session.
 * Can exist independently or as part of a treatment plan.
 */
export const consultations = sqliteTable(
  'consultations',
  {
    id: text().primaryKey().$defaultFn(createId), // Unique consultation ID — e.g., "cons_01HYZ4567"
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }), // Foreign key to the clinic/organization — e.g., "org_01HABC7890"
    patientId: text()
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }), // Reference to patient — foreign key to patients.id
    treatmentPlanId: text().references(() => treatmentPlans.id, { onDelete: 'set null' }), // Optional link to a treatment plan — e.g., for progress tracking

    // ---- Scheduling ----
    date: requiredDateSchema(), // Consultation date (timestamp ms) — e.g., 1730332800000 for "2025-10-30"
    startTime: text(), // Start time of session — e.g., "10:00"
    endTime: text(), // End time of session — e.g., "11:00"
    duration: integer(), // Session duration in minutes — e.g., 60
    type: text({
      enum: ['initial', 'follow_up', 'evaluation', 'discharge', 'mobilization', 'reinforcement', 'reeducation']
    }), // Type of consultation — e.g., "follow_up"

    // ---- Clinical content ----
    chiefComplaint: text(), // The main reason for visit — e.g., "Lower back pain for 3 months"
    notes: text(), // Session-specific notes — e.g., "Improving flexibility since last visit"
    treatmentSummary: text(), // Short summary of applied treatment — e.g., "Manual therapy and stretching"
    observations: text(), // Optional field for observations during session — e.g., "Tight hamstrings"
    nextSteps: text(), // Plan or recommendations for next session — e.g., "Increase resistance exercises"

    // ---- Clinical assessment ----
    painLevelBefore: integer(), // Pain level before session (0-10 scale) — e.g., 7
    painLevelAfter: integer(), // Pain level after session (0-10 scale) — e.g., 4
    progressNotes: text(), // Progress assessment notes — e.g., "Patient shows improvement in range of motion"

    // ---- Therapist ----
    therapistId: text().references(() => users.id, { onDelete: 'set null' }), // Lead therapist for the session

    // ---- Session management ----
    status: text({ enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'] })
      .notNull()
      .default('scheduled'), // Session status — e.g., "completed"

    // ---- Planning location ----
    location: text({ enum: ['clinic', 'home', 'telehealth'] }).default('clinic'), // Consultation location — e.g., "clinic"

    // ---- Billing & insurance ----
    billed: integer({ mode: 'boolean' }).default(false), // Whether session was billed — e.g., true
    insuranceClaimed: integer({ mode: 'boolean' }).default(false), // Whether insurance claim was submitted — e.g., true
    cost: integer(), // Cost of session in cents — e.g., 5000 for €50.00

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

    // ---- Status and scheduling indexes ----
    // Find consultations by status: WHERE organizationId = ? AND status = ? ORDER BY date ASC
    index('idx_consultations_org_status_date').on(table.organizationId, table.status, table.date),

    // Find consultations by therapist: WHERE organizationId = ? AND therapistId = ? ORDER BY date DESC
    index('idx_consultations_org_therapist_date').on(table.organizationId, table.therapistId, table.date),

    // Find consultations by session type: WHERE organizationId = ? AND sessionType = ? ORDER BY date DESC
    index('idx_consultations_org_session_type_date').on(table.organizationId, table.type, table.date),

    // ---- Location-based indexes ----
    // Find consultations by location: WHERE organizationId = ? AND location = ? ORDER BY date DESC
    index('idx_consultations_org_location_date').on(table.organizationId, table.location, table.date),

    // ---- Billing and insurance indexes ----
    // Find unbilled consultations: WHERE organizationId = ? AND billed = false ORDER BY date ASC
    index('idx_consultations_org_billed_date').on(table.organizationId, table.billed, table.date),

    // Find consultations with insurance claims: WHERE organizationId = ? AND insuranceClaimed = true ORDER BY date DESC
    index('idx_consultations_org_insurance_date').on(table.organizationId, table.insuranceClaimed, table.date),

    // ---- Lookup indexes ----
    // Find all consultations for a patient (regardless of org - useful for patient portal)
    index('idx_consultations_patient_date').on(table.patientId, table.date),

    // Date-based reporting: WHERE organizationId = ? AND date >= ? ORDER BY date, patientId
    index('idx_consultations_org_date_patient').on(table.organizationId, table.date, table.patientId),

    // Filter by treatment plan
    index('idx_consultations_org_plan_date').on(table.organizationId, table.treatmentPlanId, table.date),

    // ---- Multi-field indexes for common queries ----
    // Therapist's daily schedule: WHERE organizationId = ? AND therapistId = ? AND date = ? AND status != 'cancelled'
    index('idx_consultations_org_therapist_date_status').on(
      table.organizationId,
      table.therapistId,
      table.date,
      table.status
    ),

    // Patient's treatment progress: WHERE organizationId = ? AND patientId = ? AND treatmentPlanId = ? ORDER BY date DESC
    index('idx_consultations_org_patient_plan_date').on(
      table.organizationId,
      table.patientId,
      table.treatmentPlanId,
      table.date
    )
  ]
)

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
    treatmentPlanId: text().references(() => treatmentPlans.id, { onDelete: 'set null' }), // Optional link to a treatment plan — e.g., MRI related to specific plan

    // ---- File metadata ----
    fileName: text().notNull(), // Stored filename — e.g., "patient-123-xray-2024.pdf"
    originalFileName: text().notNull(), // Original filename from upload — e.g., "Chest X-Ray.pdf"
    mimeType: text().notNull(), // File type — e.g., "application/pdf", "image/jpeg"
    fileSize: integer().notNull(), // Size in bytes — e.g., 2048576 (2MB)
    storageKey: text().notNull().unique(), // Unique key for S3/storage — e.g., "orgs/org_123/patients/pat_456/doc_789.pdf"

    category: text({
      enum: ['referral', 'imaging', 'lab_results', 'treatment_notes', 'prescriptions', 'other']
    }).notNull(), // Document category for filtering
    description: text(), // Optional description — e.g., "MRI results showing improvement"

    ...timestampsSoftDelete
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

// ----------------------
// Drizzle Relations
// ----------------------
import { relations } from 'drizzle-orm'

export const patientsRelations = relations(patients, ({ many }) => ({
  consultations: many(consultations),
  treatmentPlans: many(treatmentPlans),
  documents: many(patientDocuments)
}))

export const treatmentPlansRelations = relations(treatmentPlans, ({ one, many }) => ({
  patient: one(patients, {
    fields: [treatmentPlans.patientId],
    references: [patients.id]
  }),
  organization: one(organizations, {
    fields: [treatmentPlans.organizationId],
    references: [organizations.id]
  }),
  consultations: many(consultations),
  documents: many(patientDocuments)
}))

export const consultationsRelations = relations(consultations, ({ one }) => ({
  patient: one(patients, {
    fields: [consultations.patientId],
    references: [patients.id]
  }),
  organization: one(organizations, {
    fields: [consultations.organizationId],
    references: [organizations.id]
  }),
  treatmentPlan: one(treatmentPlans, {
    fields: [consultations.treatmentPlanId],
    references: [treatmentPlans.id]
  })
}))

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
