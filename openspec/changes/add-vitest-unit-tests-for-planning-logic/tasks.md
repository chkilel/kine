## 1. Setup and Configuration

- [ ] 1.1 Install Vitest as dev dependency
- [ ] 1.2 Create `vitest.config.ts` with proper configuration for Nuxt/Vite project
- [ ] 1.3 Add test scripts to package.json (test, test:watch, test:coverage)
- [ ] 1.4 Verify Vitest runs successfully with basic test

## 2. Core Planning Logic Tests

- [ ] 2.1 Create test file `shared/utils/planning-utils.spec.ts`
- [ ] 2.2 Write tests for `getEffectiveAvailability()` function
  - [ ] 2.2.1 Test with only weekly templates (no exceptions)
  - [ ] 2.2.2 Test with availability exceptions adding extra time
  - [ ] 2.2.3 Test with full-day unavailability exception
  - [ ] 2.2.4 Test with partial unavailability exceptions (blocking specific ranges)
  - [ ] 2.2.5 Test combination of templates and exceptions
  - [ ] 2.2.6 Test empty results when no availability exists

- [ ] 2.3 Write tests for `generateTimeSlots()` function
  - [ ] 2.3.1 Test basic slot generation with no conflicts
  - [ ] 2.3.2 Test with booked periods blocking slots
  - [ ] 2.3.3 Test with gap minutes requirement
  - [ ] 2.3.4 Test with custom slot increment intervals
  - [ ] 2.3.5 Test edge cases (range boundaries, zero duration)
  - [ ] 2.3.6 Test multiple available ranges

- [ ] 2.4 Write tests for `subtractBookedPeriods()` function
  - [ ] 2.4.1 Test no overlap (range before booked period)
  - [ ] 2.4.2 Test no overlap (range after booked period)
  - [ ] 2.4.3 Test partial overlap (booked at start)
  - [ ] 2.4.4 Test partial overlap (booked at end)
  - [ ] 2.4.5 Test full containment (range completely covers booked period)
  - [ ] 2.4.6 Test full overlap (booked period covers entire range)
  - [ ] 2.4.7 Test multiple booked periods
  - [ ] 2.4.8 Test gap minutes buffering

- [ ] 2.5 Write tests for `hasConflict()` and `checkTimeSlotConflicts()` functions
  - [ ] 2.5.1 Test no conflict with gap
  - [ ] 2.5.2 Test conflict when slot overlaps booked period
  - [ ] 2.5.3 Test conflict with gap violations
  - [ ] 2.5.4 Test multiple booked periods
  - [ ] 2.5.5 Test edge cases (exact boundary times)

## 3. Time Utility Function Tests

- [ ] 3.1 Write tests for `addSecondsToTime()` function
  - [ ] 3.1.1 Test HH:MM format conversion to HH:MM:SS
  - [ ] 3.1.2 Test HH:MM:SS format (no change)

- [ ] 3.2 Write tests for `calculateEndTime()` function
  - [ ] 3.2.1 Test simple duration addition
  - [ ] 3.2.2 Test crossing hour boundaries
  - [ ] 3.2.3 Test crossing day boundaries (24+ hours)

- [ ] 3.3 Write tests for `normalizeTimeFormat()` function
  - [ ] 3.3.1 Test HH:MM format (no change)
  - [ ] 3.3.2 Test HH:MM:SS format conversion to HH:MM
  - [ ] 3.3.3 Test invalid format (throws error)

## 4. Validation and Documentation

- [ ] 4.1 Run all tests and ensure 100% pass rate
- [ ] 4.2 Run test coverage and ensure reasonable coverage for planning-utils.ts
- [ ] 4.3 Update `openspec/project.md` testing strategy section
- [ ] 4.4 Verify tests run successfully in CI environment
- [ ] 4.5 Add comments to complex test cases explaining edge cases and business logic

## 5. Code Quality

- [ ] 5.1 Run Prettier on test files
- [ ] 5.2 Run TypeScript type checking on test files
- [ ] 5.3 Ensure test file organization matches source file structure
