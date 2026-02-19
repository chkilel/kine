# Change: Add Appointment Actions Dropdown

## Why

Therapists currently have limited actions available in the appointment dropdown menu on the daily schedule view. They can only navigate to the patient page or click a placeholder action. This creates friction when they need to cancel, reschedule, or access session details directly from the daily view.

## What Changes

- Add "Cancel Appointment" action with confirmation modal for appointments not yet started
- Add "Postpone/Reschedule" action that opens PlanningSlideover for appointments not yet started
- Add "Pre-Session Notes" action that opens TreatmentSessionSlideover for appointments not yet started
- For appointments with started sessions (in progress or completed): limit actions to "Patient Details" and "Session Details"
- Update appointment dropdown menu items based on appointment status and treatment session existence
- Implement cancel confirmation workflow using existing AppModalConfirm component
- Integrate with existing PlanningSlideover for rescheduling
- Integrate with existing TreatmentSessionSlideover for session notes

## Impact

- Affected specs: therapist-daily-schedule
- Affected code:
  - `app/components/appointment/ListItem.vue` - Add action items to dropdown menu
  - `app/composables/useAppointment.ts` - Use existing useUpdateAppointmentStatus for cancellation
  - Existing components: PlanningSlideover, TreatmentSessionSlideover, AppModalConfirm
