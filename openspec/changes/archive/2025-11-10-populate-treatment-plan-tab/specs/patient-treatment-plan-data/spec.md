# patient-treatment-plan-data Specification

## Purpose

Replace static mock data in PatientTreatmentPlanTab.vue with dynamic data from the database, implementing proper empty states and real-time progress calculation.

## ADDED Requirements

### Requirement: Dynamic Treatment Plan Data Fetching

The system SHALL fetch real treatment plan data from the database instead of using static mock data.

#### Scenario: Data fetching on component mount

- **WHEN** the PatientTreatmentPlanTab component mounts
- **THEN** the system SHALL make an API call to `/api/patients/[id]/treatment-plans`
- **AND** use the patient ID from component props
- **AND** display loading state during data fetch
- **AND** handle API errors gracefully

#### Scenario: Data display with real information

- **WHEN** treatment plan data is successfully fetched
- **THEN** the system SHALL display the active treatment plan with real data
- **AND** show therapist name instead of therapist ID
- **AND** calculate progress using actual completed consultation count
- **AND** display accurate session counts and dates

### ADDED Requirement: Empty State Implementation

The system SHALL display an appropriate empty state when no treatment plans exist using the Nuxt UI Empty component.

#### Scenario: Empty state display

- **WHEN** a patient has no treatment plans
- **THEN** the system SHALL display the UEmpty component with specific configuration
- **AND** set icon to `i-lucide-clipboard-plus`
- **AND** set title to "Aucun plan de traitement"
- **AND** set description to "Ce patient n'a pas encore de plan de traitement. Créez-en un pour commencer le suivi."
- **AND** provide "Créer un plan" action button that opens CreateTreatmentPlanSlideover

#### Scenario: Empty state interaction

- **WHEN** the user clicks "Créer un plan" in the empty state
- **THEN** the system SHALL open the CreateTreatmentPlanSlideover
- **AND** maintain the same functionality as existing create plan button

### ADDED Requirement: Progress Calculation with Real Data

The system SHALL calculate treatment plan progress using actual consultation data from the database.

#### Scenario: Accurate progress calculation

- **WHEN** displaying treatment plan progress
- **THEN** the system SHALL use the completedConsultations count from API response
- **AND** calculate percentage as (completed / planned) \* 100
- **AND** handle zero planned sessions gracefully (show 0%)
- **AND** display both numerical percentage and session count

#### Scenario: Progress display updates

- **WHEN** treatment plan data changes (new sessions completed)
- **THEN** the system SHALL reflect updated progress on next data fetch
- **AND** maintain accurate progress representation

### ADDED Requirement: Error Handling and Loading States

The system SHALL provide proper user feedback during data fetching and error scenarios.

#### Scenario: Loading state display

- **WHEN** treatment plan data is being fetched
- **THEN** the system SHALL display loading indicators
- **AND** maintain existing UI layout structure
- **AND** prevent user interaction with data-dependent elements

#### Scenario: Error state handling

- **WHEN** API call fails or returns error
- **THEN** the system SHALL display appropriate error message
- **AND** provide retry mechanism if possible
- **AND** maintain component stability

### ADDED Requirement: Backward Compatibility

The system SHALL maintain all existing functionality while replacing static data with dynamic data.

#### Scenario: Existing functionality preservation

- **WHEN** data is replaced with dynamic fetching
- **THEN** the system SHALL preserve all existing buttons and actions
- **AND** maintain CreateTreatmentPlanSlideover functionality
- **AND** keep existing UI layout and styling
- **AND** preserve responsive design behavior
