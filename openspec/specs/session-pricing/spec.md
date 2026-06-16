# session-pricing Specification

## Purpose

Pricing code selection and snapshotting for appointments. The system stores a nullable `priceItem` JSON column on the `appointments` table that snapshots the selected pricing code at the time of selection, decoupling session pricing from future org price changes.

## Requirements

### Requirement: Price Item Snapshot on Appointment

The system SHALL store a nullable `priceItem` JSON column on the `appointments` table that snapshots the selected pricing code (code, description, rateCent) at the time of selection. This decouples session pricing from future org price changes, matching the treatment plan pattern.

#### Scenario: Price item stored on appointment creation

- **GIVEN** an organization has price items: [{ code: "CONSULT", description: "Consultation standard", rateCent: { clinic: 15000, home: 25000, telehealth: 12000 } }]
- **AND** a treatment plan exists with priceItem snapshot: { code: "SUIVI", description: "Suivi post-op", rateCent: { clinic: 10000, home: 20000, telehealth: 8000 } }
- **AND** an appointment is created linked to this treatment plan with location "clinic"
- **WHEN** the appointment is created
- **THEN** appointment.priceItem is set to the treatment plan's priceItem snapshot: { code: "SUIVI", description: "Suivi post-op", rateCent: { clinic: 10000, home: 20000, telehealth: 8000 } }
- **AND** appointment.priceCents is set to 10000 (from plan's rateCent[clinic])

#### Scenario: Price item inherited from org default when no treatment plan

- **GIVEN** an organization has a default price item: { code: "DEFAULT", description: "Séance standard", rateCent: { clinic: 15000, home: 25000, telehealth: 12000 } }
- **AND** an appointment is created with location "home" and no treatment plan
- **WHEN** the appointment is created
- **THEN** appointment.priceItem is set to the org default price item snapshot
- **AND** appointment.priceCents is set to 25000 (from default item's rateCent[home])

#### Scenario: Price item null when no pricing data available

- **GIVEN** an organization has no price items configured
- **AND** an appointment is created with no treatment plan
- **WHEN** the appointment is created
- **THEN** appointment.priceItem is null
- **AND** appointment.priceCents defaults to 0

### Requirement: Price Code Override on Appointment

The system SHALL allow overriding the inherited price item on an appointment by selecting a different pricing code from the organization's catalog. The override MUST reference an existing org price item by code — free-input prices are not allowed.

#### Scenario: Override with different pricing code

- **GIVEN** an appointment exists with priceItem: { code: "SUIVI", ... } and priceCents: 10000
- **AND** the organization has price items: [{ code: "CONSULT", ... rateCent: { clinic: 15000 } }, { code: "SUIVI", ... }]
- **AND** appointment location is "clinic"
- **WHEN** PATCH /api/appointments/[id]/price is called with body { priceItemCode: "CONSULT" }
- **THEN** appointment.priceItem is updated to the CONSULT price item snapshot: { code: "CONSULT", description: "Consultation standard", rateCent: { clinic: 15000, home: 25000, telehealth: 12000 } }
- **AND** appointment.priceCents is updated to 15000 (CONSULT rateCent[clinic])
- **AND** HTTP response is 200 OK

#### Scenario: Override to same pricing code as plan

- **GIVEN** an appointment exists with priceItem inherited from plan: { code: "SUIVI", ... }
- **WHEN** PATCH /api/appointments/[id]/price is called with body { priceItemCode: "SUIVI" }
- **THEN** priceItem and priceCents remain unchanged
- **AND** HTTP response is 200 OK

#### Scenario: Reject invalid pricing code

- **GIVEN** an appointment exists
- **AND** the organization does NOT have a price item with code "NONEXISTENT"
- **WHEN** PATCH /api/appointments/[id]/price is called with body { priceItemCode: "NONEXISTENT" }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message indicates the pricing code is not found in the organization's catalog

#### Scenario: Reject free-input priceCents on override endpoint

- **GIVEN** an appointment exists
- **WHEN** PATCH /api/appointments/[id]/price is called with body { priceCents: 7500 }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message indicates that priceItemCode is required, not raw priceCents

### Requirement: Price Item Selector UI on Session

The system SHALL provide a pricing code selector on the session view that allows the therapist to choose from the organization's defined price items. The selector SHALL display the current pricing code and allow switching to any org-defined code.

#### Scenario: Display current price item on session

- **GIVEN** an appointment has priceItem: { code: "SUIVI", description: "Suivi post-op", rateCent: { clinic: 10000, ... } }
- **AND** appointment location is "clinic"
- **WHEN** the session pricing section is rendered
- **THEN** the selector displays "Suivi post-op" as the current selection
- **AND** the price shows 100,00 Dh (from rateCent[clinic])

#### Scenario: Select different pricing code

- **GIVEN** the session pricing selector is displayed
- **AND** the org has price items: [{ code: "CONSULT", description: "Consultation standard" }, { code: "SUIVI", description: "Suivi post-op" }]
- **WHEN** the therapist selects "Consultation standard" from the dropdown
- **THEN** PATCH /api/appointments/[id]/price is called with priceItemCode: "CONSULT"
- **AND** the displayed price updates to the CONSULT rate for the session's location
- **AND** the priceItem snapshot is updated

#### Scenario: Org price item changes do not affect existing sessions

- **GIVEN** an appointment has priceItem: { code: "CONSULT", description: "Consultation standard", rateCent: { clinic: 15000 } }
- **AND** the organization updates the CONSULT price item rateCent[clinic] to 18000
- **WHEN** the session pricing section is rendered
- **THEN** the session still shows 15000 (from the snapshot, not the updated org price)
