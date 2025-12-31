## ADDED Requirements

### Requirement: Room Availability for Consultation Booking

The rooms management system SHALL provide room availability information for consultation planning, allowing therapists to check if a room is available for a specific time slot before booking.

#### Scenario: Check room availability for booking

- **GIVEN** a room with id "room-123" exists
- **AND** the room has no consultations on "2025-01-15"
- **WHEN** checking availability for "2025-01-15" from "10:00" to "11:00"
- **THEN** the system returns that the room is available
- **AND** the room can be booked for a consultation

#### Scenario: Check room availability when booked

- **GIVEN** a room with id "room-123" has a consultation on "2025-01-15" from "10:00" to "11:00"
- **WHEN** checking availability for "2025-01-15" from "10:00" to "11:00"
- **THEN** the system returns that the room is not available
- **AND** the room cannot be booked for that time slot

#### Scenario: Check room availability across multiple dates

- **GIVEN** a room exists with consultations on various dates
- **WHEN** checking availability for dates ["2025-01-15", "2025-01-16", "2025-01-17"]
- **THEN** the system returns availability status for each date
- **AND** each date shows whether the room is available or not

## MODIFIED Requirements

### Requirement: Consultation-Room Relationship

The system SHALL enforce a one-to-one relationship between consultations and rooms at a given time slot, ensuring that a room can only host one consultation at a time.

#### Scenario: Link consultation to room

- **GIVEN** a consultation with id "consultation-123" exists
- **AND** a room with id "room-123" exists
- **WHEN** the consultation is assigned to the room
- **THEN** the consultation's roomId is set to "room-123"
- **AND** the consultation can be queried by room
- **AND** the room's consultation history includes this consultation

#### Scenario: Prevent room double-booking at database level

- **GIVEN** a consultation exists in room "room-123" on "2025-01-15" at "10:00"
- **WHEN** attempting to create another consultation in the same room at the same date and time
- **THEN** the database unique constraint on (roomId, date, startTime) prevents the insert
- **AND** an error is returned indicating the room is already booked

#### Scenario: Query consultations by room and date

- **GIVEN** multiple consultations exist across different rooms and dates
- **WHEN** querying consultations for room "room-123" on "2025-01-15"
- **THEN** only consultations for that specific room and date are returned
- **AND** results are ordered by startTime
