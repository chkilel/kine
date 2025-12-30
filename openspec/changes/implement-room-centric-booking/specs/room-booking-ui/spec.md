# Room Booking UI Specification

## Purpose

Define user interface components for room-based consultation booking, providing therapists with an intuitive workflow to select a room, choose a session duration, pick an available time slot, and confirm the booking. The UI shall be mobile-optimized with progressive disclosure and clear visual feedback.

## ADDED Requirements

### Requirement: Room Cards Overview Component

The system SHALL provide a RoomCards component that displays all rooms in the organization with quick availability preview (sessions count and next/last available times). The component shall use vertical card layout optimized for mobile viewing.

#### Scenario: Display room cards with availability preview

- **GIVEN** an organization has 3 rooms: "Salle de traitement", "Salle d'exercice", "Salle de kiné"
- **AND** "Salle de traitement" has 5 available slots on 2025-01-15
- **AND** "Salle d'exercice" has 8 available slots
- **AND** "Salle de kiné" has 3 available slots
- **WHEN** the RoomCards component is rendered
- **THEN** 3 room cards are displayed in vertical stack
- **AND** each card shows: room name, sessions count, next available time, last available time
- **AND** "Salle de traitement" shows: "5 créneaux disponibles", "Prochaine: 09:00", "Dernière: 16:00"
- **AND** "Salle d'exercice" shows: "8 créneaux disponibles", "Prochaine: 09:15", "Dernière: 16:45"
- **AND** "Salle de kiné" shows: "3 créneaux disponibles", "Prochaine: 10:00", "Dernière: 17:00"

#### Scenario: Do NOT display equipment in room cards

- **GIVEN** a room "Salle de traction" exists with equipment: ["Table de traction", "Électrothérapie"]
- **WHEN** the RoomCards component displays the room card
- **THEN** the room card does NOT show the equipment list
- **AND** the room card only shows: name, sessions count, next/last times
- **AND** the information density remains low for readability

#### Scenario: Display loading state while fetching room data

- **GIVEN** the RoomCards component is initializing
- **AND** room data is being fetched from API
- **WHEN** the component is rendered
- **THEN** the component displays 4 skeleton loading cards
- **AND** skeleton cards have same dimensions as actual room cards
- **AND** skeleton cards show animated loading state
- **AND** no actual room cards are displayed until data loads

#### Scenario: Display error state when room fetch fails

- **GIVEN** the RoomCards component is rendered
- **AND** the API call to fetch rooms fails with error
- **WHEN** the component receives the error
- **THEN** the component displays an error message in French
- **AND** the error message includes a retry button
- **AND** the retry button allows the user to attempt fetching rooms again
- **AND** a toast notification appears with the error details

#### Scenario: Allow room card interaction to open duration selector

- **GIVEN** the RoomCards component displays multiple room cards
- **WHEN** a user taps on a room card (or taps "VOIR LES CRÉNEAUX" button)
- **THEN** the component opens the DurationSelector component
- **AND** the selected room is passed to DurationSelector
- **AND** the room cards remain visible in the background (or component transitions)
- **AND** the user can see which room they selected

### Requirement: Duration Selector Component

The system SHALL provide a DurationSelector component that allows therapists to select session duration from 8 predefined options (15, 30, 45, 60, 75, 90, 105, 120 minutes) after selecting a room. The component shall use radio button selection with a primary action to proceed to slot grid.

#### Scenario: Display 8 duration options

- **GIVEN** a user has selected a room "Salle de traitement"
- **WHEN** the DurationSelector component is rendered
- **THEN** the component displays 8 duration options: 15, 30, 45, 60, 75, 90, 105, 120 minutes
- **AND** 45 minutes is selected by default
- **AND** each option shows radio button (selected/unselected state)
- **AND** each option displays the duration value in minutes

#### Scenario: Allow selecting different duration

- **GIVEN** the DurationSelector component is open with 45 minutes selected
- **WHEN** a user taps on the 60 minutes option
- **THEN** the 60 minutes option becomes selected (radio button filled)
- **AND** the 45 minutes option becomes unselected (radio button hollow)
- **AND** no other durations are selected
- **AND** only one duration is selected at a time

#### Scenario: Pre-select existing consultation duration when editing

- **GIVEN** a user is editing an existing consultation
- **AND** the consultation has duration: 60 minutes
- **WHEN** the DurationSelector component is rendered for editing
- **THEN** the 60 minutes option is selected by default
- **AND** the selected state matches the consultation's existing duration
- **AND** the user can change the duration if needed

#### Scenario: Navigate to slot grid after confirming duration

- **GIVEN** the DurationSelector component is open with 45 minutes selected
- **WHEN** a user taps the "VOIR LES CRÉNEAUX" primary action button
- **THEN** the component opens the SlotGrid component
- **AND** the selected room is passed to SlotGrid
- **AND** the selected duration (45 minutes) is passed to SlotGrid
- **AND** the DurationSelector component is closed or minimized

#### Scenario: Cancel duration selection

- **GIVEN** the DurationSelector component is open
- **AND** a user has selected 60 minutes
- **WHEN** the user taps the "ANNULER" button or closes the component
- **THEN** the component closes without proceeding to slot grid
- **AND** the user returns to the RoomCards view
- **AND** the selected duration is cleared (reverts to default 45 min for next session)

### Requirement: Slot Grid Component

The system SHALL provide a SlotGrid component that displays available time slots for a selected room and duration using horizontal scrolling time blocks. The component shall group slots by Morning/Afternoon, show binary availability indicators (available/booked), and allow tap-to-book.

#### Scenario: Display available slots in horizontal grid

- **GIVEN** a room has 12 available slots on 2025-01-15: 09:00, 09:15, 09:30, 09:45, 10:00, 10:15, 10:30, 10:45, 13:00, 13:15, 13:30, 13:45
- **AND** 45-minute duration is selected
- **WHEN** the SlotGrid component is rendered
- **THEN** the component displays time blocks in horizontal scrolling layout
- **AND** slots are grouped by "Matin" (before 12:00) and "Après-midi" (12:00+)
- **AND** Morning group shows: 09:00, 09:15, 09:30, 09:45, 10:00, 10:15, 10:30, 10:45
- **AND** Afternoon group shows: 13:00, 13:15, 13:30, 13:45
- **AND** each time block is a large touchable button (44px+ minimum)

#### Scenario: Show available slots with visual indicator

- **GIVEN** a room has available slot at 09:00
- **WHEN** the SlotGrid component displays the 09:00 time block
- **THEN** the time block shows green checkmark (✓) indicator
- **AND** the time block has primary color styling
- **AND** the time block is fully interactive (tap to select)
- **AND** the time block is not dimmed or grayed out

#### Scenario: Show booked slots with visual indicator

- **GIVEN** a room has a booked slot at 10:00
- **WHEN** the SlotGrid component displays the 10:00 time block
- **THEN** the time block shows gray X (✗) indicator
- **AND** the time block has neutral/subtle color styling
- **AND** the time block is NOT interactive (cannot be tapped)
- **AND** the time block is dimmed or grayed out

#### Scenario: Handle horizontal scrolling for mobile

- **GIVEN** the SlotGrid component is rendered on a mobile device
- **AND** the component displays 12 time blocks in Morning group
- **WHEN** the user swipes left on the time blocks
- **THEN** the time blocks scroll horizontally
- **AND** the scrolling feels natural (left-to-right swipe gesture)
- **AND** 4-6 time blocks are visible at a time
- **AND** the user can scroll to see all 12 time blocks
- **AND** the Afternoon group is displayed below Morning group

#### Scenario: Allow slot selection by tapping

- **GIVEN** the SlotGrid component displays available slots
- **AND** no slot is currently selected
- **WHEN** a user taps on the 09:15 time block
- **THEN** the 09:15 time block becomes selected (solid variant, primary color)
- **AND** all other time blocks become unselected (subtle variant, neutral color)
- **AND** the selection is visually clear (border, color change, or checkmark)
- **AND** the component enables the "RÉSERVER" action button

#### Scenario: Allow changing slot selection

- **GIVEN** the SlotGrid component has 09:15 time block selected
- **WHEN** a user taps on the 09:30 time block
- **THEN** the 09:30 time block becomes selected
- **AND** the 09:15 time block becomes unselected
- **AND** only one slot is selected at a time
- **AND** the user can freely switch between available slots

#### Scenario: Book consultation after selecting slot

- **GIVEN** the SlotGrid component has 09:15 time block selected
- **AND** room is "Salle de traitement", duration is 45 minutes, date is 2025-01-15
- **WHEN** a user taps the "RÉSERVER" action button
- **THEN** the component initiates consultation booking
- **AND** the component shows loading state on the button
- **AND** the booking request includes: roomId, date (2025-01-15), startTime (09:15), endTime (10:00), duration (45)
- **AND** on success, the BookingConfirmation component opens

#### Scenario: Show loading state while fetching slots

- **GIVEN** the SlotGrid component is initializing
- **AND** slot data is being fetched from API
- **WHEN** the component is rendered
- **THEN** the component displays skeleton loading time blocks
- **AND** skeleton blocks are arranged in horizontal scrolling layout
- **AND** skeleton blocks have same dimensions as actual time blocks
- **AND** no actual time blocks are displayed until data loads

#### Scenario: Display no slots available message

- **GIVEN** a room has no available slots for selected date and duration
- **WHEN** the SlotGrid component receives empty slots array
- **THEN** the component displays a message: "Aucun créneau disponible pour cette date"
- **AND** the component shows an empty state icon (calendar with X)
- **AND** the component suggests: "Essayez une autre date ou une durée différente"
- **AND** no time blocks are displayed

#### Scenario: Handle API error when fetching slots

- **GIVEN** the SlotGrid component is rendered
- **AND** the API call to fetch slots fails with error
- **WHEN** the component receives the error
- **THEN** the component displays an error message in French
- **AND** the error message includes a retry button
- **AND** a toast notification appears with the error details
- **AND** the user can retry fetching slots by tapping the retry button

#### Scenario: Show error when booking fails (double-booking)

- **GIVEN** the SlotGrid component has 09:00 time block selected
- **AND** the slot is actually already booked (race condition)
- **WHEN** a user taps the "RÉSERVER" action button
- **THEN** the booking API returns HTTP 409 Conflict
- **AND** the component displays error message: "Ce créneau est déjà réservé. Veuillez sélectionner une autre heure."
- **AND** the 09:00 time block is updated to show booked state (gray X)
- **AND** the user remains in SlotGrid component (can select another slot)
- **AND** the user can try booking a different slot

#### Scenario: Ensure large touch targets for mobile

- **GIVEN** the SlotGrid component is displayed on a mobile device
- **WHEN** the component renders time block buttons
- **THEN** each time block button has minimum touch target of 44x44 pixels (Apple HIG guideline)
- **AND** buttons have adequate padding (minimum 12px)
- **AND** buttons are spaced appropriately for thumb reach
- **AND** tap areas are visually clear (not overlapping)

### Requirement: Booking Confirmation Component

The system SHALL provide a BookingConfirmation component that displays booking summary after successful consultation creation and allows users to dismiss the confirmation or edit the booking. The component shall provide clear visual feedback and error handling.

#### Scenario: Display booking confirmation details

- **GIVEN** a consultation booking was successfully created
- **AND** booking details: room="Salle de traitement", patient="Jean Dupont", date="2025-01-15", time="09:00-09:45", therapist="Dr. Martin"
- **WHEN** the BookingConfirmation component is rendered
- **THEN** the component displays a large success icon (✅)
- **AND** the component displays title: "Consultation planifiée !"
- **AND** the component displays booking summary in clear format:
  - "Salle: Salle de traitement"
  - "Patient: Jean Dupont"
  - "Date: 15 janvier 2025"
  - "Heure: 09:00 - 09:45"
  - "Thérapeute: Dr. Martin"
- **AND** the component provides "OK" button to dismiss

#### Scenario: Allow editing booking from confirmation

- **GIVEN** the BookingConfirmation component is displayed
- **WHEN** a user taps the "Modifier la consultation" action button
- **THEN** the component opens the consultation edit view
- **AND** the consultation details are pre-populated with the booking data
- **AND** the user can modify time, duration, room, or other fields
- **AND** the confirmation component is closed

#### Scenario: Dismiss confirmation and return to room cards

- **GIVEN** the BookingConfirmation component is displayed
- **WHEN** a user taps the "OK" button
- **THEN** the component closes
- **AND** the user returns to the RoomCards view
- **AND** the newly booked consultation is reflected in room availability (slot no longer available)
- **AND** room cards refresh to show updated slot counts

#### Scenario: Show error when booking fails

- **GIVEN** the booking API call fails with error (network issue, validation error)
- **WHEN** the BookingConfirmation component is attempting to display
- **THEN** the component does NOT show success state
- **AND** the component shows an error message in French
- **AND** the error message describes what went wrong
- **AND** the user can retry the booking or cancel

### Requirement: Component Integration Flow

The system SHALL integrate RoomCards, DurationSelector, SlotGrid, and BookingConfirmation components in a seamless user flow, allowing therapists to progress through booking steps with natural transitions and state management.

#### Scenario: Complete booking flow from room selection to confirmation

- **GIVEN** a user is on the consultation booking page
- **WHEN** the user completes the following steps:
  1. Tap on "Salle de traitement" room card
  2. Select 45 minutes duration
  3. Tap "VOIR LES CRÉNEAUX"
  4. Tap 09:15 time slot
  5. Tap "RÉSERVER"
- **THEN** the BookingConfirmation component displays successfully
- **AND** the booking flow completes without errors
- **AND** the user can see the booking details in confirmation
- **AND** the user can dismiss confirmation and continue working

#### Scenario: Navigate back through booking flow

- **GIVEN** a user has progressed to SlotGrid component
- **AND** the user has selected 09:15 time slot
- **WHEN** the user taps the back button or navigation gesture
- **THEN** the component returns to DurationSelector
- **AND** the selected duration is preserved (still 45 minutes)
- **AND** the user can continue from DurationSelector without re-selecting duration

#### Scenario: Cancel booking at any step

- **GIVEN** a user has progressed to SlotGrid component
- **WHEN** the user taps "ANNULER" or closes the flow
- **THEN** the component closes and returns to RoomCards view
- **AND** no consultation is created
- **AND** no temporary state is preserved (fresh start for next booking attempt)

#### Scenario: Handle state persistence across component navigation

- **GIVEN** a user has selected room "Salle de traitement", duration "45 minutes", and time slot "09:15"
- **WHEN** the user navigates back to RoomCards and then forward to DurationSelector
- **THEN** the selected room "Salle de traitement" is preserved
- **AND** the selected duration "45 minutes" is preserved
- **AND** the user does not need to re-select room or duration

### Requirement: Mobile Responsiveness

The system SHALL optimize all booking UI components for mobile devices with appropriate layout, touch targets, and scrolling behavior following mobile UX best practices.

#### Scenario: Room cards adapt to mobile screen

- **GIVEN** the RoomCards component is rendered on a mobile device (iPhone SE, 375px width)
- **WHEN** the component displays room cards
- **THEN** room cards use full width (100% of screen)
- **AND** cards are stacked vertically (one per row)
- **AND** 4-5 room cards are visible without scrolling
- **AND** user can scroll vertically to see all room cards
- **AND** touch targets (buttons, entire card) are 44px+ minimum

#### Scenario: Slot grid adapts to mobile screen

- **GIVEN** the SlotGrid component is rendered on a mobile device
- **WHEN** the component displays time blocks
- **THEN** time blocks use horizontal scrolling (left-to-right swipe)
- **AND** 4 time blocks are visible at a time
- **AND** time blocks are 44px+ height for touch targets
- **AND** Morning and Afternoon sections are stacked vertically
- **AND** the primary action button ("RÉSERVER") is sticky at bottom

#### Scenario: Duration selector adapts to mobile screen

- **GIVEN** the DurationSelector component is rendered on a mobile device
- **WHEN** the component displays duration options
- **THEN** duration options are stacked vertically (one per row)
- **AND** radio buttons are large enough for touch (44px+ height)
- **AND** the primary action button ("VOIR LES CRÉNEAUX") is sticky at bottom
- **AND** the component fits within mobile viewport without excessive scrolling

### Requirement: Error Handling and Recovery

The system SHALL provide clear error messages and recovery options throughout the booking flow, ensuring users can understand what went wrong and how to fix it.

#### Scenario: Show French error messages for all validation failures

- **GIVEN** a user enters invalid data during booking flow
- **WHEN** a validation error occurs
- **THEN** the component displays the error message in French
- **AND** the error message clearly describes what is wrong
- **AND** the error message suggests how to fix the issue
- **AND** the user can correct the input and retry

#### Scenario: Allow retry after network error

- **GIVEN** a user experiences a network error during booking
- **WHEN** the component displays the network error
- **THEN** the error message includes a "RÉESSAYER" (Retry) button
- **AND** tapping retry attempts the failed operation again
- **AND** the user's input is preserved during retry (don't lose progress)

#### Scenario: Handle concurrent booking conflicts gracefully

- **GIVEN** two users are trying to book the same slot at the same time
- **WHEN** User B attempts to book after User A succeeded
- **THEN** User B sees error: "Ce créneau est déjà réservé. Veuillez sélectionner une autre heure."
- **AND** the slot is updated to show booked state (gray X)
- **AND** User B can select a different slot and retry
- **AND** User B is not blocked from booking other slots

### Requirement: Accessibility

The system SHALL ensure all booking UI components are accessible, following WCAG 2.1 AA guidelines and providing keyboard navigation, screen reader support, and sufficient color contrast.

#### Scenario: Keyboard navigation through room cards

- **GIVEN** the RoomCards component is rendered
- **WHEN** a user uses Tab key to navigate
- **THEN** focus moves logically from room card to room card
- **AND** focus indicators are visible (outline or similar)
- **AND** Enter or Space key activates the selected room card
- **AND** the flow is fully keyboard-accessible

#### Scenario: Screen reader announces room availability

- **GIVEN** the RoomCards component is rendered with a screen reader active
- **WHEN** the screen reader reads a room card
- **THEN** the screen reader announces: "Salle de traitement, 5 créneaux disponibles, Prochaine: 09:00, Dernière: 16:00"
- **AND** the announcement includes all relevant information
- **AND** the user can understand room availability without visual cues

#### Scenario: Color contrast meets WCAG AA standards

- **GIVEN** the SlotGrid component displays available (green) and booked (gray) time blocks
- **WHEN** the color contrast is measured
- **THEN** the green available time blocks have contrast ratio ≥ 4.5:1 (AA standard)
- **AND** the gray booked time blocks have contrast ratio ≥ 4.5:1
- **AND** text labels on time blocks have contrast ratio ≥ 4.5:1

### Requirement: Performance

The system SHALL ensure fast load times and responsive interactions for all booking UI components, providing a smooth user experience even on slower mobile connections.

#### Scenario: Render room cards quickly

- **GIVEN** the RoomCards component is initializing
- **WHEN** the component fetches room data
- **THEN** the component displays loading skeletons immediately (no white screen)
- **AND** room data loads in <1 second on typical mobile connection (3G+)
- **AND** room cards render smoothly without jank (60 FPS animation)
- **AND** the component uses data pagination if room list exceeds 20 rooms

#### Scenario: Render slot grid quickly

- **GIVEN** the SlotGrid component is initializing
- **WHEN** the component fetches slot data
- **THEN** the component displays loading skeletons immediately
- **AND** slot data loads in <1 second on typical connection
- **AND** horizontal scrolling is smooth (60 FPS)
- **AND** the component virtualizes long slot lists (if >50 slots) to maintain performance
