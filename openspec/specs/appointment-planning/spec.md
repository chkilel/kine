# appointment-planning Specification

## Purpose
TBD

## Requirements

### Requirement: Appointments type column
The `appointments.type` column SHALL change from `text({ enum: VALID_APPOINTMENT_TYPES })` to plain `text()`. Type validation SHALL happen at the application level against the organization's configured types.

#### Scenario: Type column without DB enum
- **WHEN** the database schema is updated
- **THEN** the `appointments.type` column SHALL be `text()` (nullable, no enum constraint)

### Requirement: Appointment type field validation
The `appointmentCreateSchema` and `appointmentQuerySchema` SHALL validate the `type` field as `z.string().optional()` instead of `appointmentTypeSchema.optional()` (enum).

#### Scenario: Create appointment with any string type
- **WHEN** a client sends a create appointment request with `type: 'ACUPUNCTURE'`
- **THEN** the Zod schema SHALL accept any string value
- **THEN** the server SHALL additionally validate the code against the org's configured types

### Requirement: Appointment type label resolution in UI
All components that display appointment type labels SHALL resolve titles dynamically using `getAppointmentTypeTitle(code, orgTypes?)` instead of the deleted `getAppointmentTypeLabel()`.

#### Scenario: AppointmentCard displays type title
- **WHEN** an AppointmentCard renders an appointment
- **THEN** the type title SHALL be resolved via the org's appointment types with fallback to defaults

#### Scenario: Components no longer use getAppointmentTypeIcon
- **WHEN** any component needs an icon for an appointment type
- **THEN** a static icon (e.g. `i-hugeicons-calendar-03`) SHALL be used
- **THEN** `getAppointmentTypeIcon` SHALL NOT exist
