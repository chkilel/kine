# Change: Implement Active Consultation Screen

## Why

The current workflow allows therapists to start a consultation by clicking "Démarrer", which only changes the status to 'in_progress'. There is no dedicated interface for documenting active consultation, capturing pain levels (EVA), taking notes, tracking consultation time, or viewing patient context during consultation. The reference HTML shows a comprehensive consultation interface that should be implemented using Nuxt UI's design system.

## What Changes

- Create a fullscreen slideover component `ActiveConsultationSlideover.vue` that opens when therapist clicks "Démarrer"
- Replace status-only workflow with consultation screen that provides comprehensive documentation tools
- Implement consultation timer with elapsed/remaining time display
- Add pain level (EVA) input with 0-10 scale and emoji indicators
- Add rich text notes editor with smart tags
- Display patient context sidebar with diagnosis, medical alerts, and progress stats
- Show previous consultation notes for reference
- Add consultation controls: pause, stop, complete
- Style all components using Nuxt UI design system (colors, components, utilities)

## Impact

- Affected specs: therapist-daily-schedule (modify), consultation-planning (modify), new spec: active-consultation-screen
- Affected code:
  - `app/pages/therapists/day.vue` - modify handleStartConsultation to open slideover
  - `app/components/consultation/PlanningSlideover.vue` - modify handleStartConsultation to open slideover
  - New component: `app/components/consultation/ActiveConsultationSlideover.vue`
  - Possibly new composable: `app/composables/useActiveConsultation.ts`
- Database schema: consultation table already has required fields (notes, painLevelBefore, painLevelAfter, treatmentSummary, observations, nextSteps, progressNotes)
- Improved therapist experience with comprehensive consultation documentation tools
