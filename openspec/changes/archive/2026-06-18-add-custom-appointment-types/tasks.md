## 1. Types & Schemas

- [x] 1.1 Transform `VALID_APPOINTMENT_TYPES` in `shared/types/base.types.ts` from `string[]` to array of `{ code, title, isDefault }` with uppercase codes and French titles. Remove `appointmentTypeSchema` (z.enum), replace with `appointmentTypeCodeSchema = z.string()` for dynamic validation. Export type `AppointmentTypeSeedItem`.
- [x] 1.2 Add `orgAppointmentTypeItemSchema` and `orgAppointmentTypesSchema` to `shared/types/org.types.ts`: `{ id: z.string().uuid(), code: z.string().regex(/^[A-Z][A-Z0-9_]*$/), title: z.string().min(1), isDefault: z.boolean().default(false) }`. Export `OrgAppointmentTypeItem` type.
- [x] 1.3 Add `appointmentTypes` field to `organizationResponseSchema`, `organizationInsertSchema` (and by extension `updateOrganizationSchema`) in `shared/types/org.types.ts` — typed as `orgAppointmentTypesSchema.nullable().optional()`.
- [x] 1.4 Change `type` field in `appointmentCreateSchemaShape` and `appointmentQuerySchema` from `appointmentTypeSchema.optional()` to `z.string().optional()` in `shared/types/appointment.type.ts`.
- [x] 1.5 Remove `AppointmentType` type export from `base.types.ts` (or keep as `string` alias for backward compat in imports).

## 2. Database Schema

- [x] 2.1 Add `appointmentTypes: text({ mode: 'json' }).$type<OrgAppointmentTypeItem[]>()` column to `organizations` table in `server/database/schema/organization.ts`. Import `OrgAppointmentTypeItem` type.
- [x] 2.2 Change `appointments.type` from `text({ enum: VALID_APPOINTMENT_TYPES })` to `text()` in `server/database/schema/appointment.ts`. Remove `VALID_APPOINTMENT_TYPES` import if no longer used there.
- [x] 2.3 Generate Drizzle migration via `pnpm db:gen` and flatten.

## 3. Shared Constants & Helpers

- [x] 3.1 Delete `APPOINTMENT_TYPES_CONFIG`, `APPOINTMENT_TYPES_OPTIONS`, `getAppointmentTypeLabel`, `getAppointmentTypeIcon` from `shared/utils/constants.appointment.ts`.
- [x] 3.2 Add `DEFAULT_APPOINTMENT_TYPES_SEED` function to `shared/utils/constants.appointment.ts` — maps `VALID_APPOINTMENT_TYPES` entries to `OrgAppointmentTypeItem[]` with fresh `uuidv7()` ids.
- [x] 3.3 Add `getAppointmentTypeTitle(code: string | null, orgTypes?: OrgAppointmentTypeItem[]): string` to `shared/utils/constants.appointment.ts` — resolves from org types, falls back to `VALID_APPOINTMENT_TYPES` by code (case-insensitive), then raw code.
- [x] 3.4 Add `APPOINTMENT_TYPES_OPTIONS` derived from `VALID_APPOINTMENT_TYPES` (for fallback usage without org context): `{ label: title, value: code }[]`.

## 4. Org Creation & Update API

- [x] 4.1 Update `server/api/organizations/index.post.ts` — seed `appointmentTypes: DEFAULT_APPOINTMENT_TYPES_SEED()` on org creation.
- [x] 4.2 Add `validateAppointmentTypes(types: OrgAppointmentTypeItem[], existingTypes: OrgAppointmentTypeItem[] | null)` to `server/api/organizations/[id].put.ts` — validate unique codes (case-insensitive), prevent deletion of `isDefault: true` items, validate code format.
- [x] 4.3 Call `validateAppointmentTypes` in the PUT handler when `updateData.appointmentTypes` is present.

## 5. Appointment Creation Validation

- [x] 5.1 Update `server/api/appointments/index.post.ts` — after org context is loaded, validate `body.type` (if provided) against the org's `appointmentTypes` codes. Fall back to `VALID_APPOINTMENT_TYPES` codes if org types are null. Return 400 if invalid.

## 6. Frontend — Composable

- [x] 6.1 Create `app/composables/useAppointmentTypes.ts` — uses `useOrganization()` to get active org's `appointmentTypes`, exposes `orgTypes` computed and `resolveTitle(code)` function. Falls back to `VALID_APPOINTMENT_TYPES`.

## 7. Frontend — Settings Page

- [x] 7.1 Add `appointment-types: 'Types de rendez-vous'` entry to `tabLabelMap` in `app/pages/organizations/[id].vue`.
- [x] 7.2 Create `app/pages/organizations/[id]/appointment-types.vue` — follow `pricing.vue` pattern: list types in a table/cards, add form (code + title), edit inline, delete button disabled for `isDefault`. Code field auto-transforms to uppercase with underscores on input. Save via `useUpdateOrganization()` with `{ appointmentTypes: [...] }`.

## 8. Frontend — Update Components (Label Resolution)

- [x] 8.1 Update `app/components/appointment/AppointmentCard.vue` — replace `getAppointmentTypeLabel()` call with `useAppointmentTypes().resolveTitle()`.
- [x] 8.2 Update `app/components/appointment/PlanningSlideover.vue` — replace `getAppointmentTypeLabel()` with composable resolver.
- [x] 8.3 Update `app/components/appointment/Management.vue` — replace label resolution.
- [x] 8.4 Update `app/components/payment/BillingSessionCard.vue` — replace label resolution.
- [x] 8.5 Update `app/components/patient/overview-tab/ActivePlan.vue` — replace label resolution.
- [x] 8.6 Update `app/components/patient/overview-tab/NextAppointment.vue` — replace label resolution.
- [x] 8.7 Update `app/components/treatment-session/TreatmentSessionSlideover.vue` — replace label resolution.
- [x] 8.8 Update `app/pages/patients/[id]/seances.vue` — replace label resolution.
- [x] 8.9 Remove all `getAppointmentTypeIcon` imports/calls across components — replace with static icon (e.g. `i-hugeicons-calendar-03`) or remove if not needed.

## 9. Seed

- [x] 9.1 Update `server/api/db/seed.post.ts` — in `createOrganization()`, add `appointmentTypes: DEFAULT_APPOINTMENT_TYPES_SEED()` to the org insert payload (for both Clinic A and B).
- [x] 9.2 Update `server/api/db/seed.post.ts` — in `generateAppointments()`, replace `randomItem(VALID_APPOINTMENT_TYPES)` with `randomItem(orgAppointmentTypeCodes)` where codes are read from the org's configured types (both occurrences: line ~1861 and ~2024).
- [x] 9.3 Update imports in seed file — remove `VALID_APPOINTMENT_TYPES` import if no longer used directly for type codes, add `DEFAULT_APPOINTMENT_TYPES_SEED` import.

## 10. Lint, Typecheck & Test

- [x] 10.1 Run `pnpm lint:fix` to auto-fix formatting and unused imports.
- [x] 10.2 Run `pnpm typecheck` — fix any type errors.
- [x] 10.3 Run `pnpm test` — fix any regressions.
- [x] 10.4 Run `pnpm db:gen` to generate the migration, verify it looks correct.
