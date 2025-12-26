# Change: Add Organization Members Loading for Therapist Selection

## Why

Currently, treatment plan creation and consultation planning only allow selecting the current user as the therapist. This limits functionality for multi-tenant organizations where multiple therapists work in the same clinic and need to be assigned to different patients and treatment plans. The system needs to load and display all organization members as therapist candidates.

The Better Auth `authClient.organization.listMembers()` API does not return all user database fields (such as `licenseNumber`, `specialization`, `phoneNumbers`, etc.). To provide complete therapist information for selection and display, we need direct database access via Drizzle.

## What Changes

- Create server API endpoint `GET /api/organizations/members` using Drizzle to query database
- Query joins `members` table with `users` table to fetch complete user data for all organization members
- Create `useOrganizationMembers` composable that calls the new API endpoint
- Update `TreatmentPlanCreateSlideover` to load and display organization members in therapist selection dropdown
- Update `ConsultationPlanningSlideover` to load and pass organization members to planning components
- Remove therapist loading logic from treatment plans GET endpoint (client-side loading from members composable)
- Ensure therapist selection works across all relevant components

## Impact

- **Affected specs**: New capability: organization-members
- **Affected code**:
  - `server/api/organizations/members/index.get.ts` - create new API endpoint
  - `app/composables/useOrganizationMembers.ts` - create new composable
  - `app/components/treatment-plan/TreatmentPlanCreateSlideover.vue:22`
  - `app/components/consultation/ConsultationPlanningSlideover.vue:21`
  - `app/components/consultation/ConsultationAutomaticPlanningCard.vue:5`
  - `app/components/consultation/ConsultationManualPlanningCard.vue:6`
  - `server/api/patients/[id]/treatment-plans/index.get.ts:75-92` - remove therapist loading
  - `app/components/patient/PatientTreatmentPlanSidebar.vue:46` - therapist display
  - `app/components/patient/PatientActiveTreatmentPlan.vue:79` - therapist display
  - `shared/types/treatment-plan.ts:52-61` - TreatmentPlanWithProgress type
