# therapist-daily-schedule Specification

## Purpose

Provides therapists with a centralized view of their daily schedule, displaying all programmed consultations in chronological order with key information needed to prepare for each session.

## ADDED Requirements

### Requirement: Therapist Daily Schedule View

The system SHALL provide a dedicated page for therapists to view their daily schedule, showing all consultations for a selected date.

#### Scenario: Therapist views their daily schedule

**Given** a therapist is logged in
**And** the therapist has consultations scheduled for "2026-01-16"
**When** the therapist navigates to `/therapists/day?date=2026-01-16`
**Then** the page displays all consultations for that day
**And** consultations are sorted chronologically by start time
**And** each consultation shows patient name, time range, type, and status

#### Scenario: Therapist views empty schedule

**Given** a therapist is logged in
**And** the therapist has no consultations scheduled for "2026-01-17"
**When** the therapist navigates to `/therapists/day?date=2026-01-17`
**Then** the page displays an empty state message
**And** the message indicates no consultations are scheduled for that day

### Requirement: Daily Summary Statistics

The system SHALL display summary statistics at the top of the therapist's daily schedule page.

#### Scenario: Display total consultation count

**Given** a therapist has 8 consultations scheduled for the day
**When** the therapist views their daily schedule page
**Then** the summary section shows "Total: 8"

#### Scenario: Display completed consultation count

**Given** a therapist has 3 consultations with status "completed" for the day
**When** the therapist views their daily schedule page
**Then** the summary section shows "Completed: 3"

#### Scenario: Display upcoming consultation count

**Given** a therapist has 4 consultations with status "scheduled" or "confirmed" for the day
**When** the therapist views their daily schedule page
**Then** the summary section shows "Upcoming: 4"

#### Scenario: Display cancelled consultation count

**Given** a therapist has 1 consultation with status "cancelled" or "no_show" for the day
**When** the therapist views their daily schedule page
**Then** the summary section shows "Cancelled: 1"

### Requirement: Consultation Card Overview

The system SHALL display each consultation as a card with essential information for quick reference.

#### Scenario: Display consultation time range

**Given** a consultation starts at "09:00" and ends at "10:00"
**When** the consultation card is displayed
**Then** the card shows "09:00 - 10:00" prominently

#### Scenario: Display patient name

**Given** a consultation is for patient "John Doe"
**When** the consultation card is displayed
**Then** the card shows the patient's full name
**And** the name is clickable to navigate to patient details

#### Scenario: Display consultation type

**Given** a consultation has type "follow_up"
**When** the consultation card is displayed
**Then** the card shows "Suivi" (French label for follow_up)
**And** the type is displayed with appropriate styling

#### Scenario: Display consultation status

**Given** a consultation has status "scheduled"
**When** the consultation card is displayed
**Then** the card shows "À venir" (French label for scheduled)
**And** the status is displayed as a badge with appropriate color

#### Scenario: Display room name

**Given** a consultation is scheduled in room "Room A"
**When** the consultation card is displayed
**Then** the card shows "Room A"
**And** the room name is visible on the card

### Requirement: Session Start from Daily View

The system SHALL allow therapists to start a consultation session directly from the daily schedule view.

#### Scenario: Show Start Session button for scheduled consultations

**Given** a consultation has status "scheduled"
**When** the consultation card is displayed
**Then** the card shows a "Start Session" button
**And** the button is styled as a primary action
**And** the button displays a play icon

#### Scenario: Show Start Session button for confirmed consultations

**Given** a consultation has status "confirmed"
**When** the consultation card is displayed
**Then** the card shows a "Start Session" button
**And** the button is styled as a primary action

#### Scenario: Do not show Start Session button for completed consultations

**Given** a consultation has status "completed"
**When** the consultation card is displayed
**Then** the card does NOT show a "Start Session" button
**And** the card may show a "View Details" button instead

#### Scenario: Show Complete Session button for in-progress consultations

**Given** a consultation has status "in_progress"
**When** the consultation card is displayed
**Then** the card shows a "Complete Session" button
**And** the button is styled with success color
**And** the button displays a check icon

#### Scenario: Start session from daily view

**Given** a therapist is viewing the daily schedule
**And** a consultation has status "scheduled" or "confirmed"
**When** the therapist clicks the "Start Session" button on the consultation card
**Then** the system displays a confirmation dialog with patient name and time
**And** the dialog asks "Démarrer la consultation avec [Patient Name] à [Start Time] ?"
**And** the dialog has "Annuler" and "Démarrer" buttons

#### Scenario: Confirm session start

**Given** the session start confirmation dialog is displayed
**When** the therapist clicks the "Démarrer" button
**Then** the system updates the consultation status to "in_progress"
**And** the consultation card refreshes to show new status
**And** the "Start Session" button is replaced with "Complete Session" button
**And** a success toast notification is displayed
**And** the consultation list is refreshed

#### Scenario: Cancel session start

**Given** the session start confirmation dialog is displayed
**When** the therapist clicks the "Annuler" button
**Then** the confirmation dialog closes
**And** the consultation status remains unchanged
**And** the consultation card continues to show "Start Session" button

### Requirement: Consultation Status Update

The system SHALL use the existing consultation update endpoint to update consultation status.

#### Scenario: Update consultation status to in_progress

**Given** a consultation exists with ID "consultation-123"
**And** consultation has patientId "patient-456"
**And** consultation belongs to authenticated therapist's organization
**When** authenticated user sends `PUT /api/patients/patient-456/consultations/consultation-123` with body `{ status: "in_progress" }`
**Then** consultation status is updated to "in_progress"
**And** API returns updated consultation object
**And** HTTP status is 200 OK

#### Scenario: Update consultation status to completed

**Given** a consultation exists with ID "consultation-123"
**And** consultation has patientId "patient-456"
**And** consultation has status "in_progress"
**When** authenticated user sends `PUT /api/patients/patient-456/consultations/consultation-123` with body `{ status: "completed" }`
**Then** consultation status is updated to "completed"
**And** API returns updated consultation object

#### Scenario: Reject invalid status value

**Given** a consultation exists with ID "consultation-123"
**And** consultation has patientId "patient-456"
**When** authenticated user sends `PUT /api/patients/patient-456/consultations/consultation-123` with body `{ status: "invalid_status" }`
**Then** API returns HTTP 400 Bad Request
**And** error message states validation error

#### Scenario: Prevent status update for unauthorized consultation

**Given** a consultation exists with ID "consultation-123"
**And** consultation belongs to a different organization
**When** authenticated user from a different organization attempts to update status
**Then** API returns HTTP 404 or 403
**And** consultation status remains unchanged

### Requirement: Session Start from Consultation Details

The system SHALL allow therapists to start and complete sessions from the consultation details page.

#### Scenario: Show Start Session button on consultation details page

**Given** a therapist views consultation details page
**And** the consultation has status "scheduled" or "confirmed"
**When** the page loads
**Then** the page displays a "Start Session" button
**And** the button is prominently positioned

#### Scenario: Start session from consultation details page

**Given** a therapist views consultation details page
**And** the consultation has status "scheduled"
**When** the therapist clicks the "Start Session" button
**Then** the system updates the consultation status to "in_progress"
**And** the page refreshes to show the new status
**And** the "Start Session" button is replaced with "Complete Session" button

#### Scenario: Complete session from consultation details page

**Given** a therapist views consultation details page
**And** the consultation has status "in_progress"
**When** the therapist clicks the "Complete Session" button
**Then** the system displays a confirmation dialog
**And** upon confirmation, updates the consultation status to "completed"
**And** the page refreshes to show the new status

### Requirement: Consultation Card Action Buttons

The system SHALL display appropriate action buttons on consultation cards based on consultation status.

#### Scenario: Always show View Details button

**Given** a consultation card is displayed for any consultation
**When** the card renders
**Then** the card always shows a "View Details" button
**And** the button is styled as a secondary action
**And** clicking the button navigates to consultation details page

#### Scenario: Button visibility based on status

**Given** a consultation card is displayed
**When** the consultation status is "scheduled" or "confirmed"
**Then** the card shows "Start Session" and "View Details" buttons

**Given** a consultation card is displayed
**When** the consultation status is "in_progress"
**Then** the card shows "Complete Session" and "View Details" buttons

**Given** a consultation card is displayed
**When** the consultation status is "completed", "cancelled", or "no_show"
**Then** the card shows only "View Details" button

### Requirement: Date Navigation

The system SHALL provide navigation controls to view consultations for different dates.

#### Scenario: Navigate to previous day

**Given** the therapist is viewing the schedule for "2026-01-16"
**When** the therapist clicks the "Previous Day" button
**Then** the page displays consultations for "2026-01-15"
**And** the URL updates to `?date=2026-01-15`

#### Scenario: Navigate to next day

**Given** the therapist is viewing the schedule for "2026-01-16"
**When** the therapist clicks the "Next Day" button
**Then** the page displays consultations for "2026-01-17"
**And** the URL updates to `?date=2026-01-17`

#### Scenario: Select specific date

**Given** the therapist is viewing the schedule for "2026-01-16"
**When** the therapist uses the date picker to select "2026-01-20"
**Then** the page displays consultations for "2026-01-20"
**And** the URL updates to `?date=2026-01-20`

#### Scenario: Default to today when no date specified

**Given** the therapist navigates to `/therapists/day` without a date parameter
**When** the page loads
**Then** the page displays consultations for the current day
**And** the URL updates to include today's date

### Requirement: Navigation to Details

The system SHALL allow therapists to navigate to detailed views from the daily schedule.

#### Scenario: Navigate to patient details

**Given** the consultation card shows patient "John Doe"
**When** the therapist clicks on the patient's name
**Then** the page navigates to `/patients/[patientId]`
**And** the therapist can view the patient's full details

#### Scenario: Navigate to consultation details

**Given** the consultation card is displayed
**When** the therapist clicks anywhere on the consultation card (except patient name)
**Then** the page navigates to `/patients/[patientId]/consultations/[consultationId]`
**And** the therapist can view and edit the full consultation details

### Requirement: Therapist Consultations API Endpoint

The system SHALL provide an API endpoint to fetch consultations for the authenticated therapist.

#### Scenario: Fetch consultations for specific date

**Given** the therapist is authenticated with ID "therapist-123"
**And** the therapist has consultations on "2026-01-16"
**When** the client requests `GET /api/therapists/consultations?date=2026-01-16`
**Then** the server returns a JSON array of consultations
**And** each consultation includes patient name and room name
**And** consultations are sorted by startTime ascending
**And** only consultations for the authenticated therapist are returned

#### Scenario: Reject invalid date format

**Given** the therapist is authenticated
**When** the client requests `GET /api/therapists/consultations?date=invalid-date`
**Then** the server returns HTTP 400 Bad Request
**And** the error message states "Date invalide"

#### Scenario: Require authentication

**Given** the client is not authenticated
**When** the client requests `GET /api/therapists/consultations?date=2026-01-16`
**Then** the server returns HTTP 401 Unauthorized
**Or** the server redirects to the login page

### Requirement: Therapist Data Isolation

The system SHALL ensure therapists can only view their own consultations, not other therapists' schedules.

#### Scenario: Filter by authenticated therapist

**Given** two therapists exist: therapist A (ID "t-a") and therapist B (ID "t-b")
**And** therapist A has consultations on "2026-01-16"
**And** therapist B has consultations on "2026-01-16"
**When** therapist A requests their daily schedule
**Then** only therapist A's consultations are returned
**And** therapist B's consultations are not included in the response

#### Scenario: Prevent cross-therapist data access

**Given** therapist A is authenticated
**And** therapist A knows therapist B's patient IDs
**When** therapist A requests consultations for a date where therapist B has appointments
**Then** the system filters to only return therapist A's consultations
**And** therapist B's consultation data is not accessible to therapist A

### Requirement: Loading and Error States

The system SHALL display appropriate loading and error states during data fetching.

#### Scenario: Show loading state

**Given** the therapist navigates to `/therapists/day`
**And** the API request is in progress
**When** the page is rendering
**Then** a loading indicator or skeleton UI is displayed
**And** the user can see data is being fetched

#### Scenario: Show error state

**Given** the therapist navigates to `/therapists/day`
**And** the API request fails with an error
**When** the page receives the error
**Then** an error message is displayed
**And** a retry button is provided to retry the request

### Requirement: Keyboard Navigation

The system SHALL support keyboard shortcuts for date navigation.

#### Scenario: Navigate to previous day with keyboard

**Given** the therapist is viewing the daily schedule page
**When** the therapist presses the left arrow key
**Then** the page navigates to the previous day

#### Scenario: Navigate to next day with keyboard

**Given** the therapist is viewing the daily schedule page
**When** the therapist presses the right arrow key
**Then** the page navigates to the next day

### Requirement: Mobile Responsiveness

The system SHALL be usable on mobile devices with appropriate responsive design.

#### Scenario: View daily schedule on mobile

**Given** the therapist is using a mobile device
**When** the therapist views their daily schedule
**Then** the layout adapts to the smaller screen
**And** consultation cards stack vertically
**And** navigation controls remain accessible
**And** text is readable without horizontal scrolling
