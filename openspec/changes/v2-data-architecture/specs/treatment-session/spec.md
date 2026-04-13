## REMOVED Requirements

### Requirement: Treatment Session Creation

**Reason**: The split appointment/session model is eliminated. All treatment session data is now stored directly in the merged `appointments` table.
**Migration**: Use the merged `appointments` table which absorbs all clinical fields (primaryConcern, observations, treatmentSummary, nextSteps, painLevelBefore, painLevelAfter) and billing fields.

### Requirement: Treatment Session Status Machine

**Reason**: Session status is now part of the merged appointment status machine: `scheduled → confirmed → in_progress → finished → completed / cancelled / no_show`.
**Migration**: The `pre_session` status maps to the appointment being in `confirmed` state (before timer starts). `in_session` maps to `in_progress`. `post_session` maps to `finished`.

## ADDED Requirements

### Requirement: Merged Appointment Model

The system SHALL use a single `appointments` table that absorbs all treatment session fields. There is NO separate `treatment_sessions` table. Clinical and billing fields are columns on the appointment itself, gated by the appointment status.

#### Scenario: Appointment contains clinical fields

- **WHEN** an appointment is in `in_progress` or later status
- **THEN** the following clinical fields are available directly on the appointment:
  - `primaryConcern` (text)
  - `observations` (text)
  - `treatmentSummary` (text)
  - `nextSteps` (text)
  - `painLevelBefore` (integer 0-10)
  - `painLevelAfter` (integer 0-10)

#### Scenario: Appointment contains billing fields

- **WHEN** an appointment is created
- **THEN** the following billing fields are available:
  - `priceCents` (integer, set from treatment plan pricing or service default)
  - `expectedCoPayCents` (integer, calculated from insurance convention or 0)
  - `expectedInsuranceCents` (integer, calculated from insurance convention or 0)
  - `coPayPaidCents` (integer, default 0, updated by payment allocations)
  - `insurancePaidCents` (integer, default 0, updated by payment allocations)
  - `paymentStatus` (text enum, denormalized for fast filtering)
  - `isLocked` (boolean, default false)
  - `lockedAt` (timestamp, nullable)
  - `lockedById` (text, nullable, references user)

### Requirement: Unified Appointment State Machine

Appointments SHALL follow: `scheduled → confirmed → in_progress → finished → completed`. Side transitions: `confirmed → cancelled`, `in_progress → cancelled`, `confirmed → no_show`. Each status gates which field groups are editable.

#### Scenario: Scheduled status — scheduling fields only

- **WHEN** appointment status is `scheduled`
- **THEN** only scheduling fields are editable: `date`, `startTime`, `endTime`, `roomId`, `therapistId`, `serviceId`, `patientId`, `treatmentPlanId`, `notes`

#### Scenario: In progress — clinical fields editable

- **WHEN** appointment status is `in_progress`
- **THEN** scheduling fields AND clinical fields are editable
- **AND** `actualStartTime` is set to current timestamp

#### Scenario: Finished — billing fields editable, notes locked

- **WHEN** appointment status is `finished`
- **THEN** billing fields are editable
- **AND** clinical notes fields are locked (not editable)
- **AND** `actualEndTime` is set to current timestamp

#### Scenario: Completed — all fields locked

- **WHEN** appointment status is `completed`
- **THEN** no fields are editable (except status transitions are no longer possible)

#### Scenario: Cancelled — all fields frozen

- **WHEN** appointment status is `cancelled`
- **THEN** all fields are frozen, no modifications allowed
- **AND** `cancelledAt` is set to current timestamp
- **AND** `cancellationReason` is stored

### Requirement: Appointment Insurance Context

Appointments SHALL store `insuranceCompanyId` (inherited from treatment plan at creation) and `treatmentPlanId` (nullable for independent appointments). When `treatmentPlanId` is set and the plan has `insuranceCompanyId`, it is inherited by the appointment.

#### Scenario: Appointment under plan with insurance

- **WHEN** an appointment is created with `treatmentPlanId` pointing to a plan with `insuranceCompanyId = "cnss-123"`
- **THEN** `appointment.insuranceCompanyId` is set to `"cnss-123"`
- **AND** co-pay fields are calculated from convention attributes

#### Scenario: Independent appointment without plan

- **WHEN** an appointment is created without `treatmentPlanId`
- **THEN** `appointment.insuranceCompanyId` is NULL
- **AND** `expectedCoPayCents = 0`, `expectedInsuranceCents = 0`

### Requirement: Appointment Payment Status

Appointments SHALL have a denormalized `paymentStatus` field: `unpaid` | `copay_paid` | `partially_paid` | `paid` | `overpaid`. This field is updated by a Queue consumer after payment events and avoids JOINs for list filtering.

#### Scenario: Payment status transitions

- **WHEN** an appointment has `expectedCoPayCents = 1000`, `expectedInsuranceCents = 4000`
- **THEN** initial `paymentStatus` is `unpaid`
- **AND** after co-pay of 1000 is received, `paymentStatus` becomes `copay_paid`
- **AND** after insurance payment of 4000, `paymentStatus` becomes `paid`
