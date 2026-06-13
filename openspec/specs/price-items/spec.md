# price-items Specification

## Purpose

Custom pricing items for organizations. Each organization can define multiple pricing items (e.g., consultation, home visit, telehealth) with per-context pricing. A DEFAULT item is always present and is migrated from the legacy rateCent configuration.

## Requirements

### Requirement: Existing rateCent migrates to first priceItem

The system SHALL migrate existing organization rateCent configurations to the new priceItems array structure, converting the rateCent object to the first item with code "DEFAULT" and description "Tarif de séance".

#### Scenario: Migration creates DEFAULT item

- **WHEN** organization has existing rateCent data
- **THEN** system creates priceItems array with first item containing code "DEFAULT"
- **AND** description is "Tarif de séance"
- **AND** rateCent values are preserved
- **AND** isDefault is set to true

#### Scenario: Migration preserves pricing data

- **WHEN** organization has rateCent with clinic: 100, home: 100, telehealth: 100
- **THEN** migrated item has same rateCent values
- **AND** no pricing data is lost during migration

#### Scenario: New organizations start with DEFAULT item

- **WHEN** new organization is created
- **THEN** priceItems array contains one item with code "DEFAULT"
- **AND** description is "Tarif de séance"
- **AND** isDefault is true

### Requirement: Organization admin can create pricing items

Organization administrators SHALL be able to define pricing items with a unique code, description, and optional prices for clinic, home, and telehealth contexts. Each item can optionally be marked as the default pricing item.

#### Scenario: Create pricing item

- **WHEN** organization admin clicks "Add pricing item" and enters valid code, description, and prices
- **THEN** system adds the item to the organization's priceItems list
- **AND** item is displayed in the pricing items section

#### Scenario: Set item as default

- **WHEN** organization admin marks a pricing item as default
- **THEN** system removes default flag from all other items
- **AND** sets default flag on selected item

#### Scenario: Validation prevents duplicate codes

- **WHEN** organization admin tries to create an item with a code that already exists
- **THEN** system displays validation error
- **AND** prevents creation of duplicate item

#### Scenario: Reserved code DEFAULT cannot be duplicated

- **WHEN** organization admin tries to create item with code "DEFAULT"
- **THEN** system displays validation error
- **AND** prevents creation with reserved code

### Requirement: Organization admin can edit pricing items

Organization administrators SHALL be able to modify existing pricing items including code, description, prices, and default status.

#### Scenario: Edit item code

- **WHEN** organization admin edits an item's code to a unique value
- **THEN** system updates the item's code
- **AND** maintains all other item properties

#### Scenario: Edit item prices

- **WHEN** organization admin updates prices for clinic, home, or telehealth
- **THEN** system updates the item's rateCent values
- **AND** stores prices in cents

#### Scenario: Edit DEFAULT item

- **WHEN** organization admin edits the DEFAULT item
- **THEN** system allows editing description and prices
- **AND** prevents changing code from "DEFAULT"

#### Scenario: Cancel edit

- **WHEN** organization admin clicks cancel during editing
- **THEN** system reverts to original item values
- **AND** closes edit form

### Requirement: Organization admin can delete pricing items

Organization administrators SHALL be able to remove pricing items from their organization's pricing configuration.

#### Scenario: Delete pricing item

- **WHEN** organization admin clicks delete on a pricing item
- **THEN** system removes item from the priceItems list
- **AND** updates the UI to reflect removal

#### Scenario: Delete default item

- **WHEN** organization admin deletes the default pricing item
- **THEN** system removes item from list
- **AND** no item is marked as default

#### Scenario: Prevent deleting all items

- **WHEN** organization admin attempts to delete last remaining item
- **THEN** system displays validation error
- **AND** prevents deletion (must have at least one item)

### Requirement: Price items are persisted in organization configuration

Price items SHALL be stored as part of the organization's pricing configuration and persisted across page loads and sessions.

#### Scenario: Items persist after save

- **WHEN** organization admin saves pricing configuration with priceItems
- **THEN** system persists items to database
- **AND** items are loaded on subsequent page visits

#### Scenario: Prices stored in cents

- **WHEN** pricing item is saved
- **THEN** system stores all prices as integers representing cents
- **AND** converts to/from currency for display

### Requirement: UI follows emergency contacts pattern

The pricing items UI SHALL use the same interactive pattern as PatientEmergencyContacts.vue with list view, inline add/edit forms, and action buttons.

#### Scenario: List display

- **WHEN** pricing items exist
- **THEN** system displays each item in a card format with code, description, and prices
- **AND** shows edit and delete action buttons
- **AND** highlights default item

#### Scenario: Empty state

- **WHEN** no pricing items exist (should not happen due to DEFAULT item)
- **THEN** system displays empty state with action to add first item

#### Scenario: Inline add form

- **WHEN** organization admin adds new item
- **THEN** system shows form inline below list or in place of list
- **AND** allows entering item details without navigation
