## MODIFIED Requirements

### Requirement: Room-Centric Consultation Planning

The system SHALL provide room-centric consultation planning using room availability as the primary constraint. The unified appointment status is used for all booking validation. All existing room booking behavior is preserved.

#### Scenario: Prevent double-booking a room

- **GIVEN** a room with id "room-123" exists
- **AND** the room has a consultation booked on "2025-01-15" from "10:00" to "11:00" with status "scheduled"
- **WHEN** the system generates available slots for the room
- **THEN** the time slot "10:00" is NOT available
- **AND** no other consultation can be booked in the same room at the same time
