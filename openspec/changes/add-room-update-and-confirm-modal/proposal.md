# Change: Add Room Update and Confirm Modal

## Why

The current room management system has API endpoints and composables for updating rooms, but the UI lacks edit functionality. Additionally, room deletion requires user confirmation to prevent accidental data loss. A reusable confirmation modal will improve UX and prevent accidental deletions across the application.

## What Changes

- Add room edit functionality to the rooms management UI by modifying the existing OrganizationRoomSlideover component to support both create and edit modes
- Create a reusable ModalConfirm component for dangerous action confirmations
- Integrate the confirm modal with room delete action
- **BREAKING**: None (additive changes only)

## Impact

- Affected specs: rooms-management
- Affected code:
  - `app/components/organization/` - add room edit slideover, update rooms list
  - `app/components/` - add new ModalConfirm component
  - Existing room components will be enhanced with edit and confirmed delete actions
