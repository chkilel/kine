# 4) Tech Stack & Integrations

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
