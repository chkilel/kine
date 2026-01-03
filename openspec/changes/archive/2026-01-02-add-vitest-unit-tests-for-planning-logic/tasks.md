## 1. Setup and Configuration

- [x] 1.1 Install Vitest as dev dependency
- [x] 1.2 Create `vitest.config.ts` with proper configuration for Nuxt/Vite project
- [x] 1.3 Add test scripts to package.json (test, test:watch, test:coverage)
- [x] 1.4 Verify Vitest runs successfully with basic test

## 2. Core Planning Logic Tests

- [x] 2.1 Create test file `shared/utils/planning-utils.spec.ts`
- [x] 2.2 Write tests for `getEffectiveAvailability()` function
  - [x] 2.2.1 Test with only weekly templates (no exceptions)
  - [x] 2.2.2 Test with availability exceptions adding extra time
  - [x] 2.2.3 Test with full-day unavailability exception
  - [x] 2.2.4 Test with partial unavailability exceptions (blocking specific ranges)
  - [x] 2.2.5 Test combination of templates and exceptions
  - [x] 2.2.6 Test empty results when no availability exists

- [x] 2.3 Write tests for `generateTimeSlots()` function
  - [x] 2.3.1 Test basic slot generation with no conflicts
  - [x] 2.3.2 Test with booked periods blocking slots
  - [x] 2.3.3 Test with gap minutes requirement
  - [x] 2.3.4 Test with custom slot increment intervals
  - [x] 2.3.5 Test edge cases (range boundaries, zero duration)
  - [x] 2.3.6 Test multiple available ranges

- [x] 2.4 Write tests for `subtractBookedPeriods()` function
  - [x] 2.4.1 Test no overlap (range before booked period)
  - [x] 2.4.2 Test no overlap (range after booked period)
  - [x] 2.4.3 Test partial overlap (booked at start)
  - [x] 2.4.4 Test partial overlap (booked at end)
  - [x] 2.4.5 Test full containment (range completely covers booked period)
  - [x] 2.4.6 Test full overlap (booked period covers entire range)
  - [x] 2.4.7 Test multiple booked periods
  - [x] 2.4.8 Test gap minutes buffering

- [x] 2.5 Write tests for `hasConflict()` and `checkTimeSlotConflicts()` functions
  - [x] 2.5.1 Test no conflict with gap
  - [x] 2.5.2 Test conflict when slot overlaps booked period
  - [x] 2.5.3 Test conflict with gap violations
  - [x] 2.5.4 Test multiple booked periods
  - [x] 2.5.5 Test edge cases (exact boundary times)

## 3. Time Utility Function Tests

- [x] 3.1 Write tests for `addSecondsToTime()` function
  - [x] 3.1.1 Test HH:MM format conversion to HH:MM:SS
  - [x] 3.1.2 Test HH:MM:SS format (no change)

- [x] 3.2 Write tests for `calculateEndTime()` function
  - [x] 3.2.1 Test simple duration addition
  - [x] 3.2.2 Test crossing hour boundaries
  - [x] 3.2.3 Test crossing day boundaries (24+ hours)

- [x] 3.3 Write tests for `normalizeTimeFormat()` function
  - [x] 3.3.1 Test HH:MM format (no change)
  - [x] 3.3.2 Test HH:MM:SS format conversion to HH:MM
  - [x] 3.3.3 Test invalid format (throws error)

## 4. Validation and Documentation

- [x] 4.1 Run all tests and ensure 100% pass rate
- [x] 4.2 Run test coverage and ensure reasonable coverage for planning-utils.ts
- [x] 4.3 Update `openspec/project.md` testing strategy section
- [ ] 4.4 Verify tests run successfully in CI environment
- [x] 4.5 Add comments to complex test cases explaining edge cases and business logic

## 5. Code Quality

- [x] 5.1 Run Prettier on test files
- [x] 5.2 Run TypeScript type checking on test files
- [x] 5.3 Ensure test file organization matches source file structure
