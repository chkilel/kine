## ADDED Requirements

### Requirement: Payment Payer Attribution

Every payment SHALL record `payerType` (`patient` | `insurance_company`) and optionally `payerInsuranceCompanyId` (required when `payerType` is `insurance_company`). This enables tracking who funded each payment.

#### Scenario: Patient makes cash payment

- **WHEN** a payment is created with `type: "session_payment"`, `method: "cash"`
- **THEN** `payerType` SHALL be `patient`
- **AND** `payerInsuranceCompanyId` SHALL be NULL

#### Scenario: Insurance company makes payment

- **WHEN** an insurance payment is received from CNSS
- **THEN** `payerType` SHALL be `insurance_company`
- **AND** `payerInsuranceCompanyId` SHALL reference the insurance company

### Requirement: Payment Allocations Junction

The system SHALL link payments to both invoices AND appointments via a `payment_allocations` junction table with a `portion` field (`full` | `copay` | `insurance`). This replaces the V1 `payment_session_items` table and provides full traceability from payment → invoice → appointment.

#### Scenario: Full patient payment allocated to appointment and invoice

- **WHEN** a patient pays 5000 cents for appointment `apt-123` via invoice `inv-456`
- **THEN** a `payment_allocations` row is created with:
  - `paymentId`, `invoiceId = inv-456`, `appointmentId = apt-123`
  - `portion = "full"`, `amountCents = 5000`

#### Scenario: Co-pay split allocation

- **WHEN** a patient pays 1000 cents co-pay for appointment `apt-123` via convention invoice `inv-456`
- **THEN** a `payment_allocations` row is created with:
  - `paymentId`, `invoiceId = inv-456`, `appointmentId = apt-123`
  - `portion = "copay"`, `amountCents = 1000`

#### Scenario: Insurance portion allocation

- **WHEN** insurance pays 4000 cents for appointment `apt-123` via convention invoice `inv-456`
- **THEN** a `payment_allocations` row is created with:
  - `paymentId`, `invoiceId = inv-456`, `appointmentId = apt-123`
  - `portion = "insurance"`, `amountCents = 4000`

#### Scenario: Payment covering multiple appointments

- **WHEN** a 10000 cents payment covers appointments `apt-123` (5000) and `apt-456` (5000)
- **THEN** two `payment_allocations` rows are created, one per appointment
- **AND** total allocated amounts equal payment amount

### Requirement: Expanded Payment Types

Payment types SHALL include: `session_payment`, `session_refund`, `insurance_payment`, `insurance_refund`, `deposit_add`, `deposit_refund`, `credit_note_applied`, `write_off`. Payment methods SHALL include: `cash`, `bank-card`, `check`, `bank-transfer`, `deposit`, `insurance-electronic`.

#### Scenario: Insurance payment type

- **WHEN** an insurance company remits payment for a convention invoice
- **THEN** payment `type` is `insurance_payment`
- **AND** `payerType` is `insurance_company`
- **AND** `method` is `bank-transfer` or `insurance-electronic`

#### Scenario: Credit note applied as payment

- **WHEN** a credit note is applied to reduce an invoice balance
- **THEN** a payment record is created with `type: "credit_note_applied"`
- **AND** `method: "credit-note"` is used

#### Scenario: Write-off for uncollectible amount

- **WHEN** an invoice amount is deemed uncollectible
- **THEN** a payment record is created with `type: "write_off"`
- **AND** `method: "write-off"` is used

### Requirement: Immutable Payment Amounts

Payment amounts SHALL NEVER be updated after creation. Corrections SHALL be made by creating compensating payment records (refunds, credit notes).

#### Scenario: Correct payment amount

- **WHEN** a payment of 5000 was recorded but should have been 4000
- **THEN** a new `session_refund` payment of 5000 is created
- **AND** a new `session_payment` payment of 4000 is created
- **AND** the original payment is NOT modified

### Requirement: Sequential Receipt Numbering

Each payment SHALL have a unique sequential receipt number per organization, generated via KV atomic counter. Format: `{receiptPrefix}-{year}-{sequential}` (e.g., `REC-2026-0001`).

#### Scenario: First receipt in organization

- **WHEN** the first payment is recorded in organization with receipt prefix `REC`
- **THEN** `receiptNumber` is `REC-2026-0001`

### Requirement: Payment Soft Delete

Payments SHALL support soft delete via `deletedAt`. Soft-deleted payments SHALL be excluded from all financial totals.

#### Scenario: Soft delete a payment

- **WHEN** DELETE is called on a payment
- **THEN** `deletedAt` is set to current timestamp
- **AND** the payment is excluded from balance calculations

### Requirement: Deposit Management

The system SHALL track patient deposit balances. Deposits are added via `deposit_add` payments and consumed via `session_payment` payments with `method: "deposit"`.

#### Scenario: Add deposit

- **WHEN** a patient adds 20000 cents as deposit
- **THEN** a payment with `type: "deposit_add"` is created
- **AND** patient deposit balance increases by 20000 cents

#### Scenario: Consume deposit for session

- **WHEN** a patient's deposit is used to pay for a session
- **THEN** a payment with `type: "session_payment"`, `method: "deposit"` is created
- **AND** patient deposit balance decreases by the payment amount
