# payment-tracking Specification

## Purpose
TBD - created by archiving change implement-payment-ledger-system. Update Purpose after archive.
## Requirements
### Requirement: Payment Recording

The system SHALL record financial events as immutable ledger entries in the `payments` table, supporting payment types: payment (session payment), deposit (advance), credit_usage (using deposit), and refund.

#### Scenario: Record cash payment for session

- **GIVEN** a treatment session exists with id "session-123"
- **AND** patient has id "patient-456"
- **AND** session priceCent is 5000 cents (50.00 Dh)
- **AND** therapist records payment for this session
- **WHEN** POST /payments is called with body {
  patientId: "patient-456",
  amountCents: 5000,
  type: "payment",
  method: "cash",
  paidOn: "2026-03-24",
  sessionItems: [{
  treatmentSessionId: "session-123",
  amountCents: 5000
  }]
  }
- **THEN** a payment record is created with type="payment"
- **AND** payment_session_items record links payment to session-123
- **AND** receiptNumber is generated (e.g. "REC-2026-0001")
- **AND** amountCents is 5000 (positive)
- **AND** HTTP response is 201 Created
- **AND** response includes payment object and receiptNumber

#### Scenario: Record card payment for session

- **GIVEN** a treatment session exists with id "session-123"
- **AND** patient has id "patient-456"
- **AND** session cost is 7000 cents
- **WHEN** POST /payments is called with body {
  patientId: "patient-456",
  amountCents: 7000,
  type: "payment",
  method: "card",
  paidOn: "2026-03-24",
  sessionItems: [{
  treatmentSessionId: "session-123",
  amountCents: 7000
  }]
  }
- **THEN** a payment record is created with type="payment", method="card"
- **AND** payment_session_items record links payment to session
- **AND** receiptNumber is generated
- **AND** HTTP response is 201 Created

#### Scenario: Record advance deposit (no session link)

- **GIVEN** a patient has id "patient-456"
- **AND** patient wants to pre-pay 20000 cents (200.00 Dh) for future sessions
- **WHEN** POST /payments is called with body {
  patientId: "patient-456",
  amountCents: 20000,
  type: "deposit",
  method: "cash",
  paidOn: "2026-03-24",
  sessionItems: []
  }
- **THEN** a payment record is created with type="deposit"
- **AND** NO payment_session_items records are created (0 items)
- **AND** receiptNumber is generated
- **AND** receipt shows "Avance sur soins" (advance payment)
- **AND** patient credit balance increases by 20000 cents
- **AND** HTTP response is 201 Created

#### Scenario: Record credit usage from deposit

- **GIVEN** a patient has credit balance of 20000 cents
- **AND** a treatment session exists with id "session-123" with cost 5000 cents
- **AND** therapist applies deposit to pay for session
- **WHEN** POST /payments is called with body {
  patientId: "patient-456",
  amountCents: 5000,
  type: "credit_usage",
  method: "other",
  paidOn: "2026-03-24",
  sessionItems: [{
  treatmentSessionId: "session-123",
  amountCents: 5000
  }]
  }
- **THEN** a payment record is created with type="credit_usage"
- **AND** payment_session_items record links payment to session-123
- **AND** patient credit balance decreases by 5000 cents (now 15000)
- **AND** receiptNumber is generated
- **AND** HTTP response is 201 Created

#### Scenario: Record refund for unused deposit credit

- **GIVEN** a patient has deposit of 20000 cents (credit balance)
- **AND** patient has completed treatment and has 5000 cents of unused credit remaining
- **AND** therapist refunds unused credit to patient
- **WHEN** POST /payments is called with body {
  patientId: "patient-456",
  amountCents: 5000,
  type: "refund",
  method: "cash",
  paidOn: "2026-03-24",
  sessionItems: []
  }
- **THEN** a payment record is created with type="refund"
- **AND** refund has NO sessionItems (not linked to any session)
- **AND** receiptNumber is generated
- **AND** patient credit balance decreases by 5000 cents
- **AND** HTTP response is 201 Created

### Requirement: Payment Validation

The system SHALL validate payment requests to ensure data integrity and business rules are enforced before creating ledger entries.

#### Scenario: Require session items for non-deposit, non-refund payments

- **GIVEN** a therapist attempts to record a payment
- **AND** payment type is "payment" or "credit_usage"
- **AND** sessionItems array is empty or missing
- **WHEN** POST /payments is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session items required for payment and credit_usage types"
- **AND** no payment record is created

#### Scenario: Require session items sum to match payment amount

- **GIVEN** a therapist attempts to record a payment
- **AND** payment amountCents is 10000
- **AND** sessionItems sum to 5000 (mismatch)
- **WHEN** POST /payments is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session items total must equal payment amount"
- **AND** no payment record is created

#### Scenario: Prevent session items for deposit payments

- **GIVEN** a therapist attempts to record a deposit
- **AND** sessionItems array contains items
- **WHEN** POST /payments is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session items not allowed for deposit type"
- **AND** no payment record is created

#### Scenario: Require no session items for refund payments

- **GIVEN** a therapist attempts to record a refund
- **AND** sessionItems array contains items
- **WHEN** POST /payments is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session items not allowed for refund type (refunds apply to unused deposit credit only)"
- **AND** no payment record is created

#### Scenario: Validate credit availability before credit usage

- **GIVEN** a patient has credit balance of 3000 cents
- **AND** a treatment session costs 5000 cents
- **AND** therapist attempts to use credit for session
- **WHEN** POST /payments is called with type="credit_usage" and amountCents=5000
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Insufficient credit balance"
- **AND** no payment record is created

#### Scenario: Require positive amount

- **GIVEN** a therapist attempts to record a payment
- **AND** amountCents is 0 or negative
- **WHEN** POST /payments is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Amount must be positive"
- **AND** no payment record is created

#### Scenario: Require valid payment date

- **GIVEN** a therapist attempts to record a payment
- **AND** paidOn is missing or invalid format
- **WHEN** POST /payments is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Valid payment date required (YYYY-MM-DD)"
- **AND** no payment record is created

### Requirement: Payment Voiding

The system SHALL support voiding (canceling) payment records to correct mistakes while maintaining immutable ledger. Voided payments are excluded from all derived queries and balance calculations.

#### Scenario: Void payment

- **GIVEN** a payment exists with id "payment-123"
- **AND** payment is not voided
- **AND** user "user-789" has voiding permissions
- **WHEN** POST /payments/payment-123/void is called
- **THEN** payment.voidedAt is set to current timestamp
- **AND** payment.voidedById is set to "user-789"
- **AND** payment record remains in database (not deleted)
- **AND** linked payment_session_items are excluded from queries
- **AND** HTTP response is 200 OK
- **AND** response message indicates payment voided

#### Scenario: Void excluded from balance calculation

- **GIVEN** a patient has payments: deposit 20000, credit_usage 5000
- **AND** patient credit balance is 15000
- **AND** the deposit payment is voided
- **WHEN** patient credit balance is recalculated
- **THEN** balance is -5000 (only credit_usage counts, deposit excluded)
- **AND** voided deposit does not contribute to balance

#### Scenario: Prevent voiding already voided payment

- **GIVEN** a payment exists with id "payment-123"
- **AND** payment.voidedAt is already set
- **WHEN** POST /payments/payment-123/void is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Payment is already voided"
- **AND** payment.voidedAt remains unchanged

#### Scenario: Prevent voiding with authorization check

- **GIVEN** a payment exists with id "payment-123"
- **AND** authenticated user lacks voiding permissions
- **WHEN** POST /payments/payment-123/void is called
- **THEN** HTTP response is 403 Forbidden
- **AND** error message states "Insufficient permissions to void payment"
- **AND** payment is not voided

### Requirement: Receipt Number Generation

The system SHALL generate sequential, gap-free receipt numbers per organization, stored in `organizations.fiscal` and atomically incremented within a transaction.

#### Scenario: Generate receipt number sequentially

- **GIVEN** organization has fiscal.receiptPrefix "REC"
- **AND** fiscal.nextReceiptNumber is 1
- **WHEN** first payment is created
- **THEN** receiptNumber is "REC-2026-0001"
- **AND** fiscal.nextReceiptNumber is incremented to 2
- **AND** receipt is stored in database

#### Scenario: Generate second receipt number

- **GIVEN** organization fiscal.nextReceiptNumber is 2
- **WHEN** second payment is created
- **THEN** receiptNumber is "REC-2026-0002"
- **AND** fiscal.nextReceiptNumber is incremented to 3

#### Scenario: Use organization-specific prefix

- **GIVEN** organization has fiscal.receiptPrefix "INV"
- **AND** fiscal.nextReceiptNumber is 5
- **WHEN** payment is created
- **THEN** receiptNumber is "INV-2026-0005"

#### Scenario: Generate receipts for all payment types

- **GIVEN** a deposit payment is created
- **WHEN** receiptNumber is generated
- **THEN** deposit receives receipt number
- **AND** receipt renders as "Avance sur soins"

- **GIVEN** a credit_usage payment is created
- **WHEN** receiptNumber is generated
- **THEN** credit_usage receives receipt number

- **GIVEN** a refund payment is created
- **WHEN** receiptNumber is generated
- **THEN** refund receives receipt number

#### Scenario: Atomic increment to prevent gaps

- **GIVEN** organization fiscal.nextReceiptNumber is 10
- **AND** two concurrent payment requests occur simultaneously
- **WHEN** both payments complete
- **THEN** receipt numbers are "REC-2026-0010" and "REC-2026-0011" (no duplicates)
- **AND** fiscal.nextReceiptNumber is 12
- **AND** transaction ensures atomic increment

### Requirement: Patient Credit Balance Calculation

The system SHALL calculate patient credit balance dynamically from the ledger: `SUM(deposit) - SUM(credit_usage)` for non-voided payments, without a separate balance table.

#### Scenario: Calculate zero balance

- **GIVEN** a patient has no payments
- **WHEN** GET /patients/patient-456/balance is called
- **THEN** balanceCents is 0
- **AND** HTTP response is 200 OK

#### Scenario: Calculate positive balance (deposit)

- **GIVEN** a patient has one deposit of 20000 cents
- **AND** no credit_usage payments exist
- **WHEN** GET /patients/patient-456/balance is called
- **THEN** balanceCents is 20000
- **AND** HTTP response is 200 OK

#### Scenario: Calculate reduced balance (credit usage)

- **GIVEN** a patient has deposit of 20000 cents
- **AND** has two credit_usage payments of 5000 and 3000 cents
- **WHEN** GET /patients/patient-456/balance is called
- **THEN** balanceCents is 12000 (20000 - 5000 - 3000)
- **AND** HTTP response is 200 OK

#### Scenario: Exclude voided payments from balance

- **GIVEN** a patient has deposit of 20000 cents
- **AND** has credit_usage of 5000 cents
- **AND** the deposit is voided
- **WHEN** GET /patients/patient-456/balance is called
- **THEN** balanceCents is -5000 (only credit_usage counts)
- **AND** voided deposit is excluded from calculation

#### Scenario: Balance isolated by organization

- **GIVEN** a patient has payments in organization A
- **AND** same patient has payments in organization B
- **WHEN** balance is queried in organization A context
- **THEN** only organization A payments are included
- **AND** organization B payments are excluded

### Requirement: Receipt Document Rendering

The system SHALL generate "reçu de paiement" documents as HTML from payment records, displaying amount, date, payment method, session details (if linked), and organization info. Receipts are not stored in database.

#### Scenario: Render receipt for session payment

- **GIVEN** a payment exists with id "payment-123"
- **AND** payment type is "payment"
- **AND** payment links to treatment session "session-456"
- **WHEN** GET /payments/payment-123/receipt is called
- **THEN** HTML response includes:
  - Header: "REÇU DE PAIEMENT"
  - Receipt number: "REC-2026-0001"
  - Payment date: "2026-03-24"
  - Patient name
  - Amount: "50,00 Dh"
  - Payment method: "Espèces"
  - Session details: date, location, therapist
- **AND** response is printable HTML

#### Scenario: Render receipt for deposit

- **GIVEN** a payment exists with type "deposit"
- **AND** payment has no linked session items
- **WHEN** GET /payments/payment-123/receipt is called
- **THEN** HTML response includes:
  - Header: "REÇU DE PAIEMENT"
  - Amount: "200,00 Dh"
  - Section: "Avance sur soins"
  - No session details (since deposit is not linked to session)
- **AND** receipt shows proof of deposit

#### Scenario: Render receipt for credit usage

- **GIVEN** a payment exists with type "credit_usage"
- **AND** payment links to session "session-456"
- **WHEN** GET /payments/payment-123/receipt is called
- **THEN** HTML response includes session details
- **AND** receipt shows credit applied to specific session

#### Scenario: Render receipt with organization details

- **GIVEN** a payment exists
- **AND** organization has name "Clinique Physio"
- **AND** organization has address and contact info
- **WHEN** GET /payments/payment-123/receipt is called
- **THEN** HTML response includes:
  - Organization name
  - Organization address
  - Organization contact (phone, email)

#### Scenario: Return 404 for non-existent payment receipt

- **GIVEN** no payment exists with id "payment-999"
- **WHEN** GET /payments/payment-999/receipt is called
- **THEN** HTTP response is 404 Not Found
- **AND** error message states "Payment not found"

### Requirement: Payment-to-Session Linking

The system SHALL link payments to sessions exclusively through the `payment_session_items` table, with a single consistent rule for all payment types.

#### Scenario: Link payment to single session

- **GIVEN** a payment is created with type="payment"
- **AND** sessionItems contains one item
- **WHEN** payment is saved
- **THEN** one payment_session_items record exists
- **AND** record links paymentId to treatmentSessionId
- **AND** amountCents equals session cost

#### Scenario: Payment with no session items (deposit)

- **GIVEN** a payment is created with type="deposit"
- **AND** sessionItems is empty array
- **WHEN** payment is saved
- **THEN** NO payment_session_items records exist
- **AND** deposit is not linked to any session

#### Scenario: Query sessions paid by payment

- **GIVEN** a payment exists linked to session "session-123"
- **AND** payment is not voided
- **WHEN** session payment status is queried
- **THEN** session is considered paid
- **AND** query joins payment_session_items and payments tables
- **AND** filter includes `WHERE payments.type IN ('payment', 'credit_usage') AND payments.voidedAt IS NULL`

#### Scenario: Exclude voided payments from session status

- **GIVEN** a payment links to session "session-123"
- **AND** payment is voided
- **WHEN** session payment status is queried
- **THEN** session is NOT considered paid
- **AND** voided payment is excluded via `WHERE payments.voidedAt IS NULL`

#### Scenario: Prevent orphaned session items

- **GIVEN** a payment is voided
- **WHEN** session status query runs
- **THEN** payment_session_items for voided payment are excluded
- **AND** session reflects actual paid status (excluding voided payments)

