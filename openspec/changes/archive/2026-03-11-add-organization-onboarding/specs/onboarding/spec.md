# Onboarding Specification

## Purpose

First-time organization setup for users who register or login without an existing organization membership.

## ADDED Requirements

### Requirement: Redirect to Onboarding When No Organization Exists

The system SHALL redirect authenticated users without any organization memberships to the onboarding page.

#### Scenario: User logs in with no organization

- **GIVEN** a user exists with no organization memberships
- **AND** the user attempts to access any protected route (e.g., `/`, `/patients`)
- **WHEN** the auth middleware checks for organization membership
- **THEN** the user is redirected to `/onboarding`

#### Scenario: User registers new account

- **GIVEN** a user completes registration
- **AND** the user has no organization memberships
- **WHEN** the user is redirected to the default route
- **THEN** the auth middleware redirects them to `/onboarding`

#### Scenario: User with organization bypasses onboarding

- **GIVEN** a user is logged in
- **AND** the user has at least one organization membership
- **WHEN** the user attempts to access any protected route
- **THEN** the user is NOT redirected to `/onboarding`
- **AND** the user accesses the requested route normally

#### Scenario: User directly accesses onboarding page

- **GIVEN** a user is logged in with no organization
- **WHEN** the user navigates to `/onboarding`
- **THEN** the onboarding page is displayed
- **AND** no redirect loop occurs

### Requirement: Collect Minimal Organization Information

The system SHALL collect only the mandatory fields required to create an organization and enable core application features.

#### Scenario: Display onboarding form with required fields

- **GIVEN** a user is on the `/onboarding` page
- **WHEN** the page loads
- **THEN** the form displays fields for:
  - Organization name (required, min 5 chars)
  - Slug (required, auto-generated from name, editable)
  - Contact email (required, valid email format)
  - Contact phone (required, at least one phone number)
  - Address street (required)
  - Address postal code (required)
  - Address city (required)
  - Session rate - cabinet (required, default suggested value)
  - Session rate - domicile (required, default suggested value)
  - Session rate - téléconsultation (required, default suggested value)

#### Scenario: Auto-generate slug from organization name

- **GIVEN** a user is entering the organization name
- **WHEN** the user types "Cabinet Kine Paris"
- **THEN** the slug field automatically populates with "cabinet-kine-paris"
- **AND** the slug is displayed in real-time as the user types
- **AND** the user can manually edit the generated slug

#### Scenario: Provide default session rates

- **GIVEN** a user is viewing the session rates section
- **WHEN** the onboarding page loads
- **THEN** default values are pre-filled:
  - Cabinet: 500 (50 Dh)
  - Domicile: 650 (65 Dh)
  - Téléconsultation: 400 (40 Dh)
- **AND** the user can modify these values before submission

### Requirement: Validate Onboarding Form Data

The system SHALL validate all required fields before allowing organization creation.

#### Scenario: Validate organization name

- **GIVEN** a user is on the onboarding page
- **WHEN** the user enters an organization name with fewer than 5 characters
- **THEN** an error message is displayed: "Le nom doit avoir au moins 5 caractères"
- **AND** the submit button is disabled

#### Scenario: Validate slug format

- **GIVEN** a user is editing the slug manually
- **WHEN** the user enters "Invalid Slug!" (with spaces and special characters)
- **THEN** an error message is displayed: "Slug invalide (seulement lettres minuscules, chiffres et tirets)"
- **AND** the form cannot be submitted

#### Scenario: Validate contact email

- **GIVEN** a user is entering contact information
- **WHEN** the user enters an invalid email address
- **THEN** an error message is displayed: "Adresse email invalide"
- **AND** the form cannot be submitted

#### Scenario: Validate phone number requirement

- **GIVEN** a user is entering contact information
- **WHEN** the user does not provide any phone number
- **THEN** an error message is displayed: "Au moins un numéro de téléphone requis"
- **AND** the form cannot be submitted

#### Scenario: Validate address fields

- **GIVEN** a user is entering address information
- **WHEN** the user leaves the street field empty
- **THEN** an error message is displayed: "Adresse requise"
- **AND** the form cannot be submitted

#### Scenario: Validate session rates

- **GIVEN** a user is entering session rates
- **WHEN** the user enters a negative value for cabinet rate
- **THEN** an error message is displayed: "Price cannot be negative"
- **AND** the form cannot be submitted

### Requirement: Create Organization on Form Submission

The system SHALL create the organization and establish membership when the user submits valid onboarding data.

#### Scenario: Successful organization creation

- **GIVEN** a user has filled all required fields with valid data
- **WHEN** the user submits the onboarding form
- **THEN** the organization is created via Better Auth organization plugin
- **AND** the user becomes a member of the organization
- **AND** the organization is set as the active organization
- **AND** the user is redirected to the dashboard (`/`)
- **AND** a success message is displayed

#### Scenario: Handle slug collision error

- **GIVEN** a user submits an onboarding form with a slug that already exists
- **WHEN** the organization creation fails due to slug collision
- **THEN** an error message is displayed indicating the slug is already taken
- **AND** the user remains on the onboarding page
- **AND** the form data is preserved
- **AND** the user can modify the slug and resubmit

#### Scenario: Display loading state during submission

- **GIVEN** a user submits the onboarding form
- **WHEN** the organization creation is in progress
- **THEN** the submit button shows a loading indicator
- **AND** the form fields are disabled
- **AND** the user cannot modify data during submission

### Requirement: Prevent Bypassing Onboarding

The system SHALL prevent users from accessing application features without creating an organization.

#### Scenario: User attempts to access patients page without organization

- **GIVEN** a user is logged in with no organization
- **WHEN** the user navigates to `/patients`
- **THEN** the auth middleware redirects them to `/onboarding`
- **AND** the patients page is not displayed

#### Scenario: User attempts to access settings page without organization

- **GIVEN** a user is logged in with no organization
- **WHEN** the user navigates to `/settings`
- **THEN** the auth middleware redirects them to `/onboarding`
- **AND** the settings page is not displayed

#### Scenario: User attempts API call without organization

- **GIVEN** a user is logged in with no organization
- **WHEN** the user attempts to call a protected API endpoint
- **THEN** the API returns a 403 Forbidden error
- **AND** the error message states: "Aucune organisation active"
