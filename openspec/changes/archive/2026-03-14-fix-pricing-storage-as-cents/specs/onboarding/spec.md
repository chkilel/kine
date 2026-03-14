## MODIFIED Requirements

### Requirement: Collect Minimal Organization Information

The system SHALL collect only mandatory fields required to create an organization and enable core application features.

#### Scenario: Display onboarding form with required fields

- **GIVEN** a user is on `/onboarding` page
- **WHEN** the page loads
- **THEN** form displays fields for:
  - Organization name (required, min 5 chars)
  - Slug (required, auto-generated from name, editable)
  - Contact email (required, valid email format)
  - Contact phone (required, at least one phone number)
  - Address street (required)
  - Address postal code (required)
  - Address city (required)
  - Session rate - cabinet (required, default suggested value displayed in MAD)
  - Session rate - domicile (required, default suggested value displayed in MAD)
  - Session rate - téléconsultation (required, default suggested value displayed in MAD)

#### Scenario: Auto-generate slug from organization name

- **GIVEN** a user is entering the organization name
- **WHEN** the user types "Cabinet Kine Paris"
- **THEN** the slug field automatically populates with "cabinet-kine-paris"
- **AND** the slug is displayed in real-time as the user types
- **AND** the user can manually edit the generated slug

#### Scenario: Provide default session rates

- **GIVEN** a user is viewing the session rates section
- **WHEN** the onboarding page loads
- **THEN** default values are pre-filled and displayed as currency units:
  - Cabinet: 150 (displayed as 150 MAD, will be stored as 15000 cents)
  - Domicile: 200 (displayed as 200 MAD, will be stored as 20000 cents)
  - Téléconsultation: 120 (displayed as 120 MAD, will be stored as 12000 cents)
- **AND** the user can modify these values before submission
- **AND** all values are displayed with "MAD" or "DH" suffix

## MODIFIED Requirements

### Requirement: Create Organization on Form Submission

The system SHALL create organization and establish membership when the user submits valid onboarding data, converting pricing to cents before storage.

#### Scenario: Successful organization creation with pricing in cents

- **GIVEN** a user has filled all required fields with valid data including:
  - Organization name: "Cabinet Kine Paris"
  - Session rate - cabinet: 150 MAD
  - Session rate - domicile: 200 MAD
  - Session rate - téléconsultation: 120 MAD
- **WHEN** the user submits the onboarding form
- **THEN** the organization is created via Better Auth organization plugin
- **AND** the pricing.sessionRates values are stored as cents:
  - clinic: 15000 (150 MAD × 100)
  - home: 20000 (200 MAD × 100)
  - telehealth: 12000 (120 MAD × 100)
- **AND** the user becomes a member of the organization
- **AND** the organization is set as the active organization
- **AND** the user is redirected to the dashboard (`/`)
- **AND** a success message is displayed

#### Scenario: Handle slug collision error

- **GIVEN** a user submits an onboarding form with a slug that already exists
- **WHEN** the organization creation fails due to slug collision
- **THEN** an error message is displayed indicating the slug is already taken
- **AND** the user remains on the onboarding page
- **AND** the form data is preserved including pricing values
- **AND** the user can modify the slug and resubmit

#### Scenario: Display loading state during submission

- **GIVEN** a user submits the onboarding form
- **WHEN** the organization creation is in progress
- **THEN** the submit button shows a loading indicator
- **AND** the form fields are disabled
- **AND** the user cannot modify data during submission
