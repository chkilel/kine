## ADDED Requirements

### Requirement: Automatic Session Completion on Payment

The system SHALL automatically transition treatment sessions from `finished` to `completed` status when a payment of type 'payment' or 'credit_usage' is recorded linking to the session via `payment_session_items`. The `billed` field has been removed; session completion is now payment-driven.

#### Scenario: Payment triggers session completion

- **GIVEN** a treatment session exists with id "session-123" and status "finished"
- **AND** a payment of type="payment" is created linking to this session via payment_session_items
- **WHEN** payment is successfully created
- **THEN** treatment session status is automatically updated to "completed"
- **AND** session is considered paid
- **AND** HTTP response for payment creation includes updated session status

#### Scenario: Credit usage triggers session completion

- **GIVEN** a treatment session exists with id "session-123" and status "finished"
- **AND** a payment of type="credit_usage" is created linking to this session
- **WHEN** payment is successfully created
- **THEN** treatment session status is automatically updated to "completed"
- **AND** session is considered paid via credit usage

#### Scenario: Voided payment reverts session to finished

- **GIVEN** a treatment session has status "completed"
- **AND** session status was triggered by payment "payment-123"
- **AND** payment "payment-123" is voided
- **WHEN** void action completes
- **THEN** treatment session status reverts to "finished"
- **AND** session is no longer considered paid
- **AND** user is notified that session requires payment

#### Scenario: No payments linked means session remains unfinished

- **GIVEN** a treatment session exists with status "finished"
- **AND** no payment_session_items link to this session
- **WHEN** payment status is queried
- **THEN** session status remains "finished"
- **AND** session is not considered paid

### Requirement: Derived Session Payment Status

The system SHALL determine session payment status by querying `payment_session_items` linked to non-voided payments of type 'payment' or 'credit_usage'. Payment status is always derived from the ledger, not stored as a separate field.

#### Scenario: Query session payment status as unpaid

- **GIVEN** a treatment session exists with id "session-123"
- **AND** no payment_session_items link to this session
- **WHEN** session payment status is queried
- **THEN** status is "unpaid"
- **AND** query returns false for isPaid flag
- **AND** result is derived from: `NOT EXISTS(SELECT 1 FROM payment_session_items psi JOIN payments p ON p.id = psi.paymentId WHERE psi.treatmentSessionId = ? AND p.type IN ('payment', 'credit_usage') AND p.voidedAt IS NULL)`

#### Scenario: Query session payment status as paid via cash payment

- **GIVEN** a treatment session exists with id "session-123"
- **AND** a non-voided payment of type="payment" links to this session
- **WHEN** session payment status is queried
- **THEN** status is "paid"
- **AND** query returns true for isPaid flag
- **AND** result is derived from: `EXISTS(SELECT 1 FROM payment_session_items psi JOIN payments p ON p.id = psi.paymentId WHERE psi.treatmentSessionId = ? AND p.type IN ('payment', 'credit_usage') AND p.voidedAt IS NULL)`

#### Scenario: Query session payment status as paid via credit usage

- **GIVEN** a treatment session exists with id "session-123"
- **AND** a non-voided payment of type="credit_usage" links to this session
- **WHEN** session payment status is queried
- **THEN** status is "paid"
- **AND** session is marked as paid via credit usage

#### Scenario: Voided payment excludes session from paid status

- **GIVEN** a treatment session has a payment linking to it
- **AND** the payment is voided
- **WHEN** session payment status is queried
- **THEN** status is "unpaid"
- **AND** voided payment is excluded via `payments.voidedAt IS NULL` filter
- **AND** session payment status reflects actual payment state

#### Scenario: Refund payments do not link to sessions

- **GIVEN** a refund payment exists
- **AND** refund has NO payment_session_items linking to any session
- **WHEN** session payment status is queried
- **THEN** refund has no effect on any session's payment status
- **AND** session status is determined only by `payment` and `credit_usage` types
- **AND** refunds are only for returning unused deposit credit

#### Scenario: Multiple valid payments to same session maintain paid status

- **GIVEN** a treatment session has two `payment` type payments linking to it
- **AND** both are non-voided
- **WHEN** session payment status is queried
- **THEN** status is "paid"
- **AND** multiple payments do not affect paid status (existence of any valid payment suffices)
- **AND** refund does not negate paid status
