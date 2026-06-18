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

### Requirement: Organization Fiscal Configuration

The system SHALL store organization fiscal information in the `fiscal` JSON field, including tax identification numbers, legal form, and receipt numbering configuration for payment tracking. **MODIFIED:** Added receipt numbering fields (receiptPrefix, nextReceiptNumber) to support automatic sequential receipt generation per organization.

#### Scenario: Retrieve organization with receipt configuration

- **GIVEN** an organization exists with id "org-123"
- **AND** fiscal configuration includes receipt settings
- **WHEN** GET /organizations/org-123 is called
- **THEN** HTTP response is 200 OK
- **AND** response includes fiscal field:
  - ice: "001234567890123"
  - rc: "123456"
  - if: "12345678"
  - legalForm: "SARL"
  - vatRate: 20
  - vatSubject: true
  - paymentDelay: "30_days"
  - paymentMethod: "transfer"
  - currency: "MAD"
  - invoicePrefix: "FAC"
  - receiptPrefix: "REC"
  - nextReceiptNumber: 5

#### Scenario: Update organization receipt configuration

- **GIVEN** an organization exists with id "org-123"
- **AND** current fiscal.receiptPrefix is "REC"
- **WHEN** PATCH /organizations/org-123 is called with body {
  fiscal: {
  ...existingFiscal,
  receiptPrefix: "INV",
  nextReceiptNumber: 10
  }
  }
- **THEN** HTTP response is 200 OK
- **AND** fiscal.receiptPrefix is updated to "INV"
- **AND** fiscal.nextReceiptNumber is updated to 10
- **AND** other fiscal fields remain unchanged

#### Scenario: Validate receipt prefix format

- **GIVEN** an organization is being created or updated
- **WHEN** fiscal.receiptPrefix is set to an invalid format (e.g., contains special characters)
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Receipt prefix must be alphanumeric and hyphens only"
- **AND** organization is not updated

#### Scenario: Validate receipt number is positive integer

- **GIVEN** an organization is being created or updated
- **WHEN** fiscal.nextReceiptNumber is set to a negative number or zero
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Receipt number must be a positive integer"
- **AND** organization is not updated

#### Scenario: Default receipt configuration on organization creation

- **GIVEN** a new organization is being created
- **AND** fiscal configuration is provided without receipt settings
- **WHEN** organization is created
- **THEN** fiscal.receiptPrefix defaults to "REC"
- **AND** fiscal.nextReceiptNumber defaults to 1
- **AND** organization is created successfully

#### Scenario: Atomic increment of receipt number during payment creation

- **GIVEN** an organization has fiscal.nextReceiptNumber = 10
- **AND** two concurrent payment creation requests occur
- **WHEN** both payments complete
- **THEN** fiscal.nextReceiptNumber is updated to 12 (no gaps)
- **AND** both payments receive distinct receipt numbers (e.g., "REC-2026-0010", "REC-2026-0011")
- **AND** update is wrapped in database transaction

#### Scenario: Prevent concurrent modification conflicts for receipt number

- **GIVEN** an organization has fiscal.nextReceiptNumber = 10
- **AND** concurrent requests attempt to increment the counter
- **WHEN** transaction conflicts occur
- **THEN** database transaction retries or fails with conflict error
- **AND** no duplicate receipt numbers are assigned
- **AND** error handling ensures consistency

---

### Requirement: Organization appointment types column
The `organizations` table SHALL include a new JSON column `appointmentTypes` typed as `text({ mode: 'json' }).$type<OrgAppointmentType[]>()` (nullable).

#### Scenario: New column added
- **WHEN** the database schema is updated
- **THEN** the `organizations` table SHALL have an `appointmentTypes` column of type `text` with JSON mode
- **THEN** the TypeScript type SHALL be `OrgAppointmentType[] | null`

---

### Requirement: Organization response and update schemas
The `organizationResponseSchema` and `organizationInsertSchema` SHALL include the `appointmentTypes` field.

#### Scenario: Organization response includes appointment types
- **WHEN** the API returns an organization object
- **THEN** the response SHALL include `appointmentTypes: OrgAppointmentTypeItem[] | null`

#### Scenario: Organization update with appointment types
- **WHEN** an admin updates the organization with a new `appointmentTypes` array
- **THEN** the `updateOrganizationSchema` SHALL validate the array against `orgAppointmentTypeItemSchema`
- **THEN** the API SHALL persist the updated array in the JSON column

