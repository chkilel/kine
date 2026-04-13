## MODIFIED Requirements

### Requirement: Treatment Plan Pricing

The system SHALL store pricing for each treatment plan as a single pricing JSON object. When a treatment plan is created, pricing SHALL be automatically inherited from the organization's default session rates. The plan's pricing can be overridden at any time. Additionally, the treatment plan SHALL reference an insurance company via `insuranceCompanyId` FK, which serves as the SOURCE OF TRUTH for insurance context inherited by appointments and invoices.

#### Scenario: Treatment plan inherits org pricing on creation

- **GIVEN** an organization exists with pricing.sessionRates: { clinic: 5000, home: 6500, telehealth: 4000 }
- **WHEN** POST /api/treatment-plans is called to create a new treatment plan
- **THEN** HTTP response is 201 Created
- **AND** new treatment plan has pricing: { clinic: 5000, home: 6500, telehealth: 4000 }

#### Scenario: Treatment plan with insurance company

- **WHEN** a treatment plan is created with `insuranceCompanyId = "cnss-123"`
- **THEN** appointments created under this plan inherit `insuranceCompanyId = "cnss-123"`
- **AND** convention invoices created for this plan inherit `insuranceCompanyId = "cnss-123"`

#### Scenario: Treatment plan without insurance company

- **WHEN** a treatment plan is created without `insuranceCompanyId`
- **THEN** `insuranceCompanyId` is NULL
- **AND** appointments under this plan have `insuranceCompanyId = NULL`
- **AND** full payment is expected from the patient (no co-pay tracking)

## ADDED Requirements

### Requirement: Treatment Plan Insurance Source of Truth

`treatment_plans.insuranceCompanyId` is the source of truth for insurance context. When appointments or invoices are created under a treatment plan, they inherit the `insuranceCompanyId` at creation time (denormalized). Changes to the plan's insurance company do NOT retroactively update existing appointments/invoices.

#### Scenario: Insurance inheritance at appointment creation

- **GIVEN** a treatment plan with `insuranceCompanyId = "cnss-123"`
- **WHEN** an appointment is created under this plan
- **THEN** `appointment.insuranceCompanyId = "cnss-123"` (denormalized snapshot)
- **AND** co-pay fields are calculated from the convention attributes at creation time

#### Scenario: Plan insurance change does not affect existing appointments

- **GIVEN** a treatment plan with `insuranceCompanyId = "cnss-123"`
- **AND** an appointment exists with `insuranceCompanyId = "cnss-123"` (inherited)
- **WHEN** the treatment plan's `insuranceCompanyId` is changed to `"cnops-456"`
- **THEN** existing appointment `insuranceCompanyId` remains `"cnss-123"`
- **AND** only NEW appointments created after the change inherit `"cnops-456"`
