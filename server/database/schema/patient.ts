import { createId } from '@paralleldrive/cuid2'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { timestamps } from './columns.helpers'
import { organizations } from './organization'

// Patient table
export const patients = sqliteTable('patients', {
  id: text().primaryKey().$defaultFn(createId),
  organizationId: text()
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  firstName: text().notNull(),
  lastName: text().notNull(),
  dateOfBirth: integer({ mode: 'timestamp_ms' }), // Store as timestamp for date handling
  gender: text({ enum: ['male', 'female'] }),
  email: text().unique(),
  phone: text(),
  address: text(),
  city: text(),
  postalCode: text(),
  country: text(),
  emergencyContactName: text(),
  emergencyContactPhone: text(),
  emergencyContactRelationship: text(),
  medicalHistory: text({ mode: 'json' }), // JSON field for complex medical data
  medications: text({ mode: 'json' }), // JSON field for medications list
  allergies: text({ mode: 'json' }), // JSON field for allergies list
  insuranceProvider: text(),
  insuranceNumber: text(),
  referralSource: text(),
  referralDate: integer({ mode: 'timestamp_ms' }),
  status: text({ enum: ['active', 'inactive', 'discharged'] })
    .notNull()
    .default('active'),
  notes: text(),
  deletedAt: integer({ mode: 'timestamp_ms' }), // Soft delete support
  ...timestamps
})

// Patient Documents table
export const patientDocuments = sqliteTable('patient_documents', {
  id: text().primaryKey().$defaultFn(createId),
  patientId: text()
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  organizationId: text()
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  fileName: text().notNull(),
  originalName: text().notNull(),
  mimeType: text().notNull(),
  fileSize: integer().notNull(),
  storageKey: text().notNull().unique(),
  category: text({ enum: ['referral', 'imaging', 'lab_results', 'treatment_notes', 'other'] }).notNull(),
  description: text(),
  uploadedBy: text().notNull(),
  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  deletedAt: integer({ mode: 'timestamp_ms' }) // Soft delete support
})

// Composite indexes for optimal multi-tenant performance
// All indexes use organizationId as the leading column for proper data isolation

// Patient table composite indexes
export const patientIndexes = {
  // Primary filtering indexes (organizationId + filter field)
  orgFirstName: 'CREATE INDEX IF NOT EXISTS idx_patients_org_first_name ON patients(organizationId, firstName)',
  orgLastName: 'CREATE INDEX IF NOT EXISTS idx_patients_org_last_name ON patients(organizationId, lastName)',
  orgEmail: 'CREATE INDEX IF NOT EXISTS idx_patients_org_email ON patients(organizationId, email)',
  orgPhone: 'CREATE INDEX IF NOT EXISTS idx_patients_org_phone ON patients(organizationId, phone)',
  orgStatus: 'CREATE INDEX IF NOT EXISTS idx_patients_org_status ON patients(organizationId, status)',
  orgCreatedAt: 'CREATE INDEX IF NOT EXISTS idx_patients_org_created_at ON patients(organizationId, createdAt)',
  orgInsuranceProvider:
    'CREATE INDEX IF NOT EXISTS idx_patients_org_insurance_provider ON patients(organizationId, insuranceProvider)',

  // Multi-field composite indexes for common query patterns
  orgNameSearch:
    'CREATE INDEX IF NOT EXISTS idx_patients_org_name_search ON patients(organizationId, lastName, firstName)',
  orgStatusCreated:
    'CREATE INDEX IF NOT EXISTS idx_patients_org_status_created ON patients(organizationId, status, createdAt)',
  orgInsuranceStatus:
    'CREATE INDEX IF NOT EXISTS idx_patients_org_insurance_status ON patients(organizationId, insuranceProvider, status)',

  // Soft delete support with organization isolation
  orgDeletedAt: 'CREATE INDEX IF NOT EXISTS idx_patients_org_deleted_at ON patients(organizationId, deletedAt)',
  orgActive: 'CREATE INDEX IF NOT EXISTS idx_patients_org_active ON patients(organizationId, status, deletedAt)'
}

// Patient Documents table composite indexes
export const patientDocumentIndexes = {
  // Primary document access indexes
  orgPatient:
    'CREATE INDEX IF NOT EXISTS idx_patient_documents_org_patient ON patient_documents(organizationId, patientId)',
  orgCategory:
    'CREATE INDEX IF NOT EXISTS idx_patient_documents_org_category ON patient_documents(organizationId, category)',
  orgUploadedAt:
    'CREATE INDEX IF NOT EXISTS idx_patient_documents_org_uploaded_at ON patient_documents(organizationId, createdAt)',
  orgUploadedBy:
    'CREATE INDEX IF NOT EXISTS idx_patient_documents_org_uploaded_by ON patient_documents(organizationId, uploadedBy)',

  // Multi-field composite indexes for document queries
  orgPatientCategory:
    'CREATE INDEX IF NOT EXISTS idx_patient_documents_org_patient_category ON patient_documents(organizationId, patientId, category)',
  orgCategoryUploaded:
    'CREATE INDEX IF NOT EXISTS idx_patient_documents_org_category_uploaded ON patient_documents(organizationId, category, createdAt)',

  // Soft delete support with organization isolation
  orgDeletedAt:
    'CREATE INDEX IF NOT EXISTS idx_patient_documents_org_deleted_at ON patient_documents(organizationId, deletedAt)',
  orgActive:
    'CREATE INDEX IF NOT EXISTS idx_patient_documents_org_active ON patient_documents(organizationId, patientId, deletedAt)'
}
