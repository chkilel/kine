# Implementation Tasks

## Overview

This tasks document outlines the ordered implementation of the room-centric booking system, organized into three phases: Room Management (Phase 1), Room Booking UI (Phase 2), and Dashboard Enhancement (Phase 3). Each task is small, verifiable, and designed to deliver incremental user-visible progress.

**Estimated Timeline:** 4 weeks total (Phase 1: Week 1, Phase 2: Weeks 2-3, Phase 3: Week 4)

---

## Phase 1: Room Management (Foundation)

**Goal:** Enable room-based booking with database schema and API changes.

### Database Schema Changes

#### Task 1.1: Add roomId to consultations table ✅

- **File:** `server/database/schema/consultation.ts`
- **Description:** Add nullable `roomId` field as foreign key reference to rooms table
- **Steps:**
  1. Add `roomId` column definition with `.references(() => rooms.id)`
  2. Make field nullable (for historical data compatibility)
  3. Add to Drizzle relations
- **Verification:** TypeScript compilation succeeds, schema file updated
- **Dependencies:** None

#### Task 1.2: Create unique constraint for room booking ✅

- **File:** `server/database/schema/consultation.ts`
- **Description:** Add unique index on `(roomId, date, startTime)` to prevent double-booking
- **Steps:**
  1. Add `index('idx_consultations_room_booking_unique').on(table.roomId, table.date, table.startTime)` to indexes array
  2. Ensure constraint applies to all consultations (not filtered by organizationId)
- **Verification:** Schema file updated with unique constraint
- **Dependencies:** Task 1.1

#### Task 1.3: Create database migration ✅

- **File:** `server/database/migrations/0001_sloppy_tomas.sql` (auto-generated)
- **Description:** Generate and apply migration for schema changes
- **Steps:**
  1. Run `npx drizzle-kit generate` to generate migration file
  2. Review migration SQL to ensure correct DDL statements
  3. Run `npx drizzle-kit push` to apply migration to local database
- **Verification:** Migration applied successfully, `roomId` column exists in consultations table, unique constraint created
- **Dependencies:** Tasks 1.1, 1.2

#### Task 1.4: Add database index for room queries ✅

- **File:** `server/database/schema/consultation.ts`
- **Description:** Add composite index for efficient room-based availability queries
- **Steps:**
  1. Add `index('idx_consultations_room_date').on(table.roomId, table.date)`
  2. Add `index('idx_consultations_room_date_time').on(table.roomId, table.date, table.startTime)`
- **Verification:** Schema file updated with new indexes
- **Dependencies:** Task 1.1

### Type Definitions and Validation

#### Task 1.5: Update ConsultationCreate type ✅

- **File:** `shared/types/consultation.type.ts`
- **Description:** Add `roomId` field to consultation creation type
- **Steps:**
  1. Add `roomId?: string` to `ConsultationCreate` interface
  2. Update Zod schema to include `roomId: z.string().uuid()`
  3. Make field optional for backward compatibility (historical consultations)
- **Verification:** TypeScript compilation succeeds, types updated
- **Dependencies:** Task 1.1

#### Task 1.6: Create room availability request type ✅

- **File:** `shared/types/availability.types.ts` (or new file)
- **Description:** Define TypeScript types and Zod schemas for room slot requests
- **Steps:**
  1. Create `RoomSlotsRequest` interface with fields: `dates: string[]`, `duration: number`, `therapistId?: string`
  2. Create `RoomSlotsResponse` interface with `slots: Record<string, { availableSlots: string[], unavailable: boolean }>`
  3. Create `roomSlotsRequestSchema` with Zod validation
- **Verification:** TypeScript compilation succeeds, schemas defined
- **Dependencies:** None

### API Endpoints

#### Task 1.7: Create room-based availability endpoint ✅

- **File:** `server/api/availability/[roomId]/slots.post.ts`
- **Description:** Implement slot calculation per room based on therapist availability and existing bookings
- **Steps:**
  1. Create endpoint file `slots.post.ts` in `[roomId]` directory
  2. Extract and validate `roomId` from route params
  3. Parse and validate request body using `roomSlotsRequestSchema`
  4. Fetch room metadata and verify organization access
  5. Fetch therapist availability templates for room's location
  6. Fetch availability exceptions for requested dates
  7. Fetch existing bookings for the room (excluding cancelled sessions)
  8. Merge availability rules to get effective availability per date
  9. Subtract booked periods with gap buffer
  10. Generate time slots at `slotIncrementMinutes` intervals
  11. Return slots response grouped by date
- **Verification:** Endpoint returns available slots correctly for test cases (single date, multiple dates, full-day exception, partial-day exception)
- **Dependencies:** Tasks 1.5, 1.6

#### Task 1.8: Update consultation creation API ✅

- **File:** `server/api/consultations/[...].ts` (or similar)
- **Description:** Modify consultation creation to accept and store `roomId`, handle unique constraint violations
- **Steps:**
  1. Update Zod validation to include `roomId` (required for new bookings)
  2. Validate `roomId` exists and belongs to user's organization
  3. Attempt to insert consultation with `roomId`
  4. Catch unique constraint violation (room already booked at that time)
  5. Return HTTP 409 Conflict with French error message: "Ce créneau est déjà réservé. Veuillez sélectionner une autre heure."
  6. Return created consultation on success
- **Verification:** Consultations created successfully with roomId, duplicate booking attempts return 409 error
- **Dependencies:** Tasks 1.2, 1.5, 1.7

### Testing

#### Task 1.9: Manual testing of room availability endpoint

- **Description:** Test room slot calculation with various scenarios
- **Steps:**
  1. Create test room in database
  2. Create therapist availability templates for room's location
  3. Create availability exception (full-day and partial-day)
  4. Call endpoint with valid request body
  5. Verify slots are generated correctly
  6. Create consultation in room
  7. Call endpoint again and verify slot is excluded
  8. Test with multiple dates
- **Verification:** All test cases pass, endpoint behaves as expected
- **Dependencies:** Task 1.7

#### Task 1.10: Manual testing of consultation creation with roomId

- **Description:** Test consultation booking with room assignment
- **Steps:**
  1. Call consultation creation API with valid roomId
  2. Verify consultation is created with roomId
  3. Attempt duplicate booking (same room, date, time)
  4. Verify HTTP 409 error is returned
  5. Attempt booking without roomId
  6. Verify HTTP 400 error is returned
- **Verification:** All test cases pass
- **Dependencies:** Task 1.8

---

## Phase 2: Room Booking UI (Critical)

**Goal:** Therapists can book sessions via room cards interface.

### Composables

#### Task 2.1: Create useRoomSlots composable

- **File:** `app/composables/useRoomSlots.ts`
- **Description:** Encapsulate room slot fetching logic
- **Steps:**
  1. Define composable with reactive state: `slots`, `loading`, `error`
  2. Implement `fetchRoomSlots(roomId, date, duration, therapistId?)` function
  3. Call `POST /api/availability/[roomId]/slots` endpoint
  4. Handle loading and error states
  5. Return reactive refs for component consumption
- **Verification:** Composable compiles, can be imported and used in components
- **Dependencies:** Task 1.7

#### Task 2.2: Update useCreateConsultation composable

- **File:** `app/composables/useCreateConsultation.ts` (or similar)
- **Description:** Add roomId parameter to consultation creation
- **Steps:**
  1. Update `createConsultation` function signature to accept `roomId`
  2. Pass `roomId` in request body
  3. Handle 409 conflict error (double-booking)
  4. Return French error message for user display
- **Verification:** Composable accepts roomId and handles unique constraint error
- **Dependencies:** Task 1.8

### UI Components

#### Task 2.3: Create RoomCards component

- **File:** `app/components/booking/RoomCards.vue`
- **Description:** Display rooms with quick availability preview (name, slots count, next/last times)
- **Steps:**
  1. Create component with props: `date?: string`, `roomId?: string`
  2. Use `useRooms` composable to fetch room list
  3. Create quick availability query (or batch fetch for all rooms)
  4. Render room cards in vertical stack
  5. Each card shows: room name, sessions count, next time, last time
  6. Do NOT display equipment in cards
  7. Add loading skeleton state
  8. Add error state with retry button
  9. Handle room card tap → open DurationSelector
- **Verification:** Component displays rooms correctly, loading and error states work
- **Dependencies:** Tasks 2.1

#### Task 2.4: Create DurationSelector component

- **File:** `app/components/booking/DurationSelector.vue`
- **Description:** Allow therapists to select session duration from 8 options
- **Steps:**
  1. Create component with props: `room: Room`, `consultation?: Consultation`
  2. Define 8 duration options from `CONSULTATION_DURATIONS` constant
  3. Implement radio button selection (single duration selected)
  4. Default to 45 minutes (or consultation.duration if editing)
  5. Add "VOIR LES CRÉNEAUX" primary action button
  6. Add "ANNULER" cancel button
  7. Handle duration selection → open SlotGrid
  8. Handle cancel → return to RoomCards
- **Verification:** Component allows selecting duration, proceeds to SlotGrid on confirm
- **Dependencies:** Task 2.3

#### Task 2.5: Create SlotGrid component

- **File:** `app/components/booking/SlotGrid.vue`
- **Description:** Display available slots in horizontal scrolling grid with morning/afternoon grouping
- **Steps:**
  1. Create component with props: `room: Room`, `date: string`, `duration: number`, `therapistId?: string`
  2. Use `useRoomSlots` composable to fetch slots
  3. Group slots by Morning (<12:00) and Afternoon (12:00+)
  4. Render horizontal scrolling time blocks (large touch targets 44px+)
  5. Show visual indicators: ✓ green (available), ✗ gray (booked)
  6. Implement tap-to-book functionality
  7. Add loading skeleton state
  8. Add error state with retry button
  9. Add "no slots available" message when empty
  10. Handle double-booking error (show message, update slot to booked state)
  11. Add "RÉSERVER" primary action button
- **Verification:** Component displays slots correctly, handles booking and errors
- **Dependencies:** Tasks 2.1, 2.4

#### Task 2.6: Create BookingConfirmation component

- **File:** `app/components/booking/BookingConfirmation.vue`
- **Description:** Display booking summary after successful consultation creation
- **Steps:**
  1. Create component with props: `room: Room`, `date: string`, `time: string`, `duration: number`, `patient: Patient`, `therapist?: User`
  2. Display large success icon (✅)
  3. Display booking summary: room, patient, date, time, therapist
  4. Add "OK" button to dismiss confirmation
  5. Add "Modifier la consultation" action button
  6. Handle booking error (show error message)
- **Verification:** Component displays booking details correctly, handles success and error
- **Dependencies:** Task 2.5

### Integration

#### Task 2.7: Update ConsultationManualPlanningCard component

- **File:** `app/components/consultation/ConsultationManualPlanningCard.vue`
- **Description:** Replace therapist-centric slot selection with room-based flow
- **Steps:**
  1. Remove therapist-centric slot fetching logic
  2. Integrate RoomCards component
  3. Integrate DurationSelector component
  4. Integrate SlotGrid component
  5. Integrate BookingConfirmation component
  6. Handle state transitions: RoomCards → DurationSelector → SlotGrid → BookingConfirmation
  7. Update consultation creation to use roomId from booking flow
  8. Remove maxSessions UI logic (no longer needed)
- **Verification:** Manual planning card uses room-based booking flow
- **Dependencies:** Tasks 2.3, 2.4, 2.5, 2.6

#### Task 2.8: Update ConsultationAutomaticPlanningCard component (if applicable)

- **File:** `app/components/consultation/ConsultationAutomaticPlanningCard.vue`
- **Description:** Update automatic planning to consider room constraints
- **Steps:**
  1. Review automatic planning logic
  2. Ensure room availability is considered when auto-scheduling
  3. Add roomId assignment to auto-generated consultations
  4. Update UI to display room information
- **Verification:** Automatic planning respects room availability and assigns rooms
- **Dependencies:** Task 2.7

### Mobile Optimization

#### Task 2.9: Optimize RoomCards for mobile

- **File:** `app/components/booking/RoomCards.vue`
- **Description:** Ensure room cards work well on mobile devices
- **Steps:**
  1. Test on mobile viewport (375px width)
  2. Adjust card layout to use full width (100%)
  3. Ensure 4-5 cards are visible without scrolling
  4. Verify touch targets are 44px+ minimum
  5. Add smooth vertical scrolling for long room lists
- **Verification:** Room cards display correctly on mobile, smooth scrolling
- **Dependencies:** Task 2.3

#### Task 2.10: Optimize SlotGrid for mobile

- **File:** `app/components/booking/SlotGrid.vue`
- **Description:** Ensure slot grid works well on mobile devices
- **Steps:**
  1. Test on mobile viewport
  2. Ensure horizontal scrolling is smooth (left-to-right swipe gesture)
  3. Verify 4 time blocks are visible at a time
  4. Ensure time blocks are 44px+ height for touch targets
  5. Make "RÉSERVER" button sticky at bottom of screen
- **Verification:** Slot grid works smoothly on mobile, horizontal scrolling natural
- **Dependencies:** Task 2.5

### Testing

#### Task 2.11: Manual testing of booking flow

- **Description:** Test complete booking flow end-to-end
- **Steps:**
  1. Navigate to consultation booking page
  2. Tap on room card → verify DurationSelector opens
  3. Select 45 minutes → verify SlotGrid opens
  4. Tap on available slot → verify slot is selected
  5. Tap "RÉSERVER" → verify booking is created
  6. Verify BookingConfirmation appears with correct details
  7. Verify room availability updates (slot no longer available)
  8. Attempt double-booking → verify error message appears
- **Verification:** Complete booking flow works without errors
- **Dependencies:** Tasks 2.3, 2.4, 2.5, 2.6, 2.7

---

## Phase 3: Dashboard Enhancement (Important)

**Goal:** Provide therapists with daily overview and room utilization metrics.

### Dashboard Metrics

#### Task 3.1: Create room utilization query composable

- **File:** `app/composables/useRoomUtilization.ts`
- **Description:** Fetch room utilization metrics for a given date
- **Steps:**
  1. Define composable with reactive state: `utilization`, `loading`, `error`
  2. Implement `fetchRoomUtilization(date)` function
  3. Query consultations by roomId and date
  4. Calculate metrics per room: sessions count, available slots, occupancy percentage
  5. Return reactive refs for component consumption
- **Verification:** Composable compiles, returns room utilization metrics
- **Dependencies:** Task 1.8

#### Task 3.2: Add room utilization section to dashboard

- **File:** `app/components/home/HomeChart.client.vue` or dashboard component
- **Description:** Display room utilization metrics on dashboard
- **Steps:**
  1. Import `useRoomUtilization` composable
  2. Fetch utilization for today's date
  3. Create room utilization section with room cards
  4. Each card shows: room name, sessions count, available slots, occupancy percentage
  5. Display occupancy as progress bar or similar visualization
  6. Sort rooms by occupancy (highest first)
  7. Handle zero bookings (0% occupancy)
  8. Handle fully booked rooms (100% occupancy)
- **Verification:** Dashboard displays room utilization correctly
- **Dependencies:** Task 3.1

### Room Schedule View

#### Task 3.3: Create room schedule component

- **File:** `app/components/dashboard/RoomSchedule.vue`
- **Description:** Display room-by-room schedule for a given date
- **Steps:**
  1. Create component with props: `room: Room`, `date: string`
  2. Fetch consultations for room and date
  3. Sort sessions chronologically
  4. Render session list with time, patient name, therapist name
  5. Show session status indicators (scheduled, in_progress, completed, cancelled)
  6. Display empty gaps between sessions (with duration label)
  7. Add back button to return to utilization overview
- **Verification:** Component displays room schedule correctly
- **Dependencies:** Task 3.1

#### Task 3.4: Integrate room schedule with dashboard

- **File:** Dashboard component
- **Description:** Allow users to navigate from utilization to schedule view
- **Steps:**
  1. Add tap handler to room cards in utilization section
  2. Open RoomSchedule component with selected room
  3. Add back button functionality
  4. Maintain date context across navigation
- **Verification:** Users can tap on room card to see schedule
- **Dependencies:** Tasks 3.2, 3.3

### Quick Indicators

#### Task 3.5: Add next session indicators to dashboard

- **File:** Dashboard component
- **Description:** Display quick indicators for next upcoming session in each room
- **Steps:**
  1. Calculate next session for each room based on current time
  2. Display "Prochain: HH:MM - Patient Name" indicator
  3. Show "En cours: HH:MM - Patient Name" for current session
  4. Show "Aucune séance à venir" for rooms with no upcoming sessions
  5. Display indicators on room cards or utilization section
  6. Update indicators in real-time (every 1-2 minutes)
- **Verification:** Dashboard shows next session indicators correctly
- **Dependencies:** Task 3.1

#### Task 3.6: Add room availability preview to dashboard

- **File:** Dashboard component
- **Description:** Display compact preview of available slots per room
- **Steps:**
  1. Fetch available slots for each room (reuse slot generation logic)
  2. Display compact slot list (first 4-5 slots)
  3. Group slots by Morning/Afternoon
  4. Display "+X autres créneaux" when many slots available
  5. Expand to full SlotGrid on tap
  6. Show "Aucun créneau disponible" when room is fully booked
- **Verification:** Dashboard shows availability preview correctly
- **Dependencies:** Tasks 1.7, 2.5

### Integration with Booking Flow

#### Task 3.7: Add quick booking from dashboard

- **File:** Dashboard component
- **Description:** Allow therapists to book sessions directly from dashboard
- **Steps:**
  1. Add "RÉSERVER UN CRÉNEAU" button to room cards
  2. Open DurationSelector with pre-selected room on tap
  3. Proceed through booking flow (duration → slots → confirm)
  4. Update dashboard after successful booking (refresh utilization and schedule)
- **Verification:** Users can book sessions from dashboard without navigation
- **Dependencies:** Tasks 2.3, 2.4, 2.5, 2.6, 3.2

### Date Selection

#### Task 3.8: Add date picker to dashboard

- **File:** Dashboard component
- **Description:** Allow users to view dashboard for different dates (past, today, future)
- **Steps:**
  1. Add date picker component to dashboard
  2. Default to today's date
  3. Handle date selection change
  4. Refresh room utilization for selected date
  5. Refresh room schedules for selected date
  6. Add "AUJOURD'HUI" button to return to today
- **Verification:** Users can view dashboard for any date
- **Dependencies:** Tasks 3.1, 3.2, 3.3

### Mobile Responsiveness

#### Task 3.9: Optimize dashboard for mobile

- **File:** Dashboard component
- **Description:** Ensure dashboard components work well on mobile devices
- **Steps:**
  1. Test room utilization cards on mobile (full width, stacked vertically)
  2. Test room schedule view on mobile (vertical scrolling, compact session details)
  3. Test room availability preview on mobile (compact badges, wrapping)
  4. Ensure touch targets are 44px+ minimum
  5. Make primary actions sticky at bottom
- **Verification:** Dashboard displays correctly on mobile
- **Dependencies:** Tasks 3.2, 3.3, 3.6

### Performance

#### Task 3.10: Optimize dashboard queries

- **File:** Server API endpoints and composables
- **Description:** Ensure dashboard data loads quickly with optimized queries
- **Steps:**
  1. Verify database indexes are used for room utilization queries
  2. Batch fetch room data (single query for all rooms)
  3. Implement caching for utilization metrics (2-3 minutes)
  4. Test load times on slow mobile connections (3G)
  5. Ensure loading skeletons are shown immediately
- **Verification:** Dashboard loads in <1 second on typical connections
- **Dependencies:** Task 3.1

### Testing

#### Task 3.11: Manual testing of dashboard features

- **Description:** Test dashboard metrics, schedules, and booking flow
- **Steps:**
  1. Load dashboard → verify room utilization is displayed
  2. Tap on room card → verify schedule view opens
  3. Verify next session indicators are correct
  4. Verify room availability preview shows slots
  5. Tap "RÉSERVER UN CRÉNEAU" → verify booking flow opens
  6. Select date in past → verify historical data is shown
  7. Select date in future → verify availability is shown
  8. Test on mobile device → verify responsive layout
- **Verification:** All dashboard features work correctly
- **Dependencies:** Tasks 3.2, 3.3, 3.5, 3.6, 3.7, 3.8

---

## Cleanup and Polish

### Code Quality

#### Task 4.1: Run linter and fix issues

- **Description:** Ensure code follows project style guidelines
- **Steps:**
  1. Run `npm run lint` (or similar linter command)
  2. Fix all linting errors and warnings
  3. Verify code follows project conventions (2-space tabs, single quotes, 120 char width)
- **Verification:** Linter passes with no errors or warnings
- **Dependencies:** All implementation tasks

#### Task 4.2: Run typecheck and fix issues

- **Description:** Ensure TypeScript compilation succeeds
- **Steps:**
  1. Run `npm run typecheck` (or similar command)
  2. Fix all TypeScript errors
  3. Verify types are correct and interfaces are properly defined
- **Verification:** TypeScript compilation succeeds with no errors
- **Dependencies:** All implementation tasks

### Documentation

#### Task 4.3: Update API documentation (if applicable)

- **File:** Project README or API docs
- **Description:** Document new room-based availability endpoint
- **Steps:**
  1. Document `POST /api/availability/[roomId]/slots` endpoint
  2. Include request/response examples
  3. Describe parameters (dates, duration, therapistId)
  4. Describe error handling (404, 409)
- **Verification:** API documentation is updated
- **Dependencies:** Task 1.7

### Final Testing

#### Task 4.4: End-to-end testing of room booking flow

- **Description:** Complete manual testing of entire room booking system
- **Steps:**
  1. Create rooms via admin UI (if not already created)
  2. Set up therapist availability templates
  3. Book a consultation via room cards flow
  4. Verify consultation is created with correct roomId
  5. Verify dashboard shows updated room utilization
  6. Attempt double-booking → verify error handling
  7. Test on mobile device → verify responsive layout
  8. Test with multiple rooms → verify each works correctly
- **Verification:** All features work correctly end-to-end
- **Dependencies:** All implementation tasks

#### Task 4.5: User acceptance testing

- **Description:** Get feedback from actual therapists on room booking flow
- **Steps:**
  1. Deploy staging environment with room-centric booking
  2. Invite therapists to test new booking flow
  3. Collect feedback on UX, clarity, and functionality
  4. Address critical issues identified
  5. Document minor issues for future iterations
- **Verification:** Therapists can successfully use room booking flow
- **Dependencies:** Task 4.4

---

## Task Dependencies Summary

### Critical Path (Must Complete in Order)

1. Database schema (Tasks 1.1-1.4)
2. Types and validation (Tasks 1.5-1.6)
3. Room availability endpoint (Task 1.7)
4. Consultation creation API (Task 1.8)
5. RoomSlots composable (Task 2.1)
6. Room cards component (Task 2.3)
7. Duration selector component (Task 2.4)
8. Slot grid component (Task 2.5)
9. Booking confirmation component (Task 2.6)
10. Manual planning card integration (Task 2.7)
11. Manual testing (Task 2.11)
12. Dashboard utilization (Tasks 3.1-3.2)
13. Dashboard testing (Task 3.11)

### Parallelizable Work

- Tasks 2.3, 2.4, 2.5, 2.6 (UI components) can be worked on in parallel by different developers
- Tasks 3.2, 3.3, 3.5, 3.6 (dashboard components) can be worked on in parallel
- Mobile optimization (Tasks 2.9, 2.10, 3.9) can be done in parallel with feature development
- Testing tasks (1.9, 1.10, 2.11, 3.11, 4.4) can be done while waiting for other tasks

### Blocked Tasks

- All UI components (Phase 2) depend on API endpoints (Phase 1)
- Dashboard components (Phase 3) depend on booking UI (Phase 2) working
- Testing tasks depend on implementation completion
