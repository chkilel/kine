import { v7 as uuidv7 } from 'uuid'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

import { calendarDateField, creationAndUpdateTimestamps } from './columns.helpers'
import { organizations } from './organization'
import { users } from './auth'
import { appointments } from './appointment'
import { patients } from './patient'
import { treatmentPlans } from './treatment-plan'
import { TREATMENT_SESSION_STATUSES, TREATMENT_SESSION_STEPS } from '../../../shared/utils/constants.treatment-session'

/**
 * ================================================================
 * TREATMENT SESSIONS TABLE (CLINICAL SESSIONS)
 * ================================================================
 * Represents actual clinical sessions that occurred.
 * Linked to appointments via appointmentId (1:1 relationship).
 */
export const treatmentSessions = sqliteTable(
  'treatment_sessions',
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
    // Primary concern or reason for the session for the independent consultation, for the treatment plan
    primaryConcern: text(),
    treatmentSummary: text(),
    observations: text(),
    nextSteps: text(),

    // ---- Clinical assessment ----
    painLevelBefore: integer(),
    painLevelAfter: integer(),

    // ---- Session management ----
    sessionStep: text({ enum: TREATMENT_SESSION_STEPS }).default('pre-session'),
    status: text({ enum: TREATMENT_SESSION_STATUSES }).notNull().default('in_progress'),
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
    index('idx_treatment_sessions_patient_date').on(table.patientId, table.createdAt),

    // ---- Filter by appointment ----
    index('idx_treatment_sessions_appointment').on(table.appointmentId),

    // ---- Uniqueness: at most one session per appointment ----
    uniqueIndex('ux_treatment_sessions_appointment').on(table.appointmentId)
  ]
)

// ----------------------
// Drizzle Relations
// ----------------------

export const treatmentSessionsRelations = relations(treatmentSessions, ({ one }) => ({
  appointment: one(appointments, {
    fields: [treatmentSessions.appointmentId],
    references: [appointments.id]
  }),
  patient: one(patients, {
    fields: [treatmentSessions.patientId],
    references: [patients.id]
  }),
  therapist: one(users, {
    fields: [treatmentSessions.therapistId],
    references: [users.id]
  }),
  treatmentPlan: one(treatmentPlans, {
    fields: [treatmentSessions.treatmentPlanId],
    references: [treatmentPlans.id]
  })
}))
