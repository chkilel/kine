## 1. Create API Endpoint for Organization Members

- [x] 1.1 Create `server/api/organizations/members/index.get.ts`
- [x] 1.2 Import database schemas (members, users, organizations)
- [x] 1.3 Implement Drizzle query joining members with users table
- [x] 1.4 Filter by organizationId from active organization
- [x] 1.5 Select all user fields: id, firstName, lastName, name, email, image, licenseNumber, specialization, phoneNumbers
- [x] 1.6 Add authentication middleware to ensure user is logged in
- [x] 1.7 Add authorization to verify user is member of the organization
- [x] 1.8 Return array of members with complete user data
- [x] 1.9 Handle errors gracefully (unauthorized, not found, etc.)

## 2. Create Composable for Organization Members

- [x] 2.1 Create `app/composables/useOrganizationMembers.ts`
- [x] 2.2 Implement composable that calls `GET /api/organizations/members` endpoint
- [x] 2.3 Add loading and error state management
- [x] 2.4 Add computed properties for formatted names and therapist data
- [x] 2.5 Export composable for use in components
- [x] 2.6 Add TypeScript types for organization members response

## 3. Update Treatment Plan Creation Component

- [x] 3.1 Import and use `useOrganizationMembers` in TreatmentPlanCreateSlideover
- [x] 3.2 Replace current therapist loading (line 22) with organization members
- [x] 3.3 Update therapist dropdown to use organization members list
- [x] 3.4 Ensure proper loading and error states
- [x] 3.5 Test therapist selection and assignment

## 4. Update Consultation Planning Components

- [x] 4.1 Import and use `useOrganizationMembers` in ConsultationPlanningSlideover
- [x] 4.2 Replace current therapist loading (line 21) with organization members
- [x] 4.3 Pass organization members to ConsultationAutomaticPlanningCard
- [x] 4.4 Pass organization members to ConsultationManualPlanningCard
- [x] 4.5 Ensure therapist pre-selection works based on treatment plan

## 5. Update Treatment Plans GET Endpoint

- [x] 5.1 Remove therapist loading logic (lines 75-92) from treatment plans endpoint
- [x] 5.2 Return treatment plans with only therapistId field
- [x] 5.3 Keep progress calculation logic intact
- [x] 5.4 Verify API response format matches TreatmentPlanWithProgress type
- [x] 5.5 Test endpoint returns correct data structure

## 6. Update Type Definitions

- [x] 6.1 Add OrganizationMember type with all user fields (id, name, firstName, lastName, email, image, licenseNumber, specialization, phoneNumbers)
- [x] 6.2 Update TreatmentPlanWithProgress type to make therapist optional or remove it
- [x] 6.3 Ensure type safety across all affected components

## 7. Update Patient Display Components

- [x] 7.1 Import and use useOrganizationMembers in PatientTreatmentPlanSidebar
- [x] 7.2 Map therapistId from treatment plan to therapist data from organization members
- [x] 7.3 Import and use useOrganizationMembers in PatientActiveTreatmentPlan
- [x] 7.4 Map therapistId from treatment plan to therapist data from organization members
- [x] 7.5 Ensure therapist name display works correctly with new data structure

## 8. Check Therapist Usage Across Codebase

- [x] 8.1 Search for all references to "therapist" in Vue and TypeScript files
- [x] 8.2 Review each usage and update if needed
- [x] 8.3 Update any consultation components that reference therapists
- [x] 8.4 Update any other components that display therapist information

## 9. Testing and Validation

- [x] 9.1 Test API endpoint returns complete user data including additional fields
- [x] 9.2 Test useOrganizationMembers composable returns correct data
- [x] 9.3 Test treatment plan creation with therapist selection
- [x] 9.4 Test treatment plan update with therapist change
- [x] 9.5 Test consultation planning with therapist selection
- [x] 9.6 Verify therapist information displays correctly in patient views
- [x] 9.7 Verify treatment plans endpoint returns correct data without therapist details
- [x] 9.8 Test authorization: users can only see members of their own organization
- [x] 9.9 Run type checking and linting

## 10. Documentation

- [x] 10.1 Document the API endpoint usage and response format
- [x] 10.2 Document the useOrganizationMembers composable usage
- [x] 10.3 Update any relevant component documentation
