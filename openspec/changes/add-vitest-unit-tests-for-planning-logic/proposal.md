# Change: Add Vitest unit tests for manual planning logic

## Why

The manual planning logic in `shared/utils/planning-utils.ts` contains complex time-range calculations, availability management, and conflict detection that are currently untested. This creates risk for regressions when modifying this critical business logic. Adding comprehensive unit tests with Vitest will ensure reliability, make refactoring safer, and provide living documentation of the planning algorithms' expected behavior.

## What Changes

- **ADDED**: Install and configure Vitest testing framework
- **ADDED**: Create test suite for `shared/utils/planning-utils.ts` functions
- **ADDED**: Test coverage for core planning logic including:
  - `getEffectiveAvailability()` - date-specific availability calculation
  - `generateTimeSlots()` - slot generation algorithms
  - `subtractBookedPeriods()` - time range subtraction logic
  - `hasConflict()` - conflict detection with gap handling
  - Time utility functions (`addSecondsToTime`, `calculateEndTime`, `normalizeTimeFormat`)
- **ADDED**: Test scripts in package.json for running tests
- **MODIFIED**: project.md testing strategy section to reflect Vitest adoption
- **ADDED**: Vitest configuration file (`vitest.config.ts`)

## Impact

- **Affected specs**:
  - New capability: `testing-infrastructure` (defines testing standards and framework setup)
- **Affected code**:
  - `package.json` - Add Vitest dependency and test scripts
  - `vitest.config.ts` - New configuration file
  - `shared/utils/planning-utils.spec.ts` - New test file
  - `openspec/project.md` - Update testing strategy documentation
- **Technical considerations**:
  - Vitest chosen for native ESM support and Vite integration with Nuxt
  - Tests will be unit-focused on pure functions in shared/utils
  - No external dependencies required (all functions use date-fns and @internationalized/date)
