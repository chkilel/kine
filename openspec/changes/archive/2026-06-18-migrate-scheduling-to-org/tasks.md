## 1. Database Schema & Types

- [x] 1.1 Add `defaultAppointmentDuration`, `appointmentGapMinutes`, `slotIncrementMinutes` to `orgSchedulingSchema` in `shared/types/org.types.ts` with proper Zod validation and defaults
- [x] 1.2 Remove `defaultAppointmentDuration`, `appointmentGapMinutes`, `slotIncrementMinutes` columns from `users` table in `server/database/schema/auth.ts`
- [x] 1.3 Generate Drizzle migration (`pnpm db:gen`) to drop columns from `users`
- [x] 1.4 Remove `sessionDurationSchema`, `appointmentGapMinutesSchema`, `slotIncrementMinutesSchema` from `shared/types/auth.types.ts`
- [x] 1.5 Remove the 3 fields from `signUpSchema` and `userUpdateSchema` in `shared/types/auth.types.ts`
- [x] 1.6 Remove `AppointmentGapMinutes` and `SlotIncrementMinutes` type exports from `shared/types/auth.types.ts`
- [x] 1.7 Remove the 3 fields from Better Auth `additionalFields` in `server/utils/auth.ts`

## 2. API Routes

- [x] 2.1 Update `server/api/availability/therapists/[therapistId]/slots.post.ts` to read `appointmentGapMinutes` and `slotIncrementMinutes` from organization via `members` join instead of user profile
- [x] 2.2 Update `server/api/availability/rooms/[roomId]/slots.post.ts` to read `appointmentGapMinutes` and `slotIncrementMinutes` from organization via `members` join instead of user profile
- [x] 2.3 Add a data migration SQL step in the migration to copy existing user values into `organizations.scheduling` JSON for users who are org members (before dropping columns)

## 3. Frontend — Organization Clinical Page

- [x] 3.1 Add a "Planification" `AppCard` section in `app/pages/organizations/[id]/clinical.vue` with the 3 scheduling fields (defaultAppointmentDuration, appointmentGapMinutes, slotIncrementMinutes)
- [x] 3.2 Use the same button-group UI pattern from `ProfileTab.vue` (duration picker, gap picker, increment picker) with `APPOINTMENT_DURATIONS`, `APPOINTMENT_GAP_OPTIONS`, `APPOINTMENT_SLOT_INCREMENT_OPTIONS` constants
- [x] 3.3 Update the clinical page form schema (`orgClinicalIntakeNotificationsSchema` or a new schema) to include `scheduling` field for validation
- [x] 3.4 Update the clinical page `defaultForm()` to initialize `scheduling` fields from `org?.scheduling`

## 4. Frontend — Remove from Therapist Profile

- [x] 4.1 Remove the 3 scheduling fields (defaultAppointmentDuration, appointmentGapMinutes, slotIncrementMinutes) from `app/components/therapist/ProfileTab.vue` (form state, template UI sections, and update payload)
- [x] 4.2 Remove unused imports (`APPOINTMENT_GAP_OPTIONS`, constants) from `ProfileTab.vue`

## 5. Frontend — PlanningSlideover

- [x] 5.1 Update `app/components/appointment/PlanningSlideover.vue` to read `defaultAppointmentDuration` from the active organization's `scheduling.defaultAppointmentDuration` instead of `therapist.defaultAppointmentDuration`

## 6. Frontend — Registration

- [x] 6.1 Remove `defaultAppointmentDuration: 0` from `app/pages/(auth)/register.vue` signup payload

## 7. Seed & Tests

- [x] 7.1 Update `server/api/db/seed.post.ts` to remove references to user-level `slotIncrementMinutes` and add scheduling defaults to organization seed data
- [x] 7.2 Verify `planning-utils.spec.ts` still passes (tests pass `slotIncrementMinutes` as parameter, not from user — should be unaffected)
- [x] 7.3 Run `pnpm lint`, `pnpm typecheck`, `pnpm test` to verify everything compiles and passes
