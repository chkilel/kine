## MODIFIED Requirements

### Requirement: Start Consultation from Planning Slideover

The system SHALL allow therapists to start consultations from planning slideover by clicking "Démarrer" button, which now opens to active consultation slideover instead of just changing to status.

#### Scenario: Open active consultation slideover when starting consultation

- **GIVEN** a therapist has PlanningSlideover open for a consultation
- **AND** consultation status is 'scheduled' or 'confirmed'
- **AND** therapist clicks "Démarrer" button in slideover footer
- **WHEN** start consultation action is triggered
- **THEN** PlanningSlideover closes
- **AND** ActiveConsultationSlideover opens in fullscreen mode
- **AND** consultation status changes to 'in_progress'
- **AND** consultation timer begins automatically in slideover

### Requirement: Complete Consultation from Planning Slideover

The system SHALL allow therapists to mark consultations as completed from planning slideover when they are already in progress, without requiring a separate action in active consultation slideover.

#### Scenario: Complete in-progress consultation from planning

- **GIVEN** a consultation is in 'in_progress' status
- **AND** PlanningSlideover is reopened for that consultation
- **WHEN** therapist clicks "Terminer" button in slideover footer
- **THEN** consultation status changes to 'completed'
- **AND** PlanningSlideover closes
- **AND** parent view refreshes to show new status
