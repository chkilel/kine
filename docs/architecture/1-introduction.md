# 1) Introduction
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
