# session-timer-management Specification

## Purpose
TBD - created by archiving change implement-session-timer-management. Update Purpose after archive.
## Requirements
### Requirement: Start Session with Actual Time

The system SHALL allow therapists to start a consultation session with an actual start time, recording the time when therapy actually begins by creating a treatment session linked to the appointment.

#### Scenario: Start session creates treatment session

- **GIVEN** an appointment with id "appointment-123" exists
- **AND** appointment status is 'scheduled' or 'confirmed'
- **AND** no treatment session exists for this appointment
- **AND** current time is "10:03:25"
- **WHEN** therapist starts session via POST /api/treatment-sessions
- **THEN** a treatment session is created with appointmentId "appointment-123"
- **AND** treatment session status is set to 'in_progress'
- **AND** actualStartTime is set to "10:03:25"
- **AND** actualDurationSeconds is set to 0
- **AND** totalPausedSeconds is set to 0
- **AND** pauseStartTime is set to null
- **AND** patientId, therapistId, treatmentPlanId are copied from appointment
- **AND** timer begins tracking elapsed time

#### Scenario: Start session for appointment with existing treatment session

- **GIVEN** an appointment with id "appointment-123" exists
- **AND** a treatment session already exists for this appointment
- **WHEN** therapist attempts to start session
- **THEN** system returns HTTP 409 Conflict
- **AND** error message states "Treatment session already exists for this appointment"
- **AND** no new treatment session is created

#### Scenario: Prevent starting session for cancelled appointment

- **GIVEN** an appointment with status 'cancelled' exists
- **WHEN** therapist attempts to start session
- **THEN** system returns HTTP 400 Bad Request
- **AND** error message states "Cannot start session for cancelled appointment"

### Requirement: Pause Session and Track Pause Duration

The system SHALL allow therapists to pause an active treatment session, recording the time when pause began for accurate duration tracking.

#### Scenario: Pause active treatment session

- **GIVEN** a treatment session with status 'in_progress' exists
- **AND** actualStartTime is "10:03:25"
- **AND** current time is "10:15:30"
- **WHEN** therapist clicks pause button calling PATCH /api/treatment-sessions/[id]
- **THEN** pauseStartTime is set to "10:15:30"
- **AND** treatment session status remains 'in_progress'
- **AND** timer stops incrementing elapsed time
- **AND** UI displays "En pause depuis Xmin"

#### Scenario: Prevent pausing non-active treatment session

- **GIVEN** a treatment session with status 'completed' exists
- **WHEN** pause endpoint is called
- **THEN** system returns HTTP 400 Bad Request
- **AND** error message states "Session is not in progress"

#### Scenario: Prevent pausing already paused session

- **GIVEN** a treatment session with pauseStartTime "10:15:30" exists
- **WHEN** pause endpoint is called again
- **THEN** system returns HTTP 400 Bad Request
- **AND** error message states "Session is already paused"

### Requirement: Resume Session and Accumulate Pause Time

The system SHALL allow therapists to resume a paused treatment session, calculating the duration of the pause and adding it to total paused time.

#### Scenario: Resume session after short pause

- **GIVEN** a treatment session with actualStartTime "10:03:25"
- **AND** pauseStartTime is "10:15:30"
- **AND** totalPausedSeconds is 300
- **AND** current time is "10:18:30"
- **WHEN** therapist clicks resume button
- **THEN** current pause duration is calculated: 3 minutes (180 seconds)
- **AND** totalPausedSeconds is updated to 480 (300 + 180)
- **AND** pauseStartTime is set to null
- **AND** timer resumes incrementing elapsed time
- **AND** elapsed time excludes all paused duration

### Requirement: End Session and Calculate Final Duration

The system SHALL allow therapists to end a treatment session, calculating the actual therapy time by subtracting total paused time from total elapsed time.

#### Scenario: End treatment session normally

- **GIVEN** a treatment session with actualStartTime "10:03:25"
- **AND** totalPausedSeconds is 300 (5 minutes)
- **AND** current time is "11:00:25"
- **WHEN** therapist ends session
- **THEN** total elapsed time is calculated: 57 minutes (3420 seconds)
- **AND** actualDurationSeconds is set to 3120 (3420 - 300)
- **AND** treatment session status changes to 'completed'
- **AND** pauseStartTime is cleared
- **AND** final duration reflects actual therapy time, excluding pauses

#### Scenario: End session while still paused

- **GIVEN** a treatment session with actualStartTime "10:03:25"
- **AND** pauseStartTime is "10:45:30"
- **AND** totalPausedSeconds is 300
- **AND** therapist ends session at "11:00:00"
- **WHEN** end endpoint is called
- **THEN** current pause duration is calculated: 14.5 minutes (870 seconds)
- **AND** totalPausedSeconds becomes 1170 (300 + 870)
- **AND** elapsed time is calculated: 56.5 minutes (3390 seconds)
- **AND** actualDurationSeconds is set to 2220 (3390 - 1170)

### Requirement: Calculate Accurate Elapsed Time

The system SHALL calculate elapsed time based on actual start time, subtracting total paused time to show only therapy time for treatment sessions.

#### Scenario: Calculate elapsed time with no pauses

- **GIVEN** a treatment session with actualStartTime "10:00:00"
- **AND** totalPausedSeconds is 0
- **AND** current time is "10:30:00"
- **WHEN** timer calculates elapsed time
- **THEN** elapsed time is 30 minutes (1800 seconds)

#### Scenario: Calculate elapsed time with pauses

- **GIVEN** a treatment session with actualStartTime "10:00:00"
- **AND** totalPausedSeconds is 900 (15 minutes)
- **AND** current time is "11:00:00"
- **WHEN** timer calculates elapsed time
- **THEN** elapsed time is 45 minutes (2700 seconds)
- **AND** only actual therapy time is displayed

### Requirement: Display Pause Duration in Human-Readable Format

The system SHALL display the duration of current pause in a human-readable format (Xs, Xmin, Xh, or XhXmin).

#### Scenario: Show pause in seconds

- **GIVEN** a session paused at "10:15:30"
- **AND** current time is "10:15:35"
- **WHEN** system displays pause duration
- **THEN** pause is displayed as "5s"

#### Scenario: Show pause in minutes

- **GIVEN** a session paused at "10:15:30"
- **AND** current time is "10:18:30"
- **WHEN** system displays pause duration
- **THEN** pause is displayed as "3min"

#### Scenario: Show pause in hours

- **GIVEN** a session paused at "10:15:30"
- **AND** current time is "11:15:30"
- **WHEN** system displays pause duration
- **THEN** pause is displayed as "1h"

#### Scenario: Show pause in hours and minutes

- **GIVEN** a session paused at "10:15:30"
- **AND** current time is "11:50:30"
- **WHEN** system displays pause duration
- **THEN** pause is displayed as "1h35min"

### Requirement: Synchronize Session State Across Devices

The system SHALL support multi-device session control with last-write-wins pattern for treatment sessions, allowing therapists to control session from phone, tablet, or desktop.

#### Scenario: Pause on device A, see pause on device B

- **GIVEN** a therapist has treatment session open on desktop
- **AND** session is running
- **WHEN** therapist pauses session on phone
- **THEN** phone shows paused state immediately
- **AND** desktop shows paused state after periodic sync (30s)
- **AND** both devices display same pauseStartTime

### Requirement: Handle Multiple Pause/Resume Cycles

The system SHALL correctly accumulate paused time across multiple pause/resume cycles during a single treatment session.

#### Scenario: Multiple short pauses during session

- **GIVEN** a treatment session starts at "10:00:00"
- **AND** therapist pauses at "10:15:00" and resumes at "10:17:00" (2 minutes)
- **AND** therapist pauses again at "10:30:00" and resumes at "10:35:00" (5 minutes)
- **AND** therapist pauses again at "10:50:00" and resumes at "10:51:00" (1 minute)
- **WHEN** session is ended at "11:00:00"
  - **THEN** totalPausedSeconds is 480 (8 minutes total)
  - **AND** actualDurationSeconds is 3120 (52 minutes of therapy)

