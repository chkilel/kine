# payment-tracking Specification

## Purpose
TBD - created by archiving change implement-payment-ledger-system. Update Purpose after archive.
## Requirements
### Requirement: Payment Recording

The system SHALL record financial events as immutable ledger entries in the `payments` table. Payment types are: `session_payment` (paying for therapy sessions), `session_refund` (refunding a session payment), `deposit_add` (adding funds to patient deposit), and `deposit_refund` (refunding unused deposit balance). Payment methods are: `deposit` (using deposit balance as funding source), `cash`, `bank-card`, `check`, and `bank-transfer`. Every payment SHALL have both a type and a method (method is NOT NULL).

#### Scenario: Record cash payment for session

- **GIVEN** a treatment session exists with id "session-123"
- **AND** patient has id "patient-456"
- **AND** session priceCent is 5000 cents (50.00 Dh)
- **AND** therapist records payment for this session
- **WHEN** POST /payments is called with body {
  patientId: "patient-456",
  amountCents: 5000,
  type: "session_payment",
  method: "cash",
  paidOn: "2026-03-24",
  sessionItems: [{
  treatmentSessionId: "session-123",
  amountCents: 5000
  }]
  }
- **THEN** a payment record is created with type="session_payment", method="cash"
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
  type: "session_payment",
  method: "bank-card",
  paidOn: "2026-03-24",
  sessionItems: [{
  treatmentSessionId: "session-123",
  amountCents: 7000
  }]
  }
- **THEN** a payment record is created with type="session_payment", method="bank-card"
- **AND** payment_session_items record links payment to session
- **AND** receiptNumber is generated
- **AND** HTTP response is 201 Created

#### Scenario: Record advance deposit (no session link)

- **GIVEN** a patient has id "patient-456"
- **AND** patient wants to pre-pay 20000 cents (200.00 Dh) for future sessions
- **WHEN** POST /payments is called with body {
  patientId: "patient-456",
  amountCents: 20000,
  type: "deposit_add",
  method: "cash",
  paidOn: "2026-03-24",
  sessionItems: []
  }
- **THEN** a payment record is created with type="deposit_add", method="cash"
- **AND** NO payment_session_items records are created (0 items)
- **AND** receiptNumber is generated
- **AND** receipt shows "Avance sur soins" (advance payment)
- **AND** patient credit balance increases by 20000 cents
- **AND** HTTP response is 201 Created

#### Scenario: Record session payment using deposit balance

- **GIVEN** a patient has credit balance of 20000 cents
- **AND** a treatment session exists with id "session-123" with cost 5000 cents
- **AND** therapist applies deposit to pay for session
- **WHEN** POST /payments is called with body {
  patientId: "patient-456",
  amountCents: 5000,
  type: "session_payment",
  method: "deposit",
  paidOn: "2026-03-24",
  sessionItems: [{
  treatmentSessionId: "session-123",
  amountCents: 5000
  }]
  }
- **THEN** a payment record is created with type="session_payment", method="deposit"
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
  type: "deposit_refund",
  method: "cash",
  paidOn: "2026-03-24",
  sessionItems: []
  }
- **THEN** a payment record is created with type="deposit_refund", method="cash"
- **AND** refund has NO sessionItems (not linked to any session)
- **AND** receiptNumber is generated
- **AND** patient credit balance decreases by 5000 cents
- **AND** HTTP response is 201 Created

#### Scenario: Record session refund

- **GIVEN** a session_payment exists for session "session-123" with amount 5000 cents
- **AND** therapist refunds the session payment
- **WHEN** POST /payments is called with body {
  patientId: "patient-456",
  amountCents: 5000,
  type: "session_refund",
  method: "cash",
  paidOn: "2026-03-24",
  sessionItems: [{
  treatmentSessionId: "session-123",
  amountCents: 5000
  }]
  }
- **THEN** a payment record is created with type="session_refund", method="cash"
- **AND** payment_session_items record links refund to session-123
- **AND** session "session-123" net payment is 0 (session_payment 5000 - session_refund 5000)
- **AND** session "session-123" is no longer considered paid
- **AND** receiptNumber is generated
- **AND** HTTP response is 201 Created

#### Scenario: Record partial payment across multiple sessions

- **GIVEN** patient has id "patient-456"
- **AND** session "session-1" costs 15000 cents
- **AND** session "session-2" costs 15000 cents
- **AND** session "session-3" costs 15000 cents
- **AND** therapist wants to pay 10000 cents per session now (rest next visit)
- **WHEN** POST /payments is called with body {
  patientId: "patient-456",
  amountCents: 30000,
  type: "session_payment",
  method: "cash",
  paidOn: "2026-03-24",
  sessionItems: [{
  treatmentSessionId: "session-1",
  amountCents: 10000
  }, {
  treatmentSessionId: "session-2",
  amountCents: 10000
  }, {
  treatmentSessionId: "session-3",
  amountCents: 10000
  }]
  }
- **THEN** a payment record is created with type="session_payment", method="cash", amountCents=30000
- **AND** three payment_session_items records link payment to sessions 1, 2, 3 (10000 each)
- **AND** session "session-1" net paid is 10000 of 15000 (partially paid)
- **AND** session "session-2" net paid is 10000 of 15000 (partially paid)
- **AND** session "session-3" net paid is 10000 of 15000 (partially paid)
- **AND** receiptNumber is generated
- **AND** HTTP response is 201 Created

#### Scenario: Complete partial payment on subsequent visit

- **GIVEN** patient has id "patient-456"
- **AND** session "session-1" has net paid 10000 of 15000 cents (partially paid)
- **AND** session "session-2" has net paid 10000 of 15000 cents (partially paid)
- **AND** session "session-3" has net paid 10000 of 15000 cents (partially paid)
- **AND** therapist pays remaining 5000 cents per session
- **WHEN** POST /payments is called with body {
  patientId: "patient-456",
  amountCents: 15000,
  type: "session_payment",
  method: "bank-card",
  paidOn: "2026-04-02",
  sessionItems: [{
  treatmentSessionId: "session-1",
  amountCents: 5000
  }, {
  treatmentSessionId: "session-2",
  amountCents: 5000
  }, {
  treatmentSessionId: "session-3",
  amountCents: 5000
  }]
  }
- **THEN** a payment record is created with amountCents=15000
- **AND** session "session-1" net paid is 15000 of 15000 (fully paid)
- **AND** session "session-2" net paid is 15000 of 15000 (fully paid)
- **AND** session "session-3" net paid is 15000 of 15000 (fully paid)
- **AND** HTTP response is 201 Created

### Requirement: Payment Validation

The system SHALL validate payment requests to ensure data integrity and business rules are enforced before creating ledger entries.

#### Scenario: Require session items for session_payment type

- **GIVEN** a therapist attempts to record a payment
- **AND** payment type is "session_payment"
- **AND** sessionItems array is empty or missing
- **WHEN** POST /payments is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session items required for session_payment type"
- **AND** no payment record is created

#### Scenario: Require session items sum to match payment amount

- **GIVEN** a therapist attempts to record a payment
- **AND** payment amountCents is 10000
- **AND** sessionItems sum to 5000 (mismatch)
- **WHEN** POST /payments is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session items total must equal payment amount"
- **AND** no payment record is created

#### Scenario: Prevent session items for deposit_add payments

- **GIVEN** a therapist attempts to record a deposit
- **AND** sessionItems array contains items
- **WHEN** POST /payments is called with type="deposit_add"
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session items not allowed for deposit_add type"
- **AND** no payment record is created

#### Scenario: Prevent session items for deposit_refund payments

- **GIVEN** a therapist attempts to record a deposit refund
- **AND** sessionItems array contains items
- **WHEN** POST /payments is called with type="deposit_refund"
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session items not allowed for deposit_refund type"
- **AND** no payment record is created

#### Scenario: Require session items for session_refund type

- **GIVEN** a therapist attempts to record a session refund
- **AND** payment type is "session_refund"
- **AND** sessionItems array is empty or missing
- **WHEN** POST /payments is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session items required for session_refund type"
- **AND** no payment record is created

#### Scenario: Validate credit availability before deposit-funded session payment

- **GIVEN** a patient has credit balance of 3000 cents
- **AND** a treatment session costs 5000 cents
- **AND** therapist attempts to use deposit for session
- **WHEN** POST /payments is called with type="session_payment" and method="deposit" and amountCents=5000
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Insufficient credit balance"
- **AND** no payment record is created

#### Scenario: Require payment method

- **GIVEN** a therapist attempts to record a payment
- **AND** method is missing or null
- **WHEN** POST /payments is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Payment method is required"
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

The system SHALL support voiding (canceling) `session_payment` and `deposit_add` records to correct mistakes while maintaining immutable ledger. Voided payments are excluded from all derived queries and balance calculations. Only `session_payment` and `deposit_add` types MAY be voided — refund types (`session_refund`, `deposit_refund`) SHALL NOT be voidable.

#### Scenario: Void session_payment updates session status

- **GIVEN** a session_payment exists with id "payment-123" linked to session "session-456"
- **AND** session "session-456" is currently considered paid
- **AND** no other non-voided session_payment covers session "session-456"
- **AND** user "user-789" has voiding permissions
- **WHEN** POST /payments/payment-123/void is called
- **THEN** payment.voidedAt is set to current timestamp
- **AND** payment.voidedById is set to "user-789"
- **AND** payment record remains in database (not deleted)
- **AND** linked payment_session_items are excluded from queries
- **AND** session "session-456" is recalculated as NOT paid (net amount is 0)
- **AND** HTTP response is 200 OK
- **AND** response message indicates payment voided

#### Scenario: Void deposit-funded session_payment restores credit balance

- **GIVEN** a session_payment with method="deposit" of 5000 cents exists linked to session "session-456"
- **AND** patient credit balance is 15000 (deposit_add 20000 - session_payment 5000)
- **AND** user "user-789" has voiding permissions
- **WHEN** POST /payments/payment-123/void is called
- **THEN** payment is voided
- **AND** patient credit balance is restored to 20000 (session_payment excluded from balance)
- **AND** session "session-456" is recalculated as NOT paid

#### Scenario: Void deposit_add has no session impact

- **GIVEN** a deposit_add payment exists with id "payment-123" with no linked session items
- **AND** user "user-789" has voiding permissions
- **WHEN** POST /payments/payment-123/void is called
- **THEN** payment is voided
- **AND** no session status recalculation occurs (no linked sessions)

#### Scenario: Void excluded from balance calculation

- **GIVEN** a patient has payments: deposit_add 20000, session_payment (method='deposit') 5000
- **AND** patient credit balance is 15000
- **AND** the deposit_add payment is voided
- **WHEN** patient credit balance is recalculated
- **THEN** balance is -5000 (only session_payment with method='deposit' counts, deposit_add excluded)
- **AND** voided deposit_add does not contribute to balance

#### Scenario: Prevent voiding refund types

- **GIVEN** a payment exists with id "payment-123"
- **AND** payment type is "session_refund" or "deposit_refund"
- **WHEN** POST /payments/payment-123/void is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Refund payments cannot be voided"
- **AND** payment is not modified

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

- **GIVEN** a deposit_add payment is created
- **WHEN** receiptNumber is generated
- **THEN** deposit_add receives receipt number
- **AND** receipt renders as "Avance sur soins"

- **GIVEN** a session_payment with method='deposit' is created
- **WHEN** receiptNumber is generated
- **THEN** session_payment receives receipt number

- **GIVEN** a deposit_refund payment is created
- **WHEN** receiptNumber is generated
- **THEN** deposit_refund receives receipt number

#### Scenario: Atomic increment to prevent gaps

- **GIVEN** organization fiscal.nextReceiptNumber is 10
- **AND** two concurrent payment requests occur simultaneously
- **WHEN** both payments complete
- **THEN** receipt numbers are "REC-2026-0010" and "REC-2026-0011" (no duplicates)
- **AND** fiscal.nextReceiptNumber is 12
- **AND** transaction ensures atomic increment

### Requirement: Patient Credit Balance Calculation

The system SHALL calculate patient credit balance dynamically from the ledger: `SUM(deposit_add) - SUM(session_payment WHERE method='deposit') - SUM(deposit_refund)` for non-voided payments, without a separate balance table.

#### Scenario: Calculate zero balance

- **GIVEN** a patient has no payments
- **WHEN** GET /patients/patient-456/balance is called
- **THEN** balanceCents is 0
- **AND** HTTP response is 200 OK

#### Scenario: Calculate positive balance (deposit)

- **GIVEN** a patient has one deposit_add of 20000 cents
- **AND** no session_payment with method='deposit' exists
- **AND** no deposit_refund exists
- **WHEN** GET /patients/patient-456/balance is called
- **THEN** balanceCents is 20000
- **AND** HTTP response is 200 OK

#### Scenario: Calculate reduced balance (deposit-funded session payments)

- **GIVEN** a patient has deposit_add of 20000 cents
- **AND** has two session_payment with method='deposit' of 5000 and 3000 cents
- **WHEN** GET /patients/patient-456/balance is called
- **THEN** balanceCents is 12000 (20000 - 5000 - 3000)
- **AND** HTTP response is 200 OK

#### Scenario: Calculate balance with deposit refund

- **GIVEN** a patient has deposit_add of 20000 cents
- **AND** has deposit_refund of 5000 cents
- **AND** no session_payment with method='deposit' exists
- **WHEN** GET /patients/patient-456/balance is called
- **THEN** balanceCents is 15000 (20000 - 5000)
- **AND** HTTP response is 200 OK

#### Scenario: Exclude voided payments from balance

- **GIVEN** a patient has deposit_add of 20000 cents
- **AND** has session_payment with method='deposit' of 5000 cents
- **AND** the deposit_add is voided
- **WHEN** GET /patients/patient-456/balance is called
- **THEN** balanceCents is -5000 (only session_payment counts)
- **AND** voided deposit_add is excluded from calculation

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
- **AND** payment type is "session_payment"
- **AND** payment method is "cash"
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

#### Scenario: Render receipt for deposit_add

- **GIVEN** a payment exists with type "deposit_add"
- **AND** payment method is "cash"
- **AND** payment has no linked session items
- **WHEN** GET /payments/payment-123/receipt is called
- **THEN** HTML response includes:
  - Header: "REÇU DE PAIEMENT"
  - Amount: "200,00 Dh"
  - Section: "Avance sur soins"
  - Payment method: "Espèces"
  - No session details (since deposit is not linked to session)
- **AND** receipt shows proof of deposit

#### Scenario: Render receipt for deposit-funded session payment

- **GIVEN** a payment exists with type "session_payment"
- **AND** payment method is "deposit"
- **AND** payment links to session "session-456"
- **WHEN** GET /payments/payment-123/receipt is called
- **THEN** HTML response includes session details
- **AND** payment method displays as "Solde patient"
- **AND** receipt shows deposit applied to specific session

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

#### Scenario: Link session payment to single session

- **GIVEN** a payment is created with type="session_payment"
- **AND** sessionItems contains one item
- **WHEN** payment is saved
- **THEN** one payment_session_items record exists
- **AND** record links paymentId to treatmentSessionId
- **AND** amountCents equals session cost

#### Scenario: Deposit add with no session items

- **GIVEN** a payment is created with type="deposit_add"
- **AND** sessionItems is empty array
- **WHEN** payment is saved
- **THEN** NO payment_session_items records exist
- **AND** deposit_add is not linked to any session

#### Scenario: Query sessions paid by payment

- **GIVEN** a session_payment exists linked to session "session-123"
- **AND** no session_refund exists for session "session-123"
- **AND** payment is not voided
- **WHEN** session payment status is queried
- **THEN** session is considered paid
- **AND** query joins payment_session_items and payments tables
- **AND** net paid amount per session is `SUM(session_payment amounts) - SUM(session_refund amounts)` WHERE `payments.voidedAt IS NULL`

#### Scenario: Query sessions with partial payment

- **GIVEN** a session_payment of 10000 cents exists linked to session "session-123"
- **AND** session "session-123" cost is 15000 cents
- **AND** no other payments exist for session "session-123"
- **AND** payment is not voided
- **WHEN** session payment status is queried
- **THEN** session is considered partially paid
- **AND** net paid amount is 10000 cents of 15000 cents

#### Scenario: Query sessions with multiple partial payments

- **GIVEN** a session_payment of 10000 cents exists linked to session "session-123"
- **AND** a second session_payment of 5000 cents exists linked to session "session-123"
- **AND** session "session-123" cost is 15000 cents
- **AND** neither payment is voided
- **WHEN** session payment status is queried
- **THEN** session is considered fully paid
- **AND** net paid amount is 15000 cents (10000 + 5000)

#### Scenario: Query sessions with partial refund

- **GIVEN** a session_payment of 5000 cents exists linked to session "session-123"
- **AND** a session_refund of 3000 cents exists linked to session "session-123"
- **AND** neither payment is voided
- **WHEN** session payment status is queried
- **THEN** session is considered partially paid
- **AND** net paid amount is 2000 cents (5000 - 3000)

#### Scenario: Query sessions with full refund

- **GIVEN** a session_payment of 5000 cents exists linked to session "session-123"
- **AND** a session_refund of 5000 cents exists linked to session "session-123"
- **AND** neither payment is voided
- **WHEN** session payment status is queried
- **THEN** session is NOT considered paid
- **AND** net paid amount is 0 (5000 - 5000)

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

### Requirement: Billing Page Layout

The billing tab page SHALL display a 3-column responsive grid layout with a filter bar, sessions-to-bill section, payment history preview, patient balance card, and financial summary card. All data SHALL be static/mock.

#### Scenario: Billing page renders with all sections

- **GIVEN** a user navigates to the Facturation tab of a patient
- **WHEN** the page loads
- **THEN** the page displays a filter bar with treatment plan selector and payment status filter
- **AND** the page displays a "Séances à facturer" section with session cards
- **AND** the page displays a payment history preview with recent payments
- **AND** the page displays a patient balance sidebar card with deposit amount and outstanding sessions
- **AND** the page displays a financial summary sidebar card with totals and recovery rate progress bar

#### Scenario: Filter bar allows treatment plan and status filtering

- **GIVEN** the billing page is displayed
- **WHEN** the user interacts with the treatment plan dropdown or status filter buttons
- **THEN** the filter state updates locally (no API call)
- **AND** the session cards list filters based on selected criteria

### Requirement: Session Billing Cards

The system SHALL display session cards in the "Séances à facturer" section with status badges (Non facturé, Partiellement payé, Payé), session details, amount, and contextual action buttons.

#### Scenario: Unpaid session card shows payment action

- **GIVEN** a session card has status "Non facturé"
- **WHEN** the card is displayed
- **THEN** it shows an error-colored status badge and an "Enregistrer le paiement" button

#### Scenario: Partially paid session card shows completion action

- **GIVEN** a session card has status "Partiellement payé"
- **WHEN** the card is displayed
- **THEN** it shows a warning-colored status badge with remaining amount and a "Compléter paiement" button

#### Scenario: Paid session card shows receipt action

- **GIVEN** a session card has status "Payé"
- **WHEN** the card is displayed
- **THEN** it shows a success-colored status badge and a receipt download icon button

### Requirement: Payment History Slideover

The system SHALL provide a slideover displaying the full payment history for a patient with filter tabs (Tous, Paiements, Avances, Remboursements, Annulés), payment items with receipt number/date/amount/reference, and action buttons for download and void.

#### Scenario: Open payment history slideover

- **GIVEN** the user clicks "Voir tout l'historique" on the billing page
- **WHEN** the slideover opens
- **THEN** it displays the patient name, filter tabs, and a list of payment items
- **AND** each payment item shows icon, method label, amount, date, receipt number, and linked session references

#### Scenario: Cancelled payment shown with visual distinction

- **GIVEN** a voided payment exists in the history
- **WHEN** the slideover is displayed
- **THEN** the voided payment appears with reduced opacity, strikethrough amount, and "Annulé" badge

### Requirement: Record Payment Slideover

The system SHALL provide a slideover for recording a payment with two steps: session selection (checkbox list with running total) and payment details (amount, deposit method toggle, payment method icons, date, notes).

#### Scenario: Open record payment slideover from session card

- **GIVEN** the user clicks "Enregistrer le paiement" on an unpaid session card
- **WHEN** the slideover opens
- **THEN** it displays the selected session pre-checked in step 1
- **AND** step 2 shows payment details with the session amount pre-filled

#### Scenario: Payment method selection via icon buttons

- **GIVEN** the record payment slideover is open at step 2
- **WHEN** the user clicks a payment method icon button (cash, bank-card, check, bank-transfer, or deposit)
- **THEN** that method becomes visually selected (border + background highlight)
- **AND** the other methods are deselected

#### Scenario: Deposit method toggle

- **GIVEN** the patient has available credit balance
- **WHEN** the user selects the "deposit" payment method
- **THEN** the credit balance is shown and the payment amount reflects deposit usage
- **AND** the payment type is set to "session_payment" with method "deposit"

### Requirement: Add Deposit Slideover

The system SHALL provide a slideover for adding a deposit (advance) with amount input, payment method icon selector (cash, bank-card, check, bank-transfer), date field, and notes textarea.

#### Scenario: Open add deposit slideover

- **GIVEN** the user clicks "Ajouter une avance" on the balance card
- **WHEN** the slideover opens
- **THEN** it displays an info banner explaining advance behavior
- **AND** it shows amount, payment method, date, and notes fields

#### Scenario: Deposit payment method selection

- **GIVEN** the add deposit slideover is open
- **WHEN** the user selects a payment method icon
- **THEN** that method is visually highlighted and the others are deselected

### Requirement: Refund Balance Slideover

The system SHALL provide a slideover/modal for refunding unused deposit credit, showing current balance, refund amount input, refund method selector (cash, bank-card, check, bank-transfer), and a warning about balance reduction.

#### Scenario: Open refund balance slideover

- **GIVEN** the user clicks "Rembourser le solde" on the balance card
- **WHEN** the slideover opens
- **THEN** it displays the current advance balance
- **AND** it shows amount, refund method, and a warning banner

### Requirement: Cancel Payment Modal

The system SHALL provide a confirmation modal for voiding a payment, showing payment details, a warning about session status restoration, and a safety confirmation input requiring the user to type "ANNULER".

#### Scenario: Open cancel payment modal

- **GIVEN** the user clicks the cancel/void button on a payment item
- **WHEN** the modal opens
- **THEN** it displays the payment reference, amount, method, date, and linked sessions
- **AND** it shows a warning that linked sessions will be restored to unpaid status

#### Scenario: Safety confirmation input

- **GIVEN** the cancel payment modal is displayed
- **WHEN** the user types "ANNULER" in the confirmation input
- **THEN** the "Annuler définitivement" button becomes enabled
- **AND** before typing the confirmation, the button is disabled (opacity 50%)

**Migration notes**:

- `type='credit_usage'` → `type='session_payment'` with `method='deposit'`
- `type='payment'` → `type='session_payment'`
- `type='deposit'` → `type='deposit_add'`
- `type='refund'` → `type='deposit_refund'` (for balance refunds) or `type='session_refund'` (for session refunds)
- `method` is now required (NOT NULL) on all payments

