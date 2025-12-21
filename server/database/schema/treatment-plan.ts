import { createId } from '@paralleldrive/cuid2'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { calendarDateField, creationAndUpdateTimestamps, softDeleteTimestamps } from './columns.helpers'
import { organizations } from './organization'
import { users } from './auth'
import { relations } from 'drizzle-orm'
import { patients } from './patient'
import { VALID_COVERAGE_STATUSES, VALID_TREATMENT_PLAN_STATUSES } from '~~/shared/utils/constants.treatement-plan'

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
    id: text().primaryKey().$defaultFn(createId),
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }), // Owning organization
    patientId: text()
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }), // Associated patient
    therapistId: text().references(() => users.id, { onDelete: 'set null' }), // Assigned therapist (nullable on deletion)

    // ---- Clinical information ----
    title: text().notNull(), // e.g., "Post-operative knee rehabilitation plan"
    diagnosis: text().notNull(), // Main medical diagnosis — e.g., "Post-operative knee rehabilitation"
    objective: text(), // Goal of treatment — e.g., "Restore full range of motion"

    startDate: calendarDateField().notNull(), // YYYY-MM-DD
    endDate: calendarDateField().notNull(), // YYYY-MM-DD
    numberOfSessions: integer(), // Total number of sessions prescribed — e.g., 12
    sessionFrequency: integer(), // Session frequency — e.g., 1,...,7

    status: text({ enum: VALID_TREATMENT_PLAN_STATUSES }).notNull().default('planned'),

    // Medical staff and prescription info
    prescribingDoctor: text(), // Doctor who prescribed the treatment — e.g., "Dr. Martin"
    prescriptionDate: calendarDateField().notNull(), // YYYY-MM-DD
    // Clinical assessment
    painLevel: integer(), // Initial pain level (0-10 scale) — e.g., 6 for moderate pain

    // Insurance and coverage
    coverageStatus: text({ enum: VALID_COVERAGE_STATUSES }),
    insuranceInfo: text(), // Additional details — e.g., "Mutuelle SantéPlus, N° POL123456"

    notes: text({ mode: 'json' }), // General notes about the treatment plan — e.g., "Focus on strengthening after surgery"

    // CreatedAt, UpdatedAt
    ...creationAndUpdateTimestamps
  },
  (table) => [
    // ---- Primary filtering indexes  ----
    index('idx_treatment_plans_org_active_patient').on(table.organizationId, table.patientId),
    index('idx_treatment_plans_org_active_status').on(table.organizationId, table.status),

    // ---- Medical staff filtering ----
    index('idx_treatment_plans_org_active_therapist').on(table.organizationId, table.therapistId),

    // ---- Date-based filtering ----
    index('idx_treatment_plans_org_active_start_date').on(table.organizationId, table.startDate, table.endDate),

    // ---- Multi-field indexes for common queries ----
    // Find active treatment plans by therapist and status: WHERE organizationId = ? AND deletedAt IS NULL AND therapist = ? AND status = ?
    index('idx_treatment_plans_org_active_therapist_status').on(table.organizationId, table.therapistId, table.status)
  ]
)

// ----------------------
// Drizzle Relations
// ----------------------

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
