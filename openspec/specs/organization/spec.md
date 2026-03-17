# organization Specification

## Purpose
TBD - created by archiving change add-invoicing-and-session-pricing. Update Purpose after archive.
## Requirements
### Requirement: Organization Pricing Configuration

The system SHALL allow organizations to configure default session costs for different location types (cabinet, domicile, téléconsultation) and package pricing. Prices SHALL be stored as integer cents in the database but displayed as currency units (MAD/DH) in the user interface. All API responses SHALL return pricing values in cents.

#### Scenario: Set default pricing for all locations

- **GIVEN** an organization exists with id "org-123"
- **AND** no pricing defaults are configured
- **WHEN** PATCH /api/organizations/org-123 is called with body {
  pricing: {
  sessionRates: {
  clinic: 150,
  home: 200,
  telehealth: 120
  }
  }
  }
- **THEN** HTTP response is 200 OK
- **AND** organization.pricing.sessionRates.clinic is set to 15000 (150 MAD × 100 cents)
- **AND** organization.pricing.sessionRates.home is set to 20000 (200 MAD × 100 cents)
- **AND** organization.pricing.sessionRates.telehealth is set to 12000 (120 MAD × 100 cents)
- **AND** prices are stored in cents

#### Scenario: Update pricing for specific location

- **GIVEN** an organization has pricing.sessionRates.clinic stored as 15000
- **WHEN** PATCH /api/organizations/org-123 is called with body {
  pricing: {
  sessionRates: {
  clinic: 180
  }
  }
  }
- **THEN** HTTP response is 200 OK
- **AND** organization.pricing.sessionRates.clinic is updated to 18000 (180 MAD × 100 cents)
- **AND** other location prices remain unchanged

#### Scenario: Retrieve organization pricing

- **GIVEN** an organization has configured all default prices stored as cents
- **WHEN** GET /api/organizations/org-123 is called
- **THEN** HTTP response is 200 OK
- **AND** response includes pricing in cents: {
  pricing: {
  sessionRates: {
  clinic: 15000,
  home: 20000,
  telehealth: 12000
  }
  }
  }
- **AND** frontend displays these as 150 MAD, 200 MAD, 120 MAD

#### Scenario: Set package pricing

- **GIVEN** an organization exists with id "org-123"
- **WHEN** PATCH /api/organizations/org-123 is called with body {
  pricing: {
  packages: [
  {
  name: "5 Sessions",
  sessionCount: 5,
  price: 650
  }
  ]
  }
  }
- **THEN** HTTP response is 200 OK
- **AND** organization.pricing.packages[0].price is stored as 65000 (650 MAD × 100 cents)
- **AND** frontend displays the package price as 650 MAD

#### Scenario: Validate pricing values

- **GIVEN** an organization is updating pricing
- **WHEN** PATCH /api/organizations/org-123/pricing is called with body {
  pricing: {
  sessionRates: {
  clinic: -1.50
  }
  }
  }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Price cannot be negative"
- **AND** no changes are made

#### Scenario: Prevent setting pricing for non-existent organization

- **GIVEN** no organization exists with id "nonexistent-org"
- **WHEN** PATCH /api/organizations/nonexistent-org is called with body {
  pricing: {
  sessionRates: {
  clinic: 150
  }
  }
  }
- **THEN** HTTP response is 404 Not Found
- **AND** error message states "Organization not found"

