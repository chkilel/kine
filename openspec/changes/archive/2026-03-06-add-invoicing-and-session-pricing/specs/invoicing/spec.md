# Invoicing Specification Deltas

## ADDED Requirements

### Requirement: Invoice Creation

The system SHALL allow physiotherapists to create invoices by selecting multiple treatment sessions that relate to the same treatment plan, generating an invoice with automatic numbering, calculating totals, and associating the invoice with a patient.

#### Scenario: Create invoice for multiple sessions

- **GIVEN** a patient has 3 completed treatment sessions with costs 5000, 5000, 6000 (total: 16000 cents)
- **AND** organization has invoice number prefix "FAC" and year-based numbering enabled
- **AND** current year is 2026
- **AND** last invoice number for this organization was "FAC-2026-015"
- **WHEN** POST /api/invoices is called with body {
  patientId: "patient-123",
  treatmentSessionIds: ["session-1", "session-2", "session-3"]
  }
- **THEN** an invoice is created
- **AND** invoice.invoiceNumber is "FAC-2026-016"
- **AND** invoice.totalAmount is 16000
- **AND** invoice.status is "unpaid"
- **AND** 3 invoice_items are created linking to each treatment session
- **AND** each invoice_item has calculated description, quantity 1, unitPrice, and amount
- **AND** organization invoiceNumberCounter is incremented to 16
- **AND** HTTP response is 201 Created

#### Scenario: Create invoice grouping sessions from same treatment plan

- **GIVEN** a patient has a treatment plan "plan-123" with 5 completed sessions
- **AND** the 5 sessions span across multiple weeks (2026-01-15, 2026-01-22, 2026-01-29, 2026-02-05, 2026-02-12)
- **AND** all sessions have the same treatmentPlanId "plan-123"
- **WHEN** POST /api/invoices is called with body {
  patientId: "patient-123",
  treatmentSessionIds: ["session-1", "session-2", "session-3", "session-4", "session-5"]
  }
- **THEN** an invoice is created grouping all 5 sessions
- **AND** invoice is associated with the same patient and treatment plan
- **AND** invoice.description includes treatment plan reference
- **AND** invoice items are ordered by session date
- **AND** invoice is suitable for insurance reimbursement for that treatment plan

#### Scenario: Create invoice with custom notes and due date

- **GIVEN** a patient has completed treatment sessions
- **AND** therapist wants to add custom terms and set due date
- **WHEN** POST /api/invoices is called with body {
  patientId: "patient-123",
  treatmentSessionIds: ["session-1"],
  notes: "Paiement sous 30 jours",
  dueDate: "2026-03-15"
  }
- **THEN** invoice is created with custom notes
- **AND** invoice.dueDate is "2026-03-15"
- **AND** custom notes are stored and displayed on invoice

#### Scenario: Prevent creating invoice for non-existent patient

- **GIVEN** treatment session exists for patient "patient-123"
- **WHEN** POST /api/invoices is called with patientId "nonexistent-patient"
- **THEN** HTTP response is 404 Not Found
- **AND** error message states "Patient not found"
- **AND** no invoice is created

#### Scenario: Prevent creating invoice with no sessions

- **WHEN** POST /api/invoices is called with body {
  patientId: "patient-123",
  treatmentSessionIds: []
  }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "At least one treatment session is required"
- **AND** no invoice is created

#### Scenario: Prevent creating invoice for already invoiced sessions

- **GIVEN** treatment session "session-1" is already linked to invoice "invoice-123"
- **WHEN** POST /api/invoices is called with body {
  patientId: "patient-123",
  treatmentSessionIds: ["session-1"]
  }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "One or more sessions are already invoiced"
- **AND** no invoice is created

#### Scenario: Warn when creating invoice with sessions from different treatment plans

- **GIVEN** a patient has completed treatment sessions
- **AND** "session-1" has treatmentPlanId "plan-123"
- **AND** "session-2" has treatmentPlanId "plan-456" (different plan)
- **AND** "session-3" has treatmentPlanId "plan-123" (same as session-1)
- **WHEN** POST /api/invoices is called with body {
  patientId: "patient-123",
  treatmentSessionIds: ["session-1", "session-2", "session-3"]
  }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Sessions must belong to the same treatment plan for insurance reimbursement"
- **AND** no invoice is created
- **AND** therapist is prompted to create separate invoices for each treatment plan

### Requirement: Invoice Retrieval

The system SHALL provide endpoints to retrieve invoice data including invoice details, line items, and related treatment sessions.

#### Scenario: Get invoice by ID

- **GIVEN** an invoice exists with id "invoice-123"
- **AND** invoice has 3 invoice_items
- **AND** invoice belongs to the authenticated user's organization
- **WHEN** GET /api/invoices/invoice-123 is called
- **THEN** HTTP response is 200 OK
- **AND** response body includes invoice details
- **AND** response includes invoice_items array with related treatment session data
- **AND** response includes patient information
- **AND** response includes organization info for invoice header

#### Scenario: Get non-existent invoice

- **GIVEN** no invoice exists with id "invoice-999"
- **WHEN** GET /api/invoices/invoice-999 is called
- **THEN** HTTP response is 404 Not Found
- **AND** error message states "Invoice not found"

#### Scenario: Prevent cross-organization access

- **GIVEN** an invoice exists belonging to organization A
- **AND** the authenticated user belongs to organization B
- **WHEN** GET /api/invoices/[id] is called
- **THEN** HTTP response is 404 Not Found (treated as not found for security)

#### Scenario: List invoices for patient

- **GIVEN** a patient with id "patient-123" has 5 invoices
- **AND** the invoices belong to the authenticated user's organization
- **WHEN** GET /api/invoices?patientId=patient-123 is called
- **THEN** HTTP response is 200 OK
- **AND** response body is an array of 5 invoices
- **AND** invoices are ordered by createdAt descending (most recent first)
- **AND** each invoice includes patient, invoice count, totalAmount, and status

#### Scenario: List invoices with status filter

- **GIVEN** a patient has 10 invoices (5 paid, 5 unpaid)
- **WHEN** GET /api/invoices?patientId=patient-123&status=unpaid is called
- **THEN** HTTP response is 200 OK
- **AND** response body is an array of 5 invoices
- **AND** all invoices have status "unpaid"

#### Scenario: List invoices with date range filter

- **GIVEN** a patient has invoices spanning multiple months
- **WHEN** GET /api/invoices?patientId=patient-123&from=2026-01-01&to=2026-01-31 is called
- **THEN** HTTP response is 200 OK
- **AND** response body includes only invoices with issueDate between 2026-01-01 and 2026-01-31

### Requirement: Invoice Update

The system SHALL allow updating invoice details including status, notes, signature, and organization information.

#### Scenario: Update invoice notes and due date

- **GIVEN** an invoice exists with id "invoice-123"
- **WHEN** PATCH /api/invoices/invoice-123 is called with body {
  notes: "Paiement sous 15 jours",
  dueDate: "2026-02-28"
  }
- **THEN** HTTP response is 200 OK
- **AND** invoice notes is updated
- **AND** invoice dueDate is updated
- **AND** updatedAt timestamp is updated

#### Scenario: Update invoice organization info

- **GIVEN** an invoice exists with id "invoice-123"
- **WHEN** PATCH /api/invoices/invoice-123 is called with body {
  organizationInfo: {
  name: "Cabinet Kiné Paris",
  address: "123 Rue de la Santé, 75001 Paris",
  phone: "+33 1 23 45 67 89",
  email: "contact@cabinet-kine.fr"
  }
  }
- **THEN** HTTP response is 200 OK
- **AND** organizationInfo is updated as JSON
- **AND** new info is displayed on invoice document

#### Scenario: Prevent updating paid invoice

- **GIVEN** an invoice exists with status "paid"
- **WHEN** PATCH /api/invoices/invoice-123 is called with body { notes: "Updated notes" }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Cannot update a paid invoice"
- **AND** invoice remains unchanged

### Requirement: Invoice Deletion

The system SHALL allow deleting invoices that have not been paid, preventing deletion of paid invoices for audit purposes.

#### Scenario: Delete unpaid invoice

- **GIVEN** an unpaid invoice exists with id "invoice-123"
- **WHEN** DELETE /api/invoices/invoice-123 is called
- **THEN** HTTP response is 200 OK
- **AND** invoice is soft-deleted (deletedAt is set)
- **AND** associated invoice_items are deleted
- **AND** linked treatment sessions are not deleted (they remain)
- **AND** treatment sessions are available for new invoice creation

#### Scenario: Prevent deleting paid invoice

- **GIVEN** a paid invoice exists with id "invoice-123"
- **WHEN** DELETE /api/invoices/invoice-123 is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Cannot delete a paid invoice"
- **AND** invoice remains in database

### Requirement: Invoice Payment

The system SHALL allow marking invoices as paid, recording payment date and amount, with automatic status transitions.

#### Scenario: Mark invoice as paid in full

- **GIVEN** an invoice exists with id "invoice-123"
- **AND** invoice.totalAmount is 16000
- **AND** invoice.status is "unpaid"
- **WHEN** POST /api/invoices/invoice-123/mark-paid is called with body {
  paymentDate: "2026-02-15",
  paidAmount: 16000
  }
- **THEN** HTTP response is 200 OK
- **AND** invoice.status is updated to "paid"
- **AND** invoice.paidAmount is set to 16000
- **AND** invoice.paidDate is set to "2026-02-15"
- **AND** updatedAt timestamp is updated

#### Scenario: Mark invoice as partially paid

- **GIVEN** an invoice exists with totalAmount 16000
- **AND** invoice.status is "unpaid"
- **WHEN** POST /api/invoices/invoice-123/mark-paid is called with body {
  paymentDate: "2026-02-15",
  paidAmount: 10000
  }
- **THEN** HTTP response is 200 OK
- **AND** invoice.paidAmount is set to 10000
- **AND** invoice.status remains "unpaid" (not fully paid)
- **AND** partial payment is recorded

#### Scenario: Prevent marking already paid invoice

- **GIVEN** an invoice exists with status "paid"
- **WHEN** POST /api/invoices/invoice-123/mark-paid is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Invoice is already paid"
- **AND** no changes are made

### Requirement: Invoice Numbering

The system SHALL generate unique invoice numbers with configurable prefix, year-based separation, and per-organization incrementing counters.

#### Scenario: Generate invoice number with default prefix

- **GIVEN** organization has invoiceNumberPrefix "FAC"
- **AND** organization has invoiceNumberCounter 15
- **AND** current year is 2026
- **AND** invoiceNumberYearBased is true
- **WHEN** a new invoice is created
- **THEN** invoice.invoiceNumber is "FAC-2026-016"
- **AND** organization invoiceNumberCounter is incremented to 16

#### Scenario: Generate invoice number with custom prefix

- **GIVEN** organization has invoiceNumberPrefix "INV"
- **AND** organization has invoiceNumberCounter 99
- **AND** current year is 2026
- **WHEN** a new invoice is created
- **THEN** invoice.invoiceNumber is "INV-2026-100"

#### Scenario: Reset counter on new year

- **GIVEN** organization has invoiceNumberCounter 999
- **AND** last invoice was created in 2025
- **AND** current year is 2026
- **AND** invoiceNumberYearBased is true
- **WHEN** the first invoice of 2026 is created
- **THEN** invoice.invoiceNumber is "FAC-2026-001"
- **AND** organization invoiceNumberCounter is reset to 1

#### Scenario: Generate sequential invoice numbers without year

- **GIVEN** organization has invoiceNumberYearBased false
- **AND** organization has invoiceNumberPrefix "FAC"
- **AND** organization has invoiceNumberCounter 15
- **WHEN** a new invoice is created
- **THEN** invoice.invoiceNumber is "FAC-16"
- **AND** counter is incremented to 16
- **AND** year is not included in invoice number

#### Scenario: Ensure invoice number uniqueness per organization

- **GIVEN** two organizations exist (org-A and org-B)
- **AND** both organizations have invoiceNumberPrefix "FAC"
- **WHEN** org-A creates an invoice and org-B creates an invoice
- **THEN** both organizations can have the same invoice number "FAC-2026-001"
- **AND** uniqueness is enforced within each organization only

### Requirement: Invoice PDF Generation

The system SHALL generate downloadable PDF invoices on the client side with professional formatting including organization header, patient details, session line items, totals, and signature section.

#### Scenario: Generate PDF for invoice

- **GIVEN** an invoice exists with id "invoice-123"
- **AND** invoice has 3 line items
- **AND** therapist clicks "Télécharger PDF" button in UI
- **THEN** client-side PDF is generated using jsPDF
- **AND** PDF includes organization name and address in header
- **AND** PDF includes invoice number and date
- **AND** PDF includes patient name and contact info
- **AND** PDF includes table of line items with description, date, location, and cost
- **AND** PDF includes total amount in Moroccan Dirhams (Dh)
- **AND** PDF includes payment status badge (Payé/Non payé)
- **AND** PDF includes notes/terms at bottom
- **AND** PDF includes signature line
- **AND** PDF is downloaded to user's device

#### Scenario: Generate PDF for paid invoice

- **GIVEN** a paid invoice exists with payment date "2026-02-15"
- **AND** therapist clicks "Télécharger PDF" button
- **THEN** PDF includes payment date
- **AND** PDF shows "Payé le 15/02/2026" status
- **AND** PDF includes paid amount

#### Scenario: Generate PDF with custom organization info

- **GIVEN** an invoice has custom organizationInfo with Moroccan business identifiers (RC, ICE, IF)
- **WHEN** GET /api/invoices/[id]/pdf is called
- **THEN** PDF includes RC, ICE, and IF numbers in header
- **AND** PDF uses custom address and contact info

### Requirement: Invoice Organization Configuration

The system SHALL allow configuration of invoice numbering (prefix, year-based flag) and default invoice notes/terms at organization level.

#### Scenario: Configure invoice number prefix

- **GIVEN** an organization exists with default prefix "FAC"
- **WHEN** PATCH /api/organizations/:id/invoice-config is called with body {
  invoiceNumberPrefix: "FACT"
  }
- **THEN** organization invoiceNumberPrefix is updated to "FACT"
- **AND** new invoices will use "FACT" prefix

#### Scenario: Enable/disable year-based numbering

- **GIVEN** an organization has year-based numbering enabled
- **WHEN** PATCH /api/organizations/:id/invoice-config is called with body {
  invoiceNumberYearBased: false
  }
- **THEN** organization invoiceNumberYearBased is updated to false
- **AND** new invoices will use sequential numbering without year

#### Scenario: Configure default invoice notes

- **GIVEN** an organization wants to set default terms
- **WHEN** PATCH /api/organizations/:id/invoice-config is called with body {
  defaultInvoiceNotes: "Paiement sous 30 jours. Merci de votre confiance."
  }
- **THEN** defaultInvoiceNotes is saved
- **AND** new invoices are created with these notes pre-filled

#### Scenario: Configure organization info for invoices

- **GIVEN** an organization wants to customize invoice header
- **WHEN** PATCH /api/organizations/:id/invoice-config is called with body {
  invoiceOrganizationInfo: {
  name: "Cabinet Kiné Casablanca",
  address: "123 Boulevard Mohammed V",
  city: "20250 Casablanca",
  phone: "+212 5 22 12 34 56",
  email: "contact@cabinet-kine.ma",
  rc: "123456",
  ice: "001234567890001",
  if: "12345678"
  }
  }
- **THEN** organizationInfo is stored as JSON
- **AND** PDF invoices use this custom information
