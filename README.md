# Kine - Physical Therapy Clinic Management

A comprehensive physical therapy clinic management web application designed to streamline patient care, treatment planning, and clinic operations. Built as a multi-tenant SaaS solution for physical therapy clinics.

## Features

- **Multi-tenant SaaS**: Organization-based data isolation for multiple clinics
- **Patient Management**: Comprehensive medical records, treatment history, and consultations
- **Treatment Planning**: Custom treatment plans with goals and progress tracking
- **Scheduling**: Availability management, booking, and conflict detection
- **Document Management**: Categorized medical documents (referrals, imaging, lab results, notes, prescriptions)
- **Billing & Insurance**: Insurance tracking and billing workflows
- **Analytics**: Dashboard with charts and performance metrics
- **Role-based Access**: Clinic administrators, therapists, and staff roles

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3, TypeScript, Tailwind CSS, Nuxt UI
- **Backend**: Nitro (Nuxt's server engine) on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Authentication**: Better Auth with organization support
- **File Storage**: Cloudflare R2 (S3-compatible)
- **Testing**: Vitest for unit testing
- **Package Manager**: pnpm
- **Deployment**: Cloudflare Workers with Wrangler

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
  bun run dev
```

## Testing

Run unit tests for shared utilities and business logic:

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage
```

Tests are located in `shared/utils/*.spec.ts` and aim for >90% coverage on critical business logic.

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
  bun run preview
```

## Deployment

This project is designed for Cloudflare Workers deployment:

```bash
# Build and deploy to Cloudflare Workers
pnpm deploy
```

The application uses:

- **Cloudflare Workers** for serverless compute
- **Cloudflare D1** for SQLite database
- **Cloudflare R2** for file storage

Configure Wrangler settings in `wrangler.jsonc` for your environment.

## Database Seeding (Development Only)

This project includes a development database seeding endpoint to populate your local database with realistic test data.

**Important:** This endpoint is only available in development environment for security reasons.

### Usage

```bash
# Start the development server
npm run dev

# In a separate terminal, seed the database
curl -X POST http://localhost:3000/api/db/seed
```

### Seeded Data

The seed endpoint creates the following test data:

- **10 users** with email addresses like `user1@seed.local` to `user10@seed.local`
- **3 organizations** (`Kine Clinic A`, `Kine Clinic B`, `Kine Clinic C`)
- **10 memberships** distributing users across organizations (4-3-3 split)
- **20 patients** with realistic Moroccan names and medical data
- **60 treatment plans** (3 per patient with mixed statuses)
- **42 weekly availability templates** (3-5 per user)
- **28 availability exceptions** (2-4 per user)

### Known Credentials

All seeded users have the same password for testing purposes:

```
Password: Password123
```

### Configuration

You can modify seed data quantities by editing the `SEED_CONFIG` constant at the top of `server/api/db/seed.post.ts`:

```typescript
const SEED_CONFIG = {
  users: {
    count: 10,
    password: 'Password123',
    adminEmail: 'admin@seed.local'
  },
  organizations: {
    count: 3,
    names: [...],
    userDistribution: [4, 3, 3]
  },
  // ... and more
}
```

### Response

The endpoint returns a JSON response with creation summary:

```json
{
  "success": {
    "users": 10,
    "organizations": 3,
    "memberships": 10,
    "patients": 20,
    "treatmentPlans": 60,
    "weeklyTemplates": 42,
    "availabilityExceptions": 28
  },
  "errors": []
}
```

### Features

- **Database Reset:** Clears all existing data before seeding
- **Conflict Detection:** Ensures availability templates and exceptions don't overlap
- **Distribution:** Automatically distributes patients and users across organizations
- **Status Variety:** Creates treatment plans with mixed statuses (planned, ongoing, completed, paused, cancelled)
- **Guaranteed Active Plan:** Each patient has exactly one `ongoing` treatment plan
- **Development Protection:** Refuses all requests in non-development environments
