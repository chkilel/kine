# Implementation Tasks

## 1. Update Appointment List Item Component

- [x] 1.1 Import required lazy components (LazyAppointmentPlanningSlideover, LazyAppModalConfirm)
- [x] 1.2 Create overlay instances for PlanningSlideover and ConfirmModal
- [x] 1.3 Import useUpdateAppointmentStatus composable
- [x] 1.4 Add computed property to determine if appointment has started (has treatment session or status is in_progress/completed)
- [x] 1.5 Remove "Continue" button for in-progress appointments (lines 156-166 in ListItem.vue)

## 2. Implement Dropdown Menu Actions

- [x] 2.1 Create menuItems computed property with conditional items based on appointment state
- [x] 2.2 For not-started appointments: Add "Cancel", "Postpone", "Pre-Session Notes", "Patient" items
- [x] 2.3 For started appointments: Add only "Patient Details" and "Session Details" items
- [x] 2.4 Add appropriate icons for each menu item

## 3. Implement Action Handlers

- [x] 3.1 Implement handleCancelAppointment function with confirmation modal
- [x] 3.2 Implement handlePostponeAppointment function to open PlanningSlideover
- [x] 3.3 Implement handlePreSessionNotes function to open TreatmentSessionSlideover
- [x] 3.4 Ensure handlers pass correct data to overlays (patient, appointment, treatment plan)

## 4. Cancel Appointment Workflow

- [x] 4.1 Wire up confirmation modal with appropriate title and message
- [x] 4.2 Call useUpdateAppointmentStatus with status 'cancelled' on confirmation
- [x] 4.3 Handle success/error states with toast notifications (already handled by composable)
- [x] 4.4 Ensure appointment list refreshes after cancellation

## 5. Testing & Validation

- [x] 5.1 Test dropdown menu appears with correct actions for scheduled appointments
- [x] 5.2 Test dropdown menu shows limited actions for in-progress appointments
- [x] 5.3 Test cancel confirmation flow
- [x] 5.4 Test postpone action opens PlanningSlideover with correct data
- [x] 5.5 Test pre-session notes opens TreatmentSessionSlideover
- [x] 5.6 Verify "Continue" button is removed for in-progress sessions
- [x] 5.7 Verify all actions work correctly on mobile devices
- [x] 5.8 Run type checking and linting
