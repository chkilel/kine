# Design: Room Update and Confirm Modal

## Context

The rooms management system currently supports:

- Creating rooms via OrganizationRoomSlideover
- Listing rooms via OrganizationProfileRoomsTab
- Deleting rooms (without confirmation)
- Backend API and composables for all CRUD operations

The edit button in the room list only shows a toast notification as a placeholder.
The delete action calls the API immediately without user confirmation, which is dangerous for data integrity.

## Goals / Non-Goals

**Goals:**

- Provide a polished room edit experience by reusing the existing OrganizationRoomSlideover component
- Add confirmation for destructive actions to prevent accidental data loss
- Create a reusable modal component that can be used throughout the application
- Maintain consistency with existing UI patterns (Nuxt UI components, forms, toasts)

**Non-Goals:**

- Changing the underlying API or database schema
- Implementing room duplication functionality
- Adding complex validation beyond existing schemas
- Creating a separate edit slideover component

## Decisions

### 1. Room Edit Implementation

**Decision:** Modify the existing `OrganizationRoomSlideover.vue` component to support both create and edit modes through a `room` prop.

**Rationale:**

- Consistency: Users will have the same experience for creating and editing
- Code reusability: Forms, validation, and UI patterns remain identical
- Maintainability: Single component is easier to maintain than duplicate code
- Less code: Avoids duplicating the entire form structure and logic

**Alternatives considered:**

- Create separate edit slideover: Would result in code duplication and maintenance overhead
- Inline editing in the card: Limited space for all room fields, poor UX for complex forms

### 2. Confirm Modal Component Design

**Decision:** Create a generic `ModalConfirm.vue` component with the following props:

- `title` (string) - Modal title
- `message` (string) - Confirmation message
- `confirmText` (string, default: "Confirmer") - Primary button text
- `cancelText` (string, default: "Annuler") - Secondary button text
- `confirmColor` (string, default: "primary") - Button color variant
- `icon` (string, default: "i-carbon-warning-alt") - Warning icon
- `loading` (boolean) - Loading state for the confirm action
- Returns a Promise that resolves when user confirms or rejects

**Rationale:**

- Flexibility: Can be used for delete actions, confirmation dialogs, and other destructive operations
- Promise-based: Modern async/await pattern fits well with Vue composition API
- Nuxt UI integration: Uses UModal with existing styling system
- Customizable: Props allow different messaging for different contexts

**Alternatives considered:**

- Composable approach using `useOverlay()`: Would require more boilerplate for each usage
- Context-based modal: Adds complexity without clear benefits for simple confirmations

### 3. Modal Opening Pattern

**Decision:** Use the existing `useOverlay()` composable pattern already used in `OrganizationProfileRoomsTab.vue`.

**Rationale:**

- Consistency with existing codebase
- Proper z-index management and accessibility
- Native feel with Nuxt's overlay system

### 4. Room Edit State Management

**Decision:** When a `room` prop is provided, the slideover operates in edit mode: pre-populates the form with existing room data, uses the update composable, and displays appropriate title/button text. Without a `room` prop, it operates in create mode as before.

**Rationale:**

- User-friendly: Users see current values and can edit specific fields
- Efficient: No need to re-fetch room data on mount
- Consistent with DocumentEditModal pattern in the codebase
- Backward compatible: Create mode behavior remains unchanged when no room prop is provided

## Risks / Trade-offs

### Risk 1: Single Component Complexity

**Risk:** Modifying the existing component to support both modes adds conditional logic and may increase complexity.

**Mitigation:** Keep the mode logic simple with clear separation between create and edit paths. Use computed properties for dynamic content (title, button text, etc.) to minimize conditional rendering. The component remains focused on a single responsibility: room form submission.

### Risk 2: Confirm Modal Complexity

**Risk:** The generic ModalConfirm component may become too complex with many props.

**Mitigation:** Keep the component focused on simple confirmations. Complex forms or multi-step confirmations should use dedicated modals.

### Trade-off: Promise-based vs Event-based

**Decision:** Promise-based modal allows cleaner async/await code, but requires the parent component to manage open state.

**Trade-off accepted:** The async/await pattern is more readable and modern, outweighing the minor state management overhead.

## Migration Plan

No migration needed - all changes are additive.

### Implementation Steps

1. Create `ModalConfirm.vue` component
2. Update `OrganizationProfileRoomsTab.vue` to:
   - Integrate confirm modal with delete action
   - Add edit button handler to open slideover with room data
3. Modify `OrganizationRoomSlideover.vue` to:
   - Accept optional `room` prop
   - Detect edit vs create mode based on prop presence
   - Pre-populate form when in edit mode
   - Use useUpdateRoom composable in edit mode
   - Update title and button text dynamically
4. Test the complete flow: edit room, cancel edit, confirm delete, cancel delete

### Rollback

If issues arise:

- Revert to previous delete behavior (direct deletion without confirmation)
- Revert edit button to toast notification placeholder

## Open Questions

- Should the confirm modal support custom input fields (like the user's example)? **Decision:** No, keep it simple for now. If needed, create a separate ModalPrompt component.

## Component Structure

```
app/components/
  ├── ModalConfirm.vue (new)
  └── organization/
      ├── OrganizationRoomSlideover.vue (modified - now supports both create and edit)
      └── OrganizationProfileRoomsTab.vue (modified)
```

## Integration Points

- `ModalConfirm.vue` will be used by:
  - `OrganizationProfileRoomsTab.vue` (room delete)
  - Potentially other components in the future (patient delete, etc.)

- `OrganizationRoomSlideover.vue` will:
  - Accept optional `room?: Room` prop
  - Use `useUpdateRoom` composable in edit mode, `useCreateRoom` in create mode
  - Be opened from `OrganizationProfileRoomsTab.vue` with or without room data
  - Display different titles and button text based on mode
  - Reset to create mode when closed
