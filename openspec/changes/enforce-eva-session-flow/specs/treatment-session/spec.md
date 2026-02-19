## ADDED Requirements

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

The system SHALL require the therapist to record the patient's initial pain level (EVA) before starting a treatment session.

#### Scenario: Start session with EVA capture

- **GIVEN** an appointment exists with no treatment session
- **AND** the therapist clicks "Démarrer la séance"
- **WHEN** the EVA modal is displayed
- **AND** the therapist sets EVA to 6
- **AND** confirms
- **THEN** a treatment session is created
- **AND** treatment session `painLevelBefore` is set to 6
- **AND** treatment session status is "in_progress"
- **AND** the session timer starts

#### Scenario: Cancel session start

- **GIVEN** the therapist clicks "Démarrer la séance"
- **WHEN** the EVA modal is displayed
- **AND** the therapist cancels
- **THEN** no treatment session is created
- **AND** the session does not start

#### Scenario: Session creation API with painLevelBefore

- **GIVEN** a therapist starts a session via API
- **WHEN** POST /api/treatment-sessions is called with body { appointmentId: "appointment-123", painLevelBefore: 5 }
- **THEN** a treatment session is created
- **AND** `painLevelBefore` is set to 5
- **AND** HTTP response is 201 Created

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
