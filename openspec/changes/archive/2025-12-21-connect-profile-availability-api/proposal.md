# Change: Connect Profile Availability and Exception with API

## Why

The profile availability components exist but are not connected to the live API data, preventing users from managing their weekly templates and exception schedule through the UI.

## What Changes

- Connect AvailabilityWeeklyTemplates component to fetch/display templates from API
- Connect AvailabilityExceptions component to fetch/display exceptions from API
- Wire up template slideover create/edit operations with API mutations
- Wire up exception slideover create/edit operations with API mutations
- Ensure real-time updates after CRUD operations

## Impact

- Affected specs: availability-exception-slideover, availability-template-slideover
- Affected code: profile availability components, composables already exist
- Users can now manage their availability through the profile UI
