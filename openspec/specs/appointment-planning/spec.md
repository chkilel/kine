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

### Requirement: Slot generation uses organization scheduling config
The availability slot generation endpoints (`availability/therapists/[therapistId]/slots.post.ts` and `availability/rooms/[roomId]/slots.post.ts`) SHALL read `appointmentGapMinutes` and `slotIncrementMinutes` from the therapist's organization `scheduling` JSON field.

#### Scenario: Therapist slot generation with org config
- **WHEN** the system generates slots for a therapist
- **THEN** it SHALL query the `members` table to find the therapist's organization
- **THEN** it SHALL read `appointmentGapMinutes` and `slotIncrementMinutes` from `organizations.scheduling`
- **THEN** it SHALL pass these values to `generateTimeSlots()`

#### Scenario: Fallback when no org scheduling config
- **WHEN** a therapist has no organization or the organization has no scheduling config
- **THEN** the system SHALL use fallback defaults: `appointmentGapMinutes: 5`, `slotIncrementMinutes: 15`

### Requirement: PlanningSlideover default duration from organization
The `PlanningSlideover.vue` SHALL read `defaultAppointmentDuration` from the active organization's `scheduling.defaultAppointmentDuration`.

#### Scenario: Default appointment duration
- **WHEN** a therapist creates a new appointment via the planning slideover
- **THEN** the form SHALL pre-fill with `scheduling.defaultAppointmentDuration` from the active organization
- **THEN** if no value exists, the default SHALL be 30 minutes
