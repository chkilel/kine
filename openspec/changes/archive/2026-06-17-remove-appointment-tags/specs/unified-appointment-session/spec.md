## REMOVED Requirements

### Requirement: Tags on Appointment

**Reason**: The `tags` column and its dedicated update endpoint are being removed from the appointments data model. The feature was never surfaced in the UI and the composable is unused.

**Migration**: No migration path required. The `PATCH /api/appointments/[id]/tags` endpoint is deleted. Any client still calling it will receive a 404. The `useUpdateAppointmentTags` composable is removed from the frontend.

## MODIFIED Requirements

### Requirement: Merged Database Schema

The system SHALL store all scheduling, clinical, timer, billing, and locking data in a single `appointments` table. No `treatment_sessions` table exists. The `appointments` table SHALL include a nullable `price_item` JSON column for pricing code snapshots.

#### Scenario: Appointments table includes clinical columns

- **GIVEN** the database schema is migrated
- **WHEN** the appointments table is inspected
- **THEN** it contains columns: primaryConcern, treatmentSummary, observations, nextSteps, painLevelBefore, painLevelAfter, actualStartTime, actualDurationSeconds, totalPausedSeconds, pauseStartTime, extendedDurationMinutes, priceCents, isLocked, lockedAt, lockedById, cancelledAt, cancellationReason
- **AND** it does NOT contain a `tags` column

#### Scenario: Appointments table includes pricing code column

- **GIVEN** the database schema is migrated
- **WHEN** the appointments table is inspected
- **THEN** it contains a `price_item` column of type TEXT (JSON) that is nullable
- **AND** the column stores pricing code snapshots with shape: { code: string, description: string, rateCent: { clinic: number, home: number, telehealth: number } }
