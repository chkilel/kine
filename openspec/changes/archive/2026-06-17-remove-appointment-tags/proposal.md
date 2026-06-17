## Why

The `tags` field on the appointments table is unused in the frontend (the `useUpdateAppointmentTags` composable is exported but never consumed by any component) and adds dead weight across the schema, API, types, and specs. Removing it simplifies the data model, eliminates an unused API endpoint, and keeps the codebase aligned with the actual product surface.

## What Changes

- **BREAKING**: Remove the `tags` column from the `appointments` table (Drizzle schema); no migration generated (dev phase)
- Delete the `PATCH /api/appointments/[id]/tags` endpoint and its route handler file
- Remove `tags: null` from the cancel-appointment handler's reset payload
- Remove the `updateTagsActionSchema` Zod schema and `UpdateTagsAction` type from shared types
- Remove the `_useUpdateAppointmentTags` composable and its `useUpdateAppointmentTags` export
- Remove the `consultation-smart-tags` capability (entire spec is about the tags feature)
- Update the `unified-appointment-session` spec to remove tags-related requirements and the column reference

## Capabilities

### New Capabilities
<!-- None - this change is a removal only -->

### Modified Capabilities
- `unified-appointment-session`: Remove the requirement for the tags update endpoint and remove `tags` from the documented appointment columns list
- `consultation-smart-tags`: Remove this capability entirely (all requirements relate to the tags field being deleted)

## Impact

**Code:**
- `server/database/schema/appointment.ts` - remove `tags` column
- `server/api/appointments/[id]/tags.patch.ts` - delete file
- `server/api/appointments/[id]/cancel.post.ts` - remove `tags: null` from update set
- `shared/types/appointment.type.ts` - remove `updateTagsActionSchema` and `UpdateTagsAction`
- `app/composables/useAppointment.ts` - remove `_useUpdateAppointmentTags` and `useUpdateAppointmentTags` export

**Specs:**
- `openspec/specs/unified-appointment-session/spec.md` - remove tags requirements
- `openspec/specs/consultation-smart-tags/spec.md` - remove capability

**Data:**
- **BREAKING**: The `tags` column and its data will be removed from the schema. No migration is generated (dev phase); the database will be re-seeded/re-synced locally. Any existing tag data is lost, which is acceptable since the field is not surfaced in the UI.

**Tenant boundaries:** No change - the column is removed uniformly across all organizations.

**Compliance:** No patient-data compliance implications (tags stored clinical observations as strings; removal aligns with reducing stored PII surface).
