# confirm-modal Specification

## Purpose
TBD - created by archiving change add-room-update-and-confirm-modal. Update Purpose after archive.
## Requirements
### Requirement: Reusable Confirmation Modal Component

The system SHALL provide a reusable ModalConfirm component that can be used throughout the application for confirming destructive or potentially dangerous actions. The component SHALL use Nuxt UI's UModal, support Promise-based interaction, and provide customizable props for title, message, button labels, colors, and loading state.

#### Scenario: Display basic confirmation modal

- **GIVEN** a parent component using ModalConfirm
- **AND** the component passes title: "Supprimer l'élément" and message: "Êtes-vous sûr ?"
- **WHEN** the modal is opened
- **THEN** the modal displays with the specified title at the top
- **AND** the modal displays the message in the body
- **AND** the modal shows a warning icon
- **AND** the modal has two buttons: "Annuler" (neutral) and "Confirmer" (primary)
- **AND** the modal is centered on screen with proper z-index stacking

#### Scenario: Confirm action with Promise resolution

- **GIVEN** a confirmation modal is displayed
- **WHEN** the user clicks the "Confirmer" button
- **THEN** the modal's Promise resolves with true
- **AND** the modal closes
- **AND** the parent component can proceed with the destructive action

#### Scenario: Cancel action with Promise rejection

- **GIVEN** a confirmation modal is displayed
- **WHEN** the user clicks the "Annuler" button
- **THEN** the modal's Promise rejects or resolves with false
- **AND** the modal closes
- **AND** the parent component aborts the destructive action

#### Scenario: Customize confirmation modal text

- **GIVEN** a parent component using ModalConfirm
- **WHEN** the component passes confirmText: "Supprimer" and cancelText: "Garder"
- **THEN** the confirm button displays "Supprimer"
- **AND** the cancel button displays "Garder"

#### Scenario: Customize confirmation modal colors

- **GIVEN** a parent component using ModalConfirm
- **WHEN** the component passes confirmColor: "error"
- **THEN** the confirm button has error/red styling
- **AND** the cancel button remains neutral

#### Scenario: Display loading state during async confirmation

- **GIVEN** a confirmation modal is displayed
- **WHEN** the parent component sets loading prop to true after user confirms
- **THEN** the confirm button shows a loading spinner
- **AND** the confirm button is disabled
- **AND** the cancel button is disabled
- **AND** the modal cannot be closed during loading

#### Scenario: Close modal on backdrop click

- **GIVEN** a confirmation modal is displayed
- **WHEN** the user clicks outside the modal on the backdrop
- **THEN** the modal closes
- **AND** the modal's Promise rejects (user canceled the action)

#### Scenario: Prevent close during loading

- **GIVEN** a confirmation modal is in loading state
- **WHEN** the user clicks the backdrop
- **THEN** the modal remains open
- **AND** no action is taken

#### Scenario: Customize confirmation modal icon

- **GIVEN** a parent component using ModalConfirm
- **WHEN** the component passes icon: "i-carbon-warning"
- **THEN** the modal displays the specified icon
- **AND** the icon is prominently displayed in the modal body

#### Scenario: Integrate with useOverlay for z-index management

- **GIVEN** a parent component using useOverlay() to open ModalConfirm
- **WHEN** the modal is opened via overlay.open()
- **THEN** the modal is properly layered above other UI elements
- **AND** the modal can coexist with other overlays (slideovers, dropdowns)
- **AND** the modal's z-index is managed by the overlay system

