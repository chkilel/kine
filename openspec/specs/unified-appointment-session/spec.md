# unified-appointment-session Specification

## Purpose

Unified appointment and treatment session model - all clinical, timer, and billing data is stored directly on the appointment record. No separate treatment session entity exists.

## Requirements

### Requirement: Unified Appointment State Machine

The system SHALL use a single unified status field on the `appointments` table that covers both scheduling and clinical lifecycles. Valid statuses are: `scheduled`, `confirmed`, `in_progress`, `finished`, `completed`, `cancelled`, `no_show`. No separate treatment session entity exists.

#### Scenario: Appointment created in scheduled status

- **GIVEN** a therapist creates a new appointment
- **WHEN** POST /api/appointments is called with scheduling fields (patientId, therapistId, date, startTime, endTime, roomId)
- **THEN** appointment is created with status "scheduled"
- **AND** all clinical fields (primaryConcern, treatmentSummary, observations, nextSteps, painLevelBefore, painLevelAfter) are null
- **AND** all timer fields (actualStartTime, actualDurationSeconds, totalPausedSeconds, pauseStartTime) are null
- **AND** priceCents defaults to 0
- **AND** HTTP response is 201 Created

#### Scenario: Unified status transitions

- **GIVEN** an appointment exists with status "scheduled"
- **WHEN** appointment is confirmed
- **THEN** status transitions to "confirmed"
- **WHEN** session is started
- **THEN** status transitions to "in_progress"
- **WHEN** session is ended
- **THEN** status transitions to "finished"
- **WHEN** billing is completed
- **THEN** status transitions to "completed"

### Requirement: Clinical Notes on Appointment

The system SHALL allow saving clinical notes (primaryConcern, treatmentSummary, observations, nextSteps) directly on the appointment record. Notes are editable in `scheduled` and `confirmed` statuses (pre-session preparation), `in_progress` status (during session), and `finished` status (post-session documentation).

#### Scenario: Save clinical notes on scheduled appointment

- **GIVEN** an appointment exists with status "scheduled"
- **AND** no treatment session exists (never needed)
- **WHEN** PATCH /api/appointments/[id]/clinical-notes is called with body { primaryConcern: "Lower back pain" }
- **THEN** HTTP response is 200 OK
- **AND** primaryConcern is updated on the appointment record
- **AND** status remains "scheduled"

#### Scenario: Save observations only in in_progress or later

- **GIVEN** an appointment exists with status "scheduled"
- **WHEN** PATCH /api/appointments/[id]/clinical-notes is called with body { observations: "Some observations" }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states observations cannot be saved before session starts

#### Scenario: Save all clinical notes in in_progress status

- **GIVEN** an appointment exists with status "in_progress"
- **WHEN** PATCH /api/appointments/[id]/clinical-notes is called with body { primaryConcern: "Updated concern", treatmentSummary: "Good progress", observations: "Improved ROM" }
- **THEN** HTTP response is 200 OK
- **AND** all fields are updated
- **AND** status remains "in_progress"

#### Scenario: Save nextSteps only in finished or later

- **GIVEN** an appointment exists with status "in_progress"
- **WHEN** PATCH /api/appointments/[id]/clinical-notes is called with body { nextSteps: "Continue exercises" }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states nextSteps cannot be saved before session is finished

### Requirement: Session Start on Appointment

The system SHALL support starting a session by transitioning the appointment from `confirmed` (or `scheduled`) to `in_progress`, setting actualStartTime and painLevelBefore. No separate treatment session entity is created.

#### Scenario: Start session from confirmed appointment

- **GIVEN** an appointment exists with status "confirmed"
- **AND** therapist provides painLevelBefore 6 and actualStartTime "10:05:00"
- **WHEN** POST /api/appointments/[id]/start is called with body { actualStartTime: "10:05:00", painLevelBefore: 6 }
- **THEN** status transitions to "in_progress"
- **AND** actualStartTime is set to "10:05:00"
- **AND** painLevelBefore is set to 6
- **AND** totalPausedSeconds is set to 0
- **AND** HTTP response is 200 OK

#### Scenario: Prevent starting cancelled appointment

- **GIVEN** an appointment exists with status "cancelled"
- **WHEN** POST /api/appointments/[id]/start is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states session cannot be started

#### Scenario: Prevent re-starting in_progress appointment

- **GIVEN** an appointment exists with status "in_progress"
- **WHEN** POST /api/appointments/[id]/start is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states session is already in progress

### Requirement: Session End on Appointment

The system SHALL support ending a session by transitioning the appointment from `in_progress` to `finished`, calculating actualDurationSeconds and recording painLevelAfter.

#### Scenario: End session normally

- **GIVEN** an appointment exists with status "in_progress"
- **AND** actualStartTime is "10:00:00"
- **AND** totalPausedSeconds is 300
- **AND** current time is "11:00:00" (3600 seconds elapsed)
- **WHEN** POST /api/appointments/[id]/end is called with body { painLevelAfter: 3 }
- **THEN** status transitions to "finished"
- **AND** actualDurationSeconds is set to 3300 (3600 - 300)
- **AND** painLevelAfter is set to 3
- **AND** pauseStartTime is cleared if set
- **AND** HTTP response is 200 OK

#### Scenario: End paused session

- **GIVEN** an appointment with status "in_progress" and pauseStartTime set
- **WHEN** POST /api/appointments/[id]/end is called
- **THEN** current pause duration is added to totalPausedSeconds
- **AND** pauseStartTime is cleared
- **AND** status transitions to "finished"

### Requirement: Session Pause and Resume on Appointment

The system SHALL support pausing and resuming a session via the appointment record, identical to the existing treatment session pause/resume behavior.

#### Scenario: Pause in-progress appointment

- **GIVEN** an appointment exists with status "in_progress"
- **AND** pauseStartTime is null
- **WHEN** POST /api/appointments/[id]/pause is called with body { pauseStartTime: "10:15:30" }
- **THEN** pauseStartTime is set to "10:15:30"
- **AND** status remains "in_progress"
- **AND** HTTP response is 200 OK

#### Scenario: Resume paused appointment

- **GIVEN** an appointment exists with status "in_progress"
- **AND** pauseStartTime is "10:15:30"
- **AND** totalPausedSeconds is 300
- **WHEN** POST /api/appointments/[id]/resume is called with body { pauseDurationSeconds: 300 }
- **THEN** totalPausedSeconds is updated to 600
- **AND** pauseStartTime is set to null
- **AND** HTTP response is 200 OK

#### Scenario: Prevent pausing non-in_progress appointment

- **GIVEN** an appointment exists with status "scheduled"
- **WHEN** POST /api/appointments/[id]/pause is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states session is not in progress

### Requirement: Appointment Cancellation with Unified Status

The system SHALL support cancelling an appointment from `scheduled`, `confirmed`, or `in_progress` status. Cancellation sets status to `cancelled` and records cancelledAt and cancellationReason.

#### Scenario: Cancel scheduled appointment

- **GIVEN** an appointment exists with status "scheduled"
- **WHEN** POST /api/appointments/[id]/cancel is called with body { cancellationReason: "Patient request" }
- **THEN** status transitions to "cancelled"
- **AND** cancelledAt is set to current timestamp
- **AND** cancellationReason is set to "Patient request"
- **AND** pauseStartTime is cleared if set
- **AND** HTTP response is 200 OK

#### Scenario: Cancel in_progress appointment (accidental start)

- **GIVEN** an appointment exists with status "in_progress"
- **AND** pauseStartTime is set
- **WHEN** POST /api/appointments/[id]/cancel is called
- **THEN** status transitions to "cancelled"
- **AND** pauseStartTime is cleared
- **AND** HTTP response is 200 OK

#### Scenario: Prevent cancelling finished or completed appointment

- **GIVEN** an appointment exists with status "finished"
- **WHEN** POST /api/appointments/[id]/cancel is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states cannot cancel a finished or completed appointment

### Requirement: Appointment Locking

The system SHALL support locking an appointment to prevent further modifications. Locked appointments have `isLocked=true`, `lockedAt` timestamp, and `lockedById` reference.

#### Scenario: Lock a completed appointment

- **GIVEN** an appointment exists with status "completed"
- **WHEN** PATCH /api/appointments/[id]/lock is called
- **THEN** isLocked is set to true
- **AND** lockedAt is set to current timestamp
- **AND** lockedById is set to authenticated user ID
- **AND** HTTP response is 200 OK

#### Scenario: Prevent modifying locked appointment

- **GIVEN** an appointment exists with isLocked true
- **WHEN** PATCH /api/appointments/[id]/clinical-notes is called
- **THEN** HTTP response is 403 Forbidden
- **AND** error message states appointment is locked

### Requirement: Tags on Appointment

The system SHALL support updating tags on the appointment record via dedicated endpoint.

#### Scenario: Update appointment tags

- **GIVEN** an appointment exists with status "in_progress"
- **WHEN** PATCH /api/appointments/[id]/tags is called with body { tags: ["Douleur Diminuée", "Renforcement"] }
- **THEN** tags are stored as JSON string
- **AND** HTTP response is 200 OK

### Requirement: Price and Extend on Appointment

The system SHALL support updating the price by selecting a pricing code from the organization's catalog (via `priceItemCode`), NOT by entering a free-form amount. The system resolves the code to a price item snapshot and derives `priceCents` from the selected item's rate for the session's location. Extending duration is unchanged.

#### Scenario: Update appointment price via pricing code

- **GIVEN** an appointment exists with status "finished"
- **AND** appointment location is "clinic"
- **AND** the organization has a price item with code "CONSULT" and rateCent: { clinic: 15000, home: 25000, telehealth: 12000 }
- **WHEN** PATCH /api/appointments/[id]/price is called with body { priceItemCode: "CONSULT" }
- **THEN** appointment.priceItem is set to { code: "CONSULT", description: "Consultation standard", rateCent: { clinic: 15000, home: 25000, telehealth: 12000 } }
- **AND** appointment.priceCents is set to 15000
- **AND** HTTP response is 200 OK

#### Scenario: Extend appointment duration

- **GIVEN** an appointment exists with status "in_progress"
- **WHEN** PATCH /api/appointments/[id]/extend is called with body { extendedDurationMinutes: 10 }
- **THEN** extendedDurationMinutes is incremented by 10
- **AND** HTTP response is 200 OK

### Requirement: Appointment Payment Status

The system SHALL enrich the GET /api/appointments endpoint with per-appointment payment status when `includePaymentStatus=true` query parameter is provided. Each appointment includes `paidCents`, `paymentStatus`, and `priceItemDescription` (from the price item snapshot, if present).

#### Scenario: Enrich appointments with payment status and pricing code

- **GIVEN** a patient has appointments with payment status: apt-1 paid (15000/15000), apt-2 unpaid (0/10000)
- **AND** apt-1 has priceItem: { code: "CONSULT", description: "Consultation standard", ... }
- **WHEN** GET /api/appointments?patientId=patient-456&includePaymentStatus=true is called
- **THEN** apt-1 response includes paidCents=15000, paymentStatus="paid", and priceItemDescription="Consultation standard"
- **AND** apt-2 response includes paidCents=0 and paymentStatus="unpaid"

#### Scenario: Appointment without price item shows no description

- **GIVEN** an appointment has priceItem null and priceCents 0
- **WHEN** payment status is enriched
- **THEN** priceItemDescription is null

### Requirement: Merged Database Schema

The system SHALL store all scheduling, clinical, timer, billing, and locking data in a single `appointments` table. No `treatment_sessions` table exists. The `appointments` table SHALL include a nullable `price_item` JSON column for pricing code snapshots.

#### Scenario: Appointments table includes clinical columns

- **GIVEN** the database schema is migrated
- **WHEN** the appointments table is inspected
- **THEN** it contains columns: primaryConcern, treatmentSummary, observations, nextSteps, painLevelBefore, painLevelAfter, actualStartTime, actualDurationSeconds, totalPausedSeconds, pauseStartTime, extendedDurationMinutes, tags, priceCents, isLocked, lockedAt, lockedById, cancelledAt, cancellationReason

#### Scenario: Appointments table includes pricing code column

- **GIVEN** the database schema is migrated
- **WHEN** the appointments table is inspected
- **THEN** it contains a `price_item` column of type TEXT (JSON) that is nullable
- **AND** the column stores pricing code snapshots with shape: { code: string, description: string, rateCent: { clinic: number, home: number, telehealth: number } }

#### Scenario: Appointments table has unified status enum

- **GIVEN** the database schema is migrated
- **WHEN** the appointments status column is inspected
- **THEN** it accepts values: scheduled, confirmed, in_progress, finished, completed, cancelled, no_show

### Requirement: Merged Relations

The system SHALL define relations on the appointments table that include all scheduling, clinical, and locking relationships. No treatmentSessions relations exist.

#### Scenario: Appointments have complete relations

- **GIVEN** the relations are defined in server/database/relations.ts
- **WHEN** the appointments relations are inspected
- **THEN** they include: patient, therapist, organization, treatmentPlan, room, service, lockedBy
- **AND** no treatmentSession relation exists
