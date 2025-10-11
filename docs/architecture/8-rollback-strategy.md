# 8) Rollback Strategy
Deployment Rollback (Dokploy):
- Maintain previous container image versions; use tagged releases (semver) and Dokploy rollback to last stable.
- Database migrations: implement forward-only migrations with companion down scripts for non-destructive changes.
- Backup & Restore: nightly Postgres backups in staging/prod; pre-deploy snapshot for production with restore runbook.
- Feature Flags: gate risky features to allow quick disable without deploy.

Operational Runbook:
- Roll forward on minor fixes; rollback if critical regression detected within first hour post-deploy.
- Health checks: verify SSR and API readiness endpoints; smoke tests post-deploy.
