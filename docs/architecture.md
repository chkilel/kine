# Kine Web App v2 — Brownfield Enhancement Architecture

## 1) Introduction
This document defines the architectural approach to evolve the existing Nuxt-based monolith into a production-ready practice management system tailored for physiotherapy clinics. It is grounded in the current repository state, the PRD, and development tooling present in this project. It aims to deliver a clear path from today’s stubbed APIs and UI into a secure, persistent, and role-aware application with robust scheduling, clinical documentation, billing, and reporting.

Key assumptions
- Frontend: Nuxt 4 + TypeScript with @nuxt/ui v4 and SSR via Nitro.
- Backend: Nitro server routes, consolidated in the Nuxt monorepo (single deployable). No external services required for MVP beyond Postgres, Redis, and Mailpit for dev.
- Data: PostgreSQL as the primary store; Drizzle ORM for schema and migrations; Redis for caching/queues; Mailpit for local email testing.
- AuthN/AuthZ: better-auth with organization and admin plugins; role/permission model aligning to clinic operations.
- Deployment: Self-hosted via Dokploy, with environments for dev/staging/prod.

Rationale
- Monolith-first keeps velocity and reduces coordination overhead while features are actively maturing. Nitro offers SSR with lightweight APIs that fit early-stage needs.
- Postgres + Drizzle gives strong relational modeling and type-safety across the stack.
- Redis unlocks future async jobs (notifications, reminders, batch billing) and caching without premature microservices.

## 2) Existing Project Analysis
Current State
- Nuxt 4 monolith with SSR and Nitro APIs. UI built with @nuxt/ui components; server routes return static fixtures.
- Infrastructure defined for dev via Docker Compose (Postgres, Redis, Mailpit). App code does not yet persist data or implement auth.

Constraints & Gaps
- No Drizzle models/migrations; no persistence layer used by APIs.
- No better-auth integration; routes unguarded; role-aware UI absent.
- APIs are simple, returning mock data (customers, members, notifications, mails).
- i18n (FR/AR) and accessibility goals called out in PRD but not yet wired.

Implications
- We must introduce data models, services, validation, authentication, and permission-aware UI components before production deployment.

## 3) Enhancement Scope & Objectives
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

## 4) Tech Stack & Integrations

Overview
The solution is a Nuxt 4 monolith with SSR and Nitro APIs. We will enhance it with a robust persistence, authentication, and operations foundation while retaining monolith-first velocity.

Current Capabilities (from repository)
- Frontend: Nuxt 4 + TypeScript, @nuxt/ui for accessible UI components, @vueuse/nuxt for composables, date-fns for date utilities.
- Server & APIs: Nitro server routes under /server/api/**; CORS enabled for /api/** in routeRules.
- Validation: zod available for schema/DTO validation.
- Dev Tooling: ESLint via @nuxt/eslint with stylistic config; Vue type checking via vue-tsc.
- Infrastructure (dev): Docker Compose services for Postgres, Redis, and Mailpit.

Planned Additions (Phase 1)
- ORM & Migrations: Drizzle ORM for type-safe models, migrations, and repository patterns.
- Authentication: better-auth with organization/admin plugins; server-side session storage; route guards and policies.
- Redis Integration: Node Redis client for caching and job queues; foundation for reminders and notifications.
- Email: SMTP abstraction with environment-based configuration; Mailpit in dev.
- PDF/Export: Server-side CSV/PDF export utilities for invoices/statements.
- i18n: Nuxt i18n setup with FR and AR locales; RTL support for Arabic.
- Observability: Structured logging (e.g., pino) and request metrics; health endpoints for readiness/liveness.

Integration Architecture
- Monolith Boundary: Nitro handles SSR and API requests; domain services encapsulate business logic (scheduling, billing, clinical notes).
- Data Access: Repository layer on Drizzle models; input validation via zod; transaction boundaries for multi-entity operations (e.g., invoice + payment).
- AuthN/AuthZ: Middleware and server policies enforce RBAC; UI gates hide/show actions based on role.
- Caching & Jobs: Redis-backed queues for reminders and notification dispatch; cache hot paths (e.g., dashboard aggregates).
- Emails & Notifications: SMTP integration for email; in-app notifications via server events and Redis queues.
- Internationalization & Accessibility: Locale-aware UI; RTL testing for Arabic; leverage @nuxt/ui to maintain WCAG-aligned components.

Operational Considerations
- Configuration: Environment-driven secrets (database URL, Redis URL, SMTP creds); separate envs for dev/staging/prod.
- Security: Secure cookie/session settings; input validation at API boundaries; audit logging for sensitive changes.
- Deployment: Container images for the Nuxt app; Dokploy orchestrates environment configuration, scaling, and rollouts.

Rationale
- These integrations align with PRD High priorities and current repository direction, minimizing rework while enabling production-grade capabilities.

## 5) Data Models & Entity Relationships

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

## 6) Component Architecture

Frontend Structure (Current)
- Layouts: app/layouts/default.vue provides shell (nav, header, notifications slide-over).
- Pages: app/pages/index.vue (dashboard), customers.vue, inbox.vue, settings.vue; nested settings/ directory for sub-views.
- Components: app/components/ (NotificationsSlideover, TeamsMenu, UserMenu, domain-specific folders: customers/, home/, inbox/, settings/).
- Composables: app/composables/useDashboard.ts coordinating dashboard data.

Proposed Modules (Phase 1)
- Auth: login/register, org selection, session management, role-aware guards; shared UserMenu with role context.
- Patients: list/detail, cases, visits, documents; search and filters.
- Scheduling: calendar views (day/week/month), appointment CRUD, conflict detection, reminders.
- Billing: invoices, payments, products/services; exports (CSV/PDF).
- Reporting: KPI dashboards with filters; server-side aggregates.
- Notifications: in-app feed and email dispatch; preference management.
- Settings: organization settings, clinic locations, roles/permissions, product/service catalog.

State & Data Flow
- UI State: local component state and Nuxt composables (no global store dependency); introduce targeted composables (useAuth, usePatients, useScheduling, useBilling).
- Data Fetching: server-side via Nitro APIs using $fetch or useAsyncData/useFetch; cache and invalidate per view; optimistic updates where safe.
- Error Handling: standardize error responses; surface toast/alert patterns via @nuxt/ui.

Service Layering (Server)
- API Routes: /server/api/** expose RESTful endpoints per module.
- Domain Services: encapsulate business logic (e.g., scheduling conflict checks, invoice totals).
- Repositories: Drizzle-backed CRUD with transactional boundaries.
- Validation: zod schemas for request/response; DTOs mapped in services.

UI Components & Accessibility
- Reusable atoms/molecules (tables, forms, dialogs) built on @nuxt/ui; ensure keyboard navigation and ARIA where needed.
- Locale-aware strings and RTL adjustments for Arabic; test critical pages in FR/AR.

Navigation & Permissions
- Role-aware menus (TeamsMenu/UserMenu) gate visibility; route middleware to block unauthorized access.
- Breadcrumbs and contextual actions in detail views.

Patterns & Conventions
- File structure by feature module under app/components/<feature> and server/services/<feature>.
- Naming: PascalCase for components, camelCase for composables, kebab-case for routes.
- Testing: component unit tests and API integration tests per module before feature completion.

Implementation Notes
- Indexes: composite indexes on (organizationId, createdAt), foreign key indexes on all relations; unique indexes for business keys (invoice number, product code).
- Timezones: store timestamps in UTC, render per ClinicLocation timezone.
- Files: attachments later via external object storage; store metadata in DB with signed URL strategy.

## 7) API Design

Conventions
- Base Path: /api for REST endpoints (maintain /api/** CORS per nuxt.config).
- Resources: plural nouns (patients, appointments, invoices); nested where logical (patients/{id}/cases).
- Identifiers: UUIDs for entity IDs; numeric invoice numbers as business keys.
- Pagination: page & pageSize query params; response includes meta { total, page, pageSize }.
- Filtering & Sorting: query params (e.g., ?status=active&sort=createdAt&order=desc); whitelist fields.
- Error Model: JSON envelope { error: { code, message, details? } }; zod validation errors mapped to details array.
- Rate Limiting: lightweight per-IP and per-session limits on mutation endpoints.

Endpoints (Phase 1)
- Auth
  - POST /api/auth/login
  - POST /api/auth/logout
  - POST /api/auth/register (org-aware)
  - GET  /api/auth/me
- Users & Roles
  - GET  /api/users
  - POST /api/users
  - GET  /api/users/{id}
  - PATCH/DELETE /api/users/{id}
  - GET  /api/roles, /api/permissions
- Patients & Clinical
  - GET  /api/patients
  - POST /api/patients
  - GET  /api/patients/{id}
  - PATCH/DELETE /api/patients/{id}
  - GET  /api/patients/{id}/cases
  - POST /api/patients/{id}/cases
  - GET  /api/cases/{id}/visits
  - POST /api/cases/{id}/visits
  - PATCH /api/visits/{id} (notes, status); versions via VisitRevision
- Scheduling
  - GET  /api/appointments
  - POST /api/appointments
  - GET  /api/appointments/{id}
  - PATCH/DELETE /api/appointments/{id}
  - POST /api/appointments/{id}/remind
- Billing
  - GET  /api/invoices
  - POST /api/invoices
  - GET  /api/invoices/{id}
  - PATCH /api/invoices/{id}
  - POST /api/invoices/{id}/lines
  - POST /api/invoices/{id}/payments
  - GET  /api/products
  - POST /api/products
- Notifications
  - GET  /api/notifications
  - POST /api/notifications (scheduled)

Security & Policies
- Authentication: session-based with HTTP-only secure cookies; CSRF protection for form posts.
- Authorization: RBAC enforced via server middleware and domain policies; organization scoping on all queries.
- Input Validation: zod schemas per endpoint; reject unknown fields; sanitize logs.

Responses & DTOs
- Consistent DTOs across modules; date-time fields in ISO 8601 UTC; monetary values in smallest currency unit where needed.
- Include ETag/If-None-Match support for cacheable GETs where beneficial.

## 8) Security & Compliance

Authentication
- better-auth integration with secure password hashing, session management, and account status flags.
- Organization boundary: each session tied to an organization; admin operations scoped.

Authorization
- RBAC: roles mapped to permissions; service-level checks for sensitive operations (billing.manage, patient.write, appointment.manage).
- Resource Scoping: enforce organizationId and location constraints in queries and updates.

Data Protection & Privacy
- PHI/PII: minimize exposure; never log sensitive fields; redaction in error traces.
- Encryption: TLS in transit; database and disk encryption at rest; secure cookie flags.
- Audit Logging: capture actor, entity, action, diff, timestamp; immutable logs with append-only design.

Application Security
- Input Validation: zod on all API requests; normalize/sanitize strings.
- OWASP: protections against XSS, CSRF, SSRF, injection; safe query building via Drizzle.
- Headers: secure defaults (frameguard, hsts, x-content-type-options); CORS only for needed paths.
- Rate Limiting & Brute Force: limits on auth endpoints; exponential backoff on repeated failures.

Secrets & Configuration
- Managed via environment variables; never committed; per-environment overrides; rotation procedures documented.

Compliance Readiness
- Logging, retention, and access controls prepared for clinic policy alignment; configurable retention windows.

## 9) Non-Functional Requirements (NFRs)

Performance
- Targets: p95 API latency < 200ms for common reads; dashboard aggregate endpoints < 500ms.
- Caching: Redis for hot aggregates; HTTP caching for list endpoints with ETag.
- DB: proper indexing; pagination-only queries; avoid N+1 via joins and selects.

Reliability & Availability
- Health endpoints for readiness/liveness; graceful shutdown.
- Error handling with retries/backoff for transient failures; idempotent key for critical operations (payments).

Scalability
- Horizontal scale of Nuxt app containers; DB connection pooling; queues for asynchronous jobs.
- Partitioning by organization where needed in aggregation queries.

Observability
- Structured logs (pino); request IDs; metrics for request rate, latency, error rate; optional tracing.
- Alerts on error spikes and queue backlogs.

Maintainability
- Modular code structure; strict typing; linting; unit/integration tests per module.
- Documentation kept current with templates and checklists; CI enforces typecheck and lint.

Security (NFR reiteration)
- Regular dependency updates; vulnerability scans; secret scanning in CI.

## 10) Deployment & Ops

Environments
- Dev: local Nuxt with Docker Compose (Postgres, Redis, Mailpit) and .env configuration.
- Staging/Prod: dokploy via github commit/pull, Postgres managed instances; Redis; SMTP provider.

Configuration & Secrets
- Environment variables per .env/.env.production; never commit secrets; configure DATABASE_URL, Redis URL, SMTP credentials, auth secrets.
- Health & Readiness: /health endpoints; CI builds verify lint/typecheck; migrations run on deploy.

CI/CD
- CI: lint + typecheck on push via GitHub Actions; extend with build and test jobs; add migration check.
- CD: Dokploy orchestrates deploys; image build and rollout; environment variable management.

Backups & Restore
- Nightly Postgres backups; restore scripts validated in staging; retention per clinic policy.

Logging & Monitoring
- Structured app logs; error reporting (Sentry optional); metrics for request rate/latency/error.

## 11) Risk Analysis & Mitigations

Key Risks
- Auth integration complexity and edge cases with org scoping.
- Data model evolution causing migration churn.
- Scheduling conflict detection correctness.
- Billing accuracy and reconciliation.
- i18n/RTL regressions.

Mitigations
- Incremental rollout with feature flags; extensive integration tests.
- Migration discipline: semantic naming, test seeds, roll-forward strategies.
- Deterministic scheduling rules with unit tests; visual conflict indicators.
- Billing validation tests and double-entry checks where applicable.
- Accessibility/i18n testing and QA scenarios for core flows.

## 12) Roadmap & Phasing

Phase 1 (Foundation)
- Auth/RBAC, Drizzle models/migrations, Patients CRUD, Scheduling basics, Invoices/Payments CRUD, Notifications (dev), i18n foundation.

Phase 2 (Clinical & Billing Depth)
- SOAP notes versioning, invoice export PDFs, dunning notifications, reporting dashboards.

Phase 3 (Ops & Observability)
- Advanced metrics, tracing, backup automation, multi-org scaling improvements.

## 13) Validation & Acceptance

Linkage to PRD
- High-priority features addressed by Phase 1 scope; acceptance metrics defined in Section 3.

Operational Validation
- CI passes lint/typecheck; build succeeds; migrations apply cleanly.
- Health endpoints return OK; backups verified in dev.

Security Validation
- Auth/RBAC enforced; permission scenarios tested; secure cookies and CSRF protection enabled.

Internationalization & Accessibility
- FR/AR locales available; RTL verified; components meet basic accessibility checks.

## 7) Role Taxonomy Alignment
Baseline roles for MVP, aligned with PRD and extended for clinic operations:
- Owner (Org-level administration, billing oversight)
- Admin (System administration, role/permission management)
- Manager (Clinic operations management, schedule oversight)
- Practitioner (Clinical documentation, scheduling, billing actions within scope)
- Assistant/Secretary (Front-desk operations, scheduling, patient intake)
- Patient (Portal, appointments, billing visibility)

Notes:
- PRD mentions Secretary and Substitute; Secretary maps to Assistant; Substitute will be implemented as Practitioner with temporary assignment flags.
- Permissions are enforced server-side via RBAC and mirrored in UI gates.

## 8) Rollback Strategy
Deployment Rollback (Dokploy):
- Maintain previous container image versions; use tagged releases (semver) and Dokploy rollback to last stable.
- Database migrations: implement forward-only migrations with companion down scripts for non-destructive changes.
- Backup & Restore: nightly Postgres backups in staging/prod; pre-deploy snapshot for production with restore runbook.
- Feature Flags: gate risky features to allow quick disable without deploy.

Operational Runbook:
- Roll forward on minor fixes; rollback if critical regression detected within first hour post-deploy.
- Health checks: verify SSR and API readiness endpoints; smoke tests post-deploy.

## 9) State Management Decision
- For MVP: use Nuxt composables and local component state; avoid global store.
- Introduce Pinia selectively for cross-view state where justified (e.g., auth/session context).
- Documented composables: useAuth, usePatients, useScheduling, useBilling.

## 10) i18n Implementation Notes
- Nuxt i18n module configured with FR (default) and AR with RTL.
- Locale switcher provided in layout; critical pages to be translated iteratively.
- Accessibility: ensure direction changes update document element and component styles accordingly.

## 11) Object Storage Integration (MinIO)
- Dev environment: MinIO via docker-compose exposed on 9000/9001.
- Use S3-compatible SDK; store only non-PHI or ensure encrypted storage and signed URL access when PHI involved.
- Bucket: kine-attachments; lifecycle policies in staging/prod to be defined.