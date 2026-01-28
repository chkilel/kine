# Change: Migrate Consultation Slideover to Dedicated Page

**Date**: 2026-01-27
**Status**: In Progress
**Impact**: Major

## Summary

Migrate `ActiveConsultationSlideover.vue` component to a dedicated page at `/consultations/[id]` to enable complete clinical workflow implementation, proper URL navigation, and better state management.

## Problem

- Missing post-session pain assessment and summary/analytics steps
- No URL navigation, cannot bookmark or return to specific session states
- Blocks access to other information (agenda, patient history) during active session
- Poor recovery path if tab is accidentally closed
- Complex multi-step workflow doesn't fit slideover pattern well

## Solution

Create dedicated page with 4-step workflow managed via URL query parameters:

1. **Pre-Session**: Capture initial pain level
2. **Active Session**: Document treatment with timer, notes, tags
3. **Post-Session**: Capture final pain level, calculate differential
4. **Summary**: View analytics, handle billing, book next appointment

## Files

- `proposal.md` - Detailed proposal with problem, solution, and impact
- `design.md` - Architecture, layout, and component design
- `tasks.md` - Implementation tasks organized by phase
- `specs/consultation-workflow.md` - Test scenarios for each step

## Progress

### Completed (Phases 1-5)

- ✅ Phase 1: Create consultation page structure and pre-session step
- ✅ Phase 2: Implement active session step
- ✅ Phase 3: Implement post-session step with final EVA
- ✅ Phase 4: Implement summary step with analytics and billing
- ✅ Phase 5: Update integration points (day.vue, PlanningSlideover)

### Pending

- ⏳ Phase 6: Testing and polish
- ⏳ Phase 7: Documentation and cleanup

## Components Created

- `app/pages/consultations/[id].vue` - Main consultation page
- `app/components/consultation/ConsultationStepProgress.vue` - Step progress indicator
- `app/components/consultation/ConsultationPatientInfoSidebar.vue` - Patient information sidebar
- `app/components/consultation/PreSessionStep.vue` - Pre-session step component
- `app/components/consultation/ActiveSessionStep.vue` - Active session step component
- `app/components/consultation/PostSessionStep.vue` - Post-session step component
- `app/components/consultation/SummaryStep.vue` - Summary step component
- `app/components/consultation/ConsultationEvaFinalCard.vue` - Final EVA capture card
- `app/components/consultation/ConsultationAnalyticsChart.vue` - Pain evolution chart
- `app/components/consultation/ConsultationBillingSection.vue` - Billing section
- `app/components/consultation/NextAppointmentBooking.vue` - Next appointment booking

## Files Modified

- `app/pages/therapists/day.vue` - Updated to use navigateTo instead of overlay.open
- `app/components/consultation/PlanningSlideover.vue` - Updated to use navigateTo instead of overlay.open

## Next Steps

1. Test all steps end-to-end
2. Test URL navigation and recovery
3. Test responsive design
4. Complete Phase 7: Documentation and cleanup
5. Optionally keep old slideover for read-only mode

## Related

- `openspec/changes/archive/2026-01-26-implement-active-session-slideover/` - Original slideover implementation
- `app/components/consultation/ActiveConsultationSlideover.vue` - Old component (can be removed or kept for read-only)
