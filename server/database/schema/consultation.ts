import { v7 as uuidv7 } from 'uuid'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

import { calendarDateField, creationAndUpdateTimestamps } from './columns.helpers'
import { organizations } from './organization'
import { users } from './auth'
import { patients } from './patient'
import { treatmentPlans } from './treatment-plan'
import { appointments } from './appointment'
import { VALID_CONSULTATION_STATUSES, VALID_SESSION_STEPS } from '../../../shared/utils/constants.consultation'

/**
 * ================================================================
 * CONSULTATIONS TABLE (CLINICAL SESSIONS)
 * ================================================================
 * Represents actual clinical sessions that occurred.
 * Linked to appointments via appointmentId (1:1 relationship).
 */
export const consultations = sqliteTable(
  'consultations',
  {
    id: text().primaryKey().$defaultFn(uuidv7),
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    appointmentId: text()
      .notNull()
      .references(() => appointments.id, { onDelete: 'cascade' }),

    // ---- Denormalized for query efficiency ----
    patientId: text()
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    treatmentPlanId: text().references(() => treatmentPlans.id, { onDelete: 'set null' }),
    therapistId: text()
      .notNull()
      .references(() => users.id),

    // ---- Clinical content ----
    chiefComplaint: text(),
    notes: text(),
    treatmentSummary: text(),
    observations: text(),
    nextSteps: text(),

    // ---- Clinical assessment ----
    painLevelBefore: integer(),
    painLevelAfter: integer(),
    progressNotes: text(),

    // ---- Session management ----
    sessionStep: text({ enum: VALID_SESSION_STEPS }).default('pre-session'),
    status: text({ enum: VALID_CONSULTATION_STATUSES }).notNull().default('in_progress'),
    actualStartTime: text(),
    actualDurationSeconds: integer(),
    totalPausedSeconds: integer(),
    pauseStartTime: text(),
    extendedDurationMinutes: integer().default(0),
    tags: text(),

    // ---- Billing (session-specific) ----
    billed: calendarDateField(),
    insuranceClaimed: integer({ mode: 'boolean' }).default(false),
    cost: integer(),

    // ---- Creation & update timestamps ----
    ...creationAndUpdateTimestamps
  },
  (table) => [
    // ---- Primary query patterns ----
    // Patient's session history: WHERE patientId = ? ORDER BY createdAt DESC
    index('idx_consultations_patient_date').on(table.patientId, table.createdAt),

    // ---- Filter by appointment ----
    index('idx_consultations_appointment').on(table.appointmentId)
  ]
)

// ----------------------
// Drizzle Relations
// ----------------------

export const consultationsRelations = relations(consultations, ({ one }) => ({
  appointment: one(appointments, {
    fields: [consultations.appointmentId],
    references: [appointments.id]
  }),
  patient: one(patients, {
    fields: [consultations.patientId],
    references: [patients.id]
  }),
  therapist: one(users, {
    fields: [consultations.therapistId],
    references: [users.id]
  }),
  treatmentPlan: one(treatmentPlans, {
    fields: [consultations.treatmentPlanId],
    references: [treatmentPlans.id]
  })
}))
