## MODIFIED Requirements

### Requirement: Seed creates appointment types for each organization
The seed endpoint SHALL create `appointmentTypes` for each seeded organization using `VALID_APPOINTMENT_TYPES` as the source, generating fresh uuid v7 ids.

#### Scenario: Seed organization with appointment types
- **WHEN** the seed creates an organization (Kine Clinic A or B)
- **THEN** the organization record SHALL include `appointmentTypes` populated from `VALID_APPOINTMENT_TYPES` with fresh uuid v7 ids and `isDefault: true`

### Requirement: Seed uses org appointment types for appointments
The seed SHALL use the organization's configured appointment type codes (rather than the global `VALID_APPOINTMENT_TYPES` array) when generating random appointment types.

#### Scenario: Appointments seeded with org type codes
- **WHEN** the seed generates appointments for a patient
- **THEN** the `type` field SHALL be a random code from the organization's `appointmentTypes` array
- **THEN** the code SHALL be uppercase (e.g. `'FOLLOW_UP'` not `'follow_up'`)
