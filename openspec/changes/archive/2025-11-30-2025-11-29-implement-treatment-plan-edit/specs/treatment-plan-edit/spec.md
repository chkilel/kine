# Treatment Plan Edit API Specification

## ADDED Requirements

### Requirement: Update Treatment Plan API Endpoint

The system SHALL provide a PUT endpoint for updating existing treatment plans with proper validation and authorization.

#### Scenario:

GIVEN a therapist is viewing a patient's treatment plan
WHEN they click the edit button and modify treatment plan details
THEN the system should update the treatment plan via PUT request and return the updated data

### Requirement: Enhanced Treatment Plan Form Component

The system SHALL provide a reusable form component that supports both create and edit modes for treatment plans.

#### Scenario:

GIVEN a user needs to create or edit a treatment plan
WHEN the TreatmentPlanFormSlideover component is opened
THEN it should support both create and edit modes based on the presence of a treatmentPlan prop

### Requirement: Treatment Plan Update Composable Function

The system SHALL provide a composable function for updating treatment plans with proper error handling and state management.

#### Scenario:

GIVEN a developer needs to update a treatment plan from the frontend
WHEN they call the updateTreatmentPlan function
THEN it should handle the API call, loading states, and error handling properly

### Requirement: Edit Mode Form Initialization

The system SHALL pre-populate form fields with existing treatment plan data when in edit mode.

#### Scenario:

GIVEN a user opens the treatment plan form in edit mode
WHEN the component loads
THEN all form fields should be pre-populated with existing treatment plan data

### Requirement: Constants Integration in Edit Mode

The system SHALL use shared constants for all dropdown options and configurations in edit mode.

#### Scenario:

GIVEN a user is editing a treatment plan
WHEN they interact with dropdown fields (status, coverage, etc.)
THEN the options should be populated from shared/utils/constants.ts

## MODIFIED Requirements

### Requirement: Treatment Plan Form Component

The existing TreatmentPlanCreateSideover component SHALL be enhanced to support both create and edit modes.

#### Scenario:

GIVEN the existing TreatmentPlanCreateSideover component
WHEN enhancing it for edit functionality
THEN it should be refactored to support both create and edit modes while maintaining all existing functionality

### Requirement: useTreatmentPlans Composable

The existing useTreatmentPlans composable SHALL be enhanced with update functionality.

#### Scenario:

GIVEN the existing useTreatmentPlans composable with read-only operations
WHEN adding edit functionality
THEN it should include updateTreatmentPlan function while preserving existing read operations

### Requirement: Form Validation

The existing validation schemas SHALL be extended to support partial updates for treatment plan editing.

#### Scenario:

GIVEN the existing treatment plan validation schemas
WHEN implementing edit functionality
THEN the treatmentPlanUpdateSchema should be used for partial updates while maintaining validation integrity
