# session-timer-management Specification

## Purpose

Session timer management using the unified appointment model. All timer fields are stored directly on the appointment record - no separate treatment session entity exists.

## Requirements

### Requirement: Start Session with Actual Time

The system SHALL allow therapists to start a consultation session with an actual start time by transitioning the appointment status to `in_progress`. No separate treatment session entity is created — all timer fields are stored directly on the appointment.

#### Scenario: Start session transitions appointment to in_progress

- **GIVEN** an appointment with id "appointment-123" exists
- **AND** appointment status is 'scheduled' or 'confirmed'
- **AND** current time is "10:03:25"
- **WHEN** therapist starts session via POST /api/appointments/appointment-123/start
- **THEN** appointment status transitions to 'in_progress'
- **AND** actualStartTime is set to "10:03:25"
- **AND** actualDurationSeconds is set to 0
- **AND** totalPausedSeconds is set to 0
- **AND** pauseStartTime is set to null
- **AND** timer begins tracking elapsed time
- **AND** no separate treatment session record is created

#### Scenario: Prevent starting session for cancelled appointment

- **GIVEN** an appointment with status 'cancelled' exists
- **WHEN** therapist attempts to start session
- **THEN** system returns HTTP 400 Bad Request
- **AND** error message states "Cannot start session for cancelled appointment"

### Requirement: Pause Session and Track Pause Duration

The system SHALL allow therapists to pause an active appointment session by updating pauseStartTime on the appointment record.

#### Scenario: Pause active appointment session

- **GIVEN** an appointment with status 'in_progress' exists
- **AND** actualStartTime is "10:03:25"
- **AND** current time is "10:15:30"
- **WHEN** therapist clicks pause button calling POST /api/appointments/[id]/pause
- **THEN** pauseStartTime is set to "10:15:30"
- **AND** appointment status remains 'in_progress'
- **AND** timer stops incrementing elapsed time

#### Scenario: Prevent pausing already paused session

- **GIVEN** an appointment with pauseStartTime "10:15:30" exists
- **WHEN** pause endpoint is called again
- **THEN** system returns HTTP 400 Bad Request
- **AND** error message states "Session is already paused"

### Requirement: Resume Session and Accumulate Pause Time

The system SHALL allow therapists to resume a paused session by updating totalPausedSeconds and clearing pauseStartTime on the appointment record.

#### Scenario: Resume session after short pause

- **GIVEN** an appointment with actualStartTime "10:03:25"
- **AND** pauseStartTime is "10:15:30"
- **AND** totalPausedSeconds is 300
- **AND** current time is "10:18:30"
- **WHEN** therapist clicks resume button via POST /api/appointments/[id]/resume
- **THEN** current pause duration is calculated: 3 minutes (180 seconds)
- **AND** totalPausedSeconds is updated to 480 (300 + 180)
- **AND** pauseStartTime is set to null
- **AND** timer resumes incrementing elapsed time

### Requirement: End Session and Calculate Final Duration

The system SHALL allow therapists to end a session by transitioning appointment status to 'finished' and calculating actualDurationSeconds.

#### Scenario: End appointment session normally

- **GIVEN** an appointment with actualStartTime "10:03:25"
- **AND** totalPausedSeconds is 300 (5 minutes)
- **AND** current time is "11:00:25"
- **WHEN** therapist ends session via POST /api/appointments/[id]/end
- **THEN** total elapsed time is calculated: 57 minutes (3420 seconds)
- **AND** actualDurationSeconds is set to 3120 (3420 - 300)
- **AND** appointment status transitions to 'finished'
- **AND** pauseStartTime is cleared

### Requirement: Calculate Accurate Elapsed Time

The system SHALL calculate elapsed time based on actualStartTime stored on the appointment, subtracting totalPausedSeconds.

#### Scenario: Calculate elapsed time with pauses

- **GIVEN** an appointment with actualStartTime "10:00:00"
- **AND** totalPausedSeconds is 900 (15 minutes)
- **AND** current time is "11:00:00"
- **WHEN** timer calculates elapsed time
- **THEN** elapsed time is 45 minutes (2700 seconds)
