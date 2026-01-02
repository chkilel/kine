# Change: Refactor consultation planning from therapist-centric to room-centric

## Why

The current therapist-centric planning model with `maxSessions` introduces unnecessary complexity. Therapists naturally think in terms of rooms and physical constraints, not abstract concurrent session limits. By shifting to a room-centric model, we eliminate the `maxSessions` complexity entirely—the physical room constraint becomes the natural concurrent session limit, simplifying both logic and UX.

## What Changes

- **BREAKING**: Remove `maxSessions` field from `weeklyAvailabilityTemplates` table
- **BREAKING**: Change availability slot generation logic from therapist-based concurrent counting to room-based binary availability
- **MODIFIED**: Update slot generation API to check room availability instead of therapist concurrent sessions
- **MODIFIED**: Update consultation planning UI to show room-based availability rather than therapist-based slots
- **MODIFIED**: Ensure unique database constraint prevents double-booking rooms (`roomId, date, startTime`)
- **REMOVED**: Remove concurrent session counting logic and UI indicators ("2/3", "1/3")
- **ADDED**: Room availability checks become the primary constraint for slot generation

## Impact

- **Affected specs**:
  - `rooms-management` (extend with availability logic)
  - `availability-exception-slideover` (remove maxSessions field)
  - New capability needed: `consultation-planning` (room-centric approach)
- **Affected code**:
  - `server/database/schema/availability.ts` (remove maxSessions)
  - `server/api/availability/[therapistId]/slots.post.ts` (refactor logic)
  - `app/components/consultation/ConsultationManualPlanningCard.vue` (update UI)
  - `app/components/consultation/ConsultationAutomaticPlanningCard.vue` (update UI)
  - `app/components/profile/AvailabilityTemplateSlideover.vue` (remove maxSessions input)
  - `shared/utils/planning-utils.ts` (simplify logic)
  - `shared/types/availability.types.ts` (remove maxSessions)
