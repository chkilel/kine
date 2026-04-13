## 1. Shared Types & Constants

- [x] 1.1 Update `shared/types/base.types.ts` — expand `APPOINTMENT_STATUSES` to `['scheduled', 'confirmed', 'in_progress', 'finished', 'completed', 'cancelled', 'no_show']`, delete `TREATMENT_SESSION_STATUSES` array, `treatmentSessionStatusSchema`, and `TreatmentSessionStatus` type, add `APPOINTMENT_PAYMENT_STATUSES` enum `['unpaid', 'copay_paid', 'partially_paid', 'paid', 'overpaid']`
- [x] 1.2 Delete `shared/types/treatment-session.type.ts` entirely
- [x] 1.3 Update `shared/types/appointment.type.ts` — add action schemas (start, pause, resume, end, cancel, clinical-notes, tags, price, extend) moved from treatment-session.type.ts, add clinical/timer/billing fields to `appointmentSchema`, remove `AppointmentWithSession` type, remove `include: 'treatmentSession'` from query schema, update `TreatmentSessionWithPaymentStatus` → `AppointmentWithPaymentStatus`
- [x] 1.4 Update `shared/utils/constants.treatment-session.ts` — replace with `constants.appointment.ts` containing unified status config (label, color, icon for all 7 statuses including in_progress/finished), delete treatment session status config
- [x] 1.5 Update `shared/types/invoicing.ts` — rename `treatmentSessionId` references to `appointmentId` in payment schemas and types

## 2. Database Schema & Migration

- [x] 2.1 Rewrite `server/database/schema/appointment.ts` — absorb all clinical fields (primaryConcern, treatmentSummary, observations, nextSteps), pain levels (painLevelBefore, painLevelAfter), timer fields (actualStartTime, actualDurationSeconds, totalPausedSeconds, pauseStartTime, extendedDurationMinutes), tags, billing fields (priceCents), locking fields (isLocked, lockedAt, lockedById), cancellation fields (cancellationReason), unified status enum, update indexes
- [x] 2.2 Delete `server/database/schema/treatment-session.ts`
- [x] 2.3 Update `server/database/schema/index.ts` — remove `export * from './treatment-session'`
- [x] 2.4 Update `server/database/schema/payment.ts` — rename `treatmentSessionId` column to `appointmentId` in `paymentSessionItems` table, update index
- [x] 2.5 Update `server/database/relations.ts` — remove import and schema entry for `treatmentSessions`, remove `treatmentSessions` relation block, remove `treatmentSession` relation from `appointments`, add `therapist` and `lockedBy` relations to `appointments`, update `paymentSessionItems` relation from `treatmentSession` to `appointment`
- [x] 2.6 Run `pnpm db:gen` to generate migration SQL
- [x] 2.7 Run `pnpm db:mig` to apply migration locally
- [x] 2.8 Verify migration — run `pnpm typecheck` to confirm Drizzle types are correct

## 3. Server API Routes — Delete Treatment Sessions

- [x] 3.1 Delete entire `server/api/treatment-sessions/` directory (13 files)
- [x] 3.2 Delete `server/utils/treatment-session-validation.ts`

## 4. Server API Routes — Appointment Endpoints

- [x] 4.1 Create `server/api/appointments/[id]/start.post.ts` — transition appointment from scheduled/confirmed to in_progress, set actualStartTime and painLevelBefore (moved from treatment-sessions/[id]/start.post.ts)
- [x] 4.2 Create `server/api/appointments/[id]/pause.post.ts` — set pauseStartTime on appointment (moved from treatment-sessions/[id]/pause.post.ts)
- [x] 4.3 Create `server/api/appointments/[id]/resume.post.ts` — update totalPausedSeconds, clear pauseStartTime (moved from treatment-sessions/[id]/resume.post.ts)
- [x] 4.4 Create `server/api/appointments/[id]/end.post.ts` — transition to finished, calculate actualDurationSeconds, set painLevelAfter (moved from treatment-sessions/[id]/end.post.ts)
- [x] 4.5 Create `server/api/appointments/[id]/cancel.post.ts` — transition to cancelled, set cancelledAt/cancellationReason, clear pause state (moved from treatment-sessions/[id]/cancel.post.ts)
- [x] 4.6 Create `server/api/appointments/[id]/clinical-notes.patch.ts` — update clinical fields with status-gated validation (moved from treatment-sessions/[id]/clinical-notes.patch.ts)
- [x] 4.7 Create `server/api/appointments/[id]/tags.patch.ts` — update tags (moved from treatment-sessions/[id]/tags.patch.ts)
- [x] 4.8 Create `server/api/appointments/[id]/price.patch.ts` — update priceCents (moved from treatment-sessions/[id]/price.patch.ts)
- [x] 4.9 Create `server/api/appointments/[id]/extend.patch.ts` — increment extendedDurationMinutes (moved from treatment-sessions/[id]/extend.patch.ts)

## 5. Server API Routes — Update Existing Appointment Endpoints

- [x] 5.1 Update `server/api/appointments/index.get.ts` — remove treatment session leftJoin, add optional `includePaymentStatus` support with payment status enrichment via payment_session_items join
- [x] 5.2 Update `server/api/appointments/[id].get.ts` — remove treatment session leftJoin, return clinical/timer/billing fields directly from the appointment
- [x] 5.3 Update appointment status update logic — support `no_show` status transition in addition to existing status transitions

## 6. Server API Routes — Update Payment Endpoints

- [x] 6.1 Update `server/api/payments/index.post.ts` — replace `treatmentSessions` table references with `appointments`, update session status transition to use appointment.status, replace `treatmentSessionId` with `appointmentId` in sessionItems
- [x] 6.2 Update `server/api/payments/[id]/void.post.ts` — replace treatment session status revert with appointment.status revert (finished when voided), use appointmentId in queries
- [x] 6.3 Update `server/api/payments/[id].get.ts` — replace treatment session join with appointment join in response
- [x] 6.4 Update `server/api/payments/[id]/receipt.get.ts` — replace treatment session data with appointment data in receipt generation

## 7. Composables

- [x] 7.1 Delete `app/composables/useTreatmentSession.ts`
- [x] 7.2 Delete `app/composables/useTreatmentSession.spec.ts`
- [x] 7.3 Update `app/composables/useAppointment.ts` — add session action composables (useStartAppointment, usePauseAppointment, useResumeAppointment, useEndAppointment, useCancelAppointment), add clinical notes/price/tags/extend mutation composables, update cache keys, remove `useAppointmentsListWithSessions` (merge into main list composable since session data is inline)
- [x] 7.4 Update `app/composables/usePayment.ts` — replace `treatmentSessionId` with `appointmentId`, update `useTreatmentSessionPayments` → `useAppointmentPayments`, update endpoint references from `/api/treatment-sessions` to `/api/appointments`

## 8. UI Components — Treatment Session Components

- [x] 8.1 Update `app/components/treatment-session/TreatmentSessionSlideover.vue` — remove references to `appointment.treatmentSession`, read all data from the unified appointment object, update composable calls from `useCreateTreatmentSession`/`useStartTreatmentSession` etc. to `useStartAppointment`/`useEndAppointment` etc., update API calls to appointment sub-routes
- [x] 8.2 Update `app/components/treatment-session/TreatmentSessionTimer.vue` — update composable calls from `usePauseTreatmentSession`/`useResumeTreatmentSession`/`useEndTreatmentSession` to appointment equivalents, update API endpoint URLs
- [x] 8.3 Update `app/components/treatment-session/TreatmentSessionPrice.vue` — update to read `appointment.priceCents` instead of `treatmentSession.priceCent`, update API endpoint URL
- [x] 8.4 Update `app/components/treatment-session/TreatmentSessionTimingCard.vue` — read timing data from appointment directly instead of `appointment.treatmentSession`
- [x] 8.5 Update `app/components/treatment-session/SlideoverCenter.vue` — remove `useCreateTreatmentSession` call, use appointment clinical notes save instead
- [x] 8.6 Update `app/components/treatment-session/SlideoverLeftSide.vue` — replace `AppointmentWithSession` type with `Appointment`, remove `useAppointmentsListWithSessions` usage, update data source

## 9. UI Components — Appointment Components

- [x] 9.1 Update `app/components/appointment/OnGoingCard.vue` — replace `appointment.treatmentSession` references with direct appointment fields (status, actualStartTime, etc.), update slideover prop to pass appointment directly
- [x] 9.2 Update `app/components/appointment/ListItem.vue` — replace `appointment.treatmentSession` references with direct appointment fields, replace `AppointmentWithSession` type with `Appointment`, update slideover opening logic
- [x] 9.3 Update `app/components/appointment/Management.vue` — replace `appointment.treatmentSession?.extendedDurationMinutes` with `appointment.extendedDurationMinutes`, remove `useAppointmentsListWithSessions`
- [x] 9.4 Update `app/components/appointment/PlanningSlideover.vue` — replace `appointment.treatmentSession?.id` check with `appointment.status === 'in_progress'`, remove `useCreateTreatmentSession`
- [x] 9.5 Update `app/components/appointment/Card.vue` — replace `appointment.treatmentSession?.extendedDurationMinutes` with `appointment.extendedDurationMinutes`

## 10. UI Components — Payment Components

- [x] 10.1 Update `app/components/payment/PaymentCard.vue` — replace `TreatmentSession` prop type with `Appointment`, rename prop from `treatmentSession` to `appointment`
- [x] 10.2 Update `app/components/payment/PaymentSummaryCard.vue` — replace `TreatmentSession` prop with `Appointment`, update `useTreatmentSessionPayments` to `useAppointmentPayments`
- [x] 10.3 Update `app/components/payment/PaymentTransactionCard.vue` — replace `TreatmentSession` prop with `Appointment`
- [x] 10.4 Update `app/components/payment/BillingFinancialSummaryCard.vue` — replace `TreatmentSessionWithPaymentStatus[]` with `AppointmentWithPaymentStatus[]`
- [x] 10.5 Update `app/components/payment/BillingSessionCard.vue` — replace `TreatmentSessionWithPaymentStatus` with `AppointmentWithPaymentStatus`, update `useTreatmentSessionPayments` to `useAppointmentPayments`
- [x] 10.6 Update `app/components/payment/RecordPaymentSlideover.vue` — replace `TreatmentSessionWithPaymentStatus` with `AppointmentWithPaymentStatus`, rename `treatmentSessionId` to `appointmentId` in API calls

## 11. UI Components — Patient & Pages

- [x] 11.1 Update `app/components/patient/overview-tab/NextAppointment.vue` — update import from `LazyTreatmentSessionSlideover` if renamed, or keep if same
- [x] 11.2 Update `app/pages/therapists/day.vue` — replace `a.treatmentSession?.status` checks with `a.status` checks for in_progress/finished filtering, update summary stats to use unified appointment status

## 12. Tests

- [x] 12.1 Create `server/api/appointments/[id]/appointment-action-endpoints.spec.ts` — unit tests for start, pause, resume, end, cancel endpoint logic (moved from treatment-session-endpoints.spec.ts)
- [x] 12.2 Delete `server/api/treatment-sessions/[id]/treatment-session-endpoints.spec.ts`
- [x] 12.3 Create `app/composables/useAppointment.spec.ts` — tests for new session action composables
- [x] 12.4 Update `shared/types/invoicing.spec.ts` — replace `treatmentSessionId` with `appointmentId` in test data

## 13. Database Seeder

- [x] 13.1 Update `server/api/db/seed.post.ts` — rename `chiefComplaint` to `primaryConcern`, remove `billed`/`insuranceClaimed` fields, use unified status values (generate `in_progress` and `finished` statuses for past appointments alongside `completed`/`cancelled`/`no_show`), add timer fields (`actualStartTime`, `actualDurationSeconds`, `totalPausedSeconds`) for in_progress/finished appointments, ensure `priceCents` is always set

## 14. Verification

- [x] 14.1 Run `pnpm typecheck` — confirm zero TypeScript errors
- [x] 14.2 Run `pnpm test` — confirm all tests pass
- [x] 14.3 Run `pnpm build` — confirm production build succeeds
- [x] 14.4 Run `pnpm db:mig` — apply migration locally
- [x] 14.5 Run `pnpm db:seed` — verify seeder succeeds with merged schema
- [x] 14.6 Manual smoke test — verify daily schedule, consultation slideover, timer, billing page all work with unified appointment model
