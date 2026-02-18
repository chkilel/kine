## ADDED Requirements

### Requirement: Treatment Session Creation

The system SHALL provide the ability to create a treatment session from an existing appointment, establishing a 1:1 relationship between appointment and treatment session.

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
- **AND** treatment session status is "in_progress"
- **AND** treatment session sessionStep is "pre-session"
- **AND** treatment session actualStartTime is set to current time
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

The system SHALL support pausing and resuming treatment sessions for break tracking.

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
- **AND** pauseStartTime is "10:15:30"
- **AND** totalPausedSeconds is 300
- **AND** current time is "10:20:30" (5 minutes later)
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with action "resume" and pauseDurationSeconds 300
- **THEN** HTTP response is 200 OK
- **AND** totalPausedSeconds is updated to 600 (300 + 300)
- **AND** pauseStartTime is set to null

#### Scenario: Extend treatment session duration

- **GIVEN** a treatment session exists with id "session-123"
- **AND** extendedDurationMinutes is 0
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with action "extend" and extendedDurationMinutes 5
- **THEN** HTTP response is 200 OK
- **AND** extendedDurationMinutes is updated to 5

### Requirement: Treatment Session Completion

The system SHALL support completing treatment sessions with final duration calculation.

#### Scenario: Complete treatment session

- **GIVEN** a treatment session exists with id "session-123"
- **AND** status is "in_progress"
- **AND** actualStartTime is "10:00:00"
- **AND** totalPausedSeconds is 300
- **AND** current time is "11:00:00" (60 minutes elapsed)
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with action "end" and actualDurationSeconds 3300
- **THEN** HTTP response is 200 OK
- **AND** status is updated to "completed"
- **AND** actualDurationSeconds is set to 3300 (3600 elapsed - 300 paused)
- **AND** sessionStep is updated to "post-session"

#### Scenario: Complete paused session

- **GIVEN** a treatment session exists with id "session-123"
- **AND** status is "in_progress"
- **AND** pauseStartTime is set (currently paused)
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with action "end"
- **THEN** HTTP response is 200 OK
- **AND** current pause duration is calculated and added to totalPausedSeconds
- **AND** pauseStartTime is set to null
- **AND** status is updated to "completed"

#### Scenario: Prevent completing already completed session

- **GIVEN** a treatment session exists with status "completed"
- **WHEN** PATCH /api/treatment-sessions/[id] is called with action "end"
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session is already completed"

### Requirement: Treatment Session Step Tracking

The system SHALL support tracking which step of the session the therapist is currently in.

#### Scenario: Advance session step

- **GIVEN** a treatment session exists with sessionStep "pre-session"
- **WHEN** PATCH /api/treatment-sessions/[id] is called with sessionStep "assessment"
- **THEN** HTTP response is 200 OK
- **AND** sessionStep is updated to "assessment"

#### Scenario: Session step progression

- **GIVEN** a treatment session is created
- **THEN** initial sessionStep is "pre-session"
- **WHEN** therapist begins assessment
- **THEN** sessionStep can be updated to "assessment"
- **WHEN** therapy begins
- **THEN** sessionStep can be updated to "treatment"
- **WHEN** session ends
- **THEN** sessionStep is "post-session"

### Requirement: Treatment Session Billing Data

The system SHALL support storing billing-related data on treatment sessions.

#### Scenario: Update billing information

- **GIVEN** a treatment session exists with id "session-123"
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body {
  billed: "2026-01-16",
  insuranceClaimed: true,
  cost: 6500
  }
- **THEN** HTTP response is 200 OK
- **AND** billing fields are updated
- **AND** cost is stored in cents (6500 = 65.00)

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
