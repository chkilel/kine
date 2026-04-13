## MODIFIED Requirements

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
