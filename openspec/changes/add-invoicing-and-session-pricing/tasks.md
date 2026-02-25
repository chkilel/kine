## 1. Database Schema

- [ ] 1.1 Create invoices table with fields: id, organizationId, patientId, invoiceNumber, status (paid/unpaid), issueDate, dueDate, totalAmount, paidAmount, notes, signature, organizationInfo (JSON), createdAt, updatedAt
- [ ] 1.2 Create invoice_items table with fields: id, invoiceId, treatmentSessionId, description, quantity, unitPrice, amount, createdAt, updatedAt
- [ ] 1.3 Add invoice numbering configuration to organizations table: invoiceNumberPrefix (default: 'FAC'), invoiceNumberYearBased (boolean, default: true), invoiceNumberCounter (integer)
- [ ] 1.4 Add pricing defaults to organizations table: defaultSessionCostClinic, defaultSessionCostHome, defaultSessionCostTelehealth (all in cents)
- [ ] 1.5 Add pricing overrides to treatment_plans table: sessionCostClinicOverride, sessionCostHomeOverride, sessionCostTelehealthOverride (optional, nullable)
- [ ] 1.6 Add cost override to treatment_sessions table: costOverride (nullable, cents)
- [ ] 1.7 Create indexes for invoice queries: patientId, organizationId, status, invoiceNumber
- [ ] 1.8 Create foreign key constraints: invoices → patients, invoice_items → invoices and treatment_sessions

## 2. Pricing Inheritance Logic

- [ ] 2.1 Implement cost calculation function: getTreatmentSessionCost(session, org, treatmentPlan)
- [ ] 2.2 Logic: if session.costOverride exists, use it; else if treatmentPlan override exists for session location, use it; else use org default for session location
- [ ] 2.3 Add API endpoint to get calculated cost for a treatment session
- [ ] 2.4 Add composable useSessionCost(session) that returns calculated cost with inheritance chain displayed

## 3. Invoicing API

- [ ] 3.1 POST /api/invoices - Create new invoice with array of treatment session IDs (all sessions must belong to same treatment plan)
- [ ] 3.2 GET /api/invoices/:id - Retrieve single invoice with items and related sessions
- [ ] 3.3 GET /api/invoices - List invoices with filters (patientId, status, dateRange)
- [ ] 3.4 PATCH /api/invoices/:id - Update invoice (status, notes, signature, organization info)
- [ ] 3.5 DELETE /api/invoices/:id - Delete invoice (soft delete if invoice not paid)
- [ ] 3.6 POST /api/invoices/:id/mark-paid - Mark invoice as paid with payment date
- [ ] 3.7 POST /api/invoices/:id/mark-viewed - Mark invoice as viewed (optional)

## 4. Client-Side PDF Generation

- [ ] 4.1 Implement client-side invoice PDF generation using jsPDF library
- [ ] 4.2 Implement client-side receipt PDF generation using jsPDF library
- [ ] 4.3 Invoice PDF includes: organization header, patient details, session line items, totals, signature
- [ ] 4.4 Receipt PDF includes: session details, cost, payment date, therapist signature

## 5. Invoice Numbering

- [ ] 5.1 Implement invoice number generation logic: prefix + year + incrementing counter
- [ ] 5.2 Format: {prefix}-{YYYY}-{counter} (e.g., FAC-2026-001)
- [ ] 5.3 Counter resets per year per organization
- [ ] 5.4 Increment counter atomically when creating new invoice
- [ ] 5.5 Add validation to prevent duplicate invoice numbers

## 6. Frontend Components

- [ ] 6.1 Create BillingCard component for session slideover (shows cost, allows marking as paid)
- [ ] 6.2 Create InvoiceSlideover component for creating/editing invoices
- [ ] 6.3 Create InvoiceList component with filters and search
- [ ] 6.4 Create InvoiceDocument component for viewing/printing invoices
- [ ] 6.5 Create InvoiceNumberingConfig component in organization settings
- [ ] 6.6 Create SessionPricingConfig component in organization settings (per-location defaults)
- [ ] 6.7 Create TreatmentPlanPricingConfig component (optional overrides per location)

## 7. Session Slideover Integration

- [ ] 7.1 Add BillingCard to TreatmentSessionSlideover after session finishes (status: finished)
- [ ] 7.2 Display calculated cost with inheritance chain (showing org default → plan override → final)
- [ ] 7.3 Allow therapist to override cost before marking as paid
- [ ] 7.4 Add "Payer immédiatement" button that marks session as paid and generates receipt
- [ ] 7.5 Add "Ajouter à une facture" button to add session to existing invoice

## 8. Patient Facturation Page

- [ ] 8.1 Replace mock data with real invoice and payment data
- [ ] 8.2 Show unbilled sessions grouped by treatment plan with calculated total per plan
- [ ] 8.3 Show invoices with paid/unpaid status
- [ ] 8.4 Show recent payments/receipts
- [ ] 8.5 Add "Créer une facture" button that opens InvoiceSlideover

## 9. Organization Settings

- [ ] 9.1 Add InvoiceSettings section to organization settings page
- [ ] 9.2 Configure invoice number prefix
- [ ] 9.3 Configure year-based numbering toggle
- [ ] 9.4 Configure organization info displayed on invoices (name, address, contact)
- [ ] 9.5 Configure default invoice notes/terms
- [ ] 9.6 Configure default pricing per session location

## 10. Tests

- [ ] 10.1 Unit tests for cost inheritance logic
- [ ] 10.2 Unit tests for invoice number generation
- [ ] 10.3 API integration tests for invoice CRUD operations
- [ ] 10.4 Integration tests for billing workflow (session → receipt, sessions → invoice)

## 11. Documentation

- [ ] 11.1 Document pricing inheritance chain in AGENTS.md
- [ ] 11.2 Document invoice numbering format and customization options
- [ ] 11.3 Add examples of billing workflows (immediate payment vs invoicing)
