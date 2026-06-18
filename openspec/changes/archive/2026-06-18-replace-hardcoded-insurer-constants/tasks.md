## 1. Patient Form Updates

- [x] 1.1 Update `app/components/patient/PatientEditSlideover.vue` to import `INSURER_OPTIONS`, `INSURER_SLUGS`, `getInsurerLabel`, and `isInsurerSlug`
- [x] 1.2 Replace insurer free text input with `USelect` dropdown using `INSURER_OPTIONS`
- [x] 1.3 Add "Autre" option to dropdown for custom insurer names
- [x] 1.4 Add conditional free text input for custom insurer when "Autre" is selected
- [x] 1.5 Pre-select catalog insurer if existing value matches a slug in `INSURERS_CONFIG`
- [x] 1.6 Update form submission to store insurer slug for catalog insurers
- [ ] 1.7 Test patient edit form with catalog insurer selection
- [ ] 1.8 Test patient edit form with custom insurer input

- [x] 1.9 Update `app/pages/patients/new.vue` to use same insurer dropdown pattern as edit form
- [ ] 1.10 Test patient creation with catalog insurer
- [ ] 1.11 Test patient creation with custom insurer

## 2. Treatment Plan Display Updates

- [x] 2.1 Update `app/components/patient/treatment-plan-tab/Summary.vue` to import `getInsurerLabel`
- [x] 2.2 Replace direct `insuranceInfo` display with `getInsurerLabel()` logic
- [x] 2.3 Handle case where insurer value is not in catalog (display as-is)
- [ ] 2.4 Test treatment plan display with catalog insurer
- [ ] 2.5 Test treatment plan display with custom insurer

- [x] 2.6 Update `app/components/patient/overview-tab/ActivePlan.vue` to use `getInsurerLabel()`
- [x] 2.7 Update `app/components/patient/overview-tab/ActivePlansScroll.vue` to use `getInsurerLabel()`
- [ ] 2.8 Test insurer display across all patient overview views

## 3. Search and Replace Hardcoded Insurer Data

- [x] 3.1 Search codebase for hardcoded insurer arrays (e.g., `['CNSS', 'CNOPS', ...]`)
- [x] 3.2 Replace any found insurer arrays with `INSURER_OPTIONS`
- [x] 3.3 Search for hardcoded insurer label mappings or switch statements
- [x] 3.4 Replace label mappings with `getInsurerLabel()` calls
- [x] 3.5 Remove any redundant insurer label constants or enums
- [x] 3.6 Verify no hardcoded insurer names remain in display logic

## 4. Validation and Type Safety

- [x] 4.1 Review API validation schemas for insurer-related fields
- [x] 4.2 Update validation to accept both slugs and custom names
- [x] 4.3 Add Zod refinement to validate against `INSURER_SLUGS` where appropriate
- [x] 4.4 Update TypeScript types for insurer fields to allow both `InsurerSlug` and `string`
- [ ] 4.5 Verify type safety with `pnpm typecheck`

## 5. Testing

- [x] 5.1 Run `pnpm test` to ensure existing tests pass
- [ ] 5.2 Manually test patient creation/editing workflow
- [ ] 5.3 Manually test treatment plan display with various insurers
- [ ] 5.4 Verify backward compatibility with existing patient data
- [x] 5.5 Run `pnpm lint` and fix any issues
- [x] 5.6 Run `pnpm typecheck` to ensure type safety