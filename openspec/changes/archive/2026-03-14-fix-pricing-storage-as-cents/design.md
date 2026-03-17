# Design: Fix Pricing Storage to Use Cents

## Context

The organization pricing specification requires prices to be stored in cents (as integer values) to avoid floating-point precision issues. However, the current implementation stores prices "as is" (currency units like 150 for 150 MAD) without conversion. This creates a misalignment between the spec and the implementation.

### Stakeholders

- Users: Need to see prices in familiar currency units (MAD, DH)
- Database: Needs precise integer values stored as cents
- API: Needs to return values in cents as per spec
- UI: Needs to display values in currency units

## Goals / Non-Goals

### Goals

- Store all pricing values as cents in the database (integers)
- Display pricing as currency units in the UI (divided by 100)
- Maintain existing spec compliance for API responses (cents)
- Provide clean conversion utilities for price handling

### Non-Goals

- Changing the API response format (must remain in cents as per spec)
- Supporting multiple currencies (single currency MAD/DH)
- Adding historical price tracking
- Changing pricing calculation logic in treatment plans or sessions

## Decisions

### Decision 1: Conversion Layer in Frontend

Store prices as cents in the database and API, handle conversion only in the frontend components.

**Rationale**:

- Keeps backend simple and consistent with spec
- API responses return cents, which matches the spec
- Conversion happens at display/edit time in UI
- Prevents inconsistency between storage and transport layers

**Alternatives considered**:

- Convert at API layer: Would require changing API responses, breaking spec compliance
- Convert at database layer: Would make raw database values confusing for direct queries
- Dual format: Too complex and error-prone

### Decision 2: Utility Functions for Conversion

Create dedicated utility functions in `shared/utils/price.ts`:

- `centsToCurrency(cents: number): number` - Divide by 100
- `currencyToCents(currency: number): number` - Multiply by 100

**Rationale**:

- Centralized conversion logic
- Easy to test and maintain
- Reusable across components
- Clear intent in code

### Decision 3: Seed Data Update

Update seed data files to use cents format for all pricing values.

**Rationale**:

- Project is still in development, no production data to migrate
- Seed data provides consistent test data for all environments
- Direct update is simpler than migration script
- Ensures all dev/staging environments start with correct data

### Decision 4: Form Input Handling

Forms accept/display currency units, convert to cents before submission.

**Rationale**:

- Users expect to type "150" for 150 MAD, not "15000"
- Conversion happens transparently in the form submit handler
- No need for custom input components

## Risks / Trade-offs

### Risk 1: Seed Data Inconsistency

**Risk**: Seed data might not be updated consistently across all files.

**Mitigation**:

- Search for all seed data files in the project
- Use global find/replace with careful review
- Validate seed data loads correctly after update
- Test with seeded organization data

### Risk 2: UI Display Inconsistency

**Risk**: Some UI components might not apply conversion correctly.

**Mitigation**:

- Use utility functions consistently
- Add comprehensive test coverage for price display
- Code review all changes that touch pricing

## Seed Data Update

### Steps to Update Seed Data

1. Locate all seed data files containing organization pricing
2. Update pricing values to use cents format (multiply by 100)
3. Common conversions:
   - 150 MAD → 15000 cents
   - 200 MAD → 20000 cents
   - 120 MAD → 12000 cents
4. Verify seed data loads correctly with new values

## Open Questions

1. Should we handle rounding for division operations? (Currently using integer division which is safe for cents)
