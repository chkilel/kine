# Session Timer Management Specification

## Purpose

Define requirements for database-backed consultation timer that accurately tracks actual therapy time, handles pause/resume cycles, and synchronizes across multiple devices.

## ADDED Requirements

### Requirement: Start Session with Actual Time

The system SHALL allow therapists to start a consultation session with an actual start time that may differ from the scheduled start time, recording the time when therapy actually begins.

#### Scenario: Start session at scheduled time

- **GIVEN** a consultation with id "consultation-123" exists
- **AND** consultation status is 'scheduled' or 'confirmed'
- **AND** current time is "10:03:25"
- **WHEN** therapist starts session via start endpoint
- **THEN** consultation status changes to 'in_progress'
- **AND** actualStartTime is set to "10:03:25"
- **AND** actualDurationSeconds is set to 0
- **AND** totalPausedSeconds is set to 0
- **AND** pauseStartTime is set to null
- **AND** timer begins tracking elapsed time

#### Scenario: Start session late

- **GIVEN** a consultation scheduled to start at "10:00:00"
- **AND** therapist starts session at "10:08:30"
- **WHEN** start endpoint is called with actualStartTime "10:08:30"
- **THEN** actualStartTime is stored as "10:08:30"
- **AND** timer calculates elapsed time from "10:08:30", not scheduled time

#### Scenario: Prevent starting already in-progress session

- **GIVEN** a consultation with status 'in_progress' exists
- **WHEN** start endpoint is called for the same consultation
- **THEN** system returns HTTP 400 Bad Request
- **AND** error message states "Session is already in progress"
- **AND** consultation data is not modified

### Requirement: Pause Session and Track Pause Duration

The system SHALL allow therapists to pause an active session, recording the time when pause began for accurate duration tracking.

#### Scenario: Pause active session

- **GIVEN** a consultation with status 'in_progress' exists
- **AND** actualStartTime is "10:03:25"
- **AND** current time is "10:15:30"
- **WHEN** therapist clicks pause button
- **THEN** pauseStartTime is set to "10:15:30"
- **AND** consultation status remains 'in_progress'
- **AND** timer stops incrementing elapsed time
- **AND** UI displays "En pause depuis Xmin"

#### Scenario: Prevent pausing non-active session

- **GIVEN** a consultation with status 'scheduled' exists
- **WHEN** pause endpoint is called
- **THEN** system returns HTTP 400 Bad Request
- **AND** error message states "Session is not in progress"

#### Scenario: Prevent pausing already paused session

- **GIVEN** a consultation with pauseStartTime "10:15:30" exists
- **WHEN** pause endpoint is called again
- **THEN** system returns HTTP 400 Bad Request
- **AND** error message states "Session is already paused"

### Requirement: Resume Session and Accumulate Pause Time

The system SHALL allow therapists to resume a paused session, calculating the duration of the pause and adding it to total paused time.

#### Scenario: Resume session after short pause

- **GIVEN** a consultation with actualStartTime "10:03:25"
- **AND** pauseStartTime is "10:15:30"
- **AND** totalPausedSeconds is 300
- **AND** current time is "10:18:30"
- **WHEN** therapist clicks resume button
- **THEN** current pause duration is calculated: 3 minutes (180 seconds)
- **AND** totalPausedSeconds is updated to 480 (300 + 180)
- **AND** pauseStartTime is set to null
- **AND** timer resumes incrementing elapsed time
- **AND** elapsed time excludes all paused duration

#### Scenario: Resume session after long pause

- **GIVEN** a consultation paused at "14:30:00"
- **AND** therapist resumes at "15:45:00"
- **WHEN** resume endpoint is called
- **THEN** pause duration is calculated as 75 minutes (4500 seconds)
- **AND** totalPausedSeconds is increased by 4500
- **AND** session continues normally

#### Scenario: Handle midnight crossing during pause

- **GIVEN** a consultation paused at "23:45:00"
- **AND** therapist resumes at "00:15:00" next day
- **WHEN** resume endpoint is called
- **THEN** pause duration is calculated as 30 minutes (1800 seconds)
- **AND** totalPausedSeconds is increased correctly
- **AND** time crossing midnight is handled properly

#### Scenario: Prevent resuming non-paused session

- **GIVEN** a consultation with pauseStartTime null exists
- **WHEN** resume endpoint is called
- **THEN** system returns HTTP 400 Bad Request
- **AND** error message states "Session is not paused"

### Requirement: End Session and Calculate Final Duration

The system SHALL allow therapists to end a session, calculating the actual therapy time by subtracting total paused time from total elapsed time.

#### Scenario: End session normally

- **GIVEN** a consultation with actualStartTime "10:03:25"
- **AND** totalPausedSeconds is 300 (5 minutes)
- **AND** current time is "11:00:25"
- **WHEN** therapist ends session
- **THEN** total elapsed time is calculated: 57 minutes (3420 seconds)
- **AND** actualDurationSeconds is set to 3120 (3420 - 300)
- **AND** consultation status changes to 'completed'
- **AND** pauseStartTime is cleared
- **AND** final duration reflects actual therapy time, excluding pauses

#### Scenario: End session while still paused

- **GIVEN** a consultation with actualStartTime "10:03:25"
- **AND** pauseStartTime is "10:45:30"
- **AND** totalPausedSeconds is 300
- **AND** therapist ends session at "11:00:00"
- **WHEN** end endpoint is called
- **THEN** current pause duration is calculated: 14.5 minutes (870 seconds)
- **AND** totalPausedSeconds becomes 1170 (300 + 870)
- **AND** elapsed time is calculated: 56.5 minutes (3390 seconds)
- **AND** actualDurationSeconds is set to 2220 (3390 - 1170)

#### Scenario: Ensure non-negative duration

- **GIVEN** a consultation where pause duration exceeds elapsed time
- **WHEN** end endpoint is called
- **THEN** actualDurationSeconds is set to 0 (minimum allowed)
- **AND** consultation status changes to 'completed'

#### Scenario: End session with provided duration

- **GIVEN** a consultation is in progress
- **AND** therapist provides actualDurationSeconds as 1800
- **WHEN** end endpoint is called with provided duration
- **THEN** actualDurationSeconds is set to 1800
- **AND** system uses provided value instead of calculating

### Requirement: Calculate Accurate Elapsed Time

The system SHALL calculate elapsed time based on actual start time, subtracting total paused time to show only therapy time.

#### Scenario: Calculate elapsed time with no pauses

- **GIVEN** a consultation with actualStartTime "10:00:00"
- **AND** totalPausedSeconds is 0
- **AND** current time is "10:30:00"
- **WHEN** timer calculates elapsed time
- **THEN** elapsed time is 30 minutes (1800 seconds)

#### Scenario: Calculate elapsed time with pauses

- **GIVEN** a consultation with actualStartTime "10:00:00"
- **AND** totalPausedSeconds is 900 (15 minutes)
- **AND** current time is "11:00:00"
- **WHEN** timer calculates elapsed time
- **THEN** elapsed time is 45 minutes (2700 seconds)
- **AND** only actual therapy time is displayed

#### Scenario: Calculate elapsed time while paused

- **GIVEN** a consultation with actualStartTime "10:00:00"
- **AND** pauseStartTime is "10:30:00"
- **AND** totalPausedSeconds is 0
- **AND** current time is "10:45:00"
- **WHEN** timer calculates elapsed time while paused
- **THEN** elapsed time is calculated up to pause start: 30 minutes (1800 seconds)
- **AND** timer does not increment while paused

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

The system SHALL support multi-device session control with last-write-wins pattern, allowing therapists to control session from phone, tablet, or desktop.

#### Scenario: Pause on device A, see pause on device B

- **GIVEN** a therapist has session open on desktop
- **AND** session is running
- **WHEN** therapist pauses session on phone
- **THEN** phone shows paused state immediately
- **AND** desktop shows paused state after periodic sync (30s)
- **AND** both devices display same pauseStartTime

#### Scenario: Resume on device B after pausing on device A

- **GIVEN** a session paused on phone with pauseStartTime "10:15:30"
- **AND** desktop shows paused state after sync
- **WHEN** therapist resumes session on desktop
- **THEN** totalPausedSeconds is updated on server
- **AND** phone shows running state after next sync
- **AND** timer calculations match on both devices

#### Scenario: Tags sync across devices

- **GIVEN** a session is in progress
- **AND** therapist selects "Douleur Diminuée" tag on phone
- **WHEN** tag is saved to database
- **THEN** desktop shows "Douleur Diminuée" as selected after sync
- **AND** both devices display same set of selected tags

### Requirement: Handle Multiple Pause/Resume Cycles

The system SHALL correctly accumulate paused time across multiple pause/resume cycles during a single session.

#### Scenario: Multiple short pauses

- **GIVEN** a consultation starts at "10:00:00"
- **AND** therapist pauses at "10:15:00" and resumes at "10:17:00" (2 minutes)
- **AND** therapist pauses again at "10:30:00" and resumes at "10:35:00" (5 minutes)
- **AND** therapist pauses again at "10:50:00" and resumes at "10:51:00" (1 minute)
- **WHEN** session is ended at "11:00:00"
- **THEN** totalPausedSeconds is 480 (8 minutes total)
- **AND** actualDurationSeconds is 3120 (52 minutes of therapy)

#### Scenario: Pause, resume, pause again without ending

- **GIVEN** a session has been paused and resumed once
- **AND** totalPausedSeconds is 300
- **WHEN** therapist pauses again
- **THEN** new pauseStartTime is set
- **AND** totalPausedSeconds remains 300 (until resume)
- **AND** on next resume, new pause duration is added to total
