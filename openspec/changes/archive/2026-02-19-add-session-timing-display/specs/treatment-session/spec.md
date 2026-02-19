## ADDED Requirements

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
