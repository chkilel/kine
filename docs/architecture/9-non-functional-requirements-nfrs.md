# 9) Non-Functional Requirements (NFRs)

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
