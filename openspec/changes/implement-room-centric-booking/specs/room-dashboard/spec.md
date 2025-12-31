# Room Dashboard Specification

## Purpose

Define dashboard enhancements that provide therapists with daily overview of room utilization, session counts, and room-by-room scheduling. The dashboard shall offer quick visibility into clinic operations and help optimize room scheduling efficiency.

## ADDED Requirements

### Requirement: Today's Room Utilization Metrics

The system SHALL display room utilization metrics for the current day on the dashboard, showing sessions count per room, available slots count, and occupancy percentage.

#### Scenario: Display room utilization for today

- **GIVEN** today is 2025-01-15 (Wednesday)
- **AND** organization has 4 rooms:
  - "Salle de traitement": 8 booked, 4 available (50% occupancy)
  - "Salle d'exercice": 12 booked, 2 available (86% occupancy)
  - "Salle de kiné": 3 booked, 9 available (25% occupancy)
  - "Salle de traction": 10 booked, 2 available (83% occupancy)
- **WHEN** dashboard is loaded
- **THEN** dashboard displays room utilization section
- **AND** each room shows:
  - Room name
  - Sessions today: booked count
  - Available slots: available count
  - Occupancy: percentage (e.g., "50% occupé")
- **AND** rooms are sorted by occupancy (highest first)
- **AND** visualization shows progress bar or similar for occupancy percentage

#### Scenario: Show zero bookings for rooms

- **GIVEN** today is 2025-01-15
- **AND** a room "Salle de consultation" has 0 booked sessions, 12 available slots
- **WHEN** dashboard is loaded
- **THEN** dashboard displays room with:
  - "Sessions today: 0"
  - "Available slots: 12"
  - "Occupancy: 0% occupé"
- **AND** progress bar is empty or very short
- **AND** room is still displayed (not hidden)

#### Scenario: Show fully booked rooms

- **GIVEN** today is 2025-01-15
- **AND** a room "Salle d'exercice" has 12 booked sessions, 0 available slots (100% occupancy)
- **WHEN** dashboard is loaded
- **THEN** dashboard displays room with:
  - "Sessions today: 12"
  - "Available slots: 0"
  - "Occupancy: 100% occupé"
- **AND** progress bar is full
- **AND** room is highlighted (success color or similar)

#### Scenario: Calculate occupancy percentage correctly

- **GIVEN** a room has 10 total slots and 7 booked sessions
- **WHEN** dashboard calculates occupancy
- **THEN** occupancy is displayed as "70% occupé" (7/10 \* 100 = 70%)
- **AND** percentage is rounded to nearest whole number
- **AND** calculation excludes cancelled sessions

#### Scenario: Handle no rooms in organization

- **GIVEN** organization has 0 rooms configured
- **WHEN** dashboard is loaded
- **THEN** dashboard displays a message: "Aucune salle configurée"
- **AND** message includes a button to add rooms
- **AND** button navigates to room management page
- **AND** no room utilization section is displayed

### Requirement: Room-by-Room Schedule View

The system SHALL provide a room-by-room schedule view that shows all sessions for each room on the current day, allowing therapists to quickly see what's happening in each room throughout the day.

#### Scenario: Display room schedule with time slots

- **GIVEN** today is 2025-01-15
- **AND** "Salle de traitement" has 4 sessions:
  - 09:00-09:45: Patient A (Dr. Martin)
  - 10:00-10:45: Patient B (Dr. Martin)
  - 11:00-11:45: Patient C (Dr. Dupont)
  - 14:00-14:45: Patient D (Dr. Martin)
- **WHEN** user opens room schedule for "Salle de traitement"
- **THEN** dashboard displays room schedule view
- **AND** each session shows:
  - Time range (e.g., "09:00 - 09:45")
  - Patient name (e.g., "Jean Dupont")
  - Therapist name (e.g., "Dr. Martin")
  - Status indicator (e.g., green for scheduled, gray for completed)
- **AND** sessions are sorted chronologically
- **AND** empty gaps between sessions are visible (e.g., 12:00-14:00 gap)

#### Scenario: Show empty time gaps in room schedule

- **GIVEN** today is 2025-01-15
- **AND** "Salle de kiné" has sessions at 09:00-09:45 and 11:00-11:45
- **WHEN** user opens room schedule
- **THEN** dashboard displays gap between 09:45 and 11:00
- **AND** gap is shown as empty time block (grayed out or labeled)
- **AND** gap label shows duration: "1h 15min disponible"
- **AND** therapists can see availability at a glance

#### Scenario: Navigate between room schedules

- **GIVEN** dashboard shows room utilization for 4 rooms
- **WHEN** a user taps on "Salle de traitement" room card
- **THEN** dashboard opens room schedule view for "Salle de traitement"
- **AND** user sees all sessions for that room
- **AND** user can tap back button to return to room utilization overview
- **AND** user can swipe horizontally between room schedules (optional mobile gesture)

#### Scenario: Show session status in room schedule

- **GIVEN** today is 2025-01-15
- **AND** "Salle de traitement" has sessions with different statuses:
  - 09:00-09:45: Patient A (scheduled)
  - 10:00-10:45: Patient B (in_progress)
  - 11:00-11:45: Patient C (completed)
  - 14:00-14:45: Patient D (cancelled)
- **WHEN** user opens room schedule
- **THEN** scheduled sessions show neutral/subtle styling
- **AND** in_progress sessions show primary/active styling (highlighted)
- **AND** completed sessions show success/green styling
- **AND** cancelled sessions show dimmed/strikethrough styling
- **AND** user can quickly identify session status

### Requirement: Quick "Next Session" Indicators

The system SHALL display quick indicators for the next upcoming session in each room, helping therapists know what's coming up next.

#### Scenario: Show next session for each room

- **GIVEN** current time is 10:30 on 2025-01-15
- **AND** "Salle de traitement" has upcoming sessions at 11:00 and 14:00
- **AND** "Salle d'exercice" has upcoming sessions at 11:15 and 13:30
- **WHEN** dashboard is loaded
- **THEN** dashboard shows next session indicators:
  - "Salle de traitement": "Prochain: 11:00 - Patient A"
  - "Salle d'exercice": "Prochain: 11:15 - Patient B"
- **AND** indicators are visible on room cards or utilization section
- **AND** indicators show patient name and time

#### Scenario: Show "no upcoming sessions" for rooms

- **GIVEN** current time is 17:00 on 2025-01-15
- **AND** "Salle de traction" has no more sessions today
- **WHEN** dashboard is loaded
- **THEN** dashboard shows indicator: "Aucune séance à venir aujourd'hui"
- **AND** indicator is displayed for "Salle de traction"
- **AND** styling is neutral (not error or success)

#### Scenario: Show "in progress" session for current room

- **GIVEN** current time is 10:15 on 2025-01-15
- **AND** "Salle de traitement" has a session from 10:00-10:45 (currently in progress)
- **WHEN** dashboard is loaded
- **THEN** dashboard shows indicator: "En cours: 10:00 - Patient A"
- **AND** indicator is highlighted (primary color or similar)
- **AND** "En cours" label clearly differentiates from "Prochain"

#### Scenario: Update next session indicators in real-time

- **GIVEN** dashboard is loaded at 10:00
- **AND** "Salle de kiné" shows next session at 10:30
- **WHEN** 10:00 session completes and time becomes 10:01
- **THEN** dashboard updates to show next session at 10:30
- **AND** update happens automatically (no page refresh needed)
- **AND** user sees updated indicator within 1-2 minutes

### Requirement: Room Availability Preview on Dashboard

The system SHALL display room availability preview on the dashboard, showing today's available slots per room in a compact, glanceable format.

#### Scenario: Show compact availability preview per room

- **GIVEN** today is 2025-01-15
- **AND** "Salle de traitement" has available slots: 10:00, 11:00, 14:00, 14:30, 15:00, 15:30, 16:00
- **WHEN** dashboard displays room availability preview
- **THEN** dashboard shows compact slot list for room
- **AND** slots are grouped by time: "Matin: 10:00, 11:00", "Après-midi: 14:00, 14:30, 15:00, 15:30, 16:00"
- **AND** slots are displayed as small time badges (e.g., "10:00", "11:00")
- **AND** preview is expandable to show full slot grid

#### Scenario: Show limited slots when many are available

- **GIVEN** a room has 12 available slots today
- **WHEN** dashboard displays room availability preview
- **THEN** dashboard shows first 4-5 slots (e.g., "09:00, 09:15, 09:30, 09:45")
- **AND** display shows "+8 autres créneaux" or similar
- **AND** user can tap to expand and see all 12 slots
- **AND** expansion opens SlotGrid component for that room

#### Scenario: Show "no slots" message when room is fully booked

- **GIVEN** a room has 0 available slots today
- **WHEN** dashboard displays room availability preview
- **THEN** dashboard shows message: "Aucun créneau disponible"
- **AND** message is styled neutrally (not error)
- **AND** user can tap to see full schedule (all booked slots)

### Requirement: Dashboard Integration with Room Booking Flow

The system SHALL integrate dashboard room components with the room booking flow, allowing therapists to quickly create bookings from dashboard without navigation.

#### Scenario: Book session from dashboard room card

- **GIVEN** dashboard shows room utilization cards
- **AND** "Salle de traitement" has available slots
- **WHEN** a user taps on "RÉSERVER UN CRÉNEAU" button on room card
- **THEN** dashboard opens DurationSelector component
- **AND** room "Salle de traitement" is pre-selected
- **AND** user can proceed through booking flow (duration → slots → confirm)
- **AND** on successful booking, dashboard updates to show new session in room schedule

#### Scenario: See room details from dashboard

- **GIVEN** dashboard shows room utilization cards
- **WHEN** a user taps on room card (not booking button)
- **THEN** dashboard opens room detail view
- **AND** detail view shows: room name, equipment, today's schedule, utilization metrics
- **AND** user can navigate to room edit page if needed

### Requirement: Date Range Selection for Dashboard

The system SHALL allow users to select different dates for the dashboard view, showing room utilization and schedules for past, current, and future dates.

#### Scenario: View room utilization for past date

- **GIVEN** user is viewing dashboard for 2025-01-15 (today)
- **WHEN** user selects date 2025-01-14 (yesterday)
- **THEN** dashboard refreshes with data for 2025-01-14
- **AND** room utilization shows sessions and occupancy for yesterday
- **AND** room schedules show historical sessions (no booking available)
- **AND** "Prochain: En cours" indicators are not shown for past dates

#### Scenario: View room utilization for future date

- **GIVEN** user is viewing dashboard for 2025-01-15 (today)
- **WHEN** user selects date 2025-01-20 (future date)
- **THEN** dashboard refreshes with data for 2025-01-20
- **AND** room utilization shows 0 booked sessions (no data yet)
- **AND** room availability preview shows available slots for that date
- **AND** user can book sessions for future date

#### Scenario: Return to today view

- **GIVEN** user is viewing dashboard for 2025-01-20 (future date)
- **WHEN** a user taps on "AUJOURD'HUI" (Today) button
- **THEN** dashboard refreshes with data for today's date (2025-01-15)
- **AND** current date is highlighted in date picker
- **AND** dashboard shows today's utilization and schedules

### Requirement: Mobile Responsiveness for Dashboard

The system SHALL optimize dashboard components for mobile devices with appropriate layout, touch targets, and scrolling behavior.

#### Scenario: Room utilization cards adapt to mobile

- **GIVEN** dashboard is displayed on mobile device (375px width)
- **WHEN** dashboard shows room utilization
- **THEN** room cards use full width (100% of screen)
- **AND** cards are stacked vertically (one per row)
- **AND** occupancy progress bar is visible but compact
- **AND** touch targets (buttons, entire card) are 44px+ minimum

#### Scenario: Room schedule view adapts to mobile

- **GIVEN** user opens room schedule on mobile device
- **WHEN** room schedule is displayed
- **THEN** sessions are stacked vertically with clear time labels
- **AND** session details are concise (patient name, time, therapist)
- **AND** user can scroll vertically to see all sessions
- **AND** primary actions (book, edit) are sticky at bottom

#### Scenario: Room availability preview adapts to mobile

- **GIVEN** dashboard shows room availability preview on mobile device
- **WHEN** preview displays available slots
- **THEN** slots are displayed as compact time badges
- **AND** slots wrap to multiple lines if needed
- **AND** "Voir tous les créneaux" button is prominent
- **AND** tapping button opens SlotGrid component

### Requirement: Performance for Dashboard

The system SHALL ensure fast load times for dashboard room metrics, utilizing efficient queries and appropriate caching strategies.

#### Scenario: Load room utilization metrics quickly

- **GIVEN** dashboard is initializing
- **WHEN** dashboard fetches room utilization data
- **THEN** dashboard displays loading skeletons for room cards
- **AND** utilization data loads in <1 second on typical mobile connection
- **AND** dashboard uses optimized query (single query for all room sessions)
- **AND** dashboard caches utilization data for 2-3 minutes

#### Scenario: Load room schedule quickly

- **GIVEN** user taps on a room card to view schedule
- **WHEN** dashboard fetches room session data
- **THEN** dashboard displays loading skeleton for schedule
- **AND** schedule data loads in <500ms
- **AND** dashboard uses indexed query (roomId + date)
- **AND** no noticeable jank or delay

### Requirement: Error Handling for Dashboard

The system SHALL provide clear error messages and recovery options when dashboard data fails to load or update.

#### Scenario: Show error when room utilization fetch fails

- **GIVEN** dashboard is initializing
- **AND** API call to fetch room utilization fails
- **WHEN** dashboard receives error
- **THEN** dashboard displays error message: "Impossible de charger les données de salle"
- **AND** error message includes a "RÉESSAYER" (Retry) button
- **AND** a toast notification appears with error details
- **AND** user can retry fetching data

#### Scenario: Show error when room schedule fetch fails

- **GIVEN** user taps on a room card to view schedule
- **AND** API call to fetch room sessions fails
- **WHEN** dashboard receives error
- **THEN** dashboard displays error message in room schedule section
- **AND** error message includes a retry button
- **AND** room utilization section remains visible (not impacted)
- **AND** user can retry fetching schedule

### Requirement: Analytics and Insights (Future Enhancement)

The system SHALL provide basic room utilization analytics on the dashboard, helping therapists identify patterns and optimize scheduling. (Note: This is a future enhancement, not part of initial implementation.)

#### Scenario: Show weekly room utilization trend

- **GIVEN** therapist views dashboard analytics section (future feature)
- **WHEN** analytics are displayed
- **THEN** dashboard shows line chart of room utilization over last 7 days
- **AND** each room is shown as separate line on chart
- **AND** chart identifies peaks (high utilization) and valleys (low utilization)
- **AND** therapist can see patterns (e.g., "Salle de kiné always busy on Mondays")

#### Scenario: Show room efficiency insights

- **GIVEN** therapist views dashboard analytics (future feature)
- **WHEN** insights are displayed
- **THEN** dashboard shows top-performing rooms (highest utilization)
- **AND** dashboard shows underutilized rooms (opportunity for optimization)
- **AND** dashboard shows average session duration per room
- **AND** therapist can identify scheduling inefficiencies
