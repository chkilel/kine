## Why

Currently, treatment plan creation and modification use hardcoded default insurance values (`insuranceInfo: ''` and `coverageStatus: 'not_required'`), requiring therapists to manually enter this information for each plan. This creates unnecessary data entry work and potential inconsistencies, especially since patients typically have stable insurance information that should be reused across treatment plans.

## What Changes

- **Inherit patient insurance when creating treatment plans**: Automatically populate `insuranceProvider`, `customInsurerName`, and `insurerSelectionType` from the patient's existing insurance data instead of using hardcoded defaults
- **Use same UI pattern as PatientEditSlideover**: Implement insurer dropdown with catalog selection and custom insurer input option, matching the UX pattern used in patient editing
- **Modifiable during plan creation/edit**: Allow therapists to override the inherited insurance information in the TreatmentPlanCreateSlideover when needed (e.g., different insurer for specific treatment)
- **No breaking changes**: Existing treatment plans remain unchanged; only new/modified plans inherit from patient data

## Capabilities

### New Capabilities

### Modified Capabilities

- `treatment-plan-management`: Update treatment plan creation to inherit insurance from patient profile, while maintaining the ability to override during plan creation/edit

## Impact

- **Affected code**:
  - `app/components/treatment-plan/TreatmentPlanCreateSlideover.vue`: Replace insuranceInfo and coverageStatus fields with insuranceProvider dropdown, customInsurerName input, and insurerSelectionType state; modify form initialization to read patient's insurance data
  - `app/composables/useTreatmentPlan.ts`: May need adjustment if form initialization logic is shared
  - `shared/types/treatment-plan.ts`: Update treatment plan types to rename `insuranceInfo` to `insuranceProvider` and add `customInsurerName` and `insurerSelectionType` fields
  - `server/database/schema/treatment-plan.ts`: Rename `insuranceInfo` column to `insuranceProvider` and add `customInsurerName` and `insurerSelectionType` columns
  - **Database**: Schema migration required to rename column and add new fields
  - **API**: Update treatment plan create/update endpoints to accept new field names
  - **User experience**: Reduced data entry for therapists, improved consistency across patient's treatment plans