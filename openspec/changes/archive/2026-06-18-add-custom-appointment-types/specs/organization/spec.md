## MODIFIED Requirements

### Requirement: Organization appointment types column
The `organizations` table SHALL include a new JSON column `appointmentTypes` typed as `text({ mode: 'json' }).$type<OrgAppointmentType[]>()` (nullable).

#### Scenario: New column added
- **WHEN** the database schema is updated
- **THEN** the `organizations` table SHALL have an `appointmentTypes` column of type `text` with JSON mode
- **THEN** the TypeScript type SHALL be `OrgAppointmentType[] | null`

### Requirement: Organization response and update schemas
The `organizationResponseSchema` and `organizationInsertSchema` SHALL include the `appointmentTypes` field.

#### Scenario: Organization response includes appointment types
- **WHEN** the API returns an organization object
- **THEN** the response SHALL include `appointmentTypes: OrgAppointmentTypeItem[] | null`

#### Scenario: Organization update with appointment types
- **WHEN** an admin updates the organization with a new `appointmentTypes` array
- **THEN** the `updateOrganizationSchema` SHALL validate the array against `orgAppointmentTypeItemSchema`
- **THEN** the API SHALL persist the updated array in the JSON column
