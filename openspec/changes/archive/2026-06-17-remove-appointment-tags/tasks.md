## 1. Schema

- [x] 1.1 Remove the `tags: text()` line from `server/database/schema/appointment.ts`

## 2. API Cleanup

- [x] 2.1 Delete the file `server/api/appointments/[id]/tags.patch.ts` entirely
- [x] 2.2 Remove the `tags: null` line from the `.set({...})` payload in `server/api/appointments/[id]/cancel.post.ts`

## 3. Shared Types Cleanup

- [x] 3.1 Remove the `updateTagsActionSchema` Zod schema block from `shared/types/appointment.type.ts`
- [x] 3.2 Remove the `UpdateTagsAction` type export from `shared/types/appointment.type.ts`

## 4. Frontend Composable Cleanup

- [x] 4.1 Remove the `_useUpdateAppointmentTags` function block from `app/composables/useAppointment.ts`
- [x] 4.2 Remove the `export const useUpdateAppointmentTags = createSharedComposable(_useUpdateAppointmentTags)` line from `app/composables/useAppointment.ts`

## 5. Verification

- [x] 5.1 Run `pnpm typecheck` and confirm no dangling type references to `tags`, `UpdateTagsAction`, or `updateTagsActionSchema`
- [x] 5.2 Run `pnpm lint` and fix any reported issues
- [x] 5.3 Run `pnpm test` and confirm no regressions
- [x] 5.4 Grep the codebase for residual `tags` references in appointment-related paths and confirm none remain (excluding unrelated `striptags`/Cloudflare typings)
