# Change: Modernize Treatment Plan Notes & Follow-up UI

## Why

The current "Notes & Follow-up" section in PatientTreatmentPlanSidebar.vue displays treatment plan notes in a basic list format without interactive capabilities. Therapists need a more user-friendly interface for adding clinical notes and tracking patient progress over time.

## What Changes

- Replace basic note list with interactive UI including textarea for adding clinical notes
- Add send button for note submission
- Implement timeline-style display for existing notes with visual indicators
- Use Nuxt UI design system colors (text-primary, text-muted, bg-muted, border-default, etc.) instead of hardcoded colors
- Maintain existing data structure (treatmentPlan.notes array with author, date, content fields)
- Preserve all existing component props and events
- Add scrollable container for notes with max-height to manage space efficiently

## Impact

- Affected specs: New spec `treatment-plan-notes` to be created
- Affected code: app/components/patient/PatientTreatmentPlanSidebar.vue (lines 193-212)
- **No changes to data structure or props interface**
- Improved user experience with modern timeline design
- Better visual hierarchy and note readability
- Consistent design with rest of the application using Nuxt UI colors
