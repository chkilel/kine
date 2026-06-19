## Context

TreatmentPlanCreateSlideover.vue currently uses `insuranceInfo` (text field) and `coverageStatus` (dropdown) for insurance information, initialized with hardcoded defaults (`insuranceInfo: ''` and `coverageStatus: 'not_required'`). The component receives a `patient` prop which contains the patient's `insuranceProvider` and related insurance data, but this data is not used during form initialization.

The existing UI differs from the robust pattern used in PatientEditSlideover.vue (lines 162-177) that features:
- Catalog-based insurer dropdown with predefined options
- Custom insurer input option when "Autre" is selected
- Proper state management for `insurerSelectionType` ('catalog' | 'custom')
- Computed property to sync dropdown selection with form state

Current behavior in TreatmentPlanCreateSlideover.vue (lines 101-102):
```typescript
insuranceInfo: treatmentPlan?.insuranceInfo || '',
coverageStatus: treatmentPlan?.coverageStatus || 'not_required',
```

Current UI (lines 311-324):
```vue
<UFormField label="Assurance / Mutuelle" name="insuranceInfo">
  <UInput v-model="formState.insuranceInfo" placeholder="Mutuelle SantéPlus..." />
</UFormField>
<UFormField label="Statut de couverture">
  <USelectMenu v-model="formState.coverageStatus" :items="INSURANCE_COVERAGE_OPTIONS" />
</UFormField>
```

**Database schema change required**: Rename `insuranceInfo` column to `insuranceProvider` and add `customInsurerName` and `insurerSelectionType` columns to match the new UI pattern and data model.

## Goals / Non-Goals

**Goals:**
- Automatically populate insurance fields from patient data when creating a new treatment plan
- Maintain existing behavior when editing a treatment plan (use plan's own insurance data)
- Preserve the ability for therapists to override inherited values
- No backend changes required — patient data is already available as a prop

**Non-Goals:**
- Modifying the patient insurance management flow
- Changing how treatment plan insurance is stored or validated
- Auto-updating insurance across existing treatment plans if patient data changes

## Decisions

### Replace insurance UI with catalog dropdown pattern

Replace the current insurance fields (`insuranceInfo` text input + `coverageStatus` dropdown) with the insurer selection pattern from PatientEditSlideover.vue:

```typescript
interface TreatmentPlanFormState extends TreatmentPlanUpdate {
  insurerSelectionType: 'catalog' | 'custom'
  customInsurerName?: string
}
```

Initialize these fields from patient data:
```typescript
const currentInsurer = patient.insuranceProvider || ''
const isCatalogInsurer = currentInsurer && isInsurerSlug(currentInsurer)
insuranceProvider: treatmentPlan?.insuranceProvider || (isCatalogInsurer ? currentInsurer : undefined),
customInsurerName: treatmentPlan?.customInsurerName || (isCatalogInsurer ? undefined : currentInsurer),
insurerSelectionType: treatmentPlan?.insurerSelectionType || (isCatalogInsurer ? 'catalog' : currentInsurer ? 'custom' : 'catalog'),
```

Create computed property for dropdown sync:
```typescript
const selectedInsurerSlug = computed({
  get: () => (formState.insurerSelectionType === 'catalog' ? formState.insuranceProvider : 'other'),
  set: (val) => {
    if (val === 'other') {
      formState.insurerSelectionType = 'custom'
      formState.insuranceProvider = formState.customInsurerName || undefined
    } else {
      formState.insurerSelectionType = 'catalog'
      formState.insuranceProvider = val
    }
  }
})
```

Update UI to match PatientEditSlideover pattern:
```vue
<UFormField label="Assureur" name="insuranceProvider">
  <USelect v-model="selectedInsurerSlug" :items="INSURER_DROPDOWN_OPTIONS" class="w-full" />
</UFormField>

<UFormField
  v-if="formState.insurerSelectionType === 'custom'"
  label="Nom de l'assureur"
  name="customInsurerName"
  class="md:col-span-2"
>
  <UInput
    v-model="formState.customInsurerName"
    placeholder="Nom de l'assureur personnalisé"
    class="w-full"
  />
</UFormField>
```

**Rationale:** Matches the UX pattern used in PatientEditSlideover.vue, providing a consistent user experience. Using patient data as a fallback reduces data entry while maintaining the override capability. The existing fallback logic for null/undefined values remains as safety nets.

### Database schema migration

Rename `insuranceInfo` column to `insuranceProvider` and add new columns:
```sql
-- Rename insuranceInfo to insuranceProvider
ALTER TABLE treatment_plans RENAME COLUMN insuranceInfo TO insuranceProvider;

-- Add new columns
ALTER TABLE treatment_plans ADD COLUMN customInsurerName TEXT;
ALTER TABLE treatment_plans ADD COLUMN insurerSelectionType TEXT DEFAULT 'catalog';
```

**Rationale:** Aligns database schema with new UI pattern and data model. The rename maintains existing data while adding support for catalog/custom distinction.

### Update TypeScript types

Update `shared/types/treatment-plan.ts`:
```typescript
export interface TreatmentPlanCreate {
  // ... existing fields
  insuranceProvider?: string  // renamed from insuranceInfo
  customInsurerName?: string  // new field
  insurerSelectionType?: 'catalog' | 'custom'  // new field
  // coverageStatus is removed
}
```

**Rationale:** Ensures type safety across frontend and backend with the new field names.

## Risks / Trade-offs

**Risk**: Patient may have outdated insurance information
**Mitigation**: Therapists can override the inherited values in the form. The insurer dropdown and custom insurer input fields remain fully editable.

**Trade-off**: Insurance data is copied at plan creation time, not synced
**Rationale:** Treatment plans represent the insurance state at the time of plan creation. If patient insurance changes, therapists should update the plan explicitly. This maintains auditability and prevents unexpected changes to historical data.

**Risk**: Patient prop may not always contain insurance fields
**Mitigation**: The existing fallback logic handles missing or null patient insurance data gracefully. The form will default to catalog selection mode with no insurer selected.

**Risk**: Database migration required
**Mitigation**: The migration is non-destructive (rename + add columns with defaults). Existing `insuranceInfo` data is preserved via the rename to `insuranceProvider`. New fields have sensible defaults (`insurerSelectionType: 'catalog'`). Test migration on staging before production.

**Risk**: Breaking change for existing API clients
**Mitigation:** This is a frontend-only change. The backend schema update is backward-compatible for existing data. No external API clients exist currently.