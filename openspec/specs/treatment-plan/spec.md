# treatment-plan Specification

## Purpose
TBD - created by archiving change add-invoicing-and-session-pricing. Update Purpose after archive.
## Requirements
### Requirement: Treatment Plan Pricing

The system SHALL store pricing for each treatment plan as a single pricing JSON object. When a treatment plan is created, pricing SHALL be automatically inherited from organization's default session rates. The plan's pricing can be overridden at any time using the standard update endpoint, and changes to organization pricing SHALL NOT affect existing treatment plans.

The pricing object SHALL have following structure:

```json
{
  "clinic": number,
  "home": number,
  "telehealth": number
}
```

All fields are required and must be numbers >= 100 representing cost in cents (minimum 100 cents = 1 DH, cannot be 0).

#### Scenario: Treatment plan inherits org pricing on creation

- **GIVEN** an organization exists with pricing.sessionRates: { clinic: 5000, home: 6500, telehealth: 4000 }
- **WHEN** POST /api/treatment-plans is called to create a new treatment plan
- **THEN** HTTP response is 201 Created
- **AND** new treatment plan has pricing: { clinic: 5000, home: 6500, telehealth: 4000 }
- **AND** pricing matches the organization's default rates at creation time

#### Scenario: Treatment plan pricing can be updated via standard update endpoint

- **GIVEN** a treatment plan exists with pricing: { clinic: 5000, home: 6500, telehealth: 4000 }
- **WHEN** PATCH /api/treatment-plans/plan-123 is called with body {
  pricing: {
  clinic: 5500,
  home: 7000,
  telehealth: 4500
  }
  }
- **THEN** HTTP response is 200 OK
- **AND** treatment plan pricing is updated
- **AND** sessions in this plan will use these new costs

#### Scenario: Treatment plan pricing can be partially updated

- **GIVEN** a treatment plan exists with pricing: { clinic: 5000, home: 6500, telehealth: 4000 }
- **WHEN** PATCH /api/treatment-plans/plan-123 is called with body {
  pricing: {
  home: 7000,
  telehealth: 4500
  }
  }
- **THEN** HTTP response is 200 OK
- **AND** pricing.home is updated to 7000
- **AND** pricing.telehealth is updated to 4500
- **AND** pricing.clinic remains 5000 (unchanged)

#### Scenario: Prevent updating pricing for non-existent treatment plan

- **GIVEN** no treatment plan exists with id "nonexistent-plan"
- **WHEN** PATCH /api/treatment-plans/nonexistent-plan is called with body {
  pricing: { clinic: 5500, home: 6500, telehealth: 4000 }
  }
- **THEN** HTTP response is 404 Not Found
- **AND** error message states "Treatment plan not found"

#### Scenario: Validate pricing values must be >= 100

- **GIVEN** a treatment plan exists
- **WHEN** PATCH /api/treatment-plans/plan-123 is called with body {
  pricing: { clinic: 0, home: 6500, telehealth: 4000 }
  }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states that pricing values must be >= 100 (minimum 1 DH)

#### Scenario: Validate pricing values cannot be negative

- **GIVEN** a treatment plan exists
- **WHEN** PATCH /api/treatment-plans/plan-123 is called with body {
  pricing: { clinic: -100, home: 6500, telehealth: 4000 }
  }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states that pricing values must be >= 100 (minimum 1 DH)

#### Scenario: Calculate session cost using treatment plan pricing

- **GIVEN** a treatment session exists with appointment.location "home"
- **AND** session belongs to treatment plan with pricing: { clinic: 5000, home: 7000, telehealth: 4000 }
- **AND** organization default for home is 6500
- **WHEN** session cost is calculated
- **THEN** final cost is 7000 (treatment plan pricing)
- **AND** system uses only plan pricing, no fallback to org pricing

#### Scenario: Organization pricing changes don't affect existing plans

- **GIVEN** an organization has pricing.sessionRates: { clinic: 5000, home: 6500, telehealth: 4000 }
- **AND** a treatment plan exists with pricing: { clinic: 5000, home: 6500, telehealth: 4000 }
- **WHEN** organization pricing is updated to { clinic: 5500, home: 7000, telehealth: 4500 }
- **AND** an existing treatment session cost is calculated for old plan
- **THEN** session cost uses old plan pricing: 6500 for home
- **AND** session cost does NOT use new organization pricing: 7000

#### Scenario: New plan inherits updated organization pricing

- **GIVEN** an organization has pricing.sessionRates: { clinic: 5500, home: 7000, telehealth: 4500 }
- **WHEN** POST /api/treatment-plans is called to create a new treatment plan
- **THEN** HTTP response is 201 Created
- **AND** new treatment plan has pricing: { clinic: 5500, home: 7000, telehealth: 4500 }
- **AND** pricing matches the organization's current rates

#### Scenario: Calculate session cost for independent appointment

- **GIVEN** a treatment session exists with appointment.location "home"
- **AND** session has no treatmentPlanId (independent appointment)
- **AND** organization default for home is 6500
- **WHEN** session cost is calculated
- **THEN** final cost is 6500 (organization default)
- **AND** system falls back to org pricing since no plan exists

#### Scenario: Handle incomplete organization pricing during plan creation

- **GIVEN** an organization has incomplete pricing: { clinic: 5000, home: null, telehealth: 4000 }
- **WHEN** POST /api/treatment-plans is called to create a new treatment plan
- **THEN** HTTP response is 201 Created
- **AND** treatment plan has complete pricing: { clinic: 5000, home: 6500, telehealth: 4000 }
- **AND** missing home pricing is populated with a sensible default value

