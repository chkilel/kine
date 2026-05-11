import { v7 as uuidv7 } from 'uuid'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

import { calendarDateField, creationAndUpdateTimestamps } from './columns.helpers'
import { organizations } from './organization'
import { users } from './auth'
import { patients } from './patient'
import { treatmentPlans } from './treatment-plan'
import { rooms } from './rooms'
import { APPOINTMENT_STATUSES, VALID_APPOINTMENT_TYPES, VALID_LOCATIONS } from '~~/shared/types/base.types'

/**
 * ================================================================
 * APPOINTMENTS TABLE (UNIFIED — SCHEDULING + CLINICAL SESSION)
 * ================================================================
 * Represents both scheduled appointments and clinical sessions.
 * Unified status machine: scheduled → confirmed → in_progress → finished → completed
 * Plus cancelled and no_show terminal states.
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
    type: text({ enum: VALID_APPOINTMENT_TYPES }),
    location: text({ enum: VALID_LOCATIONS }).notNull().default('clinic'),

    // ---- Unified status ----
    status: text({ enum: APPOINTMENT_STATUSES }).notNull().default('scheduled'),
    confirmedAt: integer({ mode: 'timestamp_ms' }),
    cancelledAt: integer({ mode: 'timestamp_ms' }),
    noShowReason: text(),
    cancellationReason: text(),

    // ---- Clinical content ----
    primaryConcern: text(),
    observations: text(),
    sessionNotes: text(),

    // ---- Clinical assessment (EVA pain scale) ----
    painLevelBefore: integer(),
    painLevelAfter: integer(),

    // ---- Timer / session management ----
    actualStartTime: text(),
    actualDurationSeconds: integer(),
    totalPausedSeconds: integer(),
    pauseStartTime: text(),
    extendedDurationMinutes: integer().default(0),
    tags: text(),

    // ---- Billing ----
    priceCents: integer().notNull().default(0),

    // ---- Locking ----
    isLocked: integer({ mode: 'boolean' }).default(false),
    lockedAt: integer({ mode: 'timestamp_ms' }),
    lockedById: text().references(() => users.id),

    ...creationAndUpdateTimestamps
  },
  (table) => [
    index('idx_appointments_cursor').on(table.organizationId, table.date, table.id),
    index('idx_appointments_org_patient_date').on(table.organizationId, table.patientId, table.date),
    index('idx_appointments_org_date').on(table.organizationId, table.date),
    index('idx_appointments_org_status_date').on(table.organizationId, table.status, table.date),
    index('idx_appointments_org_therapist_date').on(table.organizationId, table.therapistId, table.date),
    index('idx_appointments_org_location_date').on(table.organizationId, table.location, table.date),
    index('idx_appointments_org_therapist_date_status').on(
      table.organizationId,
      table.therapistId,
      table.date,
      table.status
    ),
    uniqueIndex('idx_appointments_room_booking_unique').on(table.roomId, table.date, table.startTime),
    index('idx_appointments_room_date').on(table.roomId, table.date),
    index('idx_appointments_room_date_time').on(table.roomId, table.date, table.startTime)
  ]
)
