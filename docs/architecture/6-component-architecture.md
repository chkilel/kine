# 6) Component Architecture

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
