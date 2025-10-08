import { pgTable, uuid, varchar, timestamp, text, pgEnum, boolean } from 'drizzle-orm/pg-core'
import { organization } from './auth'

export const genderEnum = pgEnum('gender', ['male', 'female', 'other'])

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id')
    .references(() => organization.id)
    .notNull(),
  patientNumber: varchar('patient_number', { length: 50 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  dateOfBirth: timestamp('date_of_birth'),
  gender: genderEnum('gender'),
  address: text('address'),
  emergencyContact: text('emergency_contact'),
  medicalHistory: text('medical_history'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const patientsRLS = `
  ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY tenant_isolation_patients ON patients
    FOR ALL
    USING (organization_id = current_setting('app.current_organization_id'));
`

export type Patient = typeof patients.$inferSelect
export type NewPatient = typeof patients.$inferInsert
