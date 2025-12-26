# Proposal: Add Database Seeding Endpoint

## Summary

Create a backend API endpoint that populates the development database with realistic test data including users, organizations, availability templates, availability exceptions, patients, and treatment plans. Using an API endpoint approach avoids environment compatibility issues since it runs within the same application context.

## Problem

Developers and testers need realistic test data to:

- Test the application's functionality across multiple organizations
- Verify availability conflict detection logic
- Validate treatment plan workflows
- Test patient management features

Currently, there is no automated way to populate the database with test data, requiring manual creation through the UI. A standalone seed script would have environment compatibility issues since it runs outside the application context and needs to make API calls to Better Auth endpoints.

## Proposed Solution

Create a database seeding script that:

1. **Uses Better Auth API** for all Better Auth-related entities (users, organizations, memberships) - not direct DB insertion
2. **Creates 10 users** with a known password (`Password123`)
3. **Creates 3 organizations** using Better Auth API
4. **Creates user-organization memberships** using Better Auth API to distribute users among organizations
5. **Resets database** before running (clears all existing data)
6. **For each user** (via Drizzle ORM, not Better Auth):
   - Creates weekly availability templates (different days/times/locations)
   - Creates availability exceptions (both available and unavailable) with conflict validation
7. **Creates 20 patients** distributed across organizations
8. **For each patient**:
   - Creates at least 3 treatment plans
   - Each treatment plan has a different status
   - One treatment plan is marked as `ongoing` (active)

The script **must be configurable** via constants for quantities (number of users, organizations, patients, etc.).

## Scope

### In Scope

- Backend API endpoint `/api/db/seed` for database seeding
- Uses Better Auth server-side API (not HTTP calls) for users, organizations, and memberships
- Drizzle ORM for non-Better Auth entities (availability templates/exceptions, patients, treatment plans)
- Configurable seed data quantities via constants (users, organizations, patients, etc.)
- Development-only protection (refuses requests in production)
- Seed 10 users with known credentials (configurable)
- Seed 3 organizations using Better Auth (configurable)
- Seed user-organization memberships using Better Auth with distributed users
- Database reset before seeding (clears all existing data)
- Seed weekly availability templates for all users
- Seed availability exceptions with proper conflict detection
- Seed 20 patients across organizations (configurable)
- Seed treatment plans for each patient with mixed statuses

### Out of Scope

- Production database seeding (security risk)
- Direct database insertion for Better Auth entities (users, organizations, memberships)
- Idempotent behavior (skipping existing records)
- Integration with CI/CD pipelines
- Advanced configuration (e.g., JSON/YAML config files)
- Standalone seed script (using tsx or similar)

## Alternatives Considered

### Alternative 1: Standalone Seed Script

**Pros:** Simple to run, doesn't affect application code
**Cons:** Environment compatibility issues (running outside app context), requires HTTP API calls to Better Auth, needs tsx or similar for TypeScript execution

**Decision:** Rejected - The API endpoint approach runs within the same application context, avoiding environment compatibility issues. It can use Better Auth server-side API directly instead of making HTTP calls, making it more reliable and simpler to implement.

### Alternative 2: UI-based Manual Data Creation

**Pros:** Simple, no code changes
**Cons:** Time-consuming, not repeatable, inconsistent data

**Decision:** Rejected - Does not meet the need for repeatable, consistent test data.

### Alternative 3: Standalone Seed Script with HTTP API Calls

**Pros:** Runs independently, doesn't require dev server running
**Cons:** Environment compatibility issues, requires HTTP calls to Better Auth endpoints, needs tsx dependency

**Decision:** Rejected - API endpoint approach is superior because it runs within the same context, can use Better Auth server-side API directly, and avoids all environment-related issues.

### Alternative 3: Faker Library for Dynamic Data

**Pros:** Realistic variety, less hardcoded
**Cons:** Additional dependency, less predictable data

**Decision:** Not initially implemented - Starting with static realistic data for predictability. Can be enhanced in future iterations.

## Dependencies

- Better Auth server-side API for users, organizations, and memberships (already exists)
- Drizzle ORM for non-Better Auth entities (already exists)
- Wrangler CLI for local D1 database (already exists)

## Success Criteria

- API endpoint responds successfully when called in development
- API endpoint refuses requests in production
- Database is reset (cleared) before seeding
- Configurable constants work correctly (can change quantities)
- All 10 users can authenticate with the known password (`Password123`)
- All 3 organizations are created via Better Auth server-side API
- All user-organization memberships are created via Better Auth server-side API
- User distribution across organizations matches 4-3-3 split
- All users have availability templates without conflicts
- All users have availability exceptions without conflicts
- All 20 patients exist across organizations
- Each patient has at least 3 treatment plans
- Each patient has exactly one `ongoing` treatment plan
- All relationships (foreign keys) are valid
- Endpoint can be called multiple times (each call resets database first)

## Risks and Mitigations

| Risk                                                                                | Impact   | Mitigation                                                                            |
| ----------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| Better Auth API authentication during seeding (users, organizations, memberships)   | High     | Use of API directly with proper headers; create helper functions for each entity type |
| Better Auth API rate limiting during sequential calls                               | Medium   | Batch operations where possible; add delays between API calls if needed               |
| Better Auth API response format changes                                             | Medium   | Document expected response format; add error handling for API failures                |
| Database reset accidentally clearing production data                                | Critical | Strict environment check; confirmation prompt before reset                            |
| Data relationship errors (Better Auth entities linking to non-Better Auth entities) | Medium   | Extract IDs from Better Auth API responses before using in Drizzle inserts            |
| Password hashing not handled correctly                                              | High     | Rely on Better Auth API which handles hashing internally                              |

## Open Questions

1. **Better Auth Server-side API**: Need to verify the Better Auth server-side API methods for:
   - User creation
   - Organization creation
   - Membership creation
   - How to use these methods directly without HTTP calls within a Nitro endpoint

2. **Database Reset Method**: Should the reset use DELETE statements or drop/recreate tables? Need to check foreign key constraints.
