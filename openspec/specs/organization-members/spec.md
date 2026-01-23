# organization-members Specification

## Purpose

TBD - created by archiving change add-organization-members-loading. Update Purpose after archive.

## Requirements

### Requirement: Fetch Organization Members

The system SHALL provide an API endpoint that queries the database directly using Drizzle to retrieve all members belonging to the active organization with complete user data including additional fields.

#### Scenario: Fetch organization members successfully

- **GIVEN** an authenticated user with an active organization
- **WHEN** the GET /api/organizations/members endpoint is called
- **THEN** the system returns a list of all users belonging to that organization
- **AND** each member includes all user fields: id, firstName, lastName, name, email, image, licenseNumber, specialization, phoneNumbers
- **AND** the response includes member role information from the members table

#### Scenario: Handle unauthorized access

- **GIVEN** an unauthenticated request
- **WHEN** the API endpoint is called
- **THEN** the system returns a 401 Unauthorized error

#### Scenario: Authorize organization member access

- **GIVEN** an authenticated user who is not a member of the requested organization
- **WHEN** the API endpoint is called for an organization they don't belong to
- **THEN** the system returns a 403 Forbidden error

### Requirement: Therapist Selection from Organization Members

The system SHALL allow users to select any member of their organization as the therapist when creating or updating treatment plans and scheduling consultations.

#### Scenario: Display therapists in creation form

- **GIVEN** an organization with multiple members
- **WHEN** opening the treatment plan creation form
- **THEN** the therapist dropdown displays all organization members with their full names

#### Scenario: Select therapist for treatment plan

- **GIVEN** an organization with multiple therapists
- **WHEN** a user selects a therapist from the dropdown
- **THEN** the selected therapist's ID is assigned to the treatment plan

#### Scenario: Load therapists for consultation planning

- **GIVEN** an active treatment plan with a therapist
- **WHEN** opening the consultation planning interface
- **THEN** the therapist dropdown displays all organization members and pre-selects the treatment plan's therapist

### Requirement: Remove Therapist Loading from Treatment Plans Endpoint

The system SHALL NOT load therapist information in the treatment plans GET endpoint; instead, therapist data should be fetched from the useOrganizationMembers composable and mapped on the client side.

#### Scenario: Fetch treatment plans without therapist data

- **GIVEN** an authenticated user requesting patient treatment plans
- **WHEN** the GET /api/treatment-plans?patientId=<id> endpoint is called
- **THEN** the system returns treatment plans with therapistId only, without fetching full therapist details

#### Scenario: Therapist data loaded separately

- **GIVEN** treatment plans with therapistIds
- **WHEN** the client needs to display therapist information
- **THEN** the client uses the useOrganizationMembers composable to fetch therapist data
- **AND** maps therapistId to therapist details for display

#### Scenario: Display therapist name in patient views

- **GIVEN** a treatment plan with a therapistId
- **WHEN** displaying the treatment plan in PatientTreatmentPlanSidebar or PatientActiveTreatmentPlan
- **THEN** the component uses the useOrganizationMembers composable to fetch organization members
- **AND** displays the therapist's name using the mapped therapist data
