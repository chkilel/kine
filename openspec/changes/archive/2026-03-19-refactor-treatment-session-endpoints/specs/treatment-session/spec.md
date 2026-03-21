## MODIFIED Requirements

### Requirement: Treatment Session Update

The system SHALL allow updating treatment session data including clinical notes (primaryConcern, treatmentSummary, observations, nextSteps), pain levels, tags, and cost. Users can modify **ANY field that is visible** regardless of when it was initially filled. Each field update uses a dedicated endpoint for explicit API semantics.

#### Scenario: Update clinical notes

- **GIVEN** a treatment session exists with id "session-123"
- **WHEN** PATCH /api/treatment-sessions/session-123/clinical-notes is called with body { treatmentSummary: "Patient showed improvement in range of motion" }
- **THEN** HTTP response is 200 OK
- **AND** treatmentSummary field is updated
- **AND** updatedAt timestamp is updated

#### Scenario: Update pain levels

- **GIVEN** a treatment session exists with id "session-123"
- **WHEN** PATCH /api/treatment-sessions/session-123/clinical-notes is called with body { painLevelBefore: 7, painLevelAfter: 3 }
- **THEN** HTTP response is 200 OK
- **AND** both pain level fields are updated

#### Scenario: Update session tags

- **GIVEN** a treatment session exists with id "session-123"
- **WHEN** PATCH /api/treatment-sessions/session-123/tags is called with body { tags: ["Douleur Diminuée", "Renforcement"] }
- **THEN** HTTP response is 200 OK
- **AND** tags are stored as JSON string

#### Scenario: Update observations and next steps

- **GIVEN** a treatment session exists with id "session-123"
- **WHEN** PATCH /api/treatment-sessions/session-123/clinical-notes is called with body {
  observations: "Patient fatigue noted during exercises",
  nextSteps: "Continue with same protocol next session"
  }
- **THEN** HTTP response is 200 OK
- **AND** both fields are updated

#### Scenario: Modify any visible field in any session status

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session status is any status (pre_session, in_progress, finished, or completed)
- **WHEN** therapist opens TreatmentSessionSlideover and sees a visible field
- **AND** therapist modifies that visible field
- **AND** therapist clicks save button on that field
- **THEN** the field is updated via appropriate API call (clinical-notes, tags, or cost endpoint)
- **AND** update is successful
- **AND** session status remains unchanged

#### Scenario: Update clinical notes in pre_session status

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session status is "pre_session"
- **WHEN** therapist fills primaryConcern field with "Lower back pain"
- **AND** therapist fills treatmentSummary field with "Initial assessment completed"
- **AND** therapist clicks save button on primaryConcern field
- **AND** therapist clicks save button on treatmentSummary field
- **THEN** both fields are saved via PATCH /api/treatment-sessions/session-123/clinical-notes API calls
- **AND** primaryConcern and treatmentSummary fields are updated
- **AND** observations and nextSteps fields are not visible (cannot be modified in pre_session)
- **AND** status remains "pre_session"

#### Scenario: Update clinical notes in in_progress status

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session status is "in_progress"
- **WHEN** therapist fills primaryConcern field with "Updated concern"
- **AND** therapist fills treatmentSummary field with "Patient responding well to treatment"
- **AND** therapist fills observations field with "Pain level decreased during exercises"
- **AND** therapist clicks save buttons on each field
- **THEN** all three fields are saved via PATCH /api/treatment-sessions/session-123/clinical-notes API calls
- **AND** primaryConcern, treatmentSummary, and observations fields are updated
- **AND** nextSteps field is not visible (cannot be modified in in_progress)
- **AND** status remains "in_progress"

#### Scenario: Update clinical notes in finished status

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session status is "finished"
- **WHEN** therapist fills primaryConcern field with "Updated concern"
- **AND** therapist fills treatmentSummary field with "Session completed successfully"
- **AND** therapist fills observations field with "Patient showed good improvement"
- **AND** therapist fills nextSteps field with "Continue with strengthening exercises next session"
- **AND** therapist clicks save buttons on each field
- **THEN** all four fields are saved via PATCH /api/treatment-sessions/session-123/clinical-notes API calls
- **AND** primaryConcern, treatmentSummary, observations, and nextSteps fields are updated
- **AND** status remains "finished"

#### Scenario: Re-modify field that was previously saved

- **GIVEN** a treatment session exists with id "session-123"
- **AND** primaryConcern field was previously saved with "Lower back pain"
- **AND** session status is "in_progress"
- **WHEN** therapist modifies primaryConcern field to "Updated: Lower back pain improved"
- **AND** therapist clicks save button on primaryConcern field
- **THEN** primaryConcern field is updated via PATCH /api/treatment-sessions/session-123/clinical-notes API call
- **AND** new value "Updated: Lower back pain improved" is saved
- **AND** previous value is overwritten
- **AND** session status remains "in_progress"

#### Scenario: Prevent updating observations in pre_session status

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session status is "pre_session"
- **WHEN** therapist attempts to PATCH /api/treatment-sessions/session-123/clinical-notes with body { observations: "Some observations" }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Cannot update observations in pre_session status"

#### Scenario: Prevent updating nextSteps before finished status

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session status is "in_progress"
- **WHEN** therapist attempts to PATCH /api/treatment-sessions/session-123/clinical-notes with body { nextSteps: "Some next steps" }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Cannot update nextSteps before session is finished"

### Requirement: Treatment Session Pause and Resume

The system SHALL support pausing and resuming treatment sessions for break tracking via dedicated endpoints. Pause and resume actions are only valid when the session is in `in_progress` status.

#### Scenario: Pause treatment session

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session status is "in_progress"
- **AND** pauseStartTime is null
- **AND** current time is "10:15:30"
- **WHEN** POST /api/treatment-sessions/session-123/pause is called with body { pauseStartTime: "10:15:30" }
- **THEN** HTTP response is 200 OK
- **AND** pauseStartTime is set to "10:15:30"
- **AND** status remains "in_progress"

#### Scenario: Resume treatment session

- **GIVEN** a treatment session exists with id "session-123"
- **AND** status is "in_progress"
- **AND** pauseStartTime is "10:15:30"
- **AND** totalPausedSeconds is 300
- **AND** current time is "10:20:30" (5 minutes later)
- **WHEN** POST /api/treatment-sessions/session-123/resume is called with body { pauseDurationSeconds: 300 }
- **THEN** HTTP response is 200 OK
- **AND** totalPausedSeconds is updated to 600 (300 + 300)
- **AND** pauseStartTime is set to null

#### Scenario: Prevent pause from pre_session status

- **GIVEN** a treatment session exists with status "pre_session"
- **WHEN** POST /api/treatment-sessions/[id]/pause is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Cannot pause session - session is not in progress"

#### Scenario: Prevent resume when not paused

- **GIVEN** a treatment session exists with status "in_progress"
- **AND** pauseStartTime is null
- **WHEN** POST /api/treatment-sessions/[id]/resume is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Treatment session is not paused"

### Requirement: Treatment Session Completion

The system SHALL support completing treatment sessions via dedicated endpoint with final duration calculation. Completing a session sets status to `finished` to allow for post-session documentation before billing.

#### Scenario: Complete treatment session

- **GIVEN** a treatment session exists with id "session-123"
- **AND** status is "in_progress"
- **AND** actualStartTime is "10:00:00"
- **AND** totalPausedSeconds is 300
- **AND** current time is "11:00:00" (60 minutes elapsed)
- **WHEN** POST /api/treatment-sessions/session-123/end is called with body { painLevelAfter: 4 }
- **THEN** HTTP response is 200 OK
- **AND** status is updated to "finished"
- **AND** actualDurationSeconds is set to 3300 (3600 elapsed - 300 paused)
- **AND** painLevelAfter is set to 4

#### Scenario: Complete paused session

- **GIVEN** a treatment session exists with id "session-123"
- **AND** status is "in_progress"
- **AND** pauseStartTime is set (currently paused)
- **WHEN** POST /api/treatment-sessions/session-123/end is called
- **THEN** HTTP response is 200 OK
- **AND** current pause duration is calculated and added to totalPausedSeconds
- **AND** pauseStartTime is set to null
- **AND** status is updated to "finished"

#### Scenario: Prevent completing already finished session

- **GIVEN** a treatment session exists with status "finished"
- **WHEN** POST /api/treatment-sessions/[id]/end is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session is already finished or completed"

#### Scenario: Prevent completing already completed session

- **GIVEN** a treatment session exists with status "completed"
- **WHEN** POST /api/treatment-sessions/[id]/end is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session is already finished or completed"

### Requirement: Treatment Session Billing Data

The system SHALL support storing billing-related data on treatment sessions. Setting `billed` field on a session with `finished` status automatically transitions it to `completed`.

#### Scenario: Update billing information

- **GIVEN** a treatment session exists with id "session-123" with status "finished"
- **WHEN** PATCH /api/treatment-sessions/session-123/clinical-notes is called with body {
  billed: "2026-01-16",
  insuranceClaimed: true,
  cost: 6500
  }
- **THEN** HTTP response is 200 OK
- **AND** billing fields are updated
- **AND** status is automatically updated to "completed"
- **AND** cost is stored in cents (6500 = 65.00 Dh)

#### Scenario: Update billing information without status change

- **GIVEN** a treatment session exists with id "session-123" with status "completed"
- **WHEN** PATCH /api/treatment-sessions/session-123/cost is called with body { cost: 7000 }
- **THEN** HTTP response is 200 OK
- **AND** cost is updated to 7000
- **AND** status remains "completed"

#### Scenario: Use cost override when billing information is updated

- **GIVEN** a treatment session has costOverride 6000
- **WHEN** PATCH /api/treatment-sessions/session-123/clinical-notes is called with body {
  billed: "2026-01-16"
  }
- **THEN** session.cost is set to 6000 (from costOverride)
- **AND** session is marked as billed
- **AND** status transitions to "completed"

#### Scenario: Calculate cost when billing information is updated without cost override

- **GIVEN** a treatment session has no costOverride
- **AND** session is associated with treatment plan and organization with pricing
- **WHEN** PATCH /api/treatment-sessions/session-123/clinical-notes is called with body {
  billed: "2026-01-16"
  }
- **THEN** session.cost is calculated using inheritance chain
- **AND** calculated cost is stored
- **AND** session is marked as billed
- **AND** status transitions to "completed"

### Requirement: Treatment Session Cancellation

The system SHALL allow canceling treatment sessions from `pre_session` or `in_progress` status to handle no-shows or accidental session starts via dedicated endpoint.

#### Scenario: Cancel session from pre_session (no-show)

- **GIVEN** a treatment session exists with status "pre_session"
- **AND** patient did not show up
- **WHEN** POST /api/treatment-sessions/[id]/cancel is called
- **THEN** status is updated to "canceled"
- **AND** HTTP response is 200 OK
- **AND** response message indicates "Session annulée"

#### Scenario: Cancel session from in_progress (accidental start)

- **GIVEN** a treatment session exists with status "in_progress"
- **AND** session was started accidentally
- **AND** pauseStartTime is "10:15:30"
- **WHEN** POST /api/treatment-sessions/[id]/cancel is called
- **THEN** status is updated to "canceled"
- **AND** pauseStartTime is set to null
- **AND** HTTP response is 200 OK

#### Scenario: Prevent cancel from finished status

- **GIVEN** a treatment session exists with status "finished"
- **WHEN** POST /api/treatment-sessions/[id]/cancel is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Cannot cancel a finished or completed session"

#### Scenario: Prevent cancel from completed status

- **GIVEN** a treatment session exists with status "completed"
- **WHEN** POST /api/treatment-sessions/[id]/cancel is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Cannot cancel a finished or completed session"

#### Scenario: Prevent cancel if already canceled

- **GIVEN** a treatment session exists with status "canceled"
- **WHEN** POST /api/treatment-sessions/[id]/cancel is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session is already canceled"

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
- **WHEN** POST /api/treatment-sessions/[id]/start is called with body { actualStartTime: "10:05:00", painLevelBefore: 5 }
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
- **WHEN** POST /api/treatment-sessions/[id]/end is called with body { painLevelAfter: 3 }
- **THEN** status is updated to "finished"
- **AND** actualDurationSeconds is set to 3300 (3600 elapsed - 300 paused)
- **AND** HTTP response is 200 OK

### Requirement: Automatic Completion on Billing

The system SHALL automatically transition treatment sessions from `finished` to `completed` status when the `billed` field is set.

#### Scenario: Mark session as billed triggers completion

- **GIVEN** a treatment session exists with status "finished"
- **WHEN** PATCH /api/treatment-sessions/[id]/clinical-notes is called with body { billed: "2026-01-16" }
- **THEN** status is automatically updated to "completed"
- **AND** billed field is set to "2026-01-16"
- **AND** HTTP response is 200 OK

#### Scenario: Billing a non-finished session does not change status

- **GIVEN** a treatment session exists with status "in_progress"
- **WHEN** PATCH /api/treatment-sessions/[id]/clinical-notes is called with body { billed: "2026-01-16" }
- **THEN** billed field is set to "2026-01-16"
- **AND** status remains "in_progress"
- **AND** HTTP response is 200 OK

### Requirement: Mandatory Initial EVA at Session Start

The system SHALL require the therapist to record the patient's initial pain level (EVA) before starting a treatment session timer. Pain level is captured via modal confirmation during the start action, not during session creation.

#### Scenario: Start session with EVA capture

- **GIVEN** an appointment exists with no treatment session
- **AND** the therapist creates a treatment session (status: "pre_session")
- **AND** the therapist clicks "Démarrer la séance"
- **WHEN** the EVA modal is displayed
- **AND** the therapist sets EVA to 6
- **AND** confirms
- **THEN** the session start action is called with painLevelBefore 6 via POST /api/treatment-sessions/[id]/start
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
- **WHEN** POST /api/treatment-sessions/[id]/start is called with body { actualStartTime: "10:05:00", painLevelBefore: 5 }
- **THEN** `painLevelBefore` is set to 5
- **AND** status is updated to "in_progress"
- **AND** actualStartTime is set to "10:05:00"
- **AND** HTTP response is 200 OK

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
- **WHEN** POST /api/treatment-sessions/session-123/end is called with body { painLevelAfter: 4 }
- **THEN** `painLevelAfter` is set to 4
- **AND** status is updated to "completed"
- **AND** HTTP response is 200 OK

### Requirement: Session Cost Override

The system SHALL allow therapists to override the calculated cost for individual treatment sessions, storing the manual override value.

#### Scenario: Override session cost

- **GIVEN** a treatment session exists with status "finished"
- **AND** calculated cost is 5000 cents
- **WHEN** PATCH /api/treatment-sessions/session-123/cost is called with body { cost: 6000 }
- **THEN** HTTP response is 200 OK
- **AND** session.cost is set to 6000
- **AND** final cost for billing uses 6000 cents

#### Scenario: Remove session cost override

- **GIVEN** a treatment session has costOverride 6000
- **WHEN** PATCH /api/treatment-sessions/session-123/cost is called with body { cost: null }
- **THEN** HTTP response is 200 OK
- **AND** session.cost is set to null
- **AND** cost reverts to calculated value from inheritance chain

## ADDED Requirements

### Requirement: Extend Treatment Session Duration

The system SHALL support extending treatment session duration for situations where sessions run longer than planned.

#### Scenario: Extend session duration

- **GIVEN** a treatment session exists with id "session-123"
- **AND** current extendedDurationMinutes is 0
- **WHEN** PATCH /api/treatment-sessions/session-123/extend is called with body { extendedDurationMinutes: 10 }
- **THEN** HTTP response is 200 OK
- **AND** extendedDurationMinutes is updated to 10
- **AND** success message indicates duration extended

#### Scenario: Extend session duration cumulatively

- **GIVEN** a treatment session has extendedDurationMinutes of 5
- **WHEN** PATCH /api/treatment-sessions/session-123/extend is called with body { extendedDurationMinutes: 10 }
- **THEN** HTTP response is 200 OK
- **AND** extendedDurationMinutes is updated to 15 (5 + 10)

#### Scenario: Prevent extending with zero or negative duration

- **GIVEN** a treatment session exists
- **WHEN** PATCH /api/treatment-sessions/session-123/extend is called with body { extendedDurationMinutes: 0 }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message indicates extended duration must be at least 1 minute

### Requirement: Treatment Session Action Endpoints

The system SHALL provide dedicated RESTful endpoints for each treatment session action, eliminating complex union schema validation and action detection logic.

#### Scenario: Start session via dedicated endpoint

- **GIVEN** a treatment session exists with status "pre_session"
- **AND** therapist provides actualStartTime and painLevelBefore
- **WHEN** POST /api/treatment-sessions/[id]/start is called with valid start action body
- **THEN** HTTP response is 200 OK
- **AND** session status transitions to "in_progress"
- **AND** actualStartTime and painLevelBefore are set
- **AND** no action detection logic is needed

#### Scenario: Pause session via dedicated endpoint

- **GIVEN** a treatment session exists with status "in_progress"
- **AND** session is not currently paused
- **WHEN** POST /api/treatment-sessions/[id]/pause is called with valid pause action body
- **THEN** HTTP response is 200 OK
- **AND** pauseStartTime is set
- **AND** session remains in "in_progress" status

#### Scenario: Resume session via dedicated endpoint

- **GIVEN** a treatment session exists with status "in_progress"
- **AND** session is currently paused
- **WHEN** POST /api/treatment-sessions/[id]/resume is called with valid resume action body
- **THEN** HTTP response is 200 OK
- **AND** totalPausedSeconds is incremented
- **AND** pauseStartTime is set to null

#### Scenario: End session via dedicated endpoint

- **GIVEN** a treatment session exists with status "in_progress"
- **WHEN** POST /api/treatment-sessions/[id]/end is called with valid end action body
- **THEN** HTTP response is 200 OK
- **AND** session status transitions to "finished"
- **AND** actualDurationSeconds and painLevelAfter are set
- **AND** pause state is cleared if session was paused

#### Scenario: Cancel session via dedicated endpoint

- **GIVEN** a treatment session exists with status "pre_session" or "in_progress"
- **WHEN** POST /api/treatment-sessions/[id]/cancel is called
- **THEN** HTTP response is 200 OK
- **AND** session status transitions to "canceled"
- **AND** all session data is cleared except metadata

#### Scenario: Update tags via dedicated endpoint

- **GIVEN** a treatment session exists
- **WHEN** PATCH /api/treatment-sessions/[id]/tags is called with body { tags: ["Tag1", "Tag2"] }
- **THEN** HTTP response is 200 OK
- **AND** tags are stored as JSON string
- **AND** other session fields remain unchanged

#### Scenario: Update cost via dedicated endpoint

- **GIVEN** a treatment session exists
- **WHEN** PATCH /api/treatment-sessions/[id]/cost is called with body { cost: 6500 }
- **THEN** HTTP response is 200 OK
- **AND** cost is set to 6500 cents
- **AND** other session fields remain unchanged

#### Scenario: Update clinical notes via dedicated endpoint

- **GIVEN** a treatment session exists
- **WHEN** PATCH /api/treatment-sessions/[id]/clinical-notes is called with body { primaryConcern: "Lower back pain", treatmentSummary: "Good progress" }
- **THEN** HTTP response is 200 OK
- **AND** specified fields are updated
- **AND** unspecified fields remain unchanged
- **AND** state-specific validation is enforced (observations/nextSteps visibility rules)

## REMOVED Requirements

### Requirement: Direct Session Start Without Pre-Session

**Reason**: This requirement describes the behavior of starting a session directly without creating it first. While this behavior is still supported, it's now handled more cleanly by the POST /start endpoint which accepts a session ID. The requirement's implementation details about bypassing pre_session status are no longer accurate since the start endpoint is explicit about the transition.

**Migration**: The UI behavior is preserved - therapists can still start sessions directly via "Démarrer la séance" button, but the API call now uses the dedicated POST /start endpoint instead of the monolithic PATCH endpoint with action detection. The underlying business logic remains the same.

### Requirement: Clinical Notes Progressive Visibility

**Reason**: This requirement describes visibility rules for clinical notes fields based on session status. The requirement is not being removed but is being MODIFIED (see above) to reflect the new endpoint-based approach. The visibility rules themselves remain unchanged.

**Migration**: None - the business rules for field visibility remain the same, only the API endpoints used to update these fields change from PATCH /api/treatment-sessions/[id] to PATCH /api/treatment-sessions/[id]/clinical-notes.
