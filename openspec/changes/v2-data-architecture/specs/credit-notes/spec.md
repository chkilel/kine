## ADDED Requirements

### Requirement: Credit Note Table Schema

The system SHALL store credit notes in a `credit_notes` table. Credit notes are the ONLY mechanism for correcting invoiced amounts — invoice amounts are never UPDATED directly. Each credit note is linked to the original invoice it corrects.

#### Scenario: Create credit note for invoice correction

- **WHEN** a credit note is created for invoice `inv-123` with `amountCents = 2000`
- **THEN** `credit_notes.originalInvoiceId` is set to `inv-123`
- **AND** `credit_notes.type` is `correction` or `refund`
- **AND** `credit_notes.status` is `draft`
- **AND** `amountCents` is positive (represents the credit amount)

#### Scenario: Credit note belongs to organization

- **WHEN** any credit note is created
- **THEN** `orgId` MUST reference the creating organization
- **AND** all credit note queries SHALL be scoped by `orgId`

### Requirement: Credit Note Status Flow

Credit notes SHALL follow: `draft → issued → cancelled`. Once issued, a credit note cannot be modified.

#### Scenario: Issue a credit note

- **WHEN** a credit note in `draft` status is issued
- **THEN** status transitions to `issued`
- **AND** the credit note amount is deducted from the original invoice balance

#### Scenario: Cancel a draft credit note

- **WHEN** a credit note in `draft` status is cancelled
- **THEN** status transitions to `cancelled`
- **AND** no financial impact occurs

#### Scenario: Cannot modify issued credit note

- **WHEN** an update is attempted on a credit note with status `issued`
- **THEN** the request SHALL be rejected
- **AND** HTTP response is 400 Bad Request

### Requirement: Credit Note Allocations

Credit notes SHALL be allocated to invoices via `credit_note_allocations` junction table, supporting partial allocations across multiple invoices.

#### Scenario: Full allocation to single invoice

- **WHEN** a credit note of 5000 cents is fully allocated to invoice `inv-123`
- **THEN** `credit_note_allocations` stores `invoiceId = inv-123`, `amountCents = 5000`

#### Scenario: Partial allocation across invoices

- **WHEN** a credit note of 5000 cents is allocated 3000 to `inv-123` and 2000 to `inv-456`
- **THEN** two `credit_note_allocations` rows are created
- **AND** total allocated equals credit note amount

### Requirement: Credit Note Soft Delete

Credit notes SHALL support soft delete via `deletedAt`. Only `draft` or `cancelled` credit notes can be soft-deleted.

#### Scenario: Soft delete draft credit note

- **WHEN** DELETE is called on a credit note in `draft` status
- **THEN** `deletedAt` is set to current timestamp
- **AND** the credit note is excluded from default queries

#### Scenario: Cannot delete issued credit note

- **WHEN** DELETE is called on a credit note in `issued` status
- **THEN** the request SHALL be rejected
