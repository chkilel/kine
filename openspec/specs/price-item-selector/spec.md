# price-item-selector Specification

## Purpose

TBD - created by syncing change treatment-plan-price-selector. Update Purpose after archive.

## Requirements

### Requirement: Price item selector displays organization price items

The treatment plan creation/edit form SHALL display a dropdown selector populated with the active organization's price items. The selector SHALL show each item's code and description.

#### Scenario: Selector shows all price items on form open

- **WHEN** the treatment plan creation slideover is opened
- **AND** the organization has price items with codes ["DEFAULT", "POST_OP", "FIRST_VISIT"]
- **THEN** the price item selector displays all three items
- **AND** each item shows its code and description as the label

#### Scenario: Selector is empty when no price items exist

- **WHEN** the treatment plan creation slideover is opened
- **AND** the organization has no pricing configuration
- **THEN** the price item selector is not displayed or shows a disabled state
- **AND** pricing fields remain manually editable with fallback defaults

#### Scenario: Default item is pre-selected on creation

- **WHEN** a new treatment plan is being created
- **AND** the organization has a price item marked as default
- **THEN** the price item selector defaults to the item with `isDefault: true`
- **AND** pricing fields are populated with that item's rates

### Requirement: Pricing is read-only and driven by selected price item

When a price item is selected from the dropdown, the clinic/home/telehealth rates SHALL be displayed as read-only values (converted from cents to DH for display). Users SHALL NOT be able to manually edit pricing fields — pricing is strictly derived from the selected price item.

#### Scenario: Selecting item displays read-only pricing

- **WHEN** user selects price item "POST_OP" with rates { clinic: 8000, home: 10000, telehealth: 6000 }
- **THEN** pricing fields display { clinic: 80, home: 100, telehealth: 60 } (in DH)
- **AND** all three pricing fields are read-only and not editable

#### Scenario: Changing selection updates read-only pricing

- **WHEN** user has item "DEFAULT" selected (rates: 50, 65, 40)
- **AND** user changes selection to item "POST_OP" (rates: 80, 100, 60)
- **THEN** pricing fields update to 80, 100, 60
- **AND** fields remain read-only

### Requirement: Full price item snapshot is cached on the treatment plan

The treatment plan SHALL cache the full selected price item (code, description, rateCent) as a JSON `priceItem` field at creation time. This snapshot is immutable until the user explicitly changes the selector — org price item rate changes SHALL NOT retroactively affect existing plans.

#### Scenario: priceItem snapshot saved on creation

- **WHEN** user creates a treatment plan with price item "POST_OP" selected (rates: { clinic: 8000, home: 10000, telehealth: 6000 })
- **THEN** the treatment plan is created with `priceItem: { code: "POST_OP", description: "Suivi post-op", rateCent: { clinic: 8000, home: 10000, telehealth: 6000 } }`
- **AND** pricing is derived from the snapshot's rateCent

#### Scenario: Org price item change does NOT affect existing plan

- **GIVEN** a treatment plan exists with `priceItem.code: "DEFAULT"` and cached rates { clinic: 5000, home: 6500, telehealth: 4000 }
- **WHEN** the organization updates the "DEFAULT" price item rates to { clinic: 5500, home: 7000, telehealth: 4500 }
- **AND** the treatment plan is viewed or edited without changing the selector
- **THEN** the plan's cached pricing remains { clinic: 5000, home: 6500, telehealth: 4000 }
- **AND** session cost calculation uses the plan's cached pricing, not the org's updated rates

#### Scenario: Explicit selector change updates the cached snapshot

- **GIVEN** a treatment plan exists with `priceItem.code: "DEFAULT"`
- **WHEN** user edits the plan and changes the selector to "POST_OP"
- **THEN** the plan's `priceItem` snapshot is updated to the POST_OP item's current data
- **AND** pricing is updated to the POST_OP item's rates
- **AND** the old snapshot is discarded

#### Scenario: Existing plan without priceItem preserves existing pricing

- **GIVEN** an existing treatment plan has `priceItem: null` and `pricing: { clinic: 5000, home: 6500, telehealth: 4000 }`
- **WHEN** the plan is edited without changing the selector
- **THEN** pricing fields display the plan's existing pricing values
- **AND** the selector shows no pre-selected item or a "non trouvé" indicator
