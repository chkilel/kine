import { createId } from '@paralleldrive/cuid2'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { calendarDateField, creationAndUpdateTimestamps } from './columns.helpers'
import { organizations } from './organization'
import { users } from './auth'
import { patients } from './patient'
import { treatmentPlans } from './treatment-plan'
import { VALID_CONSULTATION_STATUSES, VALID_CONSULTATION_TYPES } from '~~/shared/utils/constants.consultation'
import { VALID_CONSULTATION_LOCATIONS } from '~~/shared/utils/constants.location'

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
    id: text().primaryKey().$defaultFn(createId),
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    patientId: text()
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    treatmentPlanId: text().references(() => treatmentPlans.id, { onDelete: 'set null' }), // Optional link to a treatment plan — e.g., for progress tracking
    therapistId: text().references(() => users.id, { onDelete: 'set null' }), // Lead therapist for the session

    // ---- Scheduling ----
    date: calendarDateField().notNull(), // YYYY-MM-DD (date-only)
    startTime: text(), // Start time of session — e.g., "10:00"
    endTime: text(), // End time of session — e.g., "11:00"
    duration: integer(), // Session duration in minutes — e.g., 60
    type: text({ enum: VALID_CONSULTATION_TYPES }), // Type of consultation — e.g., "follow_up"

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

    // ---- Session management ----
    status: text({ enum: VALID_CONSULTATION_STATUSES }).notNull().default('scheduled'), // Session status — e.g., "completed"

    // ---- Planning location ----
    location: text({ enum: VALID_CONSULTATION_LOCATIONS }).default('clinic'),

    // ---- Billing & insurance ----
    billed: calendarDateField(), // Whether session was billed — e.g., true
    insuranceClaimed: integer({ mode: 'boolean' }).default(false), // Whether insurance claim was submitted — e.g., true
    cost: integer(), // Cost of session in cents — e.g., 5000 for €50.00

    // Creation & update timestamps
    ...creationAndUpdateTimestamps
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

// ----------------------
// Drizzle Relations
// ----------------------

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
