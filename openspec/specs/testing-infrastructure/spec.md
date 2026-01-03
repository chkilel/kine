# testing-infrastructure Specification

## Purpose
TBD - created by archiving change add-vitest-unit-tests-for-planning-logic. Update Purpose after archive.
## Requirements
### Requirement: Vitest Configuration

The system SHALL use Vitest as the primary unit testing framework, configured to work seamlessly with the Nuxt/Vite project structure.

#### Scenario: Vitest is installed and configured

- **GIVEN** the project uses Nuxt 4 and Vite
- **WHEN** Vitest is installed as a dev dependency
- **THEN** a `vitest.config.ts` configuration file exists that properly resolves Nuxt modules and shared code
- **AND** test scripts are available in package.json

#### Scenario: Tests can be executed from command line

- **GIVEN** Vitest is properly configured
- **WHEN** running `npm run test` or `pnpm test`
- **THEN** all unit tests execute and report results
- **AND** tests exit with appropriate exit code (0 for success, non-zero for failures)

### Requirement: Planning Logic Test Coverage

The system SHALL provide comprehensive unit tests for all public functions in `shared/utils/planning-utils.ts` that handle availability calculation, slot generation, and conflict detection.

#### Scenario: getEffectiveAvailability is fully tested

- **GIVEN** the `getEffectiveAvailability()` function accepts date, templates, and exceptions
- **WHEN** tests cover weekly templates, availability exceptions, unavailability exceptions, and combinations thereof
- **THEN** all code paths and edge cases have corresponding test cases
- **AND** tests verify correct time range calculations

#### Scenario: generateTimeSlots is fully tested

- **GIVEN** the `generateTimeSlots()` function generates slots from available ranges
- **WHEN** tests cover various scenarios including conflicts, gaps, and slot increments
- **THEN** all valid slot generation paths are tested
- **AND** edge cases (boundaries, zero duration, empty ranges) are covered

#### Scenario: subtractBookedPeriods is fully tested

- **GIVEN** the `subtractBookedPeriods()` function removes booked periods from available ranges
- **WHEN** tests cover all overlap scenarios (no overlap, partial overlap, full overlap)
- **THEN** time range subtraction logic is validated
- **AND** gap buffering behavior is tested

#### Scenario: Conflict detection is fully tested

- **GIVEN** the `hasConflict()` function checks for time slot conflicts
- **WHEN** tests cover scenarios with and without gaps
- **THEN** conflict detection logic is validated
- **AND** edge cases (exact boundaries, multiple bookings) are covered

### Requirement: Test Organization and Maintainability

The system SHALL organize tests to mirror the source code structure and provide clear, descriptive test cases that serve as living documentation.

#### Scenario: Test files follow naming conventions

- **GIVEN** a source file exists at `shared/utils/planning-utils.ts`
- **WHEN** tests are created
- **THEN** test file is named `shared/utils/planning-utils.spec.ts`
- **AND** test file is co-located with source file

#### Scenario: Test cases use descriptive naming

- **GIVEN** a test file exists
- **WHEN** test cases are written
- **THEN** test names clearly describe what is being tested and the expected outcome
- **AND** test names make the business logic understandable to developers

### Requirement: Code Quality Validation

The system SHALL ensure all test code passes linting and type checking before being committed.

#### Scenario: Tests pass Prettier formatting

- **GIVEN** Prettier is configured in the project
- **WHEN** test files are formatted
- **THEN** Prettier successfully formats test files without errors
- **AND** test files follow project code style (2-space tabs, single quotes)

#### Scenario: Tests pass TypeScript type checking

- **GIVEN** TypeScript strict mode is enabled
- **WHEN** test files are type-checked
- **THEN** no TypeScript errors are reported
- **AND** test types properly reflect the source code types

