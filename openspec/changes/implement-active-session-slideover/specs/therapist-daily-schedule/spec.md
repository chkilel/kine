## MODIFIED Requirements

### Requirement: Start Consultation from Daily Schedule

The system SHALL allow therapists to start consultations from their daily schedule page by clicking "Démarrer" button, which now opens to active consultation slideover instead of just changing to status.

#### Scenario: Open active consultation slideover when starting consultation

- **GIVEN** a therapist is on `/therapists/day` page
- **AND** a consultation has status 'scheduled' or 'confirmed'
- **AND** therapist clicks "Démarrer" button for that consultation
- **WHEN** start consultation action is triggered
- **THEN** ActiveConsultationSlideover component opens in fullscreen mode
- **AND** consultation status changes to 'in_progress'
- **AND** consultation timer begins automatically in slideover
- **AND** "Démarrer" button on daily schedule is replaced with a "Terminer" button

#### Scenario: Update consultation list after consultation completion

- **GIVEN** a therapist has opened and completed a consultation via ActiveConsultationSlideover
- **AND** slideover has closed after completion
- **WHEN** therapist returns to daily schedule page
- **THEN** consultation status is displayed as 'completed'
- **AND** "Terminer" button is no longer visible for that consultation
- **AND** consultation is counted in "Terminées" statistic

### Requirement: Complete Consultation from Daily Schedule

The system SHALL allow therapists to mark consultations as completed from daily schedule page when they are already in progress, without requiring a separate action in active consultation slideover.

#### Scenario: Complete in-progress consultation from schedule

- **GIVEN** a consultation is in 'in_progress' status
- **AND** ActiveConsultationSlideover is already open
- **WHEN** therapist completes consultation from within slideover
- **THEN** consultation status changes to 'completed'
- **AND** slideover closes
- **AND** daily schedule page automatically updates to show new status
- **AND** "Terminer" button is removed from schedule card
