## ADDED Requirements

### Requirement: Room-Centric Consultation Planning

The system SHALL provide room-centric consultation planning that uses room availability as the primary constraint for scheduling sessions. Each room SHALL only allow one consultation at a time, eliminating the need for concurrent session counting.

#### Scenario: Generate available slots for a room

- **GIVEN** a room with id "room-123" exists
- **AND** the room has no consultations booked on date "2025-01-15"
- **WHEN** the system generates available slots for the room
- **THEN** the system returns time slots that fall within the room's operating hours
- **AND** each slot is available for booking
- **AND** the system does not check concurrent session counts

#### Scenario: Prevent double-booking a room

- **GIVEN** a room with id "room-123" exists
- **AND** the room has a consultation booked on "2025-01-15" from "10:00" to "11:00"
- **WHEN** the system generates available slots for the room
- **THEN** the time slot "10:00" is NOT available
- **AND** the slot "11:00" IS available (after the existing consultation ends)
- **AND** no other consultation can be booked in the same room at the same time

#### Scenario: Check room availability for booking

- **GIVEN** a room with id "room-123" exists
- **AND** a therapist wants to book a session from "14:00" to "15:00" on "2025-01-15"
- **WHEN** the booking request is validated
- **THEN** the system checks if the room is booked during "14:00-15:00"
- **AND** if the room is NOT booked, the booking proceeds
- **AND** if the room IS booked, the system returns an error "Room already booked for this time slot"

### Requirement: Room Availability Slot Generation

The system SHALL generate available time slots for rooms based on simple binary availability (booked or free), without concurrent session counting or capacity indicators.

#### Scenario: Generate slots for room with no bookings

- **GIVEN** a room with id "room-123" is available on "2025-01-15" from "09:00" to "17:00"
- **AND** no consultations are booked in the room
- **AND** slot increment is 15 minutes
- **AND** consultation duration is 45 minutes
- **WHEN** the system generates available slots
- **THEN** slots are returned starting at "09:00", "09:15", "09:30", and so on
- **AND** each slot represents 45-minute availability
- **AND** the last slot starts before "16:15" (to allow 45 minutes before closing at 17:00)
- **AND** all slots are marked as available

#### Scenario: Generate slots for room with existing bookings

- **GIVEN** a room has a consultation booked from "10:00" to "11:00"
- **AND** a consultation booked from "14:00" to "15:00"
- **WHEN** the system generates available slots
- **THEN** slots during "10:00-11:00" are NOT available
- **AND** slots during "14:00-15:00" are NOT available
- **AND** slots before "10:00", between "11:00-14:00", and after "15:00" ARE available
- **AND** each slot is either available or not (no fractional capacity)

#### Scenario: Respect consultation gap buffer

- **GIVEN** a room has a consultation booked from "10:00" to "10:45"
- **AND** the consultation gap is 15 minutes
- **WHEN** the system generates available slots
- **THEN** the next available slot starts at "11:00" (end time + gap)
- **AND** slots at "10:45", "10:50", "10:55" are NOT available

### Requirement: Consultation Booking with Room Validation

The system SHALL validate room availability before creating a consultation and enforce database constraints to prevent double-booking.

#### Scenario: Create consultation when room is available

- **GIVEN** a room with id "room-123" is available on "2025-01-15" from "10:00" to "11:00"
- **WHEN** a consultation is created with roomId "room-123", date "2025-01-15", startTime "10:00", endTime "11:00"
- **THEN** the consultation is created successfully
- **AND** the consultation is linked to the room
- **AND** the room's time slot is now booked

#### Scenario: Reject consultation when room is already booked

- **GIVEN** a consultation exists in room "room-123" on "2025-01-15" from "10:00" to "11:00"
- **WHEN** a new consultation is attempted with roomId "room-123", date "2025-01-15", startTime "10:00", endTime "11:00"
- **THEN** the consultation creation fails
- **AND** the system returns HTTP 409 Conflict
- **AND** error message states "Room already booked for this time slot"
- **AND** no consultation is created

#### Scenario: Database constraint prevents double-booking

- **GIVEN** a unique index exists on consultations table for (roomId, date, startTime)
- **AND** a consultation is booked in room "room-123" on "2025-01-15" at "10:00"
- **WHEN** a second consultation is attempted with same roomId, date, and startTime
- **THEN** the database insert fails with unique constraint violation
- **AND** the error is caught and returned to the user
- **AND** the room is never double-booked even with concurrent requests
