# 5) Data Models & Entity Relationships

Principles
- Normalize core entities to support reporting and reliability; denormalize selectively for performance.
- Use UUIDs for primary keys; add unique business keys where applicable (e.g., invoice number).
- Enforce referential integrity via foreign keys; capture audit metadata (createdAt, updatedAt, createdBy, updatedBy).
- Soft deletion for patient-facing records (Patients, Appointments, Visits) with deletedAt; hard deletion for ephemeral logs as needed.

Core Entities (Phase 1)
- Organization (id, name, settingsJson, createdAt)
  - One-to-many to Users, ClinicLocations, Patients, Practitioners, Appointments, Invoices.
- ClinicLocation (id, organizationId FK, name, address, timezone, phone)
  - One-to-many to Appointments; resource constraints (rooms) modeled via LocationResource.
- User (id, organizationId FK, email unique, passwordHash, status, lastLoginAt)
  - One-to-one optional to PractitionerProfile or AssistantProfile; many-to-many Role via UserRole.
- Role (id, organizationId FK, key unique per org, name)
  - Many-to-many to Permission via RolePermission; baseline roles: Owner, Admin, Manager, Practitioner, Assistant, Patient.
- Permission (id, key unique global, description)
  - Examples: patient.read, patient.write, appointment.manage, billing.view, billing.manage.
- Patient (id, organizationId FK, firstName, lastName, dob, sex, contactJson, insuranceJson, deletedAt?)
  - One-to-many to Cases, Appointments, Visits, Invoices; PHI handling.
- PractitionerProfile (id, userId FK unique, specialtiesJson, licenseNumber, availabilityJson)
- AssistantProfile (id, userId FK unique, department, dutiesJson)
- Case (id, patientId FK, practitionerUserId FK, diagnosisJson, status, openedAt, closedAt?)
  - One-to-many to Visits.
- Visit (id, caseId FK, appointmentId FK?, notesJson (SOAP), attachmentsJson, status, visitedAt)
  - Versioning via VisitRevision (id, visitId FK, version, notesJson, createdAt, createdBy).
- Appointment (id, organizationId FK, patientId FK, practitionerUserId FK, clinicLocationId FK, start, end, status, recurrenceJson?)
  - Conflict detection across practitioner + room (LocationResource assignment).
- Invoice (id, organizationId FK, patientId FK, caseId FK?, number unique, status, issuedAt, dueAt, totalsJson)
  - One-to-many to InvoiceLine (id, invoiceId FK, itemType, itemId?, description, qty, unitPrice, taxRate, discountRate).
- Payment (id, invoiceId FK, amount, method, receivedAt, reference)
  - Balance calculation: sum(Payments) vs Invoice total.
- ProductService (id, organizationId FK, code unique per org, name, type(service|product), unitPrice, taxRate)
- Notification (id, organizationId FK, userId FK?, patientId FK?, type, payloadJson, status, scheduledAt, sentAt?)
- AuditLog (id, organizationId FK, actorUserId FK?, entityType, entityId, action, diffJson, createdAt)
- LocationResource (id, clinicLocationId FK, type(room|equipment), name)

Relationships Overview
- Organization → many Users, ClinicLocations, Patients, Practitioners, Appointments, Invoices.
- User ↔ Role via UserRole; Role ↔ Permission via RolePermission; enforce RBAC at server and UI.
- Patient → many Cases; Case → many Visits; Visit ↔ Appointment (optional linkage).
- Appointment links Patient, Practitioner, Location; support recurring events via recurrence rules.
- Invoice → many InvoiceLines; Payment → Invoice; derive outstanding balances.
- Notifications connect to Users/Patients contextually; AuditLog captures changes across entities.

Migrations & Versioning
- Drizzle migration files per feature module (auth, patients, scheduling, billing, docs).
- Semantic migration naming: yyyy-mm-dd_<module>_<short-desc>.
- Seed scripts: baseline roles, permissions, demo org, sample Patients/Practitioners, ProductService catalog.

Data Privacy & Retention
- PHI stored in Patient, Case, Visit; encrypt-at-rest via Postgres and disk-level; ensure minimized exposure in logs.
- Access controlled via RBAC; audit on create/update/delete sensitive entities.
- Retention: configurable per org; default 7-year retention for clinical records (clinic policy dependent).

Example Flows
- Scheduling: Create Appointment → save Patient/Practitioner/Location linkage → conflict check → optional reminder Notification.
- Clinical Docs: Visit created under Case → SOAP notes saved → VisitRevision captured on edit → AuditLog recorded.
- Billing: Generate Invoice from Visit(s)/ProductService items → add Payments → compute outstanding → export CSV/PDF.

Implementation Notes
- Indexes: composite indexes on (organizationId, createdAt), foreign key indexes on all relations; unique indexes for business keys (invoice number, product code).
- Timezones: store timestamps in UTC, render per ClinicLocation timezone.
- Files: attachments later via external object storage; store metadata in DB with signed URL strategy.

Migrations & Versioning
- Drizzle migration files per feature module (auth, patients, scheduling, billing, docs).
- Semantic migration naming: yyyy-mm-dd_<module>_<short-desc>.
- Seed scripts: baseline roles, permissions, demo org, sample Patients/Practitioners, ProductService catalog.

Data Privacy & Retention
- PHI stored in Patient, Case, Visit; encrypt-at-rest via Postgres and disk-level; ensure minimized exposure in logs.
- Access controlled via RBAC; audit on create/update/delete sensitive entities.
- Retention: configurable per org; default 7-year retention for clinical records (clinic policy dependent).

Example Flows
- Scheduling: Create Appointment → save Patient/Practitioner/Location linkage → conflict check → optional reminder Notification.
- Clinical Docs: Visit created under Case → SOAP notes saved → VisitRevision captured on edit → AuditLog recorded.
- Billing: Generate Invoice from Visit(s)/ProductService items → add Payments → compute outstanding → export CSV/PDF.

Implementation Notes
- Indexes: composite indexes on (organizationId, createdAt), foreign key indexes on all relations; unique indexes for business keys (invoice number, product code).
- Timezones: store timestamps in UTC, render per ClinicLocation timezone.
- Files: attachments later via external object storage; store metadata in DB with signed URL strategy.
