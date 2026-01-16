# Change: Add Therapist Day Start Screen

## Why

Therapists need a dedicated screen to start their day and get an overview of their daily schedule. Currently, there is no centralized view where a therapist can see all their planned consultations for a given day at a glance, making it difficult to prepare for their daily workload.

## What Changes

- Create a new page at `/therapists/day` that displays the therapist's daily schedule
- Add API endpoint to fetch consultations for the authenticated therapist on a specific date
- Display consultations in chronological order with key information (patient, time, type, status, room)
- Show summary statistics (total consultations, completed, upcoming)
- Include a "Start Session" button on consultation cards to quickly begin sessions
- Use existing `PUT /api/patients/[id]/consultations/[consultationId]` endpoint for status updates
- Include navigation to patient details and consultation details
- Support starting sessions both from the daily view card and from consultation details page
- Support date navigation to view other days

## Impact

- New capability: therapist-daily-schedule
- New page: `/therapists/day`
- New API endpoint: `GET /api/therapists/consultations`
- Reusing existing endpoint: `PUT /api/patients/[id]/consultations/[consultationId]` for status updates
- Affected code: app/pages/therapists/, server/api/, app/composables/
- Therapists can quickly see their daily workload and prepare for sessions
