# treatment-session Specification

## Purpose
TBD - created by archiving change migrate-to-split-appointment-session. Update Purpose after archive.
## Requirements
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

### Requirement: Treatment Session Retrieval

The system SHALL provide endpoints to retrieve treatment session data.

#### Scenario: Get treatment session by ID

- **GIVEN** a treatment session exists with id "session-123"
- **AND** the session belongs to the authenticated user's organization
- **WHEN** GET /api/treatment-sessions/session-123 is called
- **THEN** HTTP response is 200 OK
- **AND** response body includes treatment session details
- **AND** response includes related appointment, patient, therapist, and treatment plan

#### Scenario: Get non-existent treatment session

- **GIVEN** no treatment session exists with id "session-999"
- **WHEN** GET /api/treatment-sessions/session-999 is called
- **THEN** HTTP response is 404 Not Found
- **AND** error message states "Treatment session not found"

#### Scenario: Prevent cross-organization access

- **GIVEN** a treatment session exists belonging to organization A
- **AND** the authenticated user belongs to organization B
- **WHEN** GET /api/treatment-sessions/[id] is called
- **THEN** HTTP response is 404 Not Found (treated as not found for security)

#### Scenario: List treatment sessions for patient

- **GIVEN** a patient with id "patient-123" has 5 treatment sessions
- **AND** the sessions belong to the authenticated user's organization
- **WHEN** GET /api/treatment-sessions?patientId=patient-123 is called
- **THEN** HTTP response is 200 OK
- **AND** response body is an array of 5 treatment sessions
- **AND** sessions are ordered by createdAt descending (most recent first)

#### Scenario: List treatment sessions for therapist on specific date

- **GIVEN** a therapist with id "therapist-123" has treatment sessions on "2026-01-16"
- **WHEN** GET /api/treatment-sessions?therapistId=therapist-123&date=2026-01-16 is called
- **THEN** HTTP response is 200 OK
- **AND** response includes only sessions for that therapist on that date
- **AND** sessions include related appointment data

### Requirement: Treatment Session Update

The system SHALL allow updating treatment session data including clinical notes, pain levels, and timer state.

#### Scenario: Update clinical notes

- **GIVEN** a treatment session exists with id "session-123"
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body { treatmentSummary: "Patient showed improvement in range of motion" }
- **THEN** HTTP response is 200 OK
- **AND** treatmentSummary field is updated
- **AND** updatedAt timestamp is updated

#### Scenario: Update pain levels

- **GIVEN** a treatment session exists with id "session-123"
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body { painLevelBefore: 7, painLevelAfter: 3 }
- **THEN** HTTP response is 200 OK
- **AND** both pain level fields are updated

#### Scenario: Update session tags

- **GIVEN** a treatment session exists with id "session-123"
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body { tags: ["Douleur Diminuée", "Renforcement"] }
- **THEN** HTTP response is 200 OK
- **AND** tags are stored as JSON string

#### Scenario: Update observations and next steps

- **GIVEN** a treatment session exists with id "session-123"
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body {
  observations: "Patient fatigue noted during exercises",
  nextSteps: "Continue with same protocol next session"
  }
- **THEN** HTTP response is 200 OK
- **AND** both fields are updated

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

### Requirement: Data Integrity Constraints

The system SHALL enforce data integrity for treatment sessions.

#### Scenario: Unique constraint on appointmentId

- **GIVEN** a treatment session exists with appointmentId "appointment-123"
- **WHEN** attempting to create another treatment session with same appointmentId
- **THEN** database unique constraint prevents insertion
- **AND** application returns 409 Conflict

#### Scenario: Foreign key constraints

- **GIVEN** a treatment session references appointment "appointment-123"
- **WHEN** appointment "appointment-123" is deleted
- **THEN** database cascades deletion to treatment session
- **AND** data consistency is maintained

#### Scenario: Organization isolation

- **GIVEN** a treatment session belongs to organization "org-123"
- **AND** the session references patient "patient-456" and therapist "therapist-789"
- **THEN** all related entities must belong to the same organization
- **AND** API enforces this validation

### Requirement: Display Treatment Session Timing Information

The system SHALL display comprehensive timing information in the Treatment Session Slideover, including both scheduled appointment times and actual session execution times.

#### Scenario: Display timing for session not started

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** appointment date is "2026-01-16"
- **AND** appointment startTime is "10:00:00"
- **AND** appointment endTime is "11:00:00"
- **AND** appointment duration is 60 minutes
- **AND** no treatment session exists for this appointment
- **WHEN** therapist opens TreatmentSessionSlideover for appointment "appointment-123"
- **THEN** session timing section displays appointment date: "16/01/2026"
- **AND** session timing section displays appointment start time: "10:00"
- **AND** session timing section displays appointment end time: "11:00"
- **AND** session timing section displays planned duration: "60 min"
- **AND** session timing section does not show actual start time
- **AND** session timing section does not show actual end time
- **AND** session timing section does not show actual duration
- **AND** session timing section does not show paused time

#### Scenario: Display timing for active session

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** appointment date is "2026-01-16"
- **AND** appointment startTime is "10:00:00"
- **AND** appointment endTime is "11:00:00"
- **AND** appointment duration is 60 minutes
- **AND** a treatment session exists for this appointment
- **AND** treatment session actualStartTime is "10:05:00"
- **AND** treatment session totalPausedSeconds is 300 (5 minutes)
- **AND** treatment session status is "in_progress"
- **WHEN** therapist opens TreatmentSessionSlideover for appointment "appointment-123"
- **THEN** session timing section displays appointment date: "16/01/2026"
- **AND** session timing section displays appointment start time: "10:00"
- **AND** session timing section displays appointment end time: "11:00"
- **AND** session timing section displays planned duration: "60 min"
- **AND** session timing section displays actual start time: "10:05"
- **AND** session timing section displays paused time: "5 min"
- **AND** session timing section does not show actual end time
- **AND** session timing section does not show actual duration

#### Scenario: Display timing for completed session

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** appointment date is "2026-01-16"
- **AND** appointment startTime is "10:00:00"
- **AND** appointment endTime is "11:00:00"
- **AND** appointment duration is 60 minutes
- **AND** treatmentSession has extendedDurationMinutes of 5
- **AND** a treatment session exists for this appointment
- **AND** treatment session actualStartTime is "10:05:00"
- **AND** treatment session actualDurationSeconds is 3420 (57 minutes)
- **AND** treatment session totalPausedSeconds is 300 (5 minutes)
- **AND** treatment session status is "completed"
- **WHEN** therapist opens TreatmentSessionSlideover for appointment "appointment-123"
- **THEN** session timing section displays appointment date: "16/01/2026"
- **AND** session timing section displays appointment start time: "10:00"
- **AND** session timing section displays appointment end time: "11:00"
- **AND** session timing section displays planned duration: "65 min" (60 + 5 extended)
- **AND** session timing section displays actual start time: "10:05"
- **AND** session timing section displays actual end time: "11:02"
- **AND** session timing section displays actual duration: "57 min"
- **AND** session timing section displays paused time: "5 min"
- **AND** session timing section shows comparison: "57 min / 65 min"

#### Scenario: Display timing for session with no pauses

- **GIVEN** a completed treatment session exists
- **AND** treatment session actualStartTime is "10:00:00"
- **AND** treatment session actualDurationSeconds is 1800 (30 minutes)
- **AND** treatment session totalPausedSeconds is 0
- **WHEN** therapist opens TreatmentSessionSlideover for this appointment
- **THEN** session timing section displays actual duration: "30 min"
- **AND** session timing section does not display paused time
- **OR** session timing section displays paused time: "0 min"

#### Scenario: Display timing for session with multiple pauses

- **GIVEN** a completed treatment session exists
- **AND** treatment session actualStartTime is "10:00:00"
- **AND** treatment session totalPausedSeconds is 900 (15 minutes)
- **WHEN** therapist opens TreatmentSessionSlideover for this appointment
- **THEN** session timing section displays paused time: "15 min"
- **AND** paused time reflects sum of all pause periods

### Requirement: EVA Modal Component

The system SHALL provide a reusable modal component for capturing EVA (pain scale) values with a visual slider.

#### Scenario: Display EVA modal for initial pain level

- **GIVEN** a therapist initiates a new treatment session
- **WHEN** the EVA modal is displayed
- **THEN** the modal shows a slider from 0 to 10
- **AND** the slider has a gradient track from green (0) to red (10)
- **AND** the modal has a title "Évaluation de la douleur"
- **AND** the modal has a confirm button labeled "Enregistrer et démarrer"
- **AND** the modal has a cancel option

#### Scenario: Display EVA modal for end pain level

- **GIVEN** a therapist attempts to end a treatment session
- **WHEN** the EVA modal is displayed
- **THEN** the modal shows the same slider interface
- **AND** the title indicates end of session evaluation
- **AND** the confirm button is labeled "Enregistrer et terminer"

#### Scenario: Therapist sets EVA value

- **GIVEN** the EVA modal is displayed
- **WHEN** the therapist moves the slider to value 7
- **AND** clicks confirm
- **THEN** the modal emits the value 7
- **AND** the modal closes

#### Scenario: Therapist cancels EVA modal

- **GIVEN** the EVA modal is displayed
- **WHEN** the therapist clicks cancel
- **THEN** the modal emits null
- **AND** the modal closes
- **AND** the session does not start (if start modal) or does not end (if end modal)

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

### Requirement: EVA Display During Session

The system SHALL display the initial and pending end EVA values during an active session.

#### Scenario: Display initial EVA card during session

- **GIVEN** a treatment session is in progress
- **AND** `painLevelBefore` is 7
- **WHEN** the session view is displayed
- **THEN** a card titled "EVA Initiale" shows the value "7/10"
- **AND** the card is read-only (not editable)

#### Scenario: Display end EVA placeholder card

- **GIVEN** a treatment session is in progress
- **WHEN** the session view is displayed
- **THEN** a card titled "EVA Finale" is shown
- **AND** the card contains text "Sera demandé avant de terminer la séance"
- **AND** the card has a placeholder icon

#### Scenario: Hide EVA cards when session not started

- **GIVEN** no treatment session exists for the appointment
- **WHEN** the appointment view is displayed
- **THEN** neither initial nor end EVA cards are shown
- **AND** the original EVA input interface is available for reference only

### Requirement: Mandatory End EVA at Session Completion

The system SHALL require the therapist to record the patient's final pain level (EVA) before completing a treatment session.

#### Scenario: End session with EVA capture

- **GIVEN** a treatment session is in progress
- **AND** the therapist clicks "Terminer la séance"
- **WHEN** the EVA modal is displayed
- **AND** the therapist sets EVA to 3
- **AND** confirms
- **THEN** treatment session `painLevelAfter` is set to 3
- **AND** treatment session status is updated to "completed"
- **AND** the session ends

#### Scenario: Cancel session end

- **GIVEN** a treatment session is in progress
- **AND** the therapist clicks "Terminer la séance"
- **WHEN** the EVA modal is displayed
- **AND** the therapist cancels
- **THEN** treatment session status remains "in_progress"
- **AND** the session continues

#### Scenario: End session API with painLevelAfter

- **GIVEN** a treatment session with id "session-123" is in progress
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with action "end" and painLevelAfter 4
- **THEN** `painLevelAfter` is set to 4
- **AND** status is updated to "completed"
- **AND** HTTP response is 200 OK

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

