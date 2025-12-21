import { createId } from '@paralleldrive/cuid2'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

import { calendarDateField, softDeleteTimestamps } from './columns.helpers'
import { organizations } from './organization'
import { consultations } from './consultation'
import { treatmentPlans } from './treatment-plan'
import { patientDocuments } from './document'
import { VALID_PATIENT_STATUSES, VALID_SEX_VALUES } from '../../../shared/utils/constants.patient'

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
    id: text().primaryKey().$defaultFn(createId),
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    // Personal information
    firstName: text().notNull(),
    lastName: text().notNull(),
    dateOfBirth: calendarDateField().notNull(), // YYYY-MM-DD (date-only)
    gender: text({ enum: VALID_SEX_VALUES }).notNull(),
    email: text(), // Optional
    phone: text().notNull(),
    address: text(),
    city: text(),
    postalCode: text(),
    country: text(),

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
    status: text({ enum: VALID_PATIENT_STATUSES }).notNull().default('active'),
    notes: text({ mode: 'json' }), // General patient notes, preferences, observations, additional context (e.g.,["Patient prefers morning appointments",...] )

    // Created, Updated and Soft-delete timestamp (null if active)
    ...softDeleteTimestamps
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

// ----------------------
// Drizzle Relations
// ----------------------

export const patientsRelations = relations(patients, ({ many }) => ({
  consultations: many(consultations),
  treatmentPlans: many(treatmentPlans),
  documents: many(patientDocuments)
}))
