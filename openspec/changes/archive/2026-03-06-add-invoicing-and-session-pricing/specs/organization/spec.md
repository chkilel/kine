# Organization Specification Deltas

## ADDED Requirements

### Requirement: Organization Pricing Configuration

The system SHALL allow organizations to configure default session costs for different location types (cabinet, domicile, téléconsultation). These defaults serve as the base cost in the inheritance chain and can be overridden at treatment plan or session level.

#### Scenario: Set default pricing for all locations

- **GIVEN** an organization exists with id "org-123"
- **AND** no pricing defaults are configured
- **WHEN** PATCH /api/organizations/org-123/pricing is called with body {
  defaultSessionCostClinic: 5000,
  defaultSessionCostHome: 6500,
  defaultSessionCostTelehealth: 4000
  }
- **THEN** HTTP response is 200 OK
- **AND** organization.defaultSessionCostClinic is set to 5000 (50 Dh)
- **AND** organization.defaultSessionCostHome is set to 6500 (65 Dh)
- **AND** organization.defaultSessionCostTelehealth is set to 4000 (40 Dh)
- **AND** prices are stored in cents

#### Scenario: Update pricing for specific location

- **GIVEN** an organization has defaultSessionCostClinic 5000
- **WHEN** PATCH /api/organizations/org-123/pricing is called with body {
  defaultSessionCostClinic: 5500
  }
- **THEN** HTTP response is 200 OK
- **AND** organization.defaultSessionCostClinic is updated to 5500
- **AND** other location prices remain unchanged

#### Scenario: Retrieve organization pricing

- **GIVEN** an organization has configured all default prices
- **WHEN** GET /api/organizations/org-123/pricing is called
- **THEN** HTTP response is 200 OK
- **AND** response includes all default prices: {
  defaultSessionCostClinic: 5000,
  defaultSessionCostHome: 6500,
  defaultSessionCostTelehealth: 4000
  }

#### Scenario: Validate pricing values

- **GIVEN** an organization is updating pricing
- **WHEN** PATCH /api/organizations/org-123/pricing is called with body {
  defaultSessionCostClinic: -100
  }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Price cannot be negative"
- **AND** no changes are made

#### Scenario: Prevent setting pricing for non-existent organization

- **GIVEN** no organization exists with id "nonexistent-org"
- **WHEN** PATCH /api/organizations/nonexistent-org/pricing is called with body {
  defaultSessionCostClinic: 5000
  }
- **THEN** HTTP response is 404 Not Found
- **AND** error message states "Organization not found"
