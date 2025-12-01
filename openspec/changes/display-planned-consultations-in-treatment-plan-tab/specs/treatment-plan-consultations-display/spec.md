# Treatment Plan Consultations Display Specification

## ADDED Requirements

### Requirement: Display Planned Consultations in Treatment Plan Tab

The treatment plan tab SHALL display planned consultations in "Aperçu des séances" section, showing all relevant consultation information in a table format sorted from most recent to oldest.

#### Scenario:

- GIVEN a patient has an active treatment plan with planned consultations
- WHEN user views the treatment plan tab
- THEN the "Aperçu des séances" section displays all planned consultations in a table format
- AND each consultation shows date, time, type, duration, location, and status
- AND consultations are sorted from most recent to oldest by date and time

### Requirement: Consultation Data Fetching Integration

The treatment plan tab SHALL automatically fetch consultation data using existing composables and display it in sessions overview with proper sorting.

#### Scenario:

- GIVEN the treatment plan tab is loaded with an active treatment plan
- WHEN the component mounts
- THEN the system automatically fetches consultations using the existing `fetchTreatmentPlanConsultations` method
- AND the data is displayed in the sessions overview table
- AND loading states are shown during data fetching
- AND consultations are sorted from most recent to oldest

### Requirement: Consultation Management Actions

The treatment plan tab SHALL provide consultation management actions directly from the sessions overview table.

#### Scenario:

- GIVEN consultations are displayed in the treatment plan tab
- WHEN the user interacts with consultation actions
- THEN edit and delete buttons are available for each consultation
- AND status can be updated through the interface
- AND actions trigger appropriate API calls with proper error handling

### Requirement: Consultation Status and Type Display

The treatment plan tab SHALL display consultation information with proper formatting and localization.

#### Scenario:

- GIVEN consultations are displayed in the table
- WHEN viewing consultation information
- THEN consultation status is shown with appropriate color-coded badges
- AND consultation types are displayed in French labels
- AND consultation duration and location are clearly visible

### Requirement: Data Synchronization

The treatment plan tab SHALL maintain data synchronization with the consultation planning system.

#### Scenario:

- GIVEN consultations are modified through the planning slideover
- WHEN returning to the treatment plan tab
- THEN the consultation data is automatically refreshed
- AND changes are reflected in the sessions overview table
- AND a manual refresh button is available for users

## MODIFIED Requirements

### Requirement: Sessions Overview Table Enhancement

The sessions overview table in the treatment plan tab SHALL display actual consultation data instead of an empty state with proper chronological ordering.

#### Scenario:

- GIVEN the treatment plan tab sessions overview section
- WHEN displaying consultation data
- THEN the empty state is replaced with actual consultation data when available
- AND the table columns are configured to show relevant consultation information
- AND the table maintains responsive design patterns
- AND consultations are displayed from most recent to oldest

### Requirement: Treatment Plan Tab Data Management

The PatientTreatmentPlanTab component SHALL integrate consultation data management using existing patterns with proper data sorting.

#### Scenario:

- GIVEN the PatientTreatmentPlanTab component
- WHEN managing consultation data
- THEN the component uses the existing `useConsultations` composable
- AND consultation data is properly integrated with treatment plan data
- AND error handling follows existing patterns in the component
- AND consultations are sorted from most recent to oldest by default
