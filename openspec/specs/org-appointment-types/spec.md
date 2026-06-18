# org-appointment-types Specification

## Purpose
TBD

## Requirements

### Requirement: Organization appointment types storage
The organization SHALL store its appointment types in a JSON column `appointmentTypes` on the `organizations` table. Each type item SHALL conform to the following shape:

```ts
interface OrgAppointmentTypeItem {
  id: string         // uuid v7
  code: string       // UPPER_SNAKE_CASE (e.g. 'FOLLOW_UP', 'BILAN_VENTILATOIRE')
  title: string      // human-readable label (e.g. 'Suivi')
  isDefault: boolean // true for seeded defaults (non-deletable)
}
```

#### Scenario: Default types seeded on org creation
- **WHEN** a new organization is created via onboarding
- **THEN** the system SHALL insert all entries from `VALID_APPOINTMENT_TYPES` into `appointmentTypes` with a fresh `id` (uuid v7) and `isDefault: true`

#### Scenario: Organization with null appointmentTypes
- **WHEN** an organization has a null `appointmentTypes` column (legacy or pre-migration)
- **THEN** the system SHALL fall back to `VALID_APPOINTMENT_TYPES` codes for validation and label resolution

---

### Requirement: Appointment type code format
All appointment type codes SHALL follow the `UPPER_SNAKE_CASE` format: uppercase letters, digits, and underscores only, starting with a letter.

#### Scenario: Valid code
- **WHEN** a type is created with code `'CONSULTATION_URGENTE'`
- **THEN** the system SHALL accept it

#### Scenario: Invalid code rejected
- **WHEN** a type is created with code `'consultation'` (lowercase) or `'Consultation Urgente'` (spaces)
- **THEN** the Zod validation SHALL reject it

---

### Requirement: Default type protection
Types with `isDefault: true` SHALL be editable (title only) but SHALL NOT be deletable.

#### Scenario: Edit default type title
- **WHEN** an admin edits the title of a default type
- **THEN** the system SHALL persist the new title and keep `isDefault: true`

#### Scenario: Delete default type rejected
- **WHEN** an admin attempts to delete a type with `isDefault: true`
- **THEN** the UI SHALL disable the delete button
- **THEN** the API SHALL reject the update if a default type is missing from the payload

---

### Requirement: Unique codes within an organization
All appointment type codes within a single organization SHALL be unique (case-insensitive).

#### Scenario: Duplicate code rejected
- **WHEN** an admin adds a type with a code that already exists in the organization
- **THEN** the API SHALL return a 400 error with message 'Les codes doivent être uniques'

---

### Requirement: Appointment types validation on appointment creation
The appointment creation endpoint SHALL validate the `type` field against the organization's configured `appointmentTypes`.

#### Scenario: Valid type code
- **WHEN** an appointment is created with `type: 'FOLLOW_UP'` and the org has that code
- **THEN** the system SHALL accept the appointment

#### Scenario: Invalid type code
- **WHEN** an appointment is created with `type: 'UNKNOWN_TYPE'` not in the org's types
- **THEN** the system SHALL return a 400 error

#### Scenario: No type provided
- **WHEN** an appointment is created without a `type` field
- **THEN** the system SHALL accept it (type is optional)

---

### Requirement: Appointment types settings page
The organization settings SHALL include a page at `/organizations/[id]/appointment-types` to manage appointment types.

#### Scenario: Admin views appointment types
- **WHEN** an admin navigates to the appointment types settings page
- **THEN** the page SHALL list all types with their code, title, and a delete button (disabled for defaults)

#### Scenario: Admin adds a custom type
- **WHEN** an admin fills the code and title fields and clicks add
- **THEN** the system SHALL create a new type with a fresh uuid v7 `id` and `isDefault: false`
- **THEN** the new type SHALL appear in the list

#### Scenario: Admin edits a type title
- **WHEN** an admin edits the title of an existing type and saves
- **THEN** the system SHALL update the title and persist via `PUT /api/organizations/[id]`

#### Scenario: Admin deletes a custom type
- **WHEN** an admin clicks delete on a non-default type
- **THEN** the system SHALL remove the type from the list and persist the change

---

### Requirement: Appointment type title resolution
The system SHALL resolve appointment type titles dynamically from the organization's configured types, with fallback to default seed data.

#### Scenario: Title from org types
- **WHEN** a component displays an appointment with `type: 'ACUPUNCTURE'` and the org has that type
- **THEN** the resolved title SHALL be the org type's `title` field

#### Scenario: Title fallback to defaults
- **WHEN** a component displays an appointment with `type: 'FOLLOW_UP'` and the org has no `appointmentTypes` configured
- **THEN** the resolved title SHALL come from `VALID_APPOINTMENT_TYPES` by code

#### Scenario: Title fallback to raw code
- **WHEN** a component displays an appointment with a type code not found in org types or defaults
- **THEN** the resolved title SHALL be the raw code string