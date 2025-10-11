# 10) Deployment & Ops

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
