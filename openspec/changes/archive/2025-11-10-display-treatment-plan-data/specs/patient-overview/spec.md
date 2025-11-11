## ADDED Requirements

### Requirement: Patient Treatment Plan Overview Display

The system SHALL display real treatment plan data in the patient overview tab, replacing static placeholder data with dynamic information from the database.

#### Scenario: Active treatment plan display

- **WHEN** a user views a patient's overview tab
- **THEN** the system SHALL display the currently active treatment plan in a dedicated card
- **AND** show plan name, status, date range, assigned therapist
- **AND** calculate and display progress based on completed consultations

#### Scenario: Treatment plan history display

- **WHEN** a user views a patient's overview tab
- **THEN** the system SHALL display all treatment plans in the history section
- **AND** show plan name, period, and current status for each plan
- **AND** order plans by creation date (newest first)

#### Scenario: Data fetching and security

- **WHEN** treatment plan data is requested
- **THEN** the system SHALL only return plans belonging to the patient
- **AND** enforce organization-based data isolation
- **AND** include consultation data for progress calculation

#### Scenario: Empty state handling

- **WHEN** a patient has no treatment plans
- **THEN** the system SHALL display appropriate empty state messages, use nuxt ui empty component
- **AND** provide clear calls-to-action to create treatment plans

#### Scenario: Progress calculation

- **WHEN** displaying treatment plan progress
- **THEN** the system SHALL calculate progress based on completed consultations vs planned sessions
- **AND** display both numerical percentage and session count
- **AND** handle cases with zero planned sessions gracefully
