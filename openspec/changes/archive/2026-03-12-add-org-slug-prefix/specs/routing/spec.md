## ADDED Requirements

### Requirement: Organization Slug Route Prefix

The system SHALL prefix all dashboard routes with the organization slug parameter to provide explicit organization context in URLs.

#### Scenario: Dashboard home route includes org slug

- **GIVEN** a user is logged in
- **AND** the user has active organization with slug "kine-clinic-a"
- **WHEN** the user accesses the home page
- **THEN** the URL is `http://localhost:3000/kine-clinic-a`
- **AND** the page renders correctly

#### Scenario: Patients route includes org slug

- **GIVEN** a user is logged in
- **AND** the user has active organization with slug "kine-clinic-a"
- **WHEN** the user accesses the patients list
- **THEN** the URL is `http://localhost:3000/kine-clinic-a/patients`
- **AND** the patients page renders correctly

#### Scenario: Patient detail route includes org slug

- **GIVEN** a user is logged in
- **AND** the user has active organization with slug "kine-clinic-a"
- **AND** a patient exists with id "patient-123"
- **WHEN** the user accesses the patient detail page
- **THEN** the URL is `http://localhost:3000/kine-clinic-a/patients/patient-123`
- **AND** the patient detail page renders correctly

#### Scenario: Settings routes include org slug

- **GIVEN** a user is logged in
- **AND** the user has active organization with slug "kine-clinic-a"
- **WHEN** the user accesses any settings page
- **THEN** the URL is prefixed with the org slug (e.g., `http://localhost:3000/kine-clinic-a/settings`)
- **AND** the settings page renders correctly

#### Scenario: Inbox route includes org slug

- **GIVEN** a user is logged in
- **AND** the user has active organization with slug "kine-clinic-a"
- **WHEN** the user accesses the inbox
- **THEN** the URL is `http://localhost:3000/kine-clinic-a/inbox`
- **AND** the inbox page renders correctly

#### Scenario: Therapist schedule route includes org slug

- **GIVEN** a user is logged in
- **AND** the user has active organization with slug "kine-clinic-a"
- **WHEN** the user accesses the daily schedule
- **THEN** the URL is `http://localhost:3000/kine-clinic-a/therapists/day`
- **AND** the schedule page renders correctly

### Requirement: Organization Slug Validation

The system SHALL validate that the organization slug in the URL matches the user's active organization slug from the session.

#### Scenario: Valid slug allows access

- **GIVEN** a user is logged in
- **AND** the user has active organization with slug "kine-clinic-a"
- **WHEN** the user accesses `http://localhost:3000/kine-clinic-a/patients`
- **THEN** access is granted
- **AND** the patients page loads successfully

#### Scenario: Invalid slug redirects to correct org

- **GIVEN** a user is logged in
- **AND** the user has active organization with slug "kine-clinic-a"
- **WHEN** the user attempts to access `http://localhost:3000/kine-clinic-b/patients`
- **THEN** the user is redirected to `http://localhost:3000/kine-clinic-a/patients`
- **AND** no data from "kine-clinic-b" is displayed

#### Scenario: Missing slug when authenticated redirects to onboarding

- **GIVEN** a user is logged in
- **AND** the user has no active organization set
- **WHEN** the user attempts to access any dashboard route
- **THEN** the user is redirected to `/onboarding`
- **AND** no dashboard content is displayed

### Requirement: Global Routes Without Org Slug

The system SHALL NOT require organization slug for authentication and organization selection routes.

#### Scenario: Auth routes work without org slug

- **GIVEN** a user is not logged in
- **WHEN** the user accesses `/login`
- **THEN** the login page is displayed
- **AND** no org slug is required
- **AND** no redirect occurs

#### Scenario: Register route works without org slug

- **GIVEN** a user is not logged in
- **WHEN** the user accesses `/register`
- **THEN** the registration page is displayed
- **AND** no org slug is required
- **AND** no redirect occurs

#### Scenario: Onboarding route works without org slug

- **GIVEN** a user is logged in
- **AND** the user has no active organization
- **WHEN** the user accesses `/onboarding`
- **THEN** the onboarding page is displayed
- **AND** no org slug is required
- **AND** no redirect occurs

#### Scenario: Organizations list works without org slug

- **GIVEN** a user is logged in
- **WHEN** the user accesses `/organizations`
- **THEN** the organizations list is displayed
- **AND** no org slug is required
- **AND** the user can switch organizations

### Requirement: Org Scoped URL Building

The system SHALL provide a composable for generating organization-scoped URLs to simplify navigation updates.

#### Scenario: Generate org-scoped path

- **GIVEN** a user is logged in with active organization slug "kine-clinic-a"
- **WHEN** `orgPath('/patients')` is called
- **THEN** the result is `/kine-clinic-a/patients`

#### Scenario: Navigate to org-scoped path

- **GIVEN** a user is logged in with active organization slug "kine-clinic-a"
- **WHEN** `orgNavigate('/patients')` is called
- **THEN** the user is navigated to `/kine-clinic-a/patients`
- **AND** the browser URL updates

#### Scenario: Generate path with query parameters

- **GIVEN** a user is logged in with active organization slug "kine-clinic-a"
- **WHEN** `orgPath({ path: '/patients', query: { search: 'john' } })` is called
- **THEN** the result is `/kine-clinic-a/patients?search=john`

### Requirement: Navigation Link Updates

The system SHALL update all navigation links in the application to include the organization slug prefix.

#### Scenario: Sidebar navigation uses org slug

- **GIVEN** a user is logged in with active organization slug "kine-clinic-a"
- **WHEN** the user views the sidebar navigation
- **THEN** all dashboard links include the org slug
- **AND** clicking "Patients" navigates to `/kine-clinic-a/patients`
- **AND** clicking "Home" navigates to `/kine-clinic-a`

#### Scenario: Component navigateTo calls use org slug

- **GIVEN** a user is logged in with active organization slug "kine-clinic-a"
- **WHEN** a component calls `navigateTo('/patients/new')`
- **THEN** the navigation includes the org slug
- **AND** the URL becomes `/kine-clinic-a/patients/new`

#### Scenario: Direct links from components use org slug

- **GIVEN** a user is logged in with active organization slug "kine-clinic-a"
- **WHEN** a component has a link with `:to="'/inbox'"` attribute
- **THEN** the rendered link URL includes the org slug
- **AND** clicking the link navigates to `/kine-clinic-a/inbox`
