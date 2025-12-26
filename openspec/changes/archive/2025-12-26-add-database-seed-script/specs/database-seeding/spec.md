# Spec: Database Seeding

## Overview

The database seeding script MUST use a hybrid approach:

- **Better Auth API**: For all Better Auth-related entities (users, organizations, memberships)
- **Drizzle ORM**: For application-specific entities (availability templates/exceptions, patients, treatment plans)

This ensures that authentication, authorization, and organization membership logic is properly tested through the actual API endpoints.

## ADDED Requirements

### Requirement: Database Seeding Script Exists

The system SHALL provide a database seeding script that can be executed to populate the development database with test data. The script MUST be executable via an npm command. The script MUST use Better Auth API for Better Auth entities and Drizzle ORM for other entities.

#### Scenario: Developer runs seed script

**Given** the project is in development environment
**And** the local D1 database is available
**When** the developer runs `npm run db:seed`
**Then** the script should execute successfully
**And** a summary of seeded data should be displayed

---

### Requirement: User Seeding via Better Auth

The seeding script SHALL create users using the Better Auth API (not direct database insertion), with consistent credentials for testing. The script MUST create exactly 10 users with a known password. Users SHALL be created via the `/api/auth/sign-up` endpoint.

#### Scenario: Create 10 users with known password

**Given** the seed script is executed
**When** creating users
**Then** 10 users should be created
**And** each user should have the password `Password123`
**And** users should be created via Better Auth `/api/auth/sign-up` endpoint
**And** each user should have unique email addresses (e.g., `user1@seed.local`, `user2@seed.local`, etc.)
**And** each user should have realistic profile data (firstName, lastName, licenseNumber, specialization, phoneNumbers)

#### Scenario: Users can authenticate with seeded credentials

**Given** the seed script has created 10 users via Better Auth API
**When** a user logs in with their seeded email and password `Password123`
**Then** authentication should succeed
**And** the user should receive a valid session
**And** the session should include the user's Better Auth profile data

---

### Requirement: Organization Seeding via Better Auth

The seeding script SHALL create 3 organizations using the Better Auth API (not direct database insertion) and MUST distribute users among them as members. Each organization MUST have a unique slug. Organizations SHALL be created via the Better Auth organization plugin API.

#### Scenario: Create 3 organizations via Better Auth API

**Given** the seed script is executed
**And** an admin session is available for Better Auth API authentication
**When** creating organizations via Better Auth organization plugin API
**Then** 3 organizations should be created with unique names and slugs
**And** organization names should be descriptive (e.g., "Kine Clinic A", "Kine Clinic B", "Kine Clinic C")
**And** organizations should be created via authenticated Better Auth API calls

#### Scenario: Distribute users across organizations via Better Auth API

**Given** 10 users have been created via Better Auth API
**And** 3 organizations have been created via Better Auth API
**And** an admin session is available for Better Auth API authentication
**When** creating user-organization memberships via Better Auth organization plugin API
**Then** users should be distributed as members:

- Organization 1: 4 users
- Organization 2: 3 users
- Organization 3: 3 users
  **And** each membership should have the appropriate role (e.g., 'member' or 'admin')
  **And** memberships should be created via authenticated Better Auth API calls

---

### Requirement: Weekly Availability Template Seeding

The seeding script SHALL create weekly availability templates for each user and MUST respect conflict detection rules. Each user MUST have 3-5 templates (configurable via constants). The script SHALL maintain a 15-minute minimum gap between time slots.

#### Scenario: Create weekly templates for each user

**Given** users have been created and assigned to organizations
**When** creating weekly availability templates
**Then** each user should have 3-5 weekly templates
**And** templates should cover different days of the week (Mon-Sat)
**And** templates should have realistic time ranges (e.g., 09:00:00 - 12:00:00)
**And** templates should have valid locations (clinic, home, or telehealth)
**And** templates should have reasonable maxSessions values (1-4)

#### Scenario: Template conflict detection prevents duplicates

**Given** a user already has a weekly template for Monday 09:00:00 - 12:00:00
**When** attempting to create another template for the same user on Monday 09:00:00 - 12:00:00
**Then** the duplicate should be skipped (idempotent behavior)
**Or** an error should be logged and the script should continue

#### Scenario: Template maintains minimum time gap

**Given** a user has a template for Monday 09:00:00 - 12:00:00
**When** creating another template for Monday
**Then** the new template's start time should be at least 15 minutes after the existing template's end time
**Or** the times should be sufficiently separated to avoid conflicts

---

### Requirement: Availability Exception Seeding

The seeding script SHALL create availability exceptions for each user and MUST implement proper conflict detection. Each user MUST have 2-4 exceptions (configurable via constants). The script SHALL prevent full-day exceptions from conflicting with same-day exceptions. Exception date range SHALL be configurable via constants.

#### Scenario: Create availability exceptions for each user

**Given** users have weekly availability templates
**When** creating availability exceptions
**Then** each user should have 2-4 exceptions
**And** exceptions should be within the next 3 months from current date
**And** exceptions should include a mix of available (isAvailable: true) and unavailable (isAvailable: false) types
**And** exceptions should have valid reasons (vacation, holiday, sick, training, meeting, personal, reduced_hours, other)
**And** some exceptions should be full-day (no startTime/endTime)
**And** some exceptions should be partial-day (with startTime/endTime)

#### Scenario: Exception conflict detection prevents overlaps

**Given** a user has a full-day exception on 2025-01-15
**When** attempting to create any exception on 2025-01-15
**Then** the conflicting exception should be skipped
**Or** the conflict should be logged and the script should continue

#### Scenario: Partial-day exceptions maintain minimum gap

**Given** a user has a partial-day exception from 09:00:00 - 12:00:00 on 2025-01-16
**When** creating another partial-day exception on 2025-01-16
**Then** the new exception should start at least 15 minutes after the existing exception ends
**Or** the times should be sufficiently separated to avoid conflicts

---

### Requirement: Patient Seeding

The seeding script SHALL create 20 patients distributed across organizations with realistic demographic and medical information. Patients MUST be assigned to therapists from the same organization. The number of patients SHALL be configurable via constants.

#### Scenario: Create 20 patients

**Given** organizations have been created
**When** creating patients
**Then** 20 patients should be created
**And** patients should be distributed across organizations:

- Organization 1: 8 patients
- Organization 2: 6 patients
- Organization 3: 6 patients
  **And** each patient should have realistic personal information (firstName, lastName, dateOfBirth, gender, phone, address)
  **And** each patient should have medical information (medicalConditions, surgeries, allergies, medications)
  **And** each patient should have emergency contacts with valid relationship types
  **And** each patient should have a valid status (active, inactive, discharged, or archived)

#### Scenario: Patients can be assigned to therapists

**Given** patients have been created in organizations
**And** users (therapists) are members of the same organizations
**When** assigning therapists to treatment plans
**Then** each patient should be assigned therapists from the same organization
**And** therapist assignments should be balanced across available users in each organization

---

### Requirement: Treatment Plan Seeding

The seeding script SHALL create at least 3 treatment plans for each patient and MUST ensure different statuses with exactly one active plan. Each patient MUST have exactly one treatment plan with status `ongoing`.

#### Scenario: Create treatment plans for each patient

**Given** 20 patients have been created
**When** creating treatment plans
**Then** each patient should have at least 3 treatment plans
**And** each treatment plan should have a valid status (planned, ongoing, completed, paused, cancelled)
**And** each treatment plan should have realistic clinical information (title, diagnosis, objective, startDate, endDate, numberOfSessions, sessionFrequency)
**And** each treatment plan should be assigned to a therapist from the same organization
**And** each treatment plan should have valid coverageStatus (if applicable)

#### Scenario: Each patient has exactly one active treatment plan

**Given** a patient has multiple treatment plans
**When** reviewing the treatment plans
**Then** exactly one treatment plan should have status `ongoing`
**And** the other plans should have different statuses (planned, completed, paused, or cancelled)
**And** there should be no duplicate statuses among a patient's treatment plans

#### Scenario: Treatment plan relationships are valid

**Given** treatment plans have been created
**When** validating relationships
**Then** all treatment plans should have valid patientId references
**And** all treatment plans should have valid organizationId references
**And** all treatment plans should have valid therapistId references (or null if therapist was deleted)
**And** startDate should be before or equal to endDate (if endDate exists)

---

### Requirement: Database Reset Before Seeding

The seeding script MUST reset (clear) the database before running to ensure a clean slate. The script MUST verify it is running in a development environment before resetting. The script SHOULD require user confirmation before resetting the database.

#### Scenario: Reset database before seeding

**Given** the seed script is executed
**When** the script starts
**Then** it should reset (delete all data from) the database
**And** it should verify the environment is development only
**And** it should require user confirmation before proceeding with the reset

#### Scenario: Development environment safety check

**Given** the seed script is executed
**When** the script starts
**Then** it should verify it's running in a development environment
**And** if not in development, the script should refuse to run with a clear error message

---

### Requirement: Error Handling and Reporting

The seeding script SHALL handle errors gracefully and MUST provide clear feedback about the seeding process. The script MUST display a summary report after execution showing counts of created entities and any errors encountered.

#### Scenario: Summary report after successful execution

**Given** the seed script completes successfully
**When** the script finishes
**Then** a summary report should be displayed including:

- Number of users created
- Number of organizations created
- Number of memberships created
- Number of weekly templates created
- Number of availability exceptions created
- Number of patients created
- Number of treatment plans created

#### Scenario: Error reporting for failed operations

**Given** an error occurs during seeding
**When** the error is encountered
**Then** the error should be logged with sufficient context
**And** the script should continue with subsequent operations (if non-critical)
**And** a summary should include count of errors encountered
**And** each error should indicate which entity type failed

---

### Requirement: NPM Script Integration

The seeding script SHALL be easily executable via an npm script. The command `npm run db:seed` MUST execute the seeding script with TypeScript support.

#### Scenario: Execute seed script via npm

**Given** the project has been set up
**When** the developer runs `npm run db:seed`
**Then** the seed script should execute
**And** the script should run with TypeScript support (via tsx or similar)
**And** any necessary dependencies should be declared in package.json
