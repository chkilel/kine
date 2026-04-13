## ADDED Requirements

### Requirement: Invoice Table Schema

The system SHALL store all invoices in a single `invoices` table with a `type` discriminator (`convention` | `remboursement`). Convention invoices are pro-forma documents sent to insurance companies. Remboursement invoices are end-of-treatment documents issued to patients. Both types share core fields (status, dates, totals, org FK) with type-specific constraints enforced at the application level.

#### Scenario: Convention invoice requires insurance company

- **WHEN** a convention invoice is created
- **THEN** `insuranceCompanyId` MUST be set (NOT NULL for convention type)
- **AND** `type` SHALL be `convention`
- **AND** `patientId` SHALL be set

#### Scenario: Remboursement invoice has no insurance company

- **WHEN** a remboursement invoice is created
- **THEN** `insuranceCompanyId` MUST be NULL
- **AND** `type` SHALL be `remboursement`
- **AND** `patientId` SHALL be set

#### Scenario: Invoice belongs to organization

- **WHEN** any invoice is created
- **THEN** `orgId` MUST reference the creating organization
- **AND** all invoice queries SHALL be scoped by `orgId`

### Requirement: Invoice Status Flow

Convention invoices SHALL follow: `draft → sent → paid | partially_paid → cancelled`. Remboursement invoices SHALL follow: `draft → issued → cancelled`. Status transitions MUST follow these flows — out-of-order transitions SHALL be rejected.

#### Scenario: Convention invoice happy path

- **WHEN** a convention invoice is created
- **THEN** status is `draft`
- **AND** can transition `draft → sent`
- **AND** can transition `sent → paid`
- **AND** can transition `sent → partially_paid`
- **AND** can transition `draft → cancelled`
- **AND** can transition `sent → cancelled`

#### Scenario: Remboursement invoice happy path

- **WHEN** a remboursement invoice is created
- **THEN** status is `draft`
- **AND** can transition `draft → issued`
- **AND** can transition `draft → cancelled`

#### Scenario: Invalid status transition rejected

- **WHEN** a convention invoice with status `draft` is transitioned to `paid`
- **THEN** the transition SHALL be rejected
- **AND** HTTP response is 400 Bad Request

### Requirement: Invoice Line Items

Convention invoices SHALL have `invoice_line_items` storing the locked `pricePerSessionCents` at creation time. Remboursement invoices SHALL NOT use `invoice_line_items` — their pricing is captured per appointment in `invoice_appointments`.

#### Scenario: Convention invoice locks price per session

- **WHEN** a convention invoice is created for treatment plan with session price 5000 cents
- **THEN** an `invoice_line_item` is created with `pricePerSessionCents = 5000`
- **AND** this price SHALL NOT change even if the treatment plan pricing changes later

#### Scenario: Convention invoice with multiple line items

- **WHEN** a convention invoice covers sessions at different prices (e.g., home vs clinic)
- **THEN** multiple `invoice_line_items` are created, one per distinct session price
- **AND** each line item has `quantity` (number of sessions at that price) and `pricePerSessionCents`

### Requirement: Invoice Appointments Junction

The system SHALL link invoices to appointments via `invoice_appointments` junction table. Convention invoices store `sessionNumber` only (price comes from line items). Remboursement invoices store `priceCents` per appointment (captured at attachment time).

#### Scenario: Convention invoice links appointments by session number

- **WHEN** appointments are attached to a convention invoice
- **THEN** each `invoice_appointments` row stores `sessionNumber` (1-based position)
- **AND** does NOT store `priceCents` (price comes from `invoice_line_items`)

#### Scenario: Remboursement invoice captures price per appointment

- **WHEN** appointments are attached to a remboursement invoice
- **THEN** each `invoice_appointments` row stores `priceCents` captured at attachment time
- **AND** does NOT store `sessionNumber`

### Requirement: Sequential Invoice Numbering

Each invoice SHALL have a unique sequential number per organization, generated via KV atomic counter. Format: `{prefix}-{year}-{sequential}` (e.g., `FAC-2026-0001`). The prefix is configurable per organization.

#### Scenario: First invoice in organization

- **WHEN** the first convention invoice is created in organization with prefix `FAC`
- **THEN** `invoiceNumber` is `FAC-2026-0001`

#### Scenario: Sequential numbering continues

- **WHEN** the second invoice is created in the same organization and year
- **THEN** `invoiceNumber` is `FAC-2026-0002`

#### Scenario: Numbering tolerates gaps

- **WHEN** KV counter increments but invoice creation fails
- **THEN** the next successful invoice SHALL skip the failed number
- **AND** gaps in numbering are acceptable

### Requirement: Invoice Soft Delete

Invoices SHALL support soft delete via `deletedAt` timestamp. Soft-deleted invoices SHALL be excluded from all financial totals and list queries by default.

#### Scenario: Soft delete an invoice

- **WHEN** DELETE is called on an invoice in `draft` or `cancelled` status
- **THEN** `deletedAt` is set to current timestamp
- **AND** the invoice is excluded from default list queries

#### Scenario: Cannot soft delete paid invoice

- **WHEN** DELETE is called on an invoice in `paid` or `partially_paid` status
- **THEN** the request SHALL be rejected
- **AND** HTTP response is 400 Bad Request
