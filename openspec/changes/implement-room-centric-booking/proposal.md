# Implement Room-Centric Booking System

## Summary

Transform the consultation booking system from a therapist-centric model with complex concurrent session management to a simpler, more intuitive room-centric approach. This change eliminates `maxSessions` complexity by using physical rooms as the natural concurrency constraint, providing therapists with clearer visibility into clinic operations and equipment-based treatment planning.

## Problem Statement

The current system calculates available slots based on therapist availability templates with `maxSessions` parameters, requiring:

- Complex concurrent session counting logic
- Mental calculations by therapists to understand capacity
- Unclear mapping between "slots" and physical treatment rooms
- Equipment visibility disconnected from booking decisions
- Risk of double-booking across multiple therapists in the same room

Therapists naturally think in terms of "What's available in Room X?" rather than "How many concurrent sessions can I handle?"

## Proposed Solution

Implement a room-centric booking architecture where:

1. **Physical Room Constraint = Session Capacity** - Each room can host one session at a time, eliminating `maxSessions` complexity
2. **Room-Based Availability** - Calculate slots per room based on therapist availability and existing bookings in that room
3. **Simplified Booking Logic** - Binary availability (booked or free) with database unique constraint preventing double-booking
4. **Equipment-Based Planning** - Therapists select rooms based on patient treatment needs and room equipment
5. **Mobile-Optimized UI** - Room cards with quick preview, progressive disclosure for duration/slot selection

## Goals

### Primary Goals

- Eliminate `maxSessions` architectural complexity
- Provide therapists with clear, intuitive booking workflow
- Prevent double-booking across all therapists via database constraint
- Enable equipment-based treatment planning
- Optimize UX for mobile devices (vertical cards, horizontal slot scrolling)

### Secondary Goals

- Enable dashboard with room utilization metrics
- Provide room-by-room scheduling overview
- Support future analytics on room efficiency

## Non-Goals

- AI-powered room recommendations (documented for future)
- Room templates/cloning for multi-clinic scenarios
- Automatic cancellation windows (handled manually)
- Room utilization intelligence/optimization (future feature)
- Equipment tracking for movable items (handled manually by therapists)

## Impact

### User Experience Improvements

- **Clarity:** Therapists see exactly which room is available at which time
- **Efficiency:** "Click room → Select duration → Pick slot → Book" in 3-4 actions
- **Confidence:** DB constraint prevents double-booking, eliminating anxiety
- **Planning:** Equipment visibility drives room selection based on patient needs

### Technical Simplifications

- Remove concurrent session counting logic
- Replace complex capacity calculations with simple boolean availability
- Single DB unique constraint replaces app-level conflict detection
- Room-based slot generation simplifies to: "Is this room booked at this time?"

### Breaking Changes

- **Database Schema:** Add `roomId` field to consultations table (nullable during migration)
- **API Endpoints:** Replace `/api/availability/[therapistId]/slots` with `/api/availability/[roomId]/slots`
- **UI Components:** Replace therapist-centric slot selection with room cards interface
- **Migration:** Existing consultations will have `roomId = NULL` (historical data preserved)

## Architecture Decisions

### Decision 1: Room-Centric vs Therapist-Centric

**Choice:** Room-centric

**Rationale:**

- Physical constraint is the actual limit (one session per room)
- Therapists already think in room terms for equipment planning
- Eliminates `maxSessions` mental math
- Simpler DB schema and query patterns

### Decision 2: Binary Availability vs Concurrent Counting

**Choice:** Binary (booked or free)

**Rationale:**

- One session per room = no capacity indicators needed
- Reduces UI complexity (no "2/3" or "1/3" displays)
- Faster queries (no counting concurrent sessions)
- Natural mapping to physical reality

### Decision 3: On-Demand Slot Calculation vs Pre-Calculation

**Choice:** Calculate on demand when user clicks room card

**Rationale:**

- Optimize for typical workflow (therapist checks specific rooms, not all rooms)
- Avoid caching complexity
- Adequate performance with proper indexes
- Simpler implementation

### Decision 4: Horizontal vs Vertical Slot Grid

**Choice:** Horizontal scrolling time blocks

**Rationale:**

- Mobile thumb-friendly swipe gesture
- Matches natural time perception (left to right)
- Better for time groupings (Morning/Afternoon sections)
- Validated during brainstorming as optimal for mobile UX

### Decision 5: Equipment Display in Room Cards

**Choice:** Do NOT show equipment in room cards

**Rationale:**

- Therapists already know their rooms' equipment
- Reduces information density
- Equipment available in room detail view (when editing)
- Focus on what matters for booking: availability, not equipment

## Scope

### In Scope

#### Phase 1: Room Management (Foundation)

- Add `roomId` field to consultations table
- Create unique constraint `UNIQUE(roomId, date, startTime)`
- Update rooms schema (already exists)
- Create `/api/availability/[roomId]/slots` endpoint
- Update consultation booking API to accept roomId

#### Phase 2: Room Booking UI (Critical)

- Room cards component with quick preview
- Duration selection UI (after room selection)
- Slot grid component with horizontal scrolling
- Booking confirmation UI
- Integration with consultation creation flow

#### Phase 3: Dashboard Enhancement (Important)

- Today's room utilization metrics
- Room-by-room schedule view
- Quick "next session" indicators

### Out of Scope

- Automatic room recommendations based on patient condition
- Room templates/cloning for multi-clinic management
- Cancellation window enforcement
- Equipment tracking for movable items
- Predictive analytics for room optimization
- Multi-therapist coordination features

## Dependencies

### Existing Features

- Rooms table and CRUD operations (already implemented)
- Availability templates system (therapist-centric)
- Availability exceptions system
- Consultation creation flow
- Patient treatment plan system

### Required by This Change

- Therapist availability templates must be preserved (used for room slot calculation)
- Existing consultations need nullable `roomId` field during migration
- Rooms must exist before booking can occur (dependency on Phase 1)

## Risks & Mitigations

### Risk 1: Equipment Breakdowns

**Risk:** Equipment fails, patients pre-booked for that room

**Mitigation:**

- Therapist manually calls patients to reschedule
- Justification: Equipment failures rare enough for manual handling
- Future: Could add "room unavailable" feature if needed

### Risk 2: Double-Booking Across Therapists

**Risk:** Two therapists book same room at same time

**Mitigation:**

- Database unique constraint: `UNIQUE(roomId, date, startTime)`
- App-level error handling with clear message: "This slot is already booked"
- UI shows error, therapist selects alternative slot

### Risk 3: Equipment Dependencies

**Risk:** Patient needs equipment only in booked room

**Mitigation:**

- Therapist reviews equipment before booking (room cards don't show equipment)
- Equipment visible in room detail/edit view
- Manual rescheduling requires patient coordination anyway

### Risk 4: Migration Complexity

**Risk:** Existing consultations without `roomId`

**Mitigation:**

- Make `roomId` nullable during migration
- Historical data preserved with `roomId = NULL`
- New bookings require `roomId`
- Future: Admin bulk-update tool if needed

## Success Criteria

### Phase 1 (Room Management)

- [ ] `roomId` field added to consultations table
- [ ] Unique constraint created
- [ ] `/api/availability/[roomId]/slots` endpoint working
- [ ] Consultation booking accepts `roomId`

### Phase 2 (Room Booking UI)

- [ ] Room cards display sessions count + next availability
- [ ] Duration selection works with 8 options (15-120 min)
- [ ] Slot grid shows available/booked with horizontal scroll
- [ ] Booking creates consultation with roomId
- [ ] Double-booking prevented with DB constraint error

### Phase 3 (Dashboard)

- [ ] Dashboard shows room utilization metrics
- [ ] Today's schedule viewable by room
- [ ] Quick indicators for next session per room

## Implementation Phases

### Phase 1: Room Management (Week 1)

**Goal:** Enable room-based booking with database schema and API

**Tasks:**

- Update consultations schema (add roomId, unique constraint)
- Create room-based availability endpoint
- Update consultation booking API
- Update types and validation schemas

### Phase 2: Room Booking UI (Week 2-3)

**Goal:** Therapists can book sessions via room cards interface

**Tasks:**

- Create room cards component
- Create duration selection component
- Create slot grid component with horizontal scrolling
- Create booking confirmation component
- Integrate with consultation creation flow
- Update consultation components to use room-based flow

### Phase 3: Dashboard Enhancement (Week 4)

**Goal:** Provide daily overview with room utilization

**Tasks:**

- Add room utilization metrics to dashboard
- Create room-by-room schedule view
- Add quick "next session" indicators
- Update dashboard components

## Rollback Plan

### Database Changes

- Create migration to drop `roomId` column from consultations
- Drop unique constraint
- Restore therapist-centric availability endpoint

### API Changes

- Keep old `/api/availability/[therapistId]/slots` endpoint as backup during transition
- Can revert to therapist-centric booking if issues arise

### UI Changes

- Keep manual planning component (ConsultationManualPlanningCard) available
- Can switch between old and new UI via feature flag if needed

## Open Questions

1. **Should we require roomId for ALL consultations or just new ones?**
   - Decision: New bookings require roomId, historical data preserved with NULL

2. **How to handle consultations created outside room booking flow (e.g., bulk import)?**
   - Decision: Allow roomId = NULL for system-created consultations

3. **Should therapist availability still be tracked after room-centric model?**
   - Decision: Yes, therapists still have availability templates used for room slot calculation

4. **How to display equipment in room detail view vs booking flow?**
   - Decision: Equipment not shown in room cards (too much info), visible in room edit/detail view

## References

- **Brainstorming Session:** `_bmad-output/analysis/brainstorming-session-2025-12-28.md`
- **Existing Rooms Spec:** `openspec/specs/rooms-management/spec.md`
- **Current Availability Implementation:** `server/api/availability/[therapistId]/slots.post.ts`
- **Consultations Schema:** `server/database/schema/consultation.ts`
- **Rooms Schema:** `server/database/schema/rooms.ts`
