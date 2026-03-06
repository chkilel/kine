# Change: Add Invoicing and Session Pricing

## Why

Physiotherapists need to handle both simple immediate billing for individual sessions and formal invoicing for insurance reimbursement, with a flexible pricing system that supports different rates for cabinet, domicile, and téléconsultation locations.

## What Changes

- Add new invoicing capability for creating, managing, and printing invoices
- Add session pricing system with inheritance chain (org → treatment plan → session)
- Add location-based pricing configuration at organization that can be overridden in treatment plan level
- Add cost override capability at session level if needed for manual adjustments
- Add invoice numbering configuration (prefix, year-based, incrementing)
- Add simple receipt generation for immediate session billing

## Impact

- Affected specs:
  - NEW: invoicing (capability for invoice creation and management)
  - MODIFIED: treatment-session (add cost calculation, inheritance logic, immediate billing)
  - MODIFIED: organization (add pricing defaults and invoice numbering config)
  - MODIFIED: treatment-plan (add session cost overrides)
- Affected code:
  - server/database/schema/ (add invoices table, pricing fields to org/plan)
  - app/components/ (new invoice components, billing workflow in session slideover)
  - server/api/ (invoice CRUD endpoints, pricing calculation logic)
  - app/pages/patients/[id]/facturation.vue (make functional)
