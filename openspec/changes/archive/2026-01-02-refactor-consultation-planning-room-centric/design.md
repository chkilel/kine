## Context

The current consultation planning system is therapist-centric, where therapists define availability templates with a `maxSessions` field indicating how many concurrent sessions they can handle. This introduces complexity:

1. **Complex Logic**: The system must count concurrent bookings and compare against `maxSessions`
2. **Confusing UI**: Users see indicators like "2/3" or "1/3" representing concurrent session capacity
3. **Unnatural Mental Model**: Therapists naturally think in terms of rooms and physical constraints

The brainstorming analysis (`_bmad-output/analysis/brainstorming-session-2025-12-28.md`) revealed that a room-centric approach eliminates this complexity: physical rooms can only host one session at a time, making the room constraint the natural limit on concurrent sessions.

## Goals / Non-Goals

**Goals:**

- Eliminate `maxSessions` complexity from the system
- Shift availability model from therapist-based to room-based
- Simplify slot generation logic to binary room availability (booked or free)
- Improve UX clarity by showing room-based availability
- Prevent room double-booking through database constraints
- Maintain existing functionality for consultation scheduling

**Non-Goals:**

- Changing room management (already implemented)
- Adding automatic room assignment based on equipment needs
- Implementing room utilization analytics
- Multi-therapist room scheduling (room booked by multiple therapists simultaneously)

## Decisions

### Decision 1: Remove maxSessions field from availability templates

**What**: Remove the `maxSessions` integer field (default 1, max 10) from `weeklyAvailabilityTemplates` table and related code.

**Why**: Physical room constraint naturally limits concurrent sessions to 1. Therapists who want to see multiple patients simultaneously need multiple rooms. The `maxSessions` field adds unnecessary abstraction that doesn't match the physical reality of clinic operations.

**Alternatives considered:**

- Keep `maxSessions` but make it derived from room count (rejected: still complex, requires additional logic)
- Keep `maxSessions` for flexibility (rejected: adds cognitive load without clear benefit)
- Move `maxSessions` to user level (rejected: same complexity, just moved location)

### Decision 2: Shift availability from therapist-based to room-based

**What**: Instead of checking therapist availability with concurrent session counting, check if a room is booked for a given time slot.

**Why**: Rooms are the physical constraint. A room can only host one session at a time. Therapist availability is still important, but the limiting factor is room availability. This aligns with the natural mental model: "What's available in Room 1 at 9:00?"

**Alternatives considered:**

- Hybrid approach: Check both therapist AND room availability (rejected: room constraint is sufficient, therapist capacity = number of rooms they have access to)
- Therapist-first, room-second: Find available therapists, then find available rooms (rejected: backwards, room is primary constraint)

### Decision 3: Simple binary room availability (booked or free)

**What**: Slot generation checks `isRoomBooked(roomId, date, startTime, endTime)` - returns boolean. No counting, no fractions.

**Why**: Eliminates complex concurrent session counting logic. Simplifies code and reduces bug surface. Matches physical reality: a room is either occupied or not.

**Alternatives considered:**

- Keep counting for statistics (rejected: can add later, not core requirement)
- Track room utilization percentage (rejected: analytics feature, not blocking)

### Decision 4: Database unique constraint prevents room double-booking

**What**: Add unique index on `(roomId, date, startTime)` to `consultations` table.

**Why**: Provides data integrity at database level. Prevents double-booking even if application logic has bugs. Simple and effective constraint.

**Alternatives considered:**

- Application-level checks only (rejected: race conditions possible)
- Trigger-based validation (rejected: more complex, harder to debug)

### Decision 5: Gradual migration path

**What**: Remove `maxSessions` field and update code in stages: schema → types → backend → frontend.

**Why**: Minimizes risk by allowing testing at each stage. Existing data with `maxSessions` can be safely migrated (field removed, default logic applied).

**Alternatives considered:**

- Big bang rewrite (rejected: high risk, harder to debug)
- Feature flag toggle (rejected: not needed for this change, complexity outweighs benefit)

## Risks / Trade-offs

### Risk 1: Breaking existing workflows

**Risk**: Users accustomed to therapist-centric planning may find room-based approach confusing initially.

**Mitigation**: UI should clearly show room availability with equipment badges. Onboarding documentation explains the change. Therapist availability still visible (when are they working) but slots are room-based.

### Risk 2: Data migration complexity

**Risk**: Existing consultations and templates may have `maxSessions` assumptions baked in.

**Mitigation**: `maxSessions` removal is safe because field removal doesn't affect existing consultations. Only availability templates lose a field, which is non-breaking for booking logic (slot generation just ignores it during migration).

### Risk 3: Performance impact of room-based queries

**Risk**: Checking room availability for each room might be slower than therapist-based queries.

**Mitigation**: Existing indexes on `(roomId, date, startTime)` make room queries efficient. Room count is typically small (5-10 rooms per clinic), so query overhead is negligible.

### Trade-off 1: Loss of concurrent session flexibility

**Trade-off**: Can no longer theoretically allow multiple therapists in same room (e.g., group therapy).

**Rationale**: Group therapy is a different use case that should be handled separately with explicit group session support. Current model is 1-on-1 therapy.

### Trade-off 2: Therapist "free time" less visible

**Trade-off**: With room-centric view, it's less obvious which therapists have free time vs. which rooms are free.

**Rationale**: Therapist availability is shown separately (when they work). Room availability shows when sessions can happen. Therapist capacity = number of rooms they work in. Two separate concerns that shouldn't be conflated.

## Migration Plan

### Phase 1: Database Schema (Rollback-safe)

1. Create migration to add unique index `idx_consultations_room_booking_unique` on `(roomId, date, startTime)`
2. Create migration to drop `maxSessions` column from `weeklyAvailabilityTemplates`
3. Run migration in development, verify no duplicate room bookings exist
4. **Rollback**: Drop index, re-add column with default values

### Phase 2: Type Definitions (Non-breaking)

1. Update `shared/types/availability.types.ts` to remove `maxSessions` from types
2. Update Zod schemas
3. Update database schema types after migration
4. **Rollback**: Revert type definitions

### Phase 3: Backend Logic (Gradual)

1. Update `shared/utils/planning-utils.ts` to remove `maxSessions` logic
2. Update `server/api/availability/[therapistId]/slots.post.ts` to use room-based checks
3. Add room availability validation in consultation creation API
4. Test slot generation with multiple rooms
5. **Rollback**: Revert logic changes

### Phase 4: Frontend UI (Gradual)

1. Update availability template components to remove `maxSessions` inputs
2. Update consultation planning components to show room-based slots
3. Remove concurrent session indicators from UI
4. Test booking flow with room selection
5. **Rollback**: Revert UI changes

### Phase 5: Validation & Cleanup

1. Run full test suite
2. Manually test complete booking flow
3. Verify no `maxSessions` references remain
4. Update documentation
5. Deploy to production

**Rollback Plan**: Each phase can be independently rolled back by reverting changes in reverse order. Database changes can be rolled back using migrations.

## Open Questions

1. **Therapist-Room Assignment**: Should therapists specify which rooms they work in, or can any therapist book any room during their availability?
   - **Current assumption**: Therapists define availability (time/location), and during booking, they select any available room. Room equipment drives selection.

2. **Therapist Availability Display**: How should we show therapist availability in the new model?
   - **Current assumption**: Show therapist's working hours/templates separately. Show room-based slots during booking. Therapist availability = "I work 9-5 on Mondays", Room availability = "Room 1 free at 9:00".

3. **Room Equipment**: Should we add automatic room recommendations based on treatment plan needs?
   - **Current decision**: No. Manual room selection is sufficient. Can add as future enhancement.

4. **Multiple Locations**: How does room-based planning work with multiple clinic locations?
   - **Current assumption**: Availability templates already have `location` field. Rooms also belong to organizations. Room availability checks already scoped to location/org.

5. **Backward Compatibility**: Should we keep `maxSessions` in database as deprecated field?
   - **Current decision**: No, remove completely. No need for deprecated fields since this is a breaking change.
