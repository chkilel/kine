# Room-Based Availability Specification

## Purpose

Transforms availability calculation system from therapist-centric with complex concurrent session management to room-centric with simple binary availability. This specification defines API endpoints and business logic for calculating available slots per room, eliminating `maxSessions` complexity.

## ADDED Requirements

### Requirement: Add roomId Field to Consultations Table

The system SHALL add a nullable `roomId` field to the consultations table as a foreign key reference to the rooms table. Historical consultations shall have `roomId = NULL`, while new bookings shall require a valid `roomId`.

#### Scenario: Add roomId column to consultations table

- **GIVEN** the consultations table exists without roomId field
- **WHEN** a database migration is executed
- **THEN** the consultations table has a new `roomId` column of type TEXT
- **AND** roomId is nullable (can be NULL for historical data)
- **AND** roomId has a foreign key constraint referencing rooms(id)
- **AND** the foreign key uses ON DELETE SET NULL (room deletion doesn't delete consultations)

#### Scenario: Existing consultations have roomId = NULL

- **GIVEN** the database has 100 existing consultations
- **WHEN** the migration to add roomId column is executed
- **THEN** all 100 existing consultations have roomId = NULL
- **AND** no consultations are deleted or modified
- **AND** the migration completes successfully

#### Scenario: New consultation requires roomId

- **GIVEN** a user attempts to create a new consultation via API
- **AND** the request body does not include roomId
- **WHEN** POST /api/consultations is called
- **THEN** the system returns HTTP 400 Bad Request
- **AND** response includes French validation error: "roomId est requis pour les nouvelles consultations"
- **AND** no consultation is created

### Requirement: Create Unique Constraint for Room Booking

The system SHALL create a unique database constraint on `(roomId, date, startTime)` columns to prevent double-booking the same room at the same time slot. This constraint shall apply across all therapists in the organization.

#### Scenario: Unique constraint prevents double-booking

- **GIVEN** a room with id "room-123" exists
- **AND** a consultation is booked for room-123 on 2025-01-15 at 09:00
- **WHEN** a second consultation is attempted for the same room on 2025-01-15 at 09:00
- **THEN** the database rejects the insertion with a unique constraint violation
- **AND** the API returns HTTP 409 Conflict
- **AND** response includes error message: "Ce créneau est déjà réservé. Veuillez sélectionner une autre heure."
- **AND** the first consultation remains unchanged

#### Scenario: Unique constraint allows different times in same room

- **GIVEN** a room with id "room-456" exists
- **AND** a consultation is booked for room-456 on 2025-01-15 at 09:00
- **WHEN** a second consultation is booked for the same room on 2025-01-15 at 10:00
- **THEN** the database successfully inserts the second consultation
- **AND** both consultations exist in the database
- **AND** the API returns HTTP 200 OK

#### Scenario: Unique constraint allows different rooms at same time

- **GIVEN** two rooms exist with ids "room-111" and "room-222"
- **WHEN** a consultation is booked for room-111 on 2025-01-15 at 09:00
- **AND** a consultation is booked for room-222 on 2025-01-15 at 09:00
- **THEN** both consultations are successfully created
- **AND** no unique constraint violation occurs
- **AND** both consultations are returned by subsequent queries

#### Scenario: Cancelled consultations do not block slots

- **GIVEN** a room with id "room-789" exists
- **AND** a consultation with status "cancelled" exists for room-789 on 2025-01-15 at 09:00
- **WHEN** a new consultation is attempted for the same room on 2025-01-15 at 09:00
- **THEN** the new consultation is successfully created
- **AND** no unique constraint violation occurs
- **AND** the cancelled consultation remains in the database

### Requirement: Room-Based Availability Endpoint

The system SHALL provide a POST /api/availability/[roomId]/slots endpoint that calculates available time slots for a specific room based on therapist availability templates, availability exceptions, and existing bookings in that room. The endpoint shall generate slots at configurable intervals (default 15 minutes) and respect gap buffers between sessions.

#### Scenario: Calculate available slots for single date

- **GIVEN** a room with id "room-001" exists
- **AND** the organization has therapist availability: 09:00-17:00 on Wednesday
- **AND** the room has one existing booking on 2025-01-15 from 09:00-09:45
- **AND** the therapist's consultationGapMinutes is 15
- **AND** the therapist's slotIncrementMinutes is 15
- **WHEN** POST /api/availability/room-001/slots is called with body { dates: ["2025-01-15"], duration: 45 }
- **THEN** the system returns HTTP 200 OK
- **AND** response.slots["2025-01-15"].availableSlots includes "10:00" (next available after 09:45 + 15min gap)
- **AND** response.slots["2025-01-15"].availableSlots does NOT include "09:00" (booked)
- **AND** response.slots["2025-01-15"].availableSlots includes time slots every 15 minutes from 10:00 until 17:00

#### Scenario: Calculate slots for multiple dates

- **GIVEN** a room with id "room-002" exists
- **AND** the therapist is available 09:00-17:00 on Monday and Tuesday
- **WHEN** POST /api/availability/room-002/slots is called with body { dates: ["2025-01-13", "2025-01-14"], duration: 30 }
- **THEN** the system returns HTTP 200 OK
- **AND** response.slots includes entries for both "2025-01-13" and "2025-01-14"
- **AND** each date entry has availableSlots array
- **AND** each date entry has unavailable boolean (false when slots exist)

#### Scenario: Handle full-day unavailability exception

- **GIVEN** a room with id "room-003" exists
- **AND** the therapist has an availability exception for 2025-01-20 with isAvailable: false
- **AND** the exception has no startTime or endTime (full-day block)
- **WHEN** POST /api/availability/room-003/slots is called with body { dates: ["2025-01-20"], duration: 45 }
- **THEN** the system returns HTTP 200 OK
- **AND** response.slots["2025-01-20"].availableSlots is an empty array
- **AND** response.slots["2025-01-20"].unavailable is true

#### Scenario: Handle partial-day availability exception

- **GIVEN** a room with id "room-004" exists
- **AND** the therapist has availability 09:00-17:00 on Friday
- **AND** the therapist has an exception for 2025-01-17 with startTime: "13:00", endTime: "14:00", isAvailable: false
- **WHEN** POST /api/availability/room-004/slots is called with body { dates: ["2025-01-17"], duration: 30 }
- **THEN** the system returns HTTP 200 OK
- **AND** response.slots["2025-01-17"].availableSlots includes morning slots before 13:00
- **AND** response.slots["2025-01-17"].availableSlots does NOT include slots during 13:00-14:00
- **AND** response.slots["2025-01-17"].availableSlots includes afternoon slots after 14:00

#### Scenario: Filter slots by therapist when provided

- **GIVEN** a room with id "room-005" exists
- **AND** the organization has two therapists: therapist-1 and therapist-2
- **AND** therapist-1 is available 09:00-12:00 on Monday
- **AND** therapist-2 is available 13:00-17:00 on Monday
- **WHEN** POST /api/availability/room-005/slots is called with body { dates: ["2025-01-13"], duration: 45, therapistId: "therapist-1" }
- **THEN** the system returns HTTP 200 OK
- **AND** response.slots["2025-01-13"].availableSlots includes only slots within 09:00-12:00
- **AND** response.slots["2025-01-13"].availableSlots does NOT include slots after 12:00
- **AND** slots are filtered by therapist-1's availability

#### Scenario: Return 404 for non-existent room

- **GIVEN** the room with id "room-nonexistent" does not exist
- **WHEN** POST /api/availability/room-nonexistent/slots is called with any body
- **THEN** the system returns HTTP 404 Not Found
- **AND** response includes error message: "Room not found"

#### Scenario: Validate request body structure

- **GIVEN** a room with id "room-006" exists
- **WHEN** POST /api/availability/room-006/slots is called with invalid body (missing dates or duration)
- **THEN** the system returns HTTP 400 Bad Request
- **AND** response includes validation error messages
- **AND** no slots are calculated

### Requirement: Gap Buffer Logic

The system SHALL apply a configurable gap buffer (default 15 minutes) between consecutive sessions in the same room. The gap shall be added to the end time of a booked session to determine the earliest available next slot, which must then align to the next slot increment boundary.

#### Scenario: Apply 15-minute gap between sessions

- **GIVEN** a room with id "room-gap" exists
- **AND** the therapist's consultationGapMinutes is 15
- **AND** the therapist's slotIncrementMinutes is 15
- **AND** an existing booking ends at 09:45
- **WHEN** slots are calculated for 45-minute sessions
- **THEN** the next available slot is 10:00 (not 09:45 or 10:15)
- **AND** the gap buffer adds 15 minutes: 09:45 + 15min = 10:00
- **AND** the slot aligns to the 15-minute increment boundary

#### Scenario: Apply 30-minute gap when configured

- **GIVEN** a room with id "room-gap-30" exists
- **AND** the therapist's consultationGapMinutes is 30
- **AND** the therapist's slotIncrementMinutes is 15
- **AND** an existing booking ends at 09:30
- **WHEN** slots are calculated for 45-minute sessions
- **THEN** the next available slot is 10:15 (not 09:30 or 10:00)
- **AND** the gap buffer adds 30 minutes: 09:30 + 30min = 10:00
- **AND** the slot aligns to the next 15-minute increment: 10:15

#### Scenario: Align slots to custom increment boundaries

- **GIVEN** a room with id "room-inc-30" exists
- **AND** the therapist's consultationGapMinutes is 15
- **AND** the therapist's slotIncrementMinutes is 30 (custom increment)
- **AND** an existing booking ends at 09:45
- **AND** available time range starts at 09:00
- **WHEN** slots are calculated for 30-minute sessions
- **THEN** available slots include: 09:00, 10:00, 10:30, etc.
- **AND** after 09:45 booking + 15min gap = 10:00
- **AND** the next slot aligns to 30-minute increment: 10:00

#### Scenario: Handle gap at end of availability range

- **GIVEN** a room with id "room-end-gap" exists
- **AND** therapist availability ends at 17:00
- **AND** an existing booking ends at 16:30
- **AND** the therapist's consultationGapMinutes is 15
- **WHEN** slots are calculated for 60-minute sessions
- **THEN** the system does NOT offer a slot starting at 16:45 or 16:30
- **AND** the 16:30 booking ends + 15min gap = 16:45
- **AND** a 60-minute session starting at 16:45 would end at 17:45 (beyond 17:00 availability)
- **AND** therefore no slot is available after 16:30 booking

### Requirement: Slot Increment Logic

The system SHALL generate time slots at configurable intervals (default 15 minutes) as defined by the therapist's `slotIncrementMinutes` setting. Slot start times shall align to these increment boundaries, regardless of the availability range start time.

#### Scenario: Generate slots at 15-minute increments (default)

- **GIVEN** a room with id "room-inc-15" exists
- **AND** therapist availability is 09:00-17:00
- **AND** the therapist's slotIncrementMinutes is 15 (default)
- **AND** no existing bookings
- **WHEN** slots are calculated for 30-minute sessions
- **THEN** availableSlots includes: "09:00", "09:15", "09:30", "09:45", "10:00", etc.
- **AND** all slot start times are multiples of 15 minutes from 09:00
- **AND** the last slot allows the session to end by 17:00

#### Scenario: Generate slots at 30-minute increments

- **GIVEN** a room with id "room-inc-30-alt" exists
- **AND** therapist availability is 09:00-17:00
- **AND** the therapist's slotIncrementMinutes is 30
- **AND** no existing bookings
- **WHEN** slots are calculated for 45-minute sessions
- **THEN** availableSlots includes: "09:00", "09:30", "10:00", "10:30", etc.
- **AND** all slot start times are multiples of 30 minutes from 09:00
- **AND** availableSlots does NOT include "09:15" or "09:45"

#### Scenario: Align slots to increment when availability starts mid-increment

- **GIVEN** a room with id "room-mid-start" exists
- **AND** therapist availability is 09:07-17:00 (starts mid-increment)
- **AND** the therapist's slotIncrementMinutes is 15
- **WHEN** slots are calculated for 30-minute sessions
- **THEN** the first available slot is 09:15 (not 09:07)
- **AND** slots are aligned to 15-minute boundaries: 09:15, 09:30, 09:45, etc.

### Requirement: Duration Filtering

The system SHALL filter available slots based on the requested session duration, ensuring that each slot has sufficient time remaining in the availability range after accounting for the session duration and gap buffers.

#### Scenario: Filter slots for 30-minute sessions

- **GIVEN** a room with id "room-dur-30" exists
- **AND** therapist availability ends at 17:00
- **AND** the therapist's consultationGapMinutes is 15
- **AND** no existing bookings
- **WHEN** slots are calculated with duration: 30
- **THEN** the last available slot is 16:30 (not 16:45 or 17:00)
- **AND** a 30-minute session starting at 16:30 would end at 17:00 (exactly at availability end)
- **AND** a 30-minute session starting at 16:45 would end at 17:15 (beyond availability)

#### Scenario: Filter slots for 60-minute sessions

- **GIVEN** a room with id "room-dur-60" exists
- **AND** therapist availability ends at 17:00
- **AND** the therapist's consultationGapMinutes is 15
- **AND** no existing bookings
- **WHEN** slots are calculated with duration: 60
- **THEN** the last available slot is 16:00 (not 16:15 or 16:30)
- **AND** a 60-minute session starting at 16:00 would end at 17:00 (exactly at availability end)

#### Scenario: Filter slots when booking reduces available time

- **GIVEN** a room with id "room-dur-booking" exists
- **AND** therapist availability is 09:00-17:00
- **AND** an existing booking occupies 09:00-10:00 (60 minutes)
- **AND** the therapist's consultationGapMinutes is 15
- **WHEN** slots are calculated for 60-minute sessions
- **THEN** the first available slot after the booking is 10:15
- **AND** 10:00 is NOT available (10:00 booking end + 15min gap = 10:15)
- **AND** a 60-minute session starting at 10:15 would end at 11:15

### Requirement: Room Access Control

The system SHALL enforce organization-based access control for room availability endpoints, ensuring users can only view and book rooms belonging to their organization.

#### Scenario: Prevent accessing rooms from other organizations

- **GIVEN** a user belongs to organization "org-A"
- **AND** a room with id "room-org-B" belongs to organization "org-B"
- **WHEN** the user calls POST /api/availability/room-org-B/slots
- **THEN** the system returns HTTP 403 Forbidden or 404 Not Found
- **AND** response includes error message: "Room not found"
- **AND** the user cannot access availability for room-org-B

#### Scenario: Allow accessing rooms from own organization

- **GIVEN** a user belongs to organization "org-A"
- **AND** a room with id "room-org-A" belongs to organization "org-A"
- **WHEN** the user calls POST /api/availability/room-org-A/slots
- **THEN** the system returns HTTP 200 OK
- **AND** the user receives availability data for room-org-A
- **AND** access is granted

### Requirement: Update Consultation Creation API

The system SHALL update the POST /api/consultations endpoint to accept and validate the `roomId` field, storing it in the consultations table and enforcing the unique constraint to prevent double-booking.

#### Scenario: Create consultation with valid roomId

- **GIVEN** a room with id "room-create" exists and belongs to the user's organization
- **AND** a patient with id "patient-001" exists
- **WHEN** POST /api/consultations is called with body { roomId: "room-create", patientId: "patient-001", date: "2025-01-15", startTime: "09:00", endTime: "09:45", duration: 45, ... }
- **THEN** the system returns HTTP 200 OK
- **AND** the created consultation has roomId = "room-create"
- **AND** the consultation is stored in the database
- **AND** the unique constraint is satisfied

#### Scenario: Reject consultation without roomId

- **GIVEN** a patient with id "patient-002" exists
- **WHEN** POST /api/consultations is called with body { patientId: "patient-002", ... } without roomId
- **THEN** the system returns HTTP 400 Bad Request
- **AND** response includes French validation error: "roomId est requis pour les nouvelles consultations"
- **AND** no consultation is created

#### Scenario: Handle unique constraint violation on booking

- **GIVEN** a consultation exists for room "room-double" on 2025-01-15 at 09:00
- **WHEN** POST /api/consultations is called with body { roomId: "room-double", date: "2025-01-15", startTime: "09:00", ... }
- **THEN** the system returns HTTP 409 Conflict
- **AND** response includes error message: "Ce créneau est déjà réservé. Veuillez sélectionner une autre heure."
- **AND** no consultation is created
- **AND** the existing consultation remains unchanged

#### Scenario: Reject consultation with invalid roomId

- **GIVEN** a room with id "room-nonexistent" does not exist
- **WHEN** POST /api/consultations is called with body { roomId: "room-nonexistent", ... }
- **THEN** the system returns HTTP 400 Bad Request
- **AND** response includes validation error: "Room not found"
- **AND** no consultation is created

### Requirement: Performance Optimization for Slot Queries

The system SHALL use database indexes to optimize room availability queries, ensuring that retrieving existing bookings for a room across multiple dates completes within acceptable time limits (<100ms for typical queries).

#### Scenario: Query bookings for single room across 7 days

- **GIVEN** a room with id "room-perf" exists
- **AND** the room has 50 bookings spread across 7 days
- **WHEN** POST /api/availability/room-perf/slots is called with dates: [7 days]
- **THEN** the query to fetch existing bookings completes in <100ms
- **AND** the overall API response time is <200ms
- **AND** the database uses the index on (roomId, date)

#### Scenario: Query bookings for multiple rooms

- **GIVEN** 5 rooms exist in the organization
- **AND** each room has 30 bookings for the requested dates
- **WHEN** availability is calculated for all 5 rooms (5 parallel API calls)
- **THEN** each API call completes in <200ms
- **AND** the total time for all 5 calls is <500ms (parallel execution)
- **AND** the database indexes are used efficiently

### Requirement: Type Safety and Validation

The system SHALL define TypeScript types and Zod validation schemas for room-based availability requests and responses, ensuring type safety and proper data validation.

#### Scenario: Validate roomSlotsRequestSchema

- **GIVEN** the roomSlotsRequestSchema is defined
- **WHEN** validating request body { dates: ["2025-01-15"], duration: 45 }
- **THEN** validation passes successfully
- **AND** dates is required and must be an array of date strings
- **AND** duration is required and must be a number between 15 and 120
- **AND** therapistId is optional string

#### Scenario: Reject invalid dates array

- **GIVEN** the roomSlotsRequestSchema is defined
- **WHEN** validating request body { dates: "2025-01-15", duration: 45 } (dates is not an array)
- **THEN** validation fails
- **AND** error message indicates dates must be an array
- **AND** validation does not proceed to calculate slots

#### Scenario: Reject invalid duration

- **GIVEN** the roomSlotsRequestSchema is defined
- **WHEN** validating request body { dates: ["2025-01-15"], duration: 180 } (duration > 120)
- **THEN** validation fails
- **AND** error message indicates duration must be between 15 and 120
- **AND** validation does not proceed to calculate slots
