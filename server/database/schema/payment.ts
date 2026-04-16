import { v7 as uuidv7 } from 'uuid'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { calendarDateField, creationAndUpdateTimestamps } from './columns.helpers'
import { organizations } from './organization'
import { patients } from './patient'
import { users } from './auth'
import { insuranceCompanies } from './insurance-companies'
import {
  PAYMENT_TYPES,
  PAYMENT_METHODS,
  PAYMENT_PAYER_TYPES,
  PAYMENT_PORTIONS,
  CREDIT_NOTE_TYPES,
  CREDIT_NOTE_STATUSES
} from '../../../shared/types/base.types'

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

    payerType: text({ enum: PAYMENT_PAYER_TYPES }).default('patient'),
    payerInsuranceCompanyId: text().references(() => insuranceCompanies.id, {
      onDelete: 'set null'
    }),

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
    index('idx_payments_voided').on(table.voidedAt),
    index('idx_payments_payer_insurance').on(table.payerInsuranceCompanyId)
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

export const paymentAllocations = sqliteTable(
  'payment_allocations',
  {
    id: text().primaryKey().$defaultFn(uuidv7),
    paymentId: text()
      .notNull()
      .references(() => payments.id, { onDelete: 'cascade' }),
    invoiceId: text(),
    appointmentId: text(),
    portion: text({ enum: PAYMENT_PORTIONS }).notNull().default('full'),
    amountCents: integer().notNull(),
    ...creationAndUpdateTimestamps
  },
  (table) => [
    index('idx_payment_allocations_payment').on(table.paymentId),
    index('idx_payment_allocations_invoice').on(table.invoiceId),
    index('idx_payment_allocations_appointment').on(table.appointmentId)
  ]
)

export const creditNotes = sqliteTable(
  'credit_notes',
  {
    id: text().primaryKey().$defaultFn(uuidv7),
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    patientId: text()
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),

    type: text({ enum: CREDIT_NOTE_TYPES }).notNull(),
    status: text({ enum: CREDIT_NOTE_STATUSES }).notNull().default('draft'),
    amountCents: integer().notNull(),
    reason: text().notNull(),
    referenceNumber: text().unique().notNull(),

    notes: text(),
    issuedAt: integer({ mode: 'timestamp_ms' }),
    issuedById: text().references(() => users.id),
    cancelledAt: integer({ mode: 'timestamp_ms' }),

    ...creationAndUpdateTimestamps
  },
  (table) => [
    index('idx_credit_notes_org_patient').on(table.organizationId, table.patientId),
    index('idx_credit_notes_org_status').on(table.organizationId, table.status),
    index('idx_credit_notes_reference').on(table.referenceNumber)
  ]
)

export const creditNoteAllocations = sqliteTable(
  'credit_note_allocations',
  {
    id: text().primaryKey().$defaultFn(uuidv7),
    creditNoteId: text()
      .notNull()
      .references(() => creditNotes.id, { onDelete: 'cascade' }),
    invoiceId: text().notNull(),
    amountCents: integer().notNull(),
    ...creationAndUpdateTimestamps
  },
  (table) => [
    index('idx_credit_note_allocations_credit_note').on(table.creditNoteId),
    index('idx_credit_note_allocations_invoice').on(table.invoiceId)
  ]
)
