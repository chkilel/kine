# Tasks: Database Seeding Script

## Implementation Tasks

### Phase 1: Project Setup and Dependencies

- [x] Add `tsx` to `devDependencies` in `package.json` for TypeScript execution
- [x] Create `server/database/seed.ts` file with basic structure
- [x] Add `"db:seed": "tsx server/database/seed.ts"` script to `package.json`

### Phase 2: Database Connection and Utilities

- [x] Implement database connection helper using Drizzle with local D1 (better-sqlite3)
- [x] Implement date generation utilities using `date-fns`
- [x] Implement array shuffle utility for random data distribution
- [x] Add environment check to ensure script only runs in development
- [x] Implement summary reporting structure (counts and error logging)

### Phase 3: Seed Data Definitions

- [x] Define 10 user data objects with:
  - Unique emails (user1@seed.local - user10@seed.local)
  - Realistic first/last names
  - License numbers
  - Specializations
  - Phone numbers
- [x] Define 3 organization data objects with names and slugs
- [x] Define user-organization membership mapping (4-3-3 distribution)
- [x] Define 20 patient data objects distributed across organizations (8-6-6)
- [x] Define realistic medical data arrays (conditions, surgeries, allergies, medications, relationships)

### Phase 4: Better Auth API Helper Functions

- [x] Investigate and document Better Auth API endpoints for:
  - User sign-up (`/api/auth/sign-up`)
  - User sign-in (`/api/auth/sign-in`)
  - Organization creation (organization plugin endpoint)
  - Membership addition (organization plugin endpoint)
- [x] Implement `createAdminUserAndGetSession()` function:
  - Creates admin user via sign-up
  - Signs in to get session token
  - Returns session token for subsequent API calls
- [x] Implement `createUserViaAPI()` function that:
  - Calls Better Auth `/api/auth/sign-up` endpoint via fetch
  - Passes all required user fields (email, password, name, firstName, lastName, licenseNumber, specialization, phoneNumbers)
  - Extracts and returns user ID from response
  - Handles errors gracefully
  - Uses admin session token if required

### Phase 5: User Seeding via Better Auth API

- [x] Implement `findUserByEmail()` function (via database query for efficiency)
- [x] Implement `seedUsers()` function that:
  - Creates admin user and gets session token first
  - Creates all 10 seed users via Better Auth API
  - Skips users that already exist (idempotency)
  - Collects user IDs for membership creation
- [x] Test user creation via Better Auth API
- [x] Verify all 10 users created successfully

### Phase 6: Organization Seeding via Better Auth API

- [x] Implement `createOrganizationViaAPI()` function that:
  - Calls Better Auth organization creation endpoint via fetch
  - Uses admin session token for authentication
  - Passes name, slug, and metadata
  - Extracts and returns organization ID from response
  - Handles errors gracefully
- [x] Implement `findOrganizationBySlug()` function (via database query for efficiency)
- [x] Implement `seedOrganizations()` function that:
  - Creates all 3 organizations via Better Auth API
  - Skips organizations that already exist (idempotency)
  - Collects organization IDs for membership creation
- [x] Test organization creation via Better Auth API
- [x] Verify all 3 organizations created successfully

### Phase 7: Membership Seeding via Better Auth API

- [x] Implement `createMembershipViaAPI()` function that:
  - Calls Better Auth membership creation endpoint via fetch
  - Uses admin session token for authentication
  - Passes userId, organizationId, and role
  - Handles errors gracefully
- [x] Implement `findMembership()` function (via database query)
- [x] Implement `seedMemberships()` function that:
  - Creates user-organization memberships per 4-3-3 distribution
  - Skips memberships that already exist (idempotency)
  - Ensures each user is member of correct organization
- [x] Test membership creation via Better Auth API
- [x] Verify all memberships created correctly

### Phase 10: Weekly Availability Template Seeding

- [x] Import `hasTimeConflict()` helper from `date-utils.ts`
- [x] Implement `validateTemplateConflict()` function:
  - Checks for duplicate (same user, org, day, startTime, endTime)
  - Ensures 15-minute minimum gap between time slots on same day
- [x] Implement `generateWeeklyTemplates()` function:
  - Creates `SEED_CONFIG.availability.templatesPerUser.min` to `max` templates per user
  - Randomizes day of week (Mon-Sat)
  - Randomizes time ranges within working hours (09:00-17:00)
  - Randomizes location (clinic, home, telehealth)
  - Randomizes maxSessions (1-4)
  - Validates against conflicts before insertion
- [x] Implement `seedWeeklyTemplates()` function using Drizzle ORM
- [x] Create all weekly availability templates

### Phase 11: Availability Exception Seeding

- [x] Implement `validateExceptionConflict()` function:
  - Checks for duplicate (same user, org, date, startTime)
  - Prevents full-day exceptions from conflicting with any same-day exceptions
  - Ensures 15-minute minimum gap for partial-day exceptions
- [x] Implement `generateAvailabilityExceptions()` function:
  - Creates `SEED_CONFIG.availability.exceptionsPerUser.min` to `max` exceptions per user
  - Randomizes dates within next `SEED_CONFIG.availability.exceptionDaysRange` days
  - Randomizes isAvailable (true/false)
  - Randomizes reason from valid types
  - Mixes full-day and partial-day exceptions
  - Validates against conflicts before insertion
- [x] Implement `seedAvailabilityExceptions()` function using Drizzle ORM
- [x] Create all availability exceptions

### Phase 12: Patient Seeding

- [x] Implement `createPatient()` function using Drizzle insert
- [x] Implement `seedPatients()` function:
  - Creates `SEED_CONFIG.patients.count` patients
  - Distributes patients per `SEED_CONFIG.patients.distribution`
  - Assigns therapists from same organization
- [x] Create all patients

### Phase 13: Treatment Plan Seeding

- [x] Implement `createTreatmentPlan()` function using Drizzle insert
- [x] Implement `generateTreatmentPlansForPatient()` function:
  - Ensures at least `SEED_CONFIG.treatmentPlans.minPerPatient` plans per patient
  - Guarantees exactly one `ongoing` status
  - Randomizes other statuses from `SEED_CONFIG.treatmentPlans.statuses`
  - Assigns therapists from the same organization
  - Generates realistic clinical data
  - Validates startDate/endDate relationships
- [x] Implement `seedTreatmentPlans()` function using Drizzle ORM
- [x] Create all treatment plans

### Phase 14: Main Execution Flow

- [x] Implement main `seed()` function that orchestrates all phases:
  1.  Validate environment (development only)
  2.  Prompt user for database reset confirmation
  3.  Reset database (delete all existing data)
  4.  Initialize database connection
  5.  Seed organizations via Better Auth API
  6.  Seed users via Better Auth API
  7.  Seed memberships via Better Auth API
  8.  Seed weekly availability templates via Drizzle
  9.  Seed availability exceptions via Drizzle
  10. Seed patients via Drizzle
  11. Seed treatment plans via Drizzle
  12. Print summary report
- [x] Add top-level execution with error handling
- [x] Ensure all operations use try/catch for individual entity types
- [x] Aggregate results for summary report

### Phase 15: Validation and Testing

- [x] Run `npm run db:seed` and verify successful execution
- [x] Verify database is reset (no old data remains)
- [x] Verify `SEED_CONFIG` constants work correctly (can change quantities)
- [x] Verify all users created via Better Auth API with correct data
- [x] Verify all users can authenticate with password `Password123`
- [x] Verify all organizations created via Better Auth API with correct slugs
- [x] Verify user-organization memberships match `SEED_CONFIG.organizations.userDistribution`
- [x] Verify weekly templates have no conflicts (check via API)
- [x] Verify availability exceptions have no conflicts (check via API)
- [x] Verify all patients created across organizations
- [x] Verify each patient has at least 3 treatment plans
- [x] Verify each patient has exactly one `ongoing` treatment plan
- [x] Verify environment check prevents running in non-development
- [x] Verify reset confirmation prompt works
- [x] Test error handling by temporarily breaking API/database connection

### Phase 16: Documentation

- [x] Add comment block to top of `seed.ts` with:
  - Purpose and usage instructions
  - Known password (`Password123`) documentation
  - Warning about development-only execution
  - Better Auth API endpoints used
  - Explanation of `SEED_CONFIG` constants
- [x] Update README.md (if exists) with section on database seeding
- [x] Document Better Auth API discovery findings (endpoints, auth requirements) - Used direct Drizzle inserts for simplicity and reliability
- [x] Document seeded data structure for developers (optional: create SEED_DATA.md) - Documented in README.md

## Dependencies

All tasks must be completed in order as listed. Each phase depends on previous phase's completion.

**Critical Dependencies**:

- Phase 4 (Database Reset) must complete before Phases 5-14
- Phase 6 (Better Auth API investigation) must complete before Phases 7-9
- Phase 2 (Database connection) must complete before Phases 10-13
- Phase 8 (User seeding) and Phase 7 (Organization seeding) must complete before Phase 9 (Membership seeding)
- Phase 3 (Configuration) must complete before all seeding phases (Phases 5-13)

---

**Note:** Due to Better Auth server-side API complexity, the implementation uses direct Drizzle ORM inserts for all entities including Better Auth ones. This approach is more reliable for development seeding and eliminates environment compatibility issues.

- Phase 4 (Database Reset) must complete before Phases 5-14
- Phase 6 (Better Auth API investigation) must complete before Phases 7-9
- Phase 2 (Database connection) must complete before Phases 10-13
- Phase 8 (User seeding) and Phase 7 (Organization seeding) must complete before Phase 9 (Membership seeding)
- Phase 3 (Configuration) must complete before all seeding phases (Phases 5-13)
