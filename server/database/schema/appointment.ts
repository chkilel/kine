import { v7 as uuidv7 } from 'uuid'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

import { calendarDateField, creationAndUpdateTimestamps } from './columns.helpers'
import { organizations } from './organization'
import { users } from './auth'
import { patients } from './patient'
import { treatmentPlans } from './treatment-plan'
import { rooms } from './rooms'
import { APPOINTMENT_STATUSES, APPOINTMENT_TYPES } from '../../../shared/utils/constants.appointment'
import { LOCATIONS } from '../../../shared/utils/constants.location'

/**
 * ================================================================
 * APPOINTMENTS TABLE
 * ================================================================
 * Represents each individual appointment or therapy session.
 * Can exist independently or as part of a treatment plan.
 */
export const appointments = sqliteTable(
  'appointments',
  {
    id: text().primaryKey().$defaultFn(uuidv7),
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    patientId: text()
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    treatmentPlanId: text().references(() => treatmentPlans.id, { onDelete: 'set null' }), // Optional link to a treatment plan — e.g., for progress tracking
    therapistId: text()
      .notNull()
      .references(() => users.id), // Lead therapist for the session
    roomId: text().references(() => rooms.id, { onDelete: 'set null' }), // Room this session is in

    // ---- Scheduling ----
    date: calendarDateField().notNull(), // YYYY-MM-DD (date-only)
    startTime: text().notNull(), // Start time of session — e.g., "10:00"
    endTime: text().notNull(), // End time of session — e.g., "11:00"
    duration: integer().notNull(), // Session duration in minutes — e.g., 60
    type: text({ enum: APPOINTMENT_TYPES }), // Type of appointment — e.g., "follow_up"

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
    status: text({ enum: APPOINTMENT_STATUSES }).notNull().default('scheduled'), // Session status — e.g., "completed"
    actualStartTime: text(), // Actual time when therapy session began (HH:MM:SS format)
    actualDurationSeconds: integer(), // Actual therapy time in seconds (excluding pauses)
    totalPausedSeconds: integer(), // Cumulative pause duration in seconds
    pauseStartTime: text(), // Timestamp when current pause began (null if running) — e.g., "10:15:30"
    extendedDurationMinutes: integer().default(0), // Minutes added beyond planned duration
    tags: text(), // JSON array of smart tags for session classification — e.g., '["Douleur Diminuée", "Proprioception"]'

    // ---- Planning location ----
    location: text({ enum: LOCATIONS }).default('clinic'),

    // ---- Billing & insurance ----
    billed: calendarDateField(), // Whether session was billed — e.g., true
    insuranceClaimed: integer({ mode: 'boolean' }).default(false), // Whether insurance claim was submitted — e.g., true
    cost: integer(), // Cost of session in cents — e.g., 5000 for €50.00

    // Creation & update timestamps
    ...creationAndUpdateTimestamps
  },
  (table) => [
    // ---- Primary query patterns ----
    // Patient's appointment history: WHERE organizationId = ? AND patientId = ? ORDER BY date DESC
    index('idx_appointments_org_patient_date').on(table.organizationId, table.patientId, table.date),

    // All appointments by date range: WHERE organizationId = ? AND date BETWEEN ? AND ? ORDER BY date DESC
    index('idx_appointments_org_date').on(table.organizationId, table.date),

    // Recent appointments: WHERE organizationId = ? ORDER BY createdAt DESC
    index('idx_appointments_org_created_at').on(table.organizationId, table.createdAt),

    // ---- Status and scheduling indexes ----
    // Find appointments by status: WHERE organizationId = ? AND status = ? ORDER BY date ASC
    index('idx_appointments_org_status_date').on(table.organizationId, table.status, table.date),

    // Find appointments by therapist: WHERE organizationId = ? AND therapistId = ? ORDER BY date DESC
    index('idx_appointments_org_therapist_date').on(table.organizationId, table.therapistId, table.date),

    // Find appointments by session type: WHERE organizationId = ? AND sessionType = ? ORDER BY date DESC
    index('idx_appointments_org_session_type_date').on(table.organizationId, table.type, table.date),

    // ---- Location-based indexes ----
    // Find appointments by location: WHERE organizationId = ? AND location = ? ORDER BY date DESC
    index('idx_appointments_org_location_date').on(table.organizationId, table.location, table.date),

    // ---- Billing and insurance indexes ----
    // Find unbilled appointments: WHERE organizationId = ? AND billed = false ORDER BY date ASC
    index('idx_appointments_org_billed_date').on(table.organizationId, table.billed, table.date),

    // Find appointments with insurance claims: WHERE organizationId = ? AND insuranceClaimed = true ORDER BY date DESC
    index('idx_appointments_org_insurance_date').on(table.organizationId, table.insuranceClaimed, table.date),

    // ---- Lookup indexes ----
    // Find all appointments for a patient (regardless of org - useful for patient portal)
    index('idx_appointments_patient_date').on(table.patientId, table.date),

    // Date-based reporting: WHERE organizationId = ? AND date >= ? ORDER BY date, patientId
    index('idx_appointments_org_date_patient').on(table.organizationId, table.date, table.patientId),

    // Filter by treatment plan
    index('idx_appointments_org_plan_date').on(table.organizationId, table.treatmentPlanId, table.date),

    // ---- Multi-field indexes for common queries ----
    // Therapist's daily schedule: WHERE organizationId = ? AND therapistId = ? AND date = ? AND status != 'cancelled'
    index('idx_appointments_org_therapist_date_status').on(
      table.organizationId,
      table.therapistId,
      table.date,
      table.status
    ),

    // Patient's treatment progress: WHERE organizationId = ? AND patientId = ? AND treatmentPlanId = ? ORDER BY date DESC
    index('idx_appointments_org_patient_plan_date').on(
      table.organizationId,
      table.patientId,
      table.treatmentPlanId,
      table.date
    ),

    // ---- Room-based booking indexes ----
    // Unique constraint to prevent double-booking same room at same time
    index('idx_appointments_room_booking_unique').on(table.roomId, table.date, table.startTime),

    // Composite indexes for efficient room-based availability queries
    index('idx_appointments_room_date').on(table.roomId, table.date),
    index('idx_appointments_room_date_time').on(table.roomId, table.date, table.startTime)
  ]
)

// ----------------------
// Drizzle Relations
// ----------------------

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id]
  }),
  organization: one(organizations, {
    fields: [appointments.organizationId],
    references: [organizations.id]
  }),
  treatmentPlan: one(treatmentPlans, {
    fields: [appointments.treatmentPlanId],
    references: [treatmentPlans.id]
  }),
  room: one(rooms, {
    fields: [appointments.roomId],
    references: [rooms.id]
  })
}))
