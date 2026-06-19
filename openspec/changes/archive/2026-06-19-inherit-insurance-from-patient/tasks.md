## 1. Database Migration

- [x] 1.1 Create migration to rename `insuranceInfo` column to `insuranceProvider` in treatment_plans table
- [x] 1.2 Create migration to add `customInsurerName` TEXT column to treatment_plans table
- [x] 1.3 Create migration to add `insurerSelectionType` TEXT column to treatment_plans table with default 'catalog'
- [x] 1.4 Test migrations locally with `pnpm db:gen` and `pnpm db:mig`
- [x] 1.5 Verify existing treatment plan data is preserved after migration

## 2. TypeScript Type Updates

- [x] 2.1 Update `shared/types/treatment-plan.ts` to rename `insuranceInfo` to `insuranceProvider` in TreatmentPlanCreate, TreatmentPlanUpdate, and TreatmentPlan interfaces
- [x] 2.2 Add `customInsurerName?: string` field to treatment plan types
- [x] 2.3 Add `insurerSelectionType?: 'catalog' | 'custom'` field to treatment plan types
- [ ] 2.4 Remove `coverageStatus` field from treatment plan types
- [x] 2.5 Run `pnpm typecheck` to verify no type errors

## 3. Frontend Implementation

- [x] 3.1 Add insurer selection type and custom insurer name fields to TreatmentPlanCreateSlideover form state
- [x] 3.2 Replace existing insurance UI (insuranceInfo + coverageStatus fields) with insurer dropdown matching PatientEditSlideover pattern
- [x] 3.3 Implement insurer dropdown with catalog options and "Autre" option for custom insurer
- [x] 3.4 Add conditional custom insurer name input field that appears when "Autre" is selected
- [x] 3.5 Implement computed property `selectedInsurerSlug` to sync dropdown selection with form state (catalog/custom toggle)
- [x] 3.6 Modify form initialization to inherit patient's insuranceProvider, customInsurerName, and insurerSelectionType
- [x] 3.7 Verify that editing existing treatment plans preserves the plan's own insurance data
- [x] 3.8 Import required constants: `INSURER_OPTIONS`, `INSURER_DROPDOWN_OPTIONS`, and `isInsurerSlug` from `~~/shared/utils/constants.insurers`

## 4. Testing

- [x] 4.1 Test creating a new treatment plan for a patient with catalog insurer — verify dropdown shows correct insurer selected
- [x] 4.2 Test creating a new treatment plan for a patient with custom insurer — verify dropdown shows "Autre" and custom name field displays insurer name
- [x] 4.3 Test creating a new treatment plan for a patient without insurance — verify dropdown has no selection
- [x] 4.4 Test selecting "Autre" in dropdown — verify custom insurer input appears
- [x] 4.5 Test overriding inherited insurer during plan creation
- [x] 4.6 Test editing an existing treatment plan — verify plan's insurer is preserved, not overwritten by patient data
- [x] 4.7 Verify database migration preserves existing treatment plan data
- [x] 4.8 Run `pnpm typecheck` to verify TypeScript types are correct
- [x] 4.9 Run `pnpm lint` to verify code follows conventions
- [x] 4.10 Update seed file to use insuranceProvider instead of insuranceInfo