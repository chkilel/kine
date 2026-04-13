## ADDED Requirements

### Requirement: Appointment Locking After Financial Events

Appointments SHALL be locked after invoicing or payment events to prevent modification of financial data. Locking sets `isLocked = true`, `lockedAt` to current timestamp, and `lockedById` to the user who triggered the lock.

#### Scenario: Lock appointment after attaching to invoice

- **WHEN** an appointment is attached to an invoice (via `invoice_appointments`)
- **THEN** `isLocked` is set to `true`
- **AND** `lockedAt` is set to current timestamp
- **AND** `lockedById` is set to the user performing the action

#### Scenario: Lock appointment after payment allocation

- **WHEN** a payment allocation covers an appointment in full (`coPayPaidCents >= expectedCoPayCents` AND `insurancePaidCents >= expectedInsuranceCents`)
- **THEN** `isLocked` is set to `true`
- **AND** `lockedAt` is set to current timestamp

#### Scenario: Prevent modification of locked appointment

- **WHEN** an update is attempted on an appointment with `isLocked = true`
- **THEN** the request SHALL be rejected with 400 Bad Request
- **AND** error message states the appointment is locked due to financial processing

#### Scenario: Locked appointment fields

- **WHEN** an appointment is locked (`isLocked = true`)
- **THEN** the following fields SHALL NOT be modifiable:
  - Scheduling: `date`, `startTime`, `endTime`, `roomId`, `therapistId`
  - Clinical: `primaryConcern`, `observations`, `treatmentSummary`, `nextSteps`, `painLevelBefore`, `painLevelAfter`
  - Financial: `priceCents`, `expectedCoPayCents`, `expectedInsuranceCents`
  - Insurance: `insuranceCompanyId`

#### Scenario: Status changes still allowed on locked appointment

- **WHEN** an appointment is locked (`isLocked = true`)
- **THEN** status transitions SHALL still be allowed (e.g., `finished → completed`)
- **AND** only `status` field can be changed on locked appointments

### Requirement: Unlock For Credit Note

When a credit note is issued against an invoice, appointments linked to that invoice MAY be unlocked if no other financial events lock them.

#### Scenario: Unlock after full credit note

- **WHEN** a credit note is issued that fully reverses an invoice
- **AND** no payments are allocated to the appointment
- **THEN** `isLocked` is set back to `false`
- **AND** `lockedAt` and `lockedById` are set to NULL

#### Scenario: Remain locked if payment exists

- **WHEN** a credit note is issued against an invoice
- **AND** a separate payment allocation exists for the appointment
- **THEN** `isLocked` remains `true`
