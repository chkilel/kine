## MODIFIED Requirements

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
