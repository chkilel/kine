# Quick Start Checklist

## Immediate Next Steps (Week 1)

### 1. Environment Setup

#### Node.js and pnpm Versions

- Node.js: v22.x.x (LTS)
- pnpm: 10.18.0

````bash
# Install additional dependencies
```bash
# Install additional dependencies
pnpm add @better-auth/nuxt drizzle-orm postgres drizzle-kit @pinia/nuxt @nuxtjs/i18n redis pdf-lib nodemailer

# Install dev dependencies
pnpm add -D @types/pg @types/nodemailer
````

### 2. Environment Configuration

```bash
# .env
DATABASE_URL="postgresql://username:password@localhost:5432/kine_app"
REDIS_URL="redis://localhost:6379"
BETTER_AUTH_SECRET="your-secret-key-here"
ENCRYPTION_KEY="your-32-character-encryption-key"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"
```

### 3. Update Nuxt Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@better-auth/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/i18n'
  ],

  // Better Auth configuration
  auth: {
    baseURL: process.env.AUTH_ORIGIN,
    trustedOrigins: [process.env.AUTH_ORIGIN]
  },

  // Internationalization
  i18n: {
    locales: [
      { code: 'fr', iso: 'fr-FR', file: 'fr.json', dir: 'ltr' },
      { code: 'ar', iso: 'ar-MA', file: 'ar.json', dir: 'rtl' }
    ],
    defaultLocale: 'fr',
    strategy: 'prefix_except_default'
  },

  // Runtime config
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY,
    public: {
      authUrl: process.env.AUTH_ORIGIN
    }
  },

  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2024-07-11'
})
```

## 4. Typing Workflow

To ensure type safety and a smooth development experience, follow these guidelines:

- **Run Typecheck Regularly**: Before committing any changes, always run `pnpm run typecheck` to catch type errors early.
- **Understand `tsconfig.json`**: Familiarize yourself with the `tsconfig.json` files in the project, especially the root `tsconfig.json` and the generated `.nuxt/tsconfig.*.json` files. These define the TypeScript compiler options and paths.
- **Global Types**: For global type declarations, create or update `.d.ts` files in the `shared` directory or within specific module directories if the types are module-specific.
- **Nuxt Auto-imports**: Leverage Nuxt's auto-imports for composables and utilities. If you encounter type issues with auto-imports, ensure your `tsconfig.json` includes the `.nuxt/tsconfig.json` reference.
- **Strictness**: The project is configured with strict TypeScript settings. Adhere to these by explicitly typing variables, function arguments, and return values where type inference is not sufficient.
- **Troubleshooting**: If you encounter persistent type errors, try deleting the `.nuxt` and `node_modules` directories and reinstalling dependencies (`pnpm install`), then run `nuxt prepare` and `pnpm run typecheck` again.

## 5. Linting Guidelines

To maintain code quality and consistency, we use ESLint with `@nuxt/eslint` and Prettier. The linting configuration is defined in `.eslintrc.cjs` and `.prettierrc.mjs`. Ensure your code adheres to these standards by running:

- `pnpm run lint`: Checks for linting errors.
- `pnpm run lint --fix`: Automatically fixes most linting errors.
- `pnpm run format`: Formats code using Prettier.

These commands are also integrated into pre-commit hooks to ensure code quality before commits.

## 6. Git Hooks (Husky & lint-staged)

We use [Husky](https://typicode.github.io/husky/) to manage Git hooks and [lint-staged](https://github.com/okonet/lint-staged) to run linters on staged Git files. This ensures that only high-quality code is committed to the repository.

**Bootstrapping Hooks:**

After cloning the repository and installing dependencies, Husky hooks should be automatically set up. If for any reason they are not, you can manually set them up by running:

```bash
pnpm husky install
```

**Pre-commit Hook:**

The `pre-commit` hook is configured to run `lint-staged`. This means that before each commit, the following actions will be performed on your staged files:

- `.js`, `.ts`, `.vue` files will be linted and automatically fixed using ESLint (`eslint --fix`).
- `.js`, `.ts`, `.vue`, `.json`, `.md`, `.yaml` files will be formatted using Prettier (`prettier --write`).

This helps maintain code style and prevents common errors from being committed.

## 7. Developer Workflow

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Type check
pnpm typecheck

# Lint (check and fix)
pnpm lint
pnpm lint --fix

# Format with Prettier
pnpm format
```

## 8. Docker: Local Development

```bash
# Build and run locally
docker compose up --build

# Stop and remove containers
docker compose down
```

- Environment variables for local development are defined in `.env` (see Environment Configuration above).
- The local service is exposed on port `3000` by default as defined in <mcfile name="docker-compose.yml" path="/Users/adil/Dev/01-Projects/02-kine/web-app/docker-compose.yml"></mcfile>.

## 9. Docker: Production

Production build and deployment commands are outlined in the Deployment Checklist:

- See <mcfile name="deployment-checklist.md" path="/Users/adil/Dev/01-Projects/02-kine/web-app/docs/implementation-guide/deployment-checklist.md"></mcfile>
- See deployment strategy in <mcfile name="deployment-strategy.md" path="/Users/adil/Dev/01-Projects/02-kine/web-app/docs/architecture/deployment-strategy.md"></mcfile>

Key commands:

```bash
# Build production image
docker build -t kine-app:latest .

# Bring up production stack (example)
docker compose -f docker-compose.prod.yml up -d
```

## 10. References

- Git Hooks setup: see section above and <mcfile name=".husky/pre-commit" path="/Users/adil/Dev/01-Projects/02-kine/web-app/.husky/pre-commit"></mcfile>
- Docker usage: see sections 8 and 9
- TypeScript workflow: see section 4
- Linting & formatting: see section 5
