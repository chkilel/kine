import { v7 as uuidv7 } from 'uuid'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { calendarDateField, creationAndUpdateTimestamps } from './columns.helpers'
import { organizations } from './organization'
import { patients } from './patient'
import { users } from './auth'
import { PAYMENT_TYPES, PAYMENT_METHODS } from '~~/shared/types/base.types'

export const payments = sqliteTable(
  'payments',
  {
    id: text().primaryKey().$defaultFn(uuidv7),
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    patientId: text()
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    recordedById: text()
      .notNull()
      .references(() => users.id),

    amountCents: integer().notNull(),
    currency: text().default('MAD'),

    type: text({ enum: PAYMENT_TYPES }).notNull(),
    method: text({ enum: PAYMENT_METHODS }).notNull(),

    receiptNumber: text().unique().notNull(),

    notes: text(),
    paidOn: calendarDateField().notNull(),

    voidedAt: integer({ mode: 'timestamp_ms' }),
    voidedById: text().references(() => users.id),

    ...creationAndUpdateTimestamps
  },
  (table) => [
    index('idx_payments_org_patient_date').on(table.organizationId, table.patientId, table.paidOn),
    index('idx_payments_org_type').on(table.organizationId, table.type),
    index('idx_payments_voided').on(table.voidedAt)
  ]
)

export const appointmentPaymentItems = sqliteTable(
  'appointment_payment_items',
  {
    id: text().primaryKey().$defaultFn(uuidv7),
    paymentId: text()
      .notNull()
      .references(() => payments.id, { onDelete: 'cascade' }),
    appointmentId: text().notNull(),
    amountCents: integer().notNull()
  },
  (table) => [
    index('idx_appointment_payment_items_payment').on(table.paymentId),
    index('idx_appointment_payment_items_appointment').on(table.appointmentId)
  ]
)
