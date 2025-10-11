# 3) Enhancement Scope & Objectives
Goal
Transform the current Nuxt monolith into a secure, persistent, role-aware application delivering clinic-grade features per the PRD.

In-Scope Enhancements (Phase 1)
1. Authentication & Authorization
   - Integrate better-auth (org + admin plugins) with session management, secure password handling, and RBAC across these baseline roles: Owner, Admin, Manager, Practitioner, Assistant, Patient.
   - Route guards, server-side policy checks, and UI permission gates.

2. Persistence & Data Modeling (PostgreSQL + Drizzle)
   - Define core entities and relations: Organization, User, Role, Patient, Practitioner, Appointment, Visit, Case, Invoice, Payment, Product/Service, Clinic Location, Notification, AuditLog.
   - Implement Drizzle schemas, migrations, seed data, and repository/service layer with Zod-based input validation.

3. Scheduling & Calendar
   - CRUD appointments with resource constraints (room/therapist), conflict detection, recurring events, and status transitions.
   - Server APIs + UI components, with time zone handling and date-fns utilities.

4. Clinical Documentation
   - SOAP/clinical note entries linked to visits/cases; attachments (file metadata stored, content storage strategy TBD).
   - Versioning and audit trail for edits; secure access by role.

5. Billing & Payments (RCM fundamentals)
   - Invoice generation, line items, taxes/discounts; payment recording, outstanding balances, and basic dunning notifications.
   - Exportable statements and simple reports (CSV/PDF).

6. Reporting & Dashboards
   - Operational metrics: appointment utilization, revenue, no-show rate, outstanding balances, top services.
   - Role-aware, filterable dashboards with server-side aggregation.

7. Notifications & Communications
   - Email notifications through Mailpit in dev (SMTP abstraction for prod). In-app notifications via Redis-backed queues (future-ready).
   - Reminders for upcoming appointments; event-driven hooks from domain services.

8. Internationalization (FR/AR) & Accessibility
   - Introduce i18n foundation and locale-switching; ensure key screens are translated and RTL-ready for Arabic.
   - WCAG-aligned components via @nuxt/ui where applicable; keyboard navigation and contrast checks.

9. Deployment & Ops Readiness
   - Containerized deployment compatible with Dokploy; environment configuration with secrets, health endpoints, structured logging.
   - Basic backup/restore procedures for Postgres; migration pipelines integrated in CI.

Objective Metrics (Acceptance)
- Auth/RBAC: All protected routes enforced server-side; role-gated UI verified; minimum 10 permission scenarios covered in tests.
- Data: Drizzle migrations run successfully; ≥12 core tables; CRUD flows for Patients, Appointments, Invoices proven end-to-end.
- Scheduling: Conflict detection and recurring events implemented; time zone-safe rendering and storage; ≥3 scheduling scenarios tested.
- Billing: Invoice–payment linkage correct; outstanding balance calculation accurate; CSV/PDF export verified.
- Reporting: At least 5 operational KPIs with server-side aggregation and role-aware visibility.
- i18n/A11y: FR/AR locales available; RTL verified on core screens; basic accessibility checks pass.
- Ops: Container images build; smoke tests green in staging; backups/restores executed in dev with sample data.

Out-of-Scope (Initially)
- Advanced insurance clearinghouse integrations or complex claim workflows.
- Real-time chat/video; advanced document storage (external object store can be considered later).
- Full offline-first mode; mobile-native clients.

Dependencies & Prerequisites
- Establish environment secrets and config conventions.
- Confirm role model variations per clinic needs; finalize locale priorities and content requirements.
- Define minimal backup/restore and migration runbooks.

Rationale
- Prioritizes the PRD’s High priority capabilities while de-risking with monolith-first and strong data/auth foundations.
- Creates a path to expand into async processing and richer integrations without premature complexity.
