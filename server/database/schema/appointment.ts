import { v7 as uuidv7 } from 'uuid'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

import { calendarDateField, creationAndUpdateTimestamps } from './columns.helpers'
import { organizations } from './organization'
import { users } from './auth'
import { patients } from './patient'
import { treatmentPlans } from './treatment-plan'
import { treatmentSessions } from './treatment-session'
import { rooms } from './rooms'
import { APPOINTMENT_STATUSES, APPOINTMENT_TYPES } from '../../../shared/utils/constants.appointment'
import { LOCATIONS } from '../../../shared/utils/constants.location'

/**
 * ================================================================
 * APPOINTMENTS TABLE
 * ================================================================
 * Represents scheduled time slots for clinical sessions.
 * An appointment may or may not have a treatment session (1:0..1).
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
    // treatmentPlanId: Optional link to a treatment plan — e.g., null for individual sessions
    treatmentPlanId: text().references(() => treatmentPlans.id, { onDelete: 'set null' }),
    therapistId: text()
      .notNull()
      .references(() => users.id),
    roomId: text().references(() => rooms.id, { onDelete: 'set null' }),

    // ---- Scheduling ----
    date: calendarDateField().notNull(), // YYYY-MM-DD (date-only)
    startTime: text().notNull(), // Start time of session — e.g., "10:00"
    endTime: text().notNull(), // End time of session — e.g., "11:00"
    duration: integer().notNull(), // Session duration in minutes — e.g., 60
    type: text({ enum: APPOINTMENT_TYPES }), // Type of appointment — e.g., "follow_up"
    location: text({ enum: LOCATIONS }).notNull().default('clinic'),

    // ---- Appointment status (scheduling lifecycle) ----
    status: text({ enum: APPOINTMENT_STATUSES }).notNull().default('scheduled'),
    confirmedAt: integer({ mode: 'timestamp_ms' }),
    cancelledAt: integer({ mode: 'timestamp_ms' }),
    noShowReason: text(),

    // Creation & update timestamps
    ...creationAndUpdateTimestamps
  },
  (table) => [
    // ---- Primary query patterns ----
    // Patient's appointment history: WHERE organizationId = ? AND patientId = ? ORDER BY date DESC
    index('idx_appointments_org_patient_date').on(table.organizationId, table.patientId, table.date),

    // All appointments by date range: WHERE organizationId = ? AND date BETWEEN ? AND ? ORDER BY date DESC
    index('idx_appointments_org_date').on(table.organizationId, table.date),

    // ---- Status and scheduling indexes ----
    // Find appointments by status: WHERE organizationId = ? AND status = ? ORDER BY date ASC
    index('idx_appointments_org_status_date').on(table.organizationId, table.status, table.date),

    // Find appointments by therapist: WHERE organizationId = ? AND therapistId = ? ORDER BY date DESC
    index('idx_appointments_org_therapist_date').on(table.organizationId, table.therapistId, table.date),

    // ---- Location-based indexes ----
    // Find appointments by location: WHERE organizationId = ? AND location = ? ORDER BY date DESC
    index('idx_appointments_org_location_date').on(table.organizationId, table.location, table.date),

    // ---- Multi-field indexes for common queries ----
    // Therapist's daily schedule: WHERE organizationId = ? AND therapistId = ? AND date = ? AND status != 'cancelled'
    index('idx_appointments_org_therapist_date_status').on(
      table.organizationId,
      table.therapistId,
      table.date,
      table.status
    ),

    // ---- Room-based booking indexes ----
    // Unique constraint to prevent double-booking same room at same time
    uniqueIndex('idx_appointments_room_booking_unique').on(table.roomId, table.date, table.startTime),

    // Composite indexes for efficient room-based availability queries
    index('idx_appointments_room_date').on(table.roomId, table.date),
    index('idx_appointments_room_date_time').on(table.roomId, table.date, table.startTime)
  ]
)

// ----------------------
// Drizzle Relations
// ----------------------

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  treatmentSession: one(treatmentSessions, {
    fields: [appointments.id],
    references: [treatmentSessions.appointmentId]
  }),
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
