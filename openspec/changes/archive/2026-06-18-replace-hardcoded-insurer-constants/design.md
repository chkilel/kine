## Context

**Current State:**
The codebase contains multiple locations where insurer data is hardcoded:
- Patient forms use raw text inputs for insurer selection with no standardized options
- Treatment plans display insurer information but use hardcoded display logic
- Some components may have inline arrays of insurer names or slugs
- Validation schemas reference insurer values without a central source of truth

**Background:**
We recently created `shared/utils/constants.insurers.ts` with:
- `INSURERS_CONFIG`: Full insurer catalog (name, phone, address, website, isActive)
- `INSURER_OPTIONS`: Filtered active insurers with slugs and labels
- `INSURER_SLUGS`: Array of all insurer slugs for type safety
- Helper functions: `getInsurer()`, `getInsurerLabel()`, `isInsurerSlug()`

**Constraints:**
- Patient table stores `insuranceProvider` as free text (for backward compatibility)
- No database schema changes allowed (this is purely frontend refactoring)
- Must preserve existing data (some patients may have insurer names not in our catalog)
- Must work with Nuxt UI components and existing form patterns

## Goals / Non-Goals

**Goals:**
- Replace all hardcoded insurer arrays with `INSURER_OPTIONS`
- Replace insurer selection UI from free text to dropdown/select using centralized constants
- Use `getInsurerLabel()` for consistent display across the application
- Improve type safety by using `InsurerSlug` where insurer references are validated
- Ensure data consistency by using single source of truth

**Non-Goals:**
- No database schema changes (patient.insuranceProvider remains text)
- No API changes (backend validation remains unchanged)
- No migration of existing data (preserve all insurer names already stored)
- No new insurer addition/removal UI (catalog management remains manual)

## Decisions

### 1. Use USelect/UCombobox for Insurer Selection
**Decision:** Replace free text inputs with `USelect` component for insurer dropdowns.

**Rationale:**
- Nuxt UI component already in use throughout the app
- Provides clean, accessible dropdown interface
- Supports search/filter for large lists
- Type-safe with our `InsurerSlug` type

**Alternatives Considered:**
- `UCombobox`: More complex, unnecessary for simple dropdown
- Autocomplete: Overkill, insurer list is small and static
- Radio buttons: Too many options, poor UX

### 2. Preserve Backward Compatibility for Custom Insurer Names
**Decision:** Keep `insuranceProvider` as free text in DB, allow "Other" option in dropdown for custom values.

**Rationale:**
- Some patients may have insurers not in our catalog
- Cannot migrate existing data without risk of data loss
- Clinics may have private/mutuelle partnerships not in FMA registry

**Alternatives Considered:**
- Force selection from catalog only: Would break existing data
- Add all possible insurers: Impossible to maintain completeness
- Remove custom insurer support: Would limit clinic flexibility

### 3. Display Using getInsurerLabel() Helper
**Decision:** Use `getInsurerLabel(slug)` for all insurer display (treatment plans, patient profiles, etc.).

**Rationale:**
- Centralizes label logic in one place
- Handles shortName fallback automatically
- Type-safe with `InsurerSlug` input
- Consistent display across app

**Alternatives Considered:**
- Inline label mapping: Code duplication
- Direct `INSURERS_CONFIG[slug].shortName`: No fallback handling

### 4. Use INSURER_OPTIONS for All Dropdowns
**Decision:** Standardize all insurer dropdowns to use `INSURER_OPTIONS` array.

**Rationale:**
- Single source of truth for dropdown data
- Automatic filtering of inactive insurers
- Consistent label (shortName) across all dropdowns
- Simplifies maintenance when catalog changes

**Alternatives Considered:**
- Per-component filtering: Unnecessary complexity
- Derived arrays based on context: Too many variations

## Risks / Trade-offs

### Risk: Existing Patient Data May Not Match Catalog
**Description:** Patients with insurer names not in `INSURERS_CONFIG` may display incorrectly or not match dropdown options.

**Mitigation:**
- Add "Other" or "Autre" option to dropdown for custom values
- Display stored value as-is when not matching any catalog entry
- Update form to allow free text entry when "Other" selected
- Document this behavior for clinic admins

### Risk: Performance Impact from Repeated Imports
**Description:** Multiple components importing constants may cause unnecessary bundle size.

**Mitigation:**
- Constants file is small (~150 lines, compile-time data)
- Nuxt auto-imports will tree-shake unused exports
- No runtime execution, just static data
- Acceptable trade-off for maintainability

### Risk: Type Safety Gaps with Text Storage
**Description:** `insuranceProvider` stored as text cannot enforce type safety at DB level.

**Mitigation:**
- Add Zod validation at API layer to validate against `INSURER_SLUGS` when appropriate
- Keep custom insurers as valid for flexibility
- Document type mismatch between storage and display
- Consider future migration to slug-based storage if use case demands it

## Migration Plan

### Deployment Steps:
1. **Phase 1: Constants Integration**
   - Import `INSURER_OPTIONS` and `getInsurerLabel` in patient edit/create components
   - Replace free text input with `USelect` dropdown
   - Add "Other" option with conditional free text input
   - Update treatment plan display to use `getInsurerLabel()`

2. **Phase 2: Search and Replace**
   - Find all hardcoded insurer arrays or slugs
   - Replace with references to constants
   - Update any validation schemas
   - Remove redundant insurer label constants

3. **Phase 3: Testing**
   - Test patient creation/editing with catalog insurers
   - Test patient creation/editing with custom insurers
   - Verify display logic in treatment plans
   - Run existing test suite

### Rollback Strategy:
- All changes are in frontend code only
- No database changes, so no data migration to reverse
- Git revert suffices for rollback
- No risk to production data

## Open Questions

None identified. This is a straightforward refactoring with clear scope.