import { v7 as uuidv7 } from 'uuid'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

import { calendarDateField, creationAndUpdateTimestamps } from './columns.helpers'
import { organizations } from './organization'
import { users } from './auth'
import { patients } from './patient'
import { treatmentPlans } from './treatment-plan'
import { rooms } from './rooms'
import { VALID_CONSULTATION_TYPES, VALID_APPOINTMENT_STATUSES } from '../../../shared/utils/constants.consultation'
import { VALID_CONSULTATION_LOCATIONS } from '../../../shared/utils/constants.location'
// Import consultations for FK reference (circular, handled by Drizzle)
import { consultations } from './consultation'

/**
 * ================================================================
 * APPOINTMENTS TABLE
 * ================================================================
 * Represents scheduled time slots for clinical sessions.
 * An appointment may or may not have a consultation (1:0..1).
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
    treatmentPlanId: text().references(() => treatmentPlans.id, { onDelete: 'set null' }),
    therapistId: text()
      .notNull()
      .references(() => users.id),
    roomId: text().references(() => rooms.id, { onDelete: 'set null' }),

    // ---- Scheduling ----
    date: calendarDateField().notNull(),
    startTime: text().notNull(),
    endTime: text().notNull(),
    duration: integer().notNull(),
    type: text({ enum: VALID_CONSULTATION_TYPES }),
    location: text({ enum: VALID_CONSULTATION_LOCATIONS }).default('clinic'),

    // ---- Appointment status (scheduling lifecycle) ----
    status: text({ enum: VALID_APPOINTMENT_STATUSES }).notNull().default('scheduled'),
    confirmedAt: integer(),
    cancelledAt: integer(),
    noShowReason: text(),

    // ---- Link to consultation (1:0..1) ----
    // Note: No FK reference to avoid circular dependency with consultations table
    consultationId: text(),

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

    // Find appointments by session type: WHERE organizationId = ? AND type = ? ORDER BY date DESC
    index('idx_appointments_org_session_type_date').on(table.organizationId, table.type, table.date),

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
  consultation: one(consultations, {
    fields: [appointments.consultationId],
    references: [consultations.id]
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
