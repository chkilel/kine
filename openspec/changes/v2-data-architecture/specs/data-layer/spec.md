## MODIFIED Requirements

### Requirement: Database Schema Relations

The database layer SHALL define all table relations using Drizzle ORM v2 `defineRelations()` in a single consolidated relations file at `server/database/relations.ts`. The V2 schema includes 9 auth tables (managed by better-auth) and 17 domain tables.

#### Scenario: Relations consolidated in single file

- **WHEN** the application bootstraps the Drizzle database instance
- **THEN** all table relations SHALL be defined in `server/database/relations.ts` using `defineRelations(schema, (r) => ({...}))`
- **AND** relations cover all 26 tables (9 auth + 17 domain)

#### Scenario: Schema files contain no relation definitions

- **WHEN** a developer inspects any file under `server/database/schema/`
- **THEN** the file SHALL contain only table definitions (sqliteTable) and SHALL NOT contain `relations()` calls

## ADDED Requirements

### Requirement: V2 Schema File Structure

Domain schema files SHALL be organized as one file per domain entity under `server/database/schema/`. Each file exports its table definition(s). The barrel export at `server/database/schema/index.ts` re-exports all tables.

#### Scenario: Domain schema files

- **WHEN** the schema directory is inspected
- **THEN** the following domain schema files SHALL exist:
  - `patient.ts` — patients table
  - `appointment.ts` — merged appointments (absorbs treatment_sessions)
  - `treatment-plan.ts` — treatment plans (with insuranceCompanyId FK)
  - `payment.ts` — payments table (enhanced)
  - `invoice.ts` — invoices + invoice_line_items + invoice_appointments
  - `credit-note.ts` — credit_notes + credit_note_allocations
  - `insurance-company.ts` — insurance_companies table
  - `service.ts` — services table
  - `package.ts` — packages + patient_packages
  - `rooms.ts` — rooms table (unchanged)
  - `availability.ts` — weekly templates + exceptions (unchanged)
  - `document.ts` — patient documents (unchanged)
  - `columns.helpers.ts` — shared column mixins

#### Scenario: Auth schema files untouched

- **WHEN** auth schema files are inspected
- **THEN** `auth.ts` and `organization.ts` SHALL remain as-is (better-auth managed)
- **AND** V2 code SHALL NOT modify auth table definitions

### Requirement: Column Helper Mixins

Shared column mixins SHALL be defined in `columns.helpers.ts` for consistent column patterns across all domain tables: timestamps (`createdAt`, `updatedAt`), soft delete (`deletedAt`), org scoping (`orgId`), and calendar date (`date`).

#### Scenario: Timestamps mixin

- **WHEN** a table uses the timestamps mixin
- **THEN** `createdAt` is `integer('created_at', { mode: 'timestamp' }).notNull().default(sql'(unixepoch())')`
- **AND** `updatedAt` is `integer('updated_at', { mode: 'timestamp' }).notNull().default(sql'(unixepoch())')`

#### Scenario: Soft delete mixin

- **WHEN** a table uses the soft delete mixin
- **THEN** `deletedAt` is `integer('deleted_at', { mode: 'timestamp' })`

#### Scenario: Org scope mixin

- **WHEN** a domain table uses the org scope mixin
- **THEN** `orgId` is `text('org_id').notNull().references(() => organization.id)`
- **AND** all queries default to filtering by `orgId`

### Requirement: All Monetary Values in Cents

All monetary columns in the schema SHALL be stored as integers representing cents (not dirhams). Column names SHALL use the suffix `Cents` (e.g., `amountCents`, `priceCents`, `expectedCoPayCents`).

#### Scenario: Price field naming

- **WHEN** a price column is defined in any table
- **THEN** the column name SHALL end with `Cents`
- **AND** the type SHALL be `integer` (not real/float)

### Requirement: KV Atomic Counters for Sequential Numbering

The system SHALL use Cloudflare KV for atomic sequential counters, keyed per organization per number type. Keys: `invoice_number:{orgId}`, `receipt_number:{orgId}`.

#### Scenario: Increment invoice counter

- **WHEN** a new invoice is created for org `org-123`
- **THEN** KV key `invoice_number:org-123` is atomically incremented
- **AND** the returned value is used in the invoice number

#### Scenario: Counter initialization

- **WHEN** the first invoice is created for org `org-123` and key `invoice_number:org-123` does not exist
- **THEN** the key is initialized to 1
