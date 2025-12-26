# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

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

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

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
