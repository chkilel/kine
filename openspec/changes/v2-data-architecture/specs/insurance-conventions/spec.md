## ADDED Requirements

### Requirement: Insurance Company Table

The system SHALL store insurance companies in an `insurance_companies` table, org-scoped. Each insurance company represents a convention partner with specific billing attributes. Insurance companies are shared across patients within an organization.

#### Scenario: Create insurance company

- **WHEN** an insurance company is created with name `CNSS` and convention details
- **THEN** the record is org-scoped (`orgId` set)
- **AND** convention fields are stored: `coveragePercentage`, `defaultSessionPriceCents`, `patientCoPayPercentage`

#### Scenario: Insurance companies are org-scoped

- **WHEN** organization A creates an insurance company
- **THEN** organization B SHALL NOT see it in their insurance company list

### Requirement: Convention Attributes

Insurance companies SHALL store convention-level billing attributes: `coveragePercentage` (0-100), `defaultSessionPriceCents` (agreed price per session), `patientCoPayPercentage` (patient's share). These define the financial split for convention invoices.

#### Scenario: Convention with standard coverage

- **GIVEN** insurance company `CNSS` with `coveragePercentage: 80`, `defaultSessionPriceCents: 5000`, `patientCoPayPercentage: 20`
- **WHEN** a session is billed at 5000 cents under this convention
- **THEN** insurance covers 4000 cents (80%)
- **AND** patient co-pay is 1000 cents (20%)

#### Scenario: Convention with full coverage

- **GIVEN** insurance company `CNOPS` with `coveragePercentage: 100`, `defaultSessionPriceCents: 5000`, `patientCoPayPercentage: 0`
- **WHEN** a session is billed at 5000 cents under this convention
- **THEN** insurance covers 5000 cents (100%)
- **AND** patient co-pay is 0 cents

### Requirement: Insurance Context Inheritance

Insurance context SHALL flow from `treatment_plans.insuranceCompanyId` as the source of truth. When an appointment or invoice is created under a treatment plan, `insuranceCompanyId` is inherited (denormalized) at creation time.

#### Scenario: Appointment inherits insurance from treatment plan

- **GIVEN** a treatment plan with `insuranceCompanyId = "cnss-123"`
- **WHEN** an appointment is created under this plan
- **THEN** `appointment.insuranceCompanyId` is set to `"cnss-123"`
- **AND** co-pay fields (`expectedCoPayCents`, `expectedInsuranceCents`) are calculated from convention attributes

#### Scenario: Independent appointment has no insurance

- **GIVEN** an appointment created without a treatment plan (e.g., massage)
- **WHEN** the appointment is created
- **THEN** `appointment.insuranceCompanyId` is NULL
- **AND** `expectedCoPayCents` is 0
- **AND** full payment is expected from the patient

#### Scenario: Invoice inherits insurance from treatment plan

- **GIVEN** a treatment plan with `insuranceCompanyId = "cnss-123"`
- **WHEN** a convention invoice is created for this plan
- **THEN** `invoice.insuranceCompanyId` is set to `"cnss-123"`

#### Scenario: Insurance context is historical snapshot

- **GIVEN** an appointment created with `insuranceCompanyId = "cnss-123"`
- **AND** the treatment plan's insurance is later changed to `cnops-456`
- **WHEN** the original appointment is retrieved
- **THEN** `appointment.insuranceCompanyId` remains `"cnss-123"` (historical snapshot)

### Requirement: Co-pay Tracking Per Appointment

Appointments with insurance SHALL track co-pay amounts: `expectedCoPayCents`, `expectedInsuranceCents`, `coPayPaidCents`, `insurancePaidCents`. A denormalized `paymentStatus` field enables fast filtering without JOINs.

#### Scenario: Co-pay fields calculated on creation

- **GIVEN** a treatment plan with insurance convention: 80% coverage, session price 5000 cents
- **WHEN** an appointment is created under this plan
- **THEN** `expectedCoPayCents = 1000` (20% of 5000)
- **AND** `expectedInsuranceCents = 4000` (80% of 5000)
- **AND** `coPayPaidCents = 0`, `insurancePaidCents = 0`
- **AND** `paymentStatus = 'unpaid'`

#### Scenario: Denormalized payment status tracks co-pay progress

- **WHEN** patient pays 1000 cents co-pay for an appointment with `expectedCoPayCents = 1000`
- **THEN** `coPayPaidCents` is updated to 1000
- **AND** `paymentStatus` transitions to `copay_paid`
- **AND** when insurance pays 4000 cents, `paymentStatus` transitions to `paid`

### Requirement: Patient Insurance Text Fields

The `patients` table SHALL store `insuranceProvider` and `insuranceNumber` as free-text fields only. These are informational and used for display/printing. Structural insurance relationships are handled by `treatment_plans.insuranceCompanyId`.

#### Scenario: Patient with free-text insurance info

- **WHEN** a patient is created with `insuranceProvider: "CNSS"` and `insuranceNumber: "123456789"`
- **THEN** these fields are stored as text
- **AND** they have NO foreign key relationship to `insurance_companies`
- **AND** they are used for display and PDF generation only
