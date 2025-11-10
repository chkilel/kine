# Change: Display Treatment Plan Data in Patient Overview

## Why

The patient overview tab currently displays static treatment plan data instead of real data from the database. This disconnect prevents users from seeing actual treatment progress and limits the usefulness of the overview dashboard.

## What Changes

- Replace static treatment plan data with dynamic data from the database
- Display the active treatment plan in the overview card
- Show all treatment plans in the history section at the bottom
- Add API endpoint to fetch patient treatment plans
- Update PatientOverviewTab component to consume real data

## Impact

- Affected specs: patient-overview (new capability)
- Affected code: PatientOverviewTab.vue, new API endpoint
- Dependencies: Treatment plans database schema, existing authentication patterns
