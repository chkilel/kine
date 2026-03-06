# Treatment Plan Specification Deltas

## ADDED Requirements

### Requirement: Treatment Plan Pricing Overrides

The system SHALL allow treatment plans to override organization default pricing for different location types. When a session belongs to a treatment plan with location-specific overrides, the plan's override takes precedence over the organization default.

#### Scenario: Set pricing override for all locations in treatment plan

- **GIVEN** a treatment plan exists with id "plan-123"
- **AND** organization default prices are: clinic 5000, home 6500, telehealth 4000
- **WHEN** PATCH /api/treatment-plans/plan-123/pricing is called with body {
  sessionCostClinicOverride: 5500,
  sessionCostHomeOverride: 7000,
  sessionCostTelehealthOverride: 4500
  }
- **THEN** HTTP response is 200 OK
- **AND** treatment plan overrides are set
- **AND** sessions in this plan will use these overridden costs instead of org defaults

#### Scenario: Set pricing override for specific location only

- **GIVEN** a treatment plan exists
- **AND** therapist wants to override home visit cost only
- **WHEN** PATCH /api/treatment-plans/plan-123/pricing is called with body {
  sessionCostHomeOverride: 7000
  }
- **THEN** HTTP response is 200 OK
- **AND** sessionCostHomeOverride is set to 7000
- **AND** other override fields remain null
- **AND** clinic and telehealth sessions will still use organization defaults

#### Scenario: Remove pricing override

- **GIVEN** a treatment plan has sessionCostClinicOverride 5500
- **WHEN** PATCH /api/treatment-plans/plan-123/pricing is called with body {
  sessionCostClinicOverride: null
  }
- **THEN** HTTP response is 200 OK
- **AND** sessionCostClinicOverride is set to null
- **AND** clinic sessions will revert to using organization default

#### Scenario: Retrieve treatment plan pricing overrides

- **GIVEN** a treatment plan has configured pricing overrides
- **WHEN** GET /api/treatment-plans/plan-123/pricing is called
- **THEN** HTTP response is 200 OK
- **AND** response includes: {
  sessionCostClinicOverride: 5500,
  sessionCostHomeOverride: 7000,
  sessionCostTelehealthOverride: null
  }

#### Scenario: Prevent setting override for non-existent treatment plan

- **GIVEN** no treatment plan exists with id "nonexistent-plan"
- **WHEN** PATCH /api/treatment-plans/nonexistent-plan/pricing is called with body {
  sessionCostClinicOverride: 5500
  }
- **THEN** HTTP response is 404 Not Found
- **AND** error message states "Treatment plan not found"

#### Scenario: Calculate session cost with treatment plan override

- **GIVEN** a treatment session exists with appointment.location "home"
- **AND** session belongs to treatment plan with sessionCostHomeOverride 7000
- **AND** organization default for home is 6500
- **WHEN** session cost is calculated
- **THEN** final cost is 7000 (treatment plan override)
- **AND** inheritance chain shows plan override was used

#### Scenario: Calculate session cost without treatment plan override

- **GIVEN** a treatment session exists with appointment.location "clinic"
- **AND** session belongs to treatment plan with no clinic override
- **AND** organization default for clinic is 5000
- **WHEN** session cost is calculated
- **THEN** final cost is 5000 (organization default)
- **AND** inheritance chain shows org default was used

#### Scenario: Calculate session cost for independent appointment

- **GIVEN** a treatment session exists with appointment.location "home"
- **AND** session has no treatmentPlanId (independent appointment)
- **AND** organization default for home is 6500
- **WHEN** session cost is calculated
- **THEN** final cost is 6500 (organization default only)
- **AND** inheritance chain shows org default, no plan override
