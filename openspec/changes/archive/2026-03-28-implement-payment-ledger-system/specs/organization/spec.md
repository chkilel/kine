## ADDED Requirements

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
