# 7) API Design

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
