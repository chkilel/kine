# 8) Security & Compliance

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
