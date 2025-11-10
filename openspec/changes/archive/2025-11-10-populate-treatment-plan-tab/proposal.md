# populate-treatment-plan-tab Change Proposal

## Summary

Replace static treatment plan data in PatientTreatmentPlanTab.vue with dynamic data from the database, implementing proper empty states using Nuxt UI Empty component and real-time progress calculation.

## Background

The PatientTreatmentPlanTab.vue component currently displays hardcoded mock data for treatment plans, sessions, and documents. This needs to be replaced with real data fetched from the database to provide actual patient treatment information.

## Proposed Solution

Update the PatientTreatmentPlanTab component to:

1. Fetch real treatment plan data from the existing API endpoint
2. Display the current active plan with accurate progress calculation
3. Show an empty state using Nuxt UI Empty component when no plans exist
4. Handle loading states during data fetching
5. Maintain the existing UI layout and functionality

## Impact Assessment

- **Scope**: Single component update with API integration
- **Risk**: Low - API endpoint already exists and is functional
- **Dependencies**: None - uses existing infrastructure
- **Testing**: Manual verification of data display and empty states

## Why

The current PatientTreatmentPlanTab component displays static mock data, which provides no real value to users and doesn't reflect actual patient treatment information. This change is essential to:

1. **Provide Real Value**: Users need to see actual treatment plan data to make informed clinical decisions
2. **Enable Clinical Workflow**: Therapists cannot track patient progress without real data
3. **Improve User Experience**: Empty states guide users to take appropriate actions
4. **Maintain Data Consistency**: Ensure the UI reflects the actual state of patient care

## Success Criteria

- Treatment plan data loads from database for patients with plans
- Empty state displays correctly for patients without plans
- Progress calculation reflects actual completed sessions
- Loading states provide good UX during data fetching
- Existing functionality (create plan, view details) remains intact
