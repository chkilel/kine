# Consultation Planning API

## ADDED Requirements

### Requirement: Consultation CRUD API Endpoints

The system SHALL provide comprehensive API endpoints for consultation management within treatment plans.

#### Scenario: Create consultation endpoint

- **WHEN** therapist creates a new consultation
- **THEN** system SHALL provide POST `/api/patients/[id]/consultations`
- **AND** validate request with enhanced consultationCreateSchema
- **AND** ensure user has permission for patient's organization
- **AND** link consultation to treatment plan if provided
- **AND** return created consultation with proper status codes

#### Scenario: List consultations endpoint

- **WHEN** viewing patient consultations
- **THEN** system SHALL provide GET `/api/patients/[id]/consultations`
- **AND** support pagination with page and limit parameters
- **AND** allow filtering by date range, status, and type
- **AND** include treatment plan information in response
- **AND** respect organization data isolation

#### Scenario: Update consultation endpoint

- **WHEN** modifying existing consultation details
- **THEN** system SHALL provide PUT `/api/patients/[id]/consultations/[id]`
- **AND** validate updates with consultationUpdateSchema
- **AND** maintain audit trail of changes
- **AND** handle status transitions properly
- **AND** return updated consultation data

#### Scenario: Delete consultation endpoint

- **WHEN** removing consultation from schedule
- **THEN** system SHALL provide DELETE `/api/patients/[id]/consultations/[id]`
- **AND** perform soft delete to maintain audit trail
- **AND** validate user permissions
- **AND** handle treatment plan impact appropriately
- **AND** return success confirmation

### Requirement: Treatment Plan Consultations Endpoint

The system SHALL provide specialized endpoint for consultations within treatment plans.

#### Scenario: Treatment plan consultations listing

- **WHEN** viewing consultations for specific treatment plan
- **THEN** system SHALL provide GET `/api/treatment-plans/[id]/consultations`
- **AND** return consultations ordered by date
- **AND** include progress tracking information
- **AND** support filtering by status and type
- **AND** calculate completion statistics

#### Scenario: Treatment plan consultation creation

- **WHEN** adding consultations to treatment plan
- **THEN** system SHALL automatically associate consultation with treatment plan
- **AND** validate against treatment plan constraints
- **AND** update treatment plan progress accordingly
- **AND** maintain consultation limits if specified
