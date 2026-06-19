## Why

The codebase has multiple locations where insurer names, labels, and metadata are hardcoded as strings and arrays. This creates duplication, inconsistency, and maintenance burden. We recently created a centralized constants file (`shared/utils/constants.insurers.ts`) with insurer data sourced from FMA/ACAPS registries, but the codebase still uses hardcoded values throughout. This change replaces all hardcoded insurer fields with references to the centralized constants, ensuring consistency and maintainability.

## What Changes

- **Add constants import**: Import `INSURER_OPTIONS` and `INSURER_SLUGS` from `shared/utils/constants.insurers.ts` wherever insurer dropdowns or selections are rendered
- **Replace hardcoded insurer arrays**: Replace any hardcoded insurer option arrays (e.g., `['CNSS', 'CNOPS', 'Wafa Assurance', ...]`) with `INSURER_OPTIONS`
- **Replace hardcoded insurer slugs**: Replace any hardcoded insurer slug lists or enums with `INSURER_SLUGS`
- **Update insurer validation**: Ensure validation schemas reference the constants where applicable
- **Update insurer display**: Ensure display logic uses `getInsurerLabel()` helper instead of hardcoded label mappings
- **Remove insurer-specific UI labels**: Remove any insurer-specific label constants that are now redundant

## Capabilities

### New Capabilities
- `centralized-insurer-constants`: Centralized insurer data management using FMA/ACAPS-sourced constants

### Modified Capabilities
- None (this is an implementation refactoring with no requirement-level changes)

## Impact

**Affected Code:**
- Patient edit/create forms with insurer selection dropdowns
- Treatment plan forms with insurer information display
- Any components with hardcoded insurer arrays or slugs
- Validation schemas that reference insurer values

**No Breaking Changes:**
- Existing data remains valid (stored insurer names/strings are preserved)
- UI behavior remains unchanged from user perspective
- Type safety is improved with `InsurerSlug` type where applicable

**Benefits:**
- Single source of truth for insurer data
- Reduced code duplication
- Easier maintenance when insurer catalog changes
- Type-safe insurer references