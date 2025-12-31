# rooms-management Specification

## Purpose

Define requirements for managing treatment rooms within a physical therapy clinic organization, including creation, retrieval, update, and deletion of room resources with proper organization scoping and validation.

## ADDED Requirements

### Requirement: Create Rooms Table in Database

The system SHALL create a `rooms` table with the following schema: id (UUID primary key), organizationId (foreign key to organizations), name (required text), description (optional text), equipment (JSON array of strings), capacity (required integer), area (optional integer), prm (boolean for accessibility), createdAt, updatedAt, and deletedAt timestamps. The table SHALL include indexes on organizationId with deletedAt and name for efficient queries, organizationId with deletedAt and createdAt for date-based sorting, and organizationId with deletedAt for finding soft-deleted records.

#### Scenario: Create rooms table with proper structure

- **GIVEN** the database migration is executed
- **WHEN** the `rooms` table is created
- **THEN** the table has all required columns: id, organizationId, name, description, equipment, capacity, area, prm, createdAt, updatedAt, deletedAt
- **AND** id is a text field using UUID v7 format
- **AND** organizationId is a foreign key referencing organizations.id with cascade delete
- **AND** name is a required text field
- **AND** description is an optional text field
- **AND** equipment is stored as JSON array of strings
- **AND** capacity is a required integer field with minimum value of 1
- **AND** area is an optional integer field
- **AND** prm is stored as integer (0 or 1) representing boolean accessibility flag
- **AND** createdAt and updatedAt are timestamp fields in milliseconds
- **AND** deletedAt is an optional timestamp field for soft-delete

#### Scenario: Create proper indexes for room queries

- **GIVEN** the rooms table exists
- **WHEN** indexes are created
- **THEN** index `idx_rooms_org_name` exists on (organizationId, deletedAt, name)
- **AND** index `idx_rooms_org_created` exists on (organizationId, deletedAt, createdAt)
- **AND** index `idx_rooms_org_deleted` exists on (organizationId, deletedAt)

### Requirement: List Rooms API Endpoint

The system SHALL provide a GET /api/rooms endpoint that returns all rooms belonging to the authenticated user's active organization, excluding soft-deleted records. The endpoint SHALL support an optional search query parameter for filtering by name and description fields.

#### Scenario: List rooms successfully

- **GIVEN** an authenticated user with an active organization
- **AND** the organization has 5 rooms configured
- **WHEN** GET /api/rooms is called
- **THEN** the system returns HTTP 200
- **AND** response is an array of 5 rooms
- **AND** each room includes all fields: id, organizationId, name, description, equipment, capacity, area, prm, createdAt, updatedAt

#### Scenario: Search rooms by name or description

- **GIVEN** an authenticated user with an active organization
- **AND** the organization has rooms named "Salle de traitement 1" and "Salle de traitement 2"
- **WHEN** GET /api/rooms is called with search parameter "traitement"
- **THEN** the system returns HTTP 200
- **AND** response.data contains only rooms with "traitement" in name or description
- **AND** pagination.total reflects the filtered count

#### Scenario: Handle unauthorized access to rooms list

- **GIVEN** an unauthenticated request
- **WHEN** GET /api/rooms is called
- **THEN** the system returns HTTP 401 Unauthorized

#### Scenario: Exclude soft-deleted rooms from list

- **GIVEN** an authenticated user with an active organization
- **AND** the organization has 3 rooms, with 1 soft-deleted
- **WHEN** GET /api/rooms is called
- **THEN** the system returns HTTP 200
- **AND** response.data contains only 2 rooms (non-deleted)
- **AND** pagination.total equals 2

### Requirement: Create Room API Endpoint

The system SHALL provide a POST /api/rooms endpoint that creates a new room for the authenticated user's active organization. The endpoint SHALL validate the request body using Zod schema and return the created room object with all fields populated.

#### Scenario: Create room with valid data

- **GIVEN** an authenticated user with an active organization
- **WHEN** POST /api/rooms is called with valid room data: { name: "Salle de traitement", description: "Pour les soins manuels", equipment: ["Table électrique"], capacity: 2, area: 20, prm: true }
- **THEN** the system returns HTTP 200
- **AND** response includes the created room with id assigned
- **AND** response.name equals "Salle de traitement"
- **AND** response.description equals "Pour les soins manuels"
- **AND** response.equipment is array containing "Table électrique"
- **AND** response.capacity equals 2
- **AND** response.area equals 20
- **AND** response.prm equals true
- **AND** response.organizationId equals the user's active organization ID
- **AND** response.createdAt and response.updatedAt are set
- **AND** response.deletedAt is null

#### Scenario: Validate required fields when creating room

- **GIVEN** an authenticated user with an active organization
- **WHEN** POST /api/rooms is called without required fields (missing name or capacity)
- **THEN** the system returns HTTP 400
- **AND** response includes validation error messages in French
- **AND** no room is created in the database

#### Scenario: Enforce name minimum length validation

- **GIVEN** an authenticated user with an active organization
- **WHEN** POST /api/rooms is called with name field having fewer than 2 characters
- **THEN** the system returns HTTP 400
- **AND** response includes validation error message about minimum length requirement in French

#### Scenario: Enforce capacity minimum value validation

- **GIVEN** an authenticated user with an active organization
- **WHEN** POST /api/rooms is called with capacity field less than 1
- **THEN** the system returns HTTP 400
- **AND** response includes validation error message about minimum capacity in French

#### Scenario: Handle unauthorized room creation

- **GIVEN** an unauthenticated request
- **WHEN** POST /api/rooms is called with any room data
- **THEN** the system returns HTTP 401 Unauthorized

### Requirement: Update Room API Endpoint

The system SHALL provide a PUT /api/rooms/[id] endpoint that updates an existing room. The endpoint SHALL only allow updates to rooms belonging to the authenticated user's active organization and that are not soft-deleted. All fields shall be optional in the request body.

#### Scenario: Update room successfully

- **GIVEN** an authenticated user with an active organization
- **AND** a room exists with id "room-123" belonging to the organization
- **WHEN** PUT /api/rooms/room-123 is called with partial data: { name: "Salle mise à jour", capacity: 3 }
- **THEN** the system returns HTTP 200
- **AND** response includes the updated room
- **AND** response.name equals "Salle mise à jour"
- **AND** response.capacity equals 3
- **AND** response.updatedAt is different from the previous value
- **AND** other unchanged fields remain the same (description, equipment, area, prm)

#### Scenario: Return 404 for non-existent room

- **GIVEN** an authenticated user with an active organization
- **WHEN** PUT /api/rooms/non-existent-id is called with any update data
- **THEN** the system returns HTTP 404 Not Found
- **AND** response includes error message "Room not found"

#### Scenario: Prevent updating room from different organization

- **GIVEN** an authenticated user with active organization "org-A"
- **AND** a room exists with id "room-456" belonging to organization "org-B"
- **WHEN** PUT /api/rooms/room-456 is called with any update data
- **THEN** the system returns HTTP 404 Not Found
- **AND** room-456 remains unchanged

#### Scenario: Prevent updating soft-deleted room

- **GIVEN** an authenticated user with an active organization
- **AND** a room with id "room-789" was soft-deleted (deletedAt is set)
- **WHEN** PUT /api/rooms/room-789 is called with any update data
- **THEN** the system returns HTTP 404 Not Found

#### Scenario: Validate update data types

- **GIVEN** an authenticated user with an active organization
- **AND** a room exists with id "room-123" belonging to the organization
- **WHEN** PUT /api/rooms/room-123 is called with invalid data types: { capacity: "invalid" }
- **THEN** the system returns HTTP 400
- **AND** response includes validation error message in French

### Requirement: Delete Room API Endpoint

The system SHALL provide a DELETE /api/rooms/[id] endpoint that performs a soft-delete on an existing room by setting the deletedAt timestamp. The endpoint SHALL only allow deletion of rooms belonging to the authenticated user's active organization and that are not already soft-deleted. Future constraints will prevent deletion if the room has associated consultations.

#### Scenario: Soft-delete room successfully

- **GIVEN** an authenticated user with an active organization
- **AND** a room exists with id "room-123" belonging to the organization
- **AND** the room has deletedAt set to null
- **WHEN** DELETE /api/rooms/room-123 is called
- **THEN** the system returns HTTP 200
- **AND** response includes success message "Room deleted successfully"
- **AND** the room's deletedAt field is set to current timestamp
- **AND** the room no longer appears in GET /api/rooms results
- **AND** the room remains in the database (soft-delete, not hard delete)

#### Scenario: Return 404 for non-existent room deletion

- **GIVEN** an authenticated user with an active organization
- **WHEN** DELETE /api/rooms/non-existent-id is called
- **THEN** the system returns HTTP 404 Not Found
- **AND** response includes error message "Room not found"

#### Scenario: Prevent deleting room from different organization

- **GIVEN** an authenticated user with active organization "org-A"
- **AND** a room exists with id "room-456" belonging to organization "org-B"
- **WHEN** DELETE /api/rooms/room-456 is called
- **THEN** the system returns HTTP 404 Not Found
- **AND** room-456 remains in database with deletedAt unchanged

#### Scenario: Prevent double-deletion of already deleted room

- **GIVEN** an authenticated user with an active organization
- **AND** a room with id "room-789" was already soft-deleted (deletedAt is set)
- **WHEN** DELETE /api/rooms/room-789 is called
- **THEN** the system returns HTTP 404 Not Found

### Requirement: Room Types and Validation Schemas

The system SHALL define TypeScript types and Zod validation schemas for room operations including Room, RoomCreate, RoomUpdate, and RoomQuery. All validation messages SHALL use French locale to match the application's language setting.

#### Scenario: RoomCreate schema requires name and capacity

- **GIVEN** the roomCreateSchema is defined
- **WHEN** validating an object without name field
- **THEN** validation fails with French error message about required name
- **AND** when validating an object without capacity field
- **THEN** validation fails with French error message about required capacity

#### Scenario: RoomCreate schema validates name length

- **GIVEN** the roomCreateSchema is defined
- **WHEN** validating an object with name field having 1 character
- **THEN** validation fails with French error message about minimum length (2 characters)
- **AND** when validating an object with name field having 101 characters
- **THEN** validation fails with French error message about maximum length (100 characters)

#### Scenario: RoomCreate schema validates capacity range

- **GIVEN** the roomCreateSchema is defined
- **WHEN** validating an object with capacity equals 0
- **THEN** validation fails with French error message about minimum capacity
- **AND** when validating an object with capacity equals 51
- **THEN** validation fails with French error message about maximum capacity (50)

#### Scenario: RoomCreate schema validates area range when provided

- **GIVEN** the roomCreateSchema is defined
- **WHEN** validating an object with area equals 0
- **THEN** validation fails with French error message about minimum area (1)
- **AND** when validating an object with area equals 1001
- **THEN** validation fails with French error message about maximum area (1000)

#### Scenario: RoomCreate schema makes description optional

- **GIVEN** the roomCreateSchema is defined
- **WHEN** validating an object without description field
- **THEN** validation passes successfully

#### Scenario: RoomCreate schema validates description length when provided

- **GIVEN** the roomCreateSchema is defined
- **WHEN** validating an object with description field having 501 characters
- **THEN** validation fails with French error message about maximum length (500 characters)

#### Scenario: RoomUpdate schema makes all fields optional

- **GIVEN** the roomUpdateSchema is defined
- **AND** it is derived from roomCreateSchema with partial()
- **WHEN** validating an object with only name field
- **THEN** validation passes successfully
- **AND** when validating an empty object {}
- **THEN** validation passes successfully

#### Scenario: RoomQuery schema supports search

- **GIVEN** the roomQuerySchema is defined
- **WHEN** validating query parameters { search: "salle" }
- **THEN** validation passes
- **AND** when validating without optional parameters
- **THEN** validation passes

### Requirement: Room Composable for Client-Side Data Fetching

The system SHALL provide a `useRooms` composable that encapsulates room data fetching and CRUD operations. The composable SHALL use createSharedComposable for reactivity across components and expose reactive state for rooms list, loading status, and error handling.

#### Scenario: Fetch rooms list successfully

- **GIVEN** a Vue component using the useRooms composable
- **WHEN** the component calls fetchRooms()
- **THEN** the composable sets loading to true during the request
- **AND** the composable fetches data from /api/rooms endpoint
- **AND** the composable populates the rooms reactive ref with the response data
- **AND** the composable sets loading to false after completion
- **AND** the composable returns the array of rooms

#### Scenario: Create room through composable

- **GIVEN** a Vue component using the useRooms composable
- **WHEN** the component calls createRoom(roomData)
- **THEN** the composable sends POST request to /api/rooms
- **AND** the composable returns the created room object
- **AND** the composable throws an error if the request fails

#### Scenario: Update room through composable

- **GIVEN** a Vue component using the useRooms composable
- **AND** a room exists with id "room-123"
- **WHEN** the component calls updateRoom("room-123", updateData)
- **THEN** the composable sends PUT request to /api/rooms/room-123
- **AND** the composable returns the updated room object
- **AND** the composable throws an error if the request fails

#### Scenario: Delete room through composable

- **GIVEN** a Vue component using the useRooms composable
- **AND** a room exists with id "room-123"
- **WHEN** the component calls deleteRoom("room-123")
- **THEN** the composable sends DELETE request to /api/rooms/room-123
- **AND** the composable returns success message
- **AND** the composable throws an error if the request fails

#### Scenario: Composable provides reactive loading and error state

- **GIVEN** a Vue component using the useRooms composable
- **WHEN** any composable method is called
- **THEN** the component can observe loading ref state
- **AND** the component can observe error ref state
- **AND** the component can display loading indicators or error messages based on these refs

### Requirement: Integration with OrganizationRoomSlideover Component

The system SHALL update the OrganizationRoomSlideover component to replace mock data submission with real API calls using the useRooms composable. The component SHALL handle loading states during form submission, display success/error toast notifications, and reset the form after successful room creation.

#### Scenario: Submit room form creates real room

- **GIVEN** a user opens the room slideover
- **AND** the user fills in the form with valid room data
- **WHEN** the user clicks "Ajouter la salle" (Add room) button
- **THEN** the button shows loading state
- **AND** the component calls createRoom with form data
- **AND** on success, a success toast notification appears
- **AND** the slideover closes
- **AND** the form is reset to initial state
- **AND** the room is created in the database

#### Scenario: Handle room creation error

- **GIVEN** a user opens the room slideover
- **AND** the user fills in the form with invalid data (e.g., name too short)
- **WHEN** the user clicks "Ajouter la salle" button
- **THEN** the button shows loading state initially
- **AND** validation errors are displayed in the form
- **AND** an error toast notification appears with French message
- **AND** the slideover remains open
- **AND** the form data is preserved for correction

#### Scenario: Cancel room creation

- **GIVEN** a user opens the room slideover
- **AND** the user has partially filled the form
- **WHEN** the user clicks "Annuler" (Cancel) button
- **THEN** the slideover closes
- **AND** the form is reset to initial state
- **AND** no room is created

### Requirement: Integration with OrganizationProfileRoomsTab Component

The system SHALL update the OrganizationProfileRoomsTab component to replace mock data with real rooms fetched via the useRooms composable. The component SHALL connect edit, duplicate, and delete actions to composable methods, display loading states, and handle errors appropriately.

#### Scenario: Display real rooms from API

- **GIVEN** a user navigates to the organization profile rooms tab
- **WHEN** the component mounts
- **THEN** the component calls fetchRooms() from useRooms composable
- **AND** the component displays loading state during fetch
- **AND** the component displays all rooms returned by the API
- **AND** each room card shows: name, location (if available), description, equipment badges, status badge (when implemented)
- **AND** the statistics section shows real counts

#### Scenario: Handle room deletion from list

- **GIVEN** the rooms list is displayed with multiple rooms
- **AND** a user clicks the delete button on a room card
- **WHEN** the delete action is confirmed
- **THEN** the component calls deleteRoom() from useRooms composable
- **AND** on success, a success toast notification appears
- **AND** the room card is removed from the displayed list
- **AND** the statistics are updated accordingly

#### Scenario: Handle room list fetch error

- **GIVEN** a user navigates to the organization profile rooms tab
- **WHEN** the component calls fetchRooms() and the API returns an error
- **THEN** the component displays an error message
- **AND** the component shows an error toast notification with French message
- **AND** the component does not display any room cards
- **AND** the user can retry the fetch

#### Scenario: Open room creation slideover from list

- **GIVEN** the rooms list is displayed
- **WHEN** the user clicks "Ajouter une nouvelle salle" button
- **THEN** the OrganizationRoomSlideover opens
- **AND** the rooms list component remains visible in the background

#### Scenario: Open edit room action

- **GIVEN** the rooms list is displayed with multiple rooms
- **WHEN** a user clicks the edit button on a room card
- **THEN** the edit action shows a toast notification (as per current mock implementation)
- **AND** the edit functionality will be fully implemented in a future update

#### Scenario: Open duplicate room action

- **GIVEN** the rooms list is displayed with multiple rooms
- **WHEN** a user clicks the duplicate button on a room card
- **THEN** the duplicate action shows a toast notification (as per current mock implementation)
- **AND** the duplicate functionality will be fully implemented in a future update
