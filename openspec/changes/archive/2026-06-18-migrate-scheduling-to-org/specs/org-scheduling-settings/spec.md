## ADDED Requirements

### Requirement: Organization scheduling settings storage
The `OrgScheduling` type SHALL include the following fields with their defaults:
- `defaultAppointmentDuration`: number, min 15, max 180, default 30
- `appointmentGapMinutes`: number, min 0, max 60, default 5
- `slotIncrementMinutes`: number, min 5, max 30, default 15

These fields SHALL be stored in the existing `organizations.scheduling` JSON column.

#### Scenario: Default values when no scheduling config exists
- **WHEN** an organization is created without a `scheduling` value
- **THEN** the system SHALL use defaults: `defaultAppointmentDuration: 30`, `appointmentGapMinutes: 5`, `slotIncrementMinutes: 15`

#### Scenario: Updating scheduling settings
- **WHEN** an admin updates the scheduling settings via the organization API
- **THEN** the system SHALL persist the updated values in the `scheduling` JSON column and validate them against the Zod schema

### Requirement: Organization scheduling settings UI
The organization clinical page (`/organizations/[id]/clinical.vue`) SHALL display a "Planification" section with:
- A duration picker for `defaultAppointmentDuration` (same button group pattern as ProfileTab)
- A gap picker for `appointmentGapMinutes` (same button group pattern)
- A slot increment picker for `slotIncrementMinutes` (same button group pattern)

#### Scenario: Admin views scheduling settings
- **WHEN** an admin navigates to the clinical page of their organization
- **THEN** the page SHALL display the current scheduling settings with the selected values highlighted

#### Scenario: Admin saves scheduling settings
- **WHEN** an admin modifies any scheduling field and clicks save
- **THEN** the system SHALL send a partial update to the organization API with only the `scheduling` object
- **THEN** a success toast SHALL be displayed

### Requirement: Availability API reads from organization
The availability slot generation endpoints SHALL read `appointmentGapMinutes` and `slotIncrementMinutes` from the therapist's active organization's `scheduling` JSON field, not from the user profile.

#### Scenario: Slots generated with org scheduling config
- **WHEN** the system generates available time slots for a therapist
- **THEN** it SHALL join the `members` table to find the therapist's organization
- **THEN** it SHALL read `appointmentGapMinutes` and `slotIncrementMinutes` from `organizations.scheduling`
- **THEN** it SHALL fall back to defaults (5 min gap, 15 min increment) if no scheduling config exists

### Requirement: PlanningSlideover reads default duration from organization
The planning slideover SHALL pre-fill the appointment duration from the active organization's `scheduling.defaultAppointmentDuration` instead of the therapist's profile.

#### Scenario: New appointment defaults to org duration
- **WHEN** a therapist opens the planning slideover to create a new appointment
- **THEN** the default duration SHALL be set to the organization's `scheduling.defaultAppointmentDuration`
- **THEN** if no value exists, it SHALL fall back to 30 minutes

### Requirement: Remove scheduling fields from user profile
The user profile SHALL NOT contain `defaultAppointmentDuration`, `appointmentGapMinutes`, or `slotIncrementMinutes`.

#### Scenario: User profile update
- **WHEN** a user updates their profile
- **THEN** the update payload SHALL NOT include scheduling fields
- **THEN** the `userUpdateSchema` SHALL NOT validate scheduling fields

#### Scenario: User registration
- **WHEN** a new user registers
- **THEN** the signup form SHALL NOT ask for scheduling settings
- **THEN** the `signUpSchema` SHALL NOT include scheduling fields

#### Scenario: Better Auth session
- **WHEN** the auth session is loaded
- **THEN** the user object SHALL NOT contain scheduling fields in `additionalFields`
