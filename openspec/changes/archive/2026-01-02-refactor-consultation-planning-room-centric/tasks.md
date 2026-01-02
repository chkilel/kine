## 1. Database Schema Changes

- [x] 1.1 Create database migration to remove `maxSessions` column from `weeklyAvailabilityTemplates`
- [x] 1.2 Add unique index constraint to `consultations` table on `(roomId, date, startTime)` to prevent room double-booking
- [x] 1.3 Run migration in development and test data integrity

## 2. Backend API Changes

- [x] 2.1 Update `slotsRequestSchema` in `shared/types/availability.types.ts` to remove `maxSessions` parameter
- [x] 2.2 Refactor `server/api/availability/[therapistId]/slots.post.ts`:
  - [x] 2.2.1 Remove `maxSessions` logic from slot generation
  - [x] 2.2.2 Update slot generation to check room availability (simple binary: booked or free)
  - [x] 2.2.3 Remove `checkTimeSlotConflicts` call with `maxSessions` parameter
  - [x] 2.2.4 Simplify to `isRoomBooked(roomId, date, startTime, endTime)` check
- [x] 2.3 Update `shared/utils/planning-utils.ts`:
  - [x] 2.3.1 Remove `maxSessions` parameter from all functions
  - [x] 2.3.2 Remove concurrent session counting logic
  - [x] 2.3.3 Simplify conflict detection to binary room availability
- [x] 2.4 Update consultation creation API to validate room availability before booking

## 3. Type Definitions

- [x] 3.1 Remove `maxSessions` field from `WeeklyAvailabilityTemplate` type in `shared/types/availability.types.ts`
- [x] 3.2 Update availability template Zod schemas to remove `maxSessions` validation
- [x] 3.3 Update consultation planning types to reflect room-centric model

## 4. Frontend Components - Availability Management

- [x] 4.1 Update `app/components/profile/AvailabilityTemplateSlideover.vue`:
  - [x] 4.1.1 Remove `maxSessions` input field
  - [x] 4.1.2 Update form state to exclude `maxSessions`
  - [x] 4.1.3 Update template list display to remove "maxSessions" badges/text
- [x] 4.2 Update `app/components/profile/AvailabilityWeeklyTemplates.vue`:
  - [x] 4.2.1 Remove `maxSessions` display from template cards
  - [x] 4.2.2 Update template information display to focus on time and location only

## 5. Frontend Components - Consultation Planning

- [x] 5.1 Update `app/components/consultation/ConsultationManualPlanningCard.vue`:
  - [x] 5.1.1 Add room selection UI (if not already present)
  - [x] 5.1.2 Update slot fetching to pass `roomId` instead of relying on `maxSessions`
  - [x] 5.1.3 Update slot display to show room-based availability (simple: available or booked)
  - [x] 5.1.4 Remove any concurrent session indicators (e.g., "2/3", "1/3")
- [x] 5.2 Update `app/components/consultation/ConsultationAutomaticPlanningCard.vue`:
  - [x] 5.2.1 Add room-based planning logic (select room, then find available slots)
  - [x] 5.2.2 Update automatic planning algorithm to prioritize room availability
  - [x] 5.2.3 Remove `maxSessions` from planning parameters

## 6. Database Seeding

- [x] 6.1 Update `server/api/db/seed.post.ts`:
  - [x] 6.1.1 Remove `maxSessions` from template seed data
  - [x] 6.1.2 Ensure room assignments are included in consultation seeds

## 7. Testing & Validation

- [ ] 7.1 Test room booking prevents double-booking (same room, same date, same time)
- [ ] 7.2 Test slot generation shows correct availability per room
- [ ] 7.3 Test manual consultation planning with room selection
- [ ] 7.4 Test automatic consultation planning with room-based algorithm
- [ ] 7.5 Verify no concurrent session counting occurs in logs or UI
- [ ] 7.6 Test availability template creation without `maxSessions` field

## 8. Documentation

- [ ] 8.1 Update relevant OpenSpec specs to reflect room-centric model
- [ ] 8.2 Update API documentation for slot generation endpoint
- [ ] 8.3 Document room-based availability logic for future developers

## 9. Cleanup

- [x] 9.1 Remove any remaining references to `maxSessions` in codebase
- [x] 9.2 Remove concurrent session counting utility functions if unused
- [ ] 9.3 Clean up comments related to `maxSessions` logic
