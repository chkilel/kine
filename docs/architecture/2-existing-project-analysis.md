# 2) Existing Project Analysis
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
