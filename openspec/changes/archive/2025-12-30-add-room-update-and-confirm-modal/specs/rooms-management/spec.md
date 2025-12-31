## MODIFIED Requirements

### Requirement: Integration with OrganizationProfileRoomsTab Component

The system SHALL update the OrganizationProfileRoomsTab component to replace mock data with real rooms fetched via the useRooms composable, provide a confirmation modal before deleting rooms, and allow editing rooms through the existing OrganizationRoomSlideover component which supports both create and edit modes. The component SHALL display loading states, handle errors appropriately, and integrate with the useUpdateRoom composable for room updates.

#### Scenario: Display real rooms from API

- **GIVEN** a user navigates to the organization profile rooms tab
- **WHEN** the component mounts
- **THEN** the component calls fetchRooms() from useRooms composable
- **AND** the component displays loading state during fetch
- **AND** the component displays all rooms returned by the API
- **AND** each room card shows: name, location (if available), description, equipment badges, status badge (when implemented)
- **AND** the statistics section shows real counts

#### Scenario: Confirm room deletion before API call

- **GIVEN** the rooms list is displayed with multiple rooms
- **AND** a user clicks the delete button on a room card with name "Salle de traitement 1"
- **WHEN** the delete action is triggered
- **THEN** a confirmation modal is displayed with title "Supprimer la salle"
- **AND** the modal displays message "Êtes-vous sûr de vouloir supprimer \"Salle de traitement 1\" ? Cette action est irréversible."
- **AND** the modal has two buttons: "Annuler" (neutral) and "Supprimer" (error/red)
- **AND** the modal shows a warning icon
- **AND** the room is not deleted until the user confirms
- **AND** clicking "Annuler" closes the modal without deleting the room

#### Scenario: Complete room deletion after confirmation

- **GIVEN** the delete confirmation modal is displayed for a room
- **WHEN** the user clicks the "Supprimer" button
- **THEN** the button shows a loading state
- **AND** the component calls deleteRoom() from useRooms composable
- **AND** the confirmation modal closes
- **AND** on success, a success toast notification appears with message "Salle supprimée avec succès"
- **AND** the room card is removed from the displayed list
- **AND** the statistics are updated accordingly

#### Scenario: Cancel room deletion

- **GIVEN** the delete confirmation modal is displayed for a room
- **WHEN** the user clicks the "Annuler" button or closes the modal
- **THEN** the modal closes without making any API calls
- **AND** the room remains in the list unchanged
- **AND** no toast notifications are displayed

#### Scenario: Handle room deletion error

- **GIVEN** the delete confirmation modal is displayed for a room
- **AND** the user clicks the "Supprimer" button
- **WHEN** the deleteRoom() API call fails with an error
- **THEN** the confirmation modal remains open or reopens
- **AND** an error toast notification appears with French error message
- **AND** the room remains in the list
- **AND** the user can retry the deletion

#### Scenario: Open room edit slideover from list

- **GIVEN** the rooms list is displayed with multiple rooms
- **AND** a room with id "room-123" has the following data: name: "Salle de traitement", description: "Salle principale", capacity: 2, area: 20, prm: true, equipment: ["Table électrique"]
- **WHEN** a user clicks the edit button on the room card
- **THEN** the OrganizationRoomSlideover opens in edit mode
- **AND** the form is pre-populated with the room's current data
- **AND** all fields display the existing values (name, description, capacity, area, accessibility status, equipment)
- **AND** the submit button label is "Enregistrer les modifications"
- **AND** the slideover title is "Modifier la salle"

#### Scenario: Submit room edit form successfully

- **GIVEN** a user has the room slideover open in edit mode for a room
- **AND** the user modifies the name field from "Salle de traitement" to "Salle de traitement mise à jour"
- **AND** the user changes the capacity from 2 to 3
- **WHEN** the user clicks "Enregistrer les modifications" button
- **THEN** the button shows loading state
- **AND** the component calls updateRoom with the modified data via useUpdateRoom composable
- **AND** on success, a success toast notification appears with message "Salle mise à jour avec succès"
- **AND** the slideover closes
- **AND** the room in the list reflects the updated values
- **AND** the statistics are updated if applicable

#### Scenario: Cancel room edit

- **GIVEN** a user has the room slideover open in edit mode for a room
- **AND** the user has made some changes to the form fields
- **WHEN** the user clicks "Annuler" button
- **THEN** the slideover closes
- **AND** no changes are saved to the database
- **AND** the room in the list remains unchanged
- **AND** no toast notifications are displayed

#### Scenario: Validate room edit form data

- **GIVEN** a user has the room slideover open in edit mode for a room
- **AND** the user enters invalid data (e.g., name with 1 character, capacity less than 1)
- **WHEN** the user clicks "Enregistrer les modifications" button
- **THEN** validation errors are displayed in the form
- **AND** the button does not show loading state
- **AND** no API call is made
- **AND** the slideover remains open
- **AND** the user can correct the errors and retry

#### Scenario: Handle room update error

- **GIVEN** a user has the room slideover open in edit mode for a room
- **AND** the user clicks "Enregistrer les modifications" button
- **WHEN** the updateRoom() API call fails with an error
- **THEN** an error toast notification appears with French error message
- **AND** the slideover remains open
- **AND** the form data is preserved for correction
- **AND** the user can retry the update

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
- **THEN** the OrganizationRoomSlideover opens in create mode
- **AND** the form is empty (no pre-populated data)
- **AND** the submit button label is "Ajouter la salle"
- **AND** the slideover title is "Ajouter une nouvelle salle"
- **AND** the rooms list component remains visible in the background

#### Scenario: Slideover resets to create mode after closing

- **GIVEN** a user has the room slideover open in edit mode with pre-populated data
- **WHEN** the user closes the slideover (cancel or success)
- **THEN** the form state is reset to default values
- **AND** the slideover is ready for the next operation (create or edit)
- **AND** no residual room data remains in the form state

#### Scenario: Submit room create form successfully (existing behavior)

- **GIVEN** a user has the room slideover open in create mode (no room prop)
- **AND** the user fills in valid room data
- **WHEN** the user clicks "Ajouter la salle" button
- **THEN** the button shows loading state
- **AND** the component calls createRoom with the data via useCreateRoom composable
- **AND** on success, a success toast notification appears with message "Salle ajoutée avec succès"
- **AND** the slideover closes
- **AND** the new room appears in the list
- **AND** the statistics are updated
