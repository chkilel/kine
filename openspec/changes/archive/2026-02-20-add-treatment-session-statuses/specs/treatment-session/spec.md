# treatment-session Specification Delta

## ADDED Requirements

### Requirement: Pre-Session Preparation Phase

The system SHALL provide a `pre_session` status that allows therapists to prepare treatment protocol and notes before starting the actual session. Pre-session is for adding notes only; pain level is captured when starting the session.

#### Scenario: Create treatment session with pre_session status

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** therapist initiates treatment session creation
- **WHEN** POST /api/treatment-sessions is called with body { appointmentId: "appointment-123" }
- **THEN** a treatment session is created with status "pre_session"
- **AND** treatment session actualStartTime is null
- **AND** treatment session painLevelBefore is null
- **AND** HTTP response is 201 Created

#### Scenario: Start session from pre_session with pain level

- **GIVEN** a treatment session exists with status "pre_session"
- **AND** current time is "10:05:00"
- **WHEN** PATCH /api/treatment-sessions/[id] is called with action "start", actualStartTime "10:05:00", and painLevelBefore 5
- **THEN** status is updated to "in_progress"
- **AND** actualStartTime is set to "10:05:00"
- **AND** painLevelBefore is set to 5
- **AND** HTTP response is 200 OK

### Requirement: Post-Session Documentation Phase

The system SHALL provide a `finished` status to indicate that the session has ended but post-session documentation and billing are pending.

#### Scenario: End session transitions to finished status

- **GIVEN** a treatment session exists with status "in_progress"
- **AND** actualStartTime is "10:00:00"
- **AND** totalPausedSeconds is 300
- **AND** current time is "11:00:00" (60 minutes elapsed)
- **WHEN** PATCH /api/treatment-sessions/[id] is called with action "end" and painLevelAfter 3
- **THEN** status is updated to "finished"
- **AND** actualDurationSeconds is set to 3300 (3600 elapsed - 300 paused)
- **AND** HTTP response is 200 OK

### Requirement: Automatic Completion on Billing

The system SHALL automatically transition treatment sessions from `finished` to `completed` status when the `billed` field is set.

#### Scenario: Mark session as billed triggers completion

- **GIVEN** a treatment session exists with status "finished"
- **WHEN** PATCH /api/treatment-sessions/[id] is called with body { billed: "2026-01-16" }
- **THEN** status is automatically updated to "completed"
- **AND** billed field is set to "2026-01-16"
- **AND** HTTP response is 200 OK

#### Scenario: Billing a non-finished session does not change status

- **GIVEN** a treatment session exists with status "in_progress"
- **WHEN** PATCH /api/treatment-sessions/[id] is called with body { billed: "2026-01-16" }
- **THEN** billed field is set to "2026-01-16"
- **AND** status remains "in_progress"
- **AND** HTTP response is 200 OK

### Requirement: Treatment Session Cancellation

The system SHALL allow canceling treatment sessions from `pre_session` or `in_progress` status to handle no-shows or accidental session starts.

#### Scenario: Cancel session from pre_session (no-show)

- **GIVEN** a treatment session exists with status "pre_session"
- **AND** patient did not show up
- **WHEN** PATCH /api/treatment-sessions/[id] is called with action "cancel"
- **THEN** status is updated to "canceled"
- **AND** HTTP response is 200 OK
- **AND** response message indicates "Session annulée"

#### Scenario: Cancel session from in_progress (accidental start)

- **GIVEN** a treatment session exists with status "in_progress"
- **AND** session was started accidentally
- **AND** pauseStartTime is "10:15:30"
- **WHEN** PATCH /api/treatment-sessions/[id] is called with action "cancel"
- **THEN** status is updated to "canceled"
- **AND** pauseStartTime is set to null
- **AND** HTTP response is 200 OK

#### Scenario: Prevent cancel from finished status

- **GIVEN** a treatment session exists with status "finished"
- **WHEN** PATCH /api/treatment-sessions/[id] is called with action "cancel"
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Cannot cancel a finished or completed session"

#### Scenario: Prevent cancel from completed status

- **GIVEN** a treatment session exists with status "completed"
- **WHEN** PATCH /api/treatment-sessions/[id] is called with action "cancel"
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Cannot cancel a finished or completed session"

#### Scenario: Prevent cancel if already canceled

- **GIVEN** a treatment session exists with status "canceled"
- **WHEN** PATCH /api/treatment-sessions/[id] is called with action "cancel"
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session is already canceled"

## MODIFIED Requirements

### Requirement: Treatment Session Creation

The system SHALL provide ability to create a treatment session from an existing appointment, establishing a 1:1 relationship between appointment and treatment session. The session is created in `pre_session` status to allow preparation before starting. Pain level is not captured at creation.

#### Scenario: Create treatment session from appointment

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** appointment has patientId "patient-456"
- **AND** appointment has therapistId "therapist-789"
- **AND** appointment has treatmentPlanId "plan-abc"
- **AND** no treatment session exists for this appointment
- **WHEN** POST /api/treatment-sessions is called with body { appointmentId: "appointment-123" }
- **THEN** a treatment session is created
- **AND** treatment session appointmentId is "appointment-123"
- **AND** treatment session patientId is "patient-456" (copied from appointment)
- **AND** treatment session therapistId is "therapist-789" (copied from appointment)
- **AND** treatment session treatmentPlanId is "plan-abc" (copied from appointment)
- **AND** treatment session status is "pre_session"
- **AND** treatment session actualStartTime is null
- **AND** treatment session painLevelBefore is null
- **AND** HTTP response is 201 Created
- **AND** response body includes the created treatment session with relations

#### Scenario: Prevent duplicate treatment session creation

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** a treatment session already exists for appointment "appointment-123"
- **WHEN** POST /api/treatment-sessions is called with body { appointmentId: "appointment-123" }
- **THEN** HTTP response is 409 Conflict
- **AND** error message states "Treatment session already exists for this appointment"
- **AND** no new treatment session is created

#### Scenario: Prevent treatment session creation for non-existent appointment

- **GIVEN** no appointment exists with id "appointment-999"
- **WHEN** POST /api/treatment-sessions is called with body { appointmentId: "appointment-999" }
- **THEN** HTTP response is 404 Not Found
- **AND** error message states "Appointment not found"

#### Scenario: Prevent treatment session creation for cancelled appointment

- **GIVEN** an appointment exists with status "cancelled"
- **WHEN** POST /api/treatment-sessions is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Cannot create treatment session for cancelled appointment"

### Requirement: Treatment Session Completion

The system SHALL support completing treatment sessions with final duration calculation. Completing a session sets status to `finished` to allow for post-session documentation before billing.

#### Scenario: Complete treatment session

- **GIVEN** a treatment session exists with id "session-123"
- **AND** status is "in_progress"
- **AND** actualStartTime is "10:00:00"
- **AND** totalPausedSeconds is 300
- **AND** current time is "11:00:00" (60 minutes elapsed)
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with action "end" and painLevelAfter 4
- **THEN** HTTP response is 200 OK
- **AND** status is updated to "finished"
- **AND** actualDurationSeconds is set to 3300 (3600 elapsed - 300 paused)
- **AND** painLevelAfter is set to 4

#### Scenario: Complete paused session

- **GIVEN** a treatment session exists with id "session-123"
- **AND** status is "in_progress"
- **AND** pauseStartTime is set (currently paused)
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with action "end"
- **THEN** HTTP response is 200 OK
- **AND** current pause duration is calculated and added to totalPausedSeconds
- **AND** pauseStartTime is set to null
- **AND** status is updated to "finished"

#### Scenario: Prevent completing already finished session

- **GIVEN** a treatment session exists with status "finished"
- **WHEN** PATCH /api/treatment-sessions/[id] is called with action "end"
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session is already finished or completed"

#### Scenario: Prevent completing already completed session

- **GIVEN** a treatment session exists with status "completed"
- **WHEN** PATCH /api/treatment-sessions/[id] is called with action "end"
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session is already finished or completed"

### Requirement: Treatment Session Pause and Resume

The system SHALL support pausing and resuming treatment sessions for break tracking. Pause and resume actions are only valid when the session is in `in_progress` status.

#### Scenario: Pause treatment session

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session status is "in_progress"
- **AND** pauseStartTime is null
- **AND** current time is "10:15:30"
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with action "pause" and pauseStartTime "10:15:30"
- **THEN** HTTP response is 200 OK
- **AND** pauseStartTime is set to "10:15:30"
- **AND** status remains "in_progress"

#### Scenario: Resume treatment session

- **GIVEN** a treatment session exists with id "session-123"
- **AND** status is "in_progress"
- **AND** pauseStartTime is "10:15:30"
- **AND** totalPausedSeconds is 300
- **AND** current time is "10:20:30" (5 minutes later)
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with action "resume" and pauseDurationSeconds 300
- **THEN** HTTP response is 200 OK
- **AND** totalPausedSeconds is updated to 600 (300 + 300)
- **AND** pauseStartTime is set to null

#### Scenario: Prevent pause from pre_session status

- **GIVEN** a treatment session exists with status "pre_session"
- **WHEN** PATCH /api/treatment-sessions/[id] is called with action "pause"
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Cannot pause session - session is not in progress"

#### Scenario: Prevent resume when not paused

- **GIVEN** a treatment session exists with status "in_progress"
- **AND** pauseStartTime is null
- **WHEN** PATCH /api/treatment-sessions/[id] is called with action "resume"
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Treatment session is not paused"

### Requirement: Treatment Session Billing Data

The system SHALL support storing billing-related data on treatment sessions. Setting `billed` field on a session with `finished` status automatically transitions it to `completed`.

#### Scenario: Update billing information

- **GIVEN** a treatment session exists with id "session-123" with status "finished"
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body {
  billed: "2026-01-16",
  insuranceClaimed: true,
  cost: 6500
  }
- **THEN** HTTP response is 200 OK
- **AND** billing fields are updated
- **AND** status is automatically updated to "completed"
- **AND** cost is stored in cents (6500 = 65.00)

#### Scenario: Update billing information without status change

- **GIVEN** a treatment session exists with id "session-123" with status "completed"
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body { cost: 7000 }
- **THEN** HTTP response is 200 OK
- **AND** cost is updated to 7000
- **AND** status remains "completed"

### Requirement: Mandatory Initial EVA at Session Start

The system SHALL require the therapist to record the patient's initial pain level (EVA) before starting a treatment session timer. Pain level is captured via modal confirmation during the start action, not during session creation.

#### Scenario: Start session with EVA capture

- **GIVEN** an appointment exists with no treatment session
- **AND** the therapist creates a treatment session (status: "pre_session")
- **AND** the therapist clicks "Démarrer la séance"
- **WHEN** the EVA modal is displayed
- **AND** the therapist sets EVA to 6
- **AND** confirms
- **THEN** the session start action is called with painLevelBefore 6
- **AND** treatment session `painLevelBefore` is set to 6
- **AND** treatment session status is updated to "in_progress"
- **AND** the session timer starts
- **AND** actualStartTime is set

#### Scenario: Cancel session start from pre_session

- **GIVEN** a treatment session exists with status "pre_session"
- **AND** the therapist clicks "Démarrer la séance"
- **WHEN** the EVA modal is displayed
- **AND** the therapist cancels
- **THEN** the session remains in "pre_session" status
- **AND** the timer does not start
- **AND** `painLevelBefore` remains null

#### Scenario: Start session API with painLevelBefore

- **GIVEN** a therapist starts a session via API
- **WHEN** PATCH /api/treatment-sessions/[id] is called with action "start", actualStartTime "10:05:00", and painLevelBefore 5
- **THEN** `painLevelBefore` is set to 5
- **AND** status is updated to "in_progress"
- **AND** actualStartTime is set to "10:05:00"
- **AND** HTTP response is 200 OK

## REMOVED Requirements

### Requirement: Treatment Session Step Tracking

**Reason**: The `sessionStep` field is being removed as redundant. The enhanced status workflow (`pre_session`, `in_progress`, `finished`, `completed`, `canceled`) captures the full session lifecycle without needing a separate step tracking system.

**Migration**: All references to `sessionStep` should be removed from the database schema, types, API endpoints, and frontend components. UI navigation should use status-based transitions instead.

#### Scenario: Advance session step

- **REMOVED** - No longer applicable; use status transitions instead

#### Scenario: Session step progression

- **REMOVED** - No longer applicable; use status transitions instead:
  - `pre_session` (initial) → `in_progress` (when timer starts)
  - `in_progress` → `finished` (when timer ends)
  - `finished` → `completed` (when billed)
