## REMOVED Requirements

### Requirement: Store Smart Tags as JSON Array

**Reason**: The `tags` column is being removed from the appointments table. Smart tags are no longer a supported feature.

**Migration**: No data migration. The `tags` column is dropped from the database. Any previously stored tag arrays are discarded.

### Requirement: Auto-Save Tags on Toggle

**Reason**: With the tags column removed, there is no persistence target for tag toggles. The `PATCH /api/appointments/[id]/tags` endpoint is deleted.

**Migration**: The `useUpdateAppointmentTags` composable is removed from the frontend. No UI component consumed it, so no UI changes are required.

### Requirement: Display Tags with Visual Selection State

**Reason**: The smart tags UI was never implemented in any Vue component. The backing data model and API are being removed, so this requirement has no implementation to retire beyond the spec.

**Migration**: None - no UI code exists to remove.

### Requirement: Load Tags from Database on Session Start

**Reason**: The `tags` field no longer exists on the appointment record, so there is nothing to load on session start.

**Migration**: None - no UI code consumed the tags field on mount.

### Requirement: Persist Tags on Session Completion

**Reason**: Tags are no longer part of the appointment data model, so there is nothing to persist on session completion.

**Migration**: None - the session completion flow does not reference tags.
