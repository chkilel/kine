# payment-tracking Specification

## Purpose

Payment tracking using unified appointment model. Payments are now linked to appointments via `appointmentId` instead of `treatmentSessionId`.

## Requirements

### Requirement: Payment Recording

The system SHALL record financial events as immutable ledger entries. Payment session items reference `appointmentId` instead of `treatmentSessionId`. All other payment recording behavior is unchanged.

#### Scenario: Record cash payment for session

- **GIVEN** an appointment exists with id "appointment-123" and status "finished"
- **AND** appointment priceCents is 5000 cents (50.00 Dh)
- **AND** patient has id "patient-456"
- **WHEN** POST /payments is called with body {
  patientId: "patient-456",
  amountCents: 5000,
  type: "session_payment",
  method: "cash",
  paidOn: "2026-03-24",
  sessionItems: [{
  appointmentId: "appointment-123",
  amountCents: 5000
  }]
  }
- **THEN** a payment record is created with type="session_payment", method="cash"
- **AND** payment_session_items record links payment to appointment "appointment-123" via appointmentId
- **AND** receiptNumber is generated
- **AND** HTTP response is 201 Created

### Requirement: Payment-to-Session Linking

The system SHALL link payments to appointments exclusively through the `payment_session_items` table using `appointmentId` column.

#### Scenario: Link session payment to appointment

- **GIVEN** a payment is created with type="session_payment"
- **AND** sessionItems contains one item with appointmentId
- **WHEN** payment is saved
- **THEN** one payment_session_items record exists
- **AND** record links paymentId to appointmentId

#### Scenario: Query appointments with payment status

- **GIVEN** a session_payment exists linked to appointment "appointment-123"
- **AND** no session_refund exists for appointment "appointment-123"
- **WHEN** appointment payment status is queried
- **THEN** appointment is considered paid
- **AND** query joins payment_session_items on appointmentId

### Requirement: Session Payment Status Enrichment

The system SHALL enrich the `GET /api/appointments` endpoint with per-appointment payment status when `patientId` and `includePaymentStatus=true` query parameters are provided.

#### Scenario: Enrich appointments with payment status

- **GIVEN** a patient has appointments with payment status: apt-1 fully paid (15000/15000), apt-2 unpaid (0/15000)
- **WHEN** GET /api/appointments?patientId=patient-456&includePaymentStatus=true is called
- **THEN** apt-1 response includes paidCents=15000 and paymentStatus="paid"
- **AND** apt-2 response includes paidCents=0 and paymentStatus="unpaid"

#### Scenario: Default behavior without includePaymentStatus

- **GIVEN** a patient has appointments with payments
- **WHEN** GET /api/appointments?patientId=patient-456 is called without includePaymentStatus
- **THEN** appointments are returned without paidCents or paymentStatus fields

### Requirement: Payment Voiding

The system SHALL void payments and recalculate appointment payment status using the `appointmentId` column in `payment_session_items`.

#### Scenario: Void session_payment updates appointment payment status

- **GIVEN** a session_payment exists linked to appointment "appointment-456"
- **AND** appointment is currently considered paid
- **WHEN** POST /payments/payment-123/void is called
- **THEN** payment is voided
- **AND** appointment "appointment-456" is recalculated as NOT paid

### Requirement: Patient Payment Listing

The system SHALL return payment_session_items with appointmentId references instead of treatmentSessionId.

#### Scenario: List payments with appointment references

- **GIVEN** a patient has payments
- **WHEN** GET /api/patients/patient-456/payments is called
- **THEN** each payment includes sessionItems array with appointmentId references
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

The system SHALL generate "reçu de paiement" documents as HTML from payment records, displaying amount, date, payment method, session details (if linked), pricing code description (if available), and organization info. Receipts are not stored in database.

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

#### Scenario: Render receipt with pricing code description

- **GIVEN** a payment exists with type "session_payment"
- **AND** the linked appointment has priceItem: { code: "CONSULT", description: "Consultation standard", ... }
- **WHEN** GET /payments/payment-123/receipt is called
- **THEN** the HTML response includes the session details section
- **AND** the session details show the pricing code description "Consultation standard" alongside the amount

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

The billing tab page SHALL display a 3-column responsive grid layout with a filter bar, sessions-to-bill section, payment history preview, patient balance card, and financial summary card. All sessions for the patient SHALL be fetched once with payment status from the API. All filtering (by treatment plan) and financial summary calculations SHALL be performed client-side in the UI.

#### Scenario: Billing page renders with all sections

- **GIVEN** a user navigates to the Facturation tab of a patient
- **WHEN** the page loads
- **THEN** the page fetches all sessions with payment status from GET /api/treatment-sessions?patientId=:id&includePaymentStatus=true
- **AND** the page fetches recent payments from GET /api/patients/:id/payments?limit=5
- **AND** the page fetches patient balance from GET /api/patients/:id/balance
- **AND** the page displays a filter bar with a treatment plan selector (Toutes, Sans plan, Par plan) and per-plan session count badges
- **AND** the page displays a "Séances à facturer" section with session cards showing real payment status
- **AND** the page displays a payment history preview with recent real payments
- **AND** the page displays a patient balance sidebar card with real deposit amount and outstanding sessions
- **AND** the page displays a financial summary sidebar card computed client-side from the fetched session/payment data

#### Scenario: Filter bar groups sessions by treatment plan

- **GIVEN** the billing page is displayed with all patient sessions fetched
- **WHEN** the page renders the filter bar
- **THEN** the filter shows "Toutes" with the total session count
- **AND** the filter shows "Sans plan" with the count of sessions not linked to any treatment plan
- **AND** the filter shows each treatment plan name with its session count
- **AND** selecting a filter option filters the session cards list client-side with no additional API call

#### Scenario: Financial summary computed client-side

- **GIVEN** all patient sessions are fetched with payment status
- **WHEN** the billing page renders the financial summary card
- **THEN** total billed is computed as SUM of all session priceCents
- **AND** total collected is computed as SUM of all session paidCents
- **AND** remaining amount is computed as billed minus collected
- **AND** recovery rate is computed as collected divided by billed
- **AND** these values update instantly when the filter changes

### Requirement: Session Billing Cards

The system SHALL display session cards in the "Séances à facturer" section with status badges, session details, pricing code description (if available), amount, and contextual action buttons based on real payment status from the API.

#### Scenario: Unpaid session card shows pricing code and payment action

- **GIVEN** a session card has paymentStatus "unpaid" from the API
- **AND** the session has priceItem: { code: "CONSULT", description: "Consultation standard", ... }
- **WHEN** the card is displayed
- **THEN** it shows an error-colored status badge
- **AND** it shows the pricing code description "Consultation standard" alongside the amount
- **AND** it shows an "Enregistrer le paiement" button
- **AND** clicking the button opens RecordPaymentSlideover with this session pre-selected

#### Scenario: Partially paid session card shows completion action

- **GIVEN** a session card has paymentStatus "partial" from the API
- **WHEN** the card is displayed
- **THEN** it shows a warning-colored status badge with remaining amount
- **AND** it shows the pricing code description if available
- **AND** it shows a "Compléter paiement" button
- **AND** clicking the button opens RecordPaymentSlideover with this session pre-selected and amount pre-filled with remaining balance

#### Scenario: Paid session card shows receipt action

- **GIVEN** a session card has paymentStatus "paid" from the API
- **WHEN** the card is displayed
- **THEN** it shows a success-colored status badge
- **AND** it shows the pricing code description if available
- **AND** it shows a receipt download icon button
- **AND** clicking the receipt button opens ReceiptModal with the latest payment's receipt

### Requirement: Payment History Slideover

The system SHALL provide a slideover displaying the full payment history for a patient fetched from `GET /api/patients/:id/payments`, with filter tabs (Tous, Paiements, Avances, Remboursements, Annulés) that pass the `type` query parameter, payment items with receipt number/date/amount/reference, and action buttons for receipt download and void.

#### Scenario: Open payment history slideover

- **GIVEN** the user clicks "Voir tout l'historique" on the billing page
- **WHEN** the slideover opens
- **THEN** it fetches payments from GET /api/patients/:id/payments?includeVoided=true
- **AND** it displays the patient name, filter tabs, and a list of real payment items
- **AND** each payment item shows icon, method label, amount, date, receipt number, and linked session references from payment_session_items

#### Scenario: Filter tabs trigger API calls

- **GIVEN** the payment history slideover is open
- **WHEN** the user clicks the "Avances" filter tab
- **THEN** the slideover refetches with GET /api/patients/:id/payments?type=deposit_add
- **AND** only deposit_add payments are displayed

#### Scenario: Cancelled payment shown with visual distinction

- **GIVEN** the "Annulés" tab is selected
- **WHEN** the slideover fetches with includeVoided=true and displays results
- **THEN** voided payments appear with reduced opacity, strikethrough amount, and "Annulé" badge
- **AND** the void button is disabled for voided payments

#### Scenario: Void payment from history

- **GIVEN** a non-voided session_payment is displayed in the history
- **WHEN** the user clicks the void/cancel button
- **THEN** CancelPaymentModal opens with the payment details pre-filled
- **AND** on successful void confirmation, the payment list refreshes

### Requirement: Record Payment Slideover

The system SHALL provide a slideover for recording a payment with two steps: session selection (checkbox list with running total from real session data) and payment details (amount, deposit method toggle, payment method icons, date, notes). On submission, the slideover SHALL call `useCreatePayment` with the correct `PaymentRequestBody` and close on success.

#### Scenario: Open record payment slideover from session card

- **GIVEN** the user clicks "Enregistrer le paiement" on an unpaid session card
- **WHEN** the slideover opens
- **THEN** it fetches the patient's unpaid/partial sessions from the billing page data
- **AND** the selected session is pre-checked in step 1
- **AND** step 2 shows payment details with the session amount pre-filled from session.priceCent

#### Scenario: Submit payment to API

- **GIVEN** the user has selected sessions and filled payment details
- **WHEN** the user submits the form
- **THEN** POST /api/payments is called with type="session_payment", method, amountCents, sessionItems, and paidOn
- **AND** on success, a toast shows the receipt number
- **AND** the slideover closes
- **AND** the billing page data refreshes (sessions, payments, balance)

#### Scenario: Submit deposit-funded payment

- **GIVEN** the patient has credit balance
- **AND** the user selects "deposit" as payment method
- **THEN** the credit balance is displayed from usePatientBalance
- **AND** on submit, POST /api/payments is called with method="deposit"
- **AND** if credit is insufficient, the API error is displayed

### Requirement: Add Deposit Slideover

The system SHALL provide a slideover for adding a deposit (advance) with amount input, payment method icon selector, date field, and notes textarea. On submission, the slideover SHALL call `useCreatePayment` with type="deposit_add" and empty sessionItems.

#### Scenario: Submit deposit to API

- **GIVEN** the user fills the deposit form
- **WHEN** the user submits
- **THEN** POST /api/payments is called with type="deposit_add", method, amountCents, sessionItems=[], and paidOn
- **AND** on success, a toast shows the receipt number
- **AND** the slideover closes
- **AND** the billing page balance card and payment history refresh

### Requirement: Refund Balance Slideover

The system SHALL provide a slideover for refunding unused deposit credit, showing the current balance from `usePatientBalance`, refund amount input, refund method selector, and a warning about balance reduction. On submission, the slideover SHALL call `useCreatePayment` with type="deposit_refund".

#### Scenario: Submit refund to API

- **GIVEN** the user fills the refund form
- **AND** the refund amount does not exceed the current balance
- **WHEN** the user submits
- **THEN** POST /api/payments is called with type="deposit_refund", method, amountCents, sessionItems=[]
- **AND** on success, the slideover closes and balance refreshes

#### Scenario: Refund amount exceeds balance

- **GIVEN** the current balance is 5000 cents
- **AND** the user enters a refund amount of 10000 cents
- **WHEN** the user submits
- **THEN** the form validation prevents submission
- **AND** an error message indicates the amount exceeds available balance

### Requirement: Cancel Payment Modal

The system SHALL provide a confirmation modal for voiding a payment, showing real payment details fetched by payment ID, a warning about session status restoration, and a safety confirmation input requiring the user to type "ANNULER". On confirmation, the modal SHALL call `useVoidPayment` and close on success.

#### Scenario: Open cancel payment modal with real data

- **GIVEN** the user clicks the cancel/void button on a payment item
- **WHEN** the modal opens
- **THEN** it fetches the payment details (amount, method, date, receipt number)
- **AND** it fetches linked session items from the payment
- **AND** it displays the payment reference, amount, method, date, and linked session references
- **AND** it shows a warning that linked sessions may be restored to unpaid status

#### Scenario: Confirm void payment

- **GIVEN** the cancel payment modal is displayed
- **AND** the user has typed "ANNULER" in the confirmation input
- **WHEN** the user clicks "Annuler définitivement"
- **THEN** POST /api/payments/:id/void is called via useVoidPayment
- **AND** on success, the modal closes
- **AND** a toast confirms the payment was voided
- **AND** the billing page and payment history refresh

### Requirement: Patient Payment Listing

The system SHALL provide a RESTful endpoint `GET /api/patients/:id/payments` that returns all payments for a patient within the current organization, ordered by most recent first. The endpoint SHALL support query parameters: `type` (filter by payment type), `limit` (max results, default 50), and `includeVoided` (boolean, default false). Each payment SHALL include its `payment_session_items` with linked treatment session references.

#### Scenario: List all payments for a patient

- **GIVEN** a patient has id "patient-456"
- **AND** the patient has 5 payments in the current organization
- **WHEN** GET /api/patients/patient-456/payments is called
- **THEN** HTTP response is 200 OK
- **AND** response contains an array of 5 payment objects
- **AND** each payment includes sessionItems array with treatmentSessionId references
- **AND** payments are ordered by paidOn descending (most recent first)

#### Scenario: Filter payments by type

- **GIVEN** a patient has session_payment, deposit_add, and session_refund payments
- **WHEN** GET /api/patients/patient-456/payments?type=session_payment is called
- **THEN** response contains only session_payment type payments
- **AND** deposit_add and session_refund payments are excluded

#### Scenario: Include voided payments

- **GIVEN** a patient has 3 non-voided payments and 1 voided payment
- **WHEN** GET /api/patients/patient-456/payments?includeVoided=false is called (default)
- **THEN** response contains 3 payments
- **AND** the voided payment is excluded

- **WHEN** GET /api/patients/patient-456/payments?includeVoided=true is called
- **THEN** response contains 4 payments
- **AND** the voided payment is included with voidedAt and voidedById fields

#### Scenario: Limit payment results

- **GIVEN** a patient has 100 payments
- **WHEN** GET /api/patients/patient-456/payments?limit=20 is called
- **THEN** response contains at most 20 payments
- **AND** the most recent 20 payments are returned

#### Scenario: Organization isolation

- **GIVEN** a patient has payments in organization A and organization B
- **WHEN** GET /api/patients/patient-456/payments is called in organization A context
- **THEN** only organization A payments are returned
- **AND** organization B payments are excluded

### Requirement: Session Payment Status Enrichment

The system SHALL enrich the `GET /api/treatment-sessions` endpoint with per-session payment status when `patientId` and `includePaymentStatus=true` query parameters are provided. Each session SHALL include `paidCents` (net amount from non-voided session_payments minus non-voided session_refunds) and `paymentStatus` (one of: `unpaid`, `partial`, `paid`).

#### Scenario: Enrich sessions with payment status

- **GIVEN** a patient has 3 sessions with payment status: session-1 fully paid (15000/15000), session-2 partially paid (10000/15000), session-3 unpaid (0/15000)
- **WHEN** GET /api/treatment-sessions?patientId=patient-456&includePaymentStatus=true is called
- **THEN** session-1 response includes paidCents=15000 and paymentStatus="paid"
- **AND** session-2 response includes paidCents=10000 and paymentStatus="partial"
- **AND** session-3 response includes paidCents=0 and paymentStatus="unpaid"

#### Scenario: Exclude voided payments from status calculation

- **GIVEN** a session has a session_payment of 5000 cents and a voided session_refund of 5000 cents
- **WHEN** session payment status is enriched
- **THEN** paidCents is 5000 (voided refund excluded)
- **AND** paymentStatus reflects the non-voided payment only

#### Scenario: Default behavior without includePaymentStatus

- **GIVEN** a patient has sessions with payments
- **WHEN** GET /api/treatment-sessions?patientId=patient-456 is called without includePaymentStatus
- **THEN** sessions are returned without paidCents or paymentStatus fields
- **AND** behavior is unchanged from current implementation

### Requirement: Payment Voiding Composable

The system SHALL provide a `useVoidPayment` composable that wraps `POST /api/payments/:id/void` with toast notifications and query cache invalidation for patient payments and session data.

#### Scenario: Void payment via composable

- **GIVEN** a payment exists with id "payment-123" and type "session_payment"
- **AND** the user triggers void from the CancelPaymentModal
- **WHEN** useVoidPayment composable is called with paymentId="payment-123"
- **THEN** POST /api/payments/payment-123/void is called
- **AND** on success, a toast notification confirms voiding
- **AND** PAYMENT_KEYS.root cache is invalidated
- **AND** affected session query caches are invalidated

#### Scenario: Void payment error handling

- **GIVEN** a payment cannot be voided (e.g., refund type)
- **WHEN** useVoidPayment composable is called
- **THEN** an error toast is displayed with the server error message
- **AND** no cache invalidation occurs
