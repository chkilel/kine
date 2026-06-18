## ADDED Requirements

### Requirement: System provides centralized insurer catalog
The system SHALL provide a centralized catalog of Moroccan insurers sourced from FMA/ACAPS registries.

#### Scenario: Access insurer configuration
- **WHEN** code imports `INSURERS_CONFIG` from `shared/utils/constants.insurers.ts`
- **THEN** configuration object contains insurer entries with name, phone, address, city, website, and isActive status

### Requirement: System filters active insurers for UI display
The system SHALL provide a filtered array of active insurers for UI components.

#### Scenario: Access insurer options for dropdown
- **WHEN** code imports `INSURER_OPTIONS` from `shared/utils/constants.insurers.ts`
- **THEN** array contains only active insurers with slug, label (shortName or name), and full insurer data

### Requirement: System provides type-safe insurer slug enumeration
The system SHALL provide TypeScript type for insurer slugs to ensure type safety.

#### Scenario: Use insurer slug type
- **WHEN** code references `InsurerSlug` type
- **THEN** type includes all insurer slugs from `INSURERS_CONFIG`

### Requirement: System provides insurer lookup helpers
The system SHALL provide helper functions to retrieve insurer data and labels.

#### Scenario: Lookup insurer by slug
- **WHEN** code calls `getInsurer('cnss')`
- **THEN** function returns CNSS insurer entry or null if not found

#### Scenario: Get insurer display label
- **WHEN** code calls `getInsurerLabel('cnss')`
- **THEN** function returns shortName ('CNSS') if available, otherwise full name

#### Scenario: Validate insurer slug
- **WHEN** code calls `isInsurerSlug('cnss')`
- **THEN** function returns true if slug exists in configuration, false otherwise

### Requirement: Patient forms use insurer dropdown from catalog
The system SHALL provide insurer selection dropdown using centralized catalog.

#### Scenario: Create patient with catalog insurer
- **WHEN** user creates a patient and selects insurer from dropdown
- **THEN** dropdown options are populated from `INSURER_OPTIONS`
- **AND** selected value is insurer slug (e.g., 'cnss')

#### Scenario: Create patient with custom insurer
- **WHEN** user creates a patient and selects "Other" option
- **THEN** user can enter custom insurer name in free text field
- **AND** custom name is stored as-is in database

### Requirement: Patient edit form preserves existing insurer values
The system SHALL display current insurer value in dropdown if it matches catalog, otherwise show as custom value.

#### Scenario: Edit patient with catalog insurer
- **WHEN** user edits patient with insuranceProvider matching a catalog slug
- **THEN** dropdown pre-selects matching insurer
- **AND** label displays using `getInsurerLabel()`

#### Scenario: Edit patient with custom insurer
- **WHEN** user edits patient with insuranceProvider not in catalog
- **THEN** "Other" option is selected
- **AND** free text field displays current custom value

### Requirement: Treatment plans display insurer labels consistently
The system SHALL use `getInsurerLabel()` for all insurer display in treatment plans.

#### Scenario: Display insurer in treatment plan summary
- **WHEN** treatment plan is displayed with insuranceInfo
- **THEN** insurer name is formatted using `getInsurerLabel(slug)` if slug matches catalog
- **AND** raw value is displayed as-is if not in catalog

#### Scenario: Display insurer in patient overview
- **WHEN** patient overview shows insurance information
- **THEN** insurer display uses consistent label formatting across all views

### Requirement: System handles deregistered insurers gracefully
The system SHALL exclude inactive insurers from dropdowns but preserve historical data.

#### Scenario: Dropdown excludes inactive insurers
- **WHEN** insurer options are generated
- **THEN** insurers with `isActive: false` are not included in dropdown options

#### Scenario: Display historical insurer data
- **WHEN** patient has insurer that was later set to `isActive: false`
- **THEN** historical data is preserved and displayed correctly
- **AND** `getInsurer()` returns data even for inactive insurers