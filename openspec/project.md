# Project Context

## Purpose

Kine is a comprehensive physical therapy clinic management web application designed to streamline patient care, treatment planning, and clinic operations. The system serves multi-tenant physical therapy clinics with features for patient management, treatment tracking, document handling, billing, and analytics.

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3, TypeScript, Tailwind CSS via Nuxt UI
- **Backend**: Nitro (Nuxt's server engine) on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Authentication**: Better Auth with organization support
- **File Storage**: Cloudflare R2 (S3-compatible)
- **Package Manager**: pnpm
- **Deployment**: Cloudflare Workers with Wrangler

## Project Conventions

### Code Style

- **Formatting**: Prettier with 2-space tabs, single quotes, 120 character width
- **TypeScript**: Strict mode enabled
- **Vue**: Composition API with `<script setup lang='ts'>` syntax
- **Nuxt**: Leverage Nuxt's powerful features such as auto-imports, modules, and its seamless integration with the Vue ecosystem to enhance developer productivity and maintainability.
- **CSS**: Prioritize the use of Nuxt UI's base classes, especially for consistent color schemes and design language, before utilizing Tailwind CSS utility classes for additional customization and layout adjustments.
- **Tailwind CSS**: Prioritize the use of Nuxt UI's design system components and utility classes for styling. Avoid custom colors or styles that deviate from the Nuxt UI design language to ensure consistency and maintainability.
- **Naming**: PascalCase for components, camelCase for functions/variables
- **File Organization**: Feature-based structure with clear separation of concerns
- **API calls**: UseFetch and useAsyncData whenever is possible

### Nuxt Directory Structure
Kine Project Structure:

```
├── nuxt.config.ts        # Main Nuxt config
├── .nuxtrc               # Alternative config syntax
├── .nuxtignore           # Ignore files during build
├── app/                  # Core of the application
│   ├── assets/           # Build-processed assets
│   ├── components/       # Vue components
│   ├── composables/      # Reusable composables
│   ├── layouts/          # Page layouts
│   ├── middleware/       # Client-side route guards
│   ├── pages/            # File-based routing
│   ├── plugins/          # Vue plugins
│   ├── utils/            # App utilities
│   ├── app.config.ts     # Reactive app config
│   ├── app.vue           # Root component
│   └── error.vue         # Error page
├── public/               # Static files served as-is
├── server/               # Server-side logic (Nitro)
│   ├── api/              # API endpoints
│   ├── routes/           # Server routes (e.g. sitemap)
│   ├── middleware/       # Server middleware
│   ├── plugins/          # Server plugins
│   └── utils/            # Server utilities
├── shared/               # Code shared between client/server
├── content/              # Markdown CMS (Nuxt Content)
└── modules/              # Local Nuxt modules


### Architecture Patterns

- **Multi-tenant SaaS**: Organization-based data isolation
- **Soft-delete**: Data retention patterns with deleted_at timestamps
- **Type-safe APIs**: Zod validation for request/response schemas
- **Component-based**: Modular Vue components with clear props/events
- **Database Indexing**: Comprehensive indexing strategy for performance
- **File Upload**: Direct R2 uploads with signed URLs

### Testing Strategy

- No explicit testing framework currently configured
- Manual testing through development workflow
- Type safety provides compile-time error checking

### Git Workflow

- **Semantic Commits**: Conventional commit format
- **Commit Types**: feat, fix, docs, style, refactor, test, chore
- **Branching**: Feature branches from main
- **Code Review**: Pull requests for significant changes

## Domain Context

### Physical Therapy Clinic Operations

- **Patient Management**: Comprehensive medical records, treatment history, consultations
- **Treatment Planning**: Custom treatment plans with progress tracking
- **Document Management**: Categorized medical documents (referrals, imaging, lab results, treatment notes, prescriptions)
- **Billing & Insurance**: Insurance tracking and billing workflows
- **Analytics**: Dashboard with charts and performance metrics

### Regional Considerations

- **Locale**: French-speaking regions (evident from French locale in Zod schemas)
- **Medical Standards**: Compliance with physical therapy practice standards
- **Data Privacy**: Patient confidentiality and medical data protection

### User Roles

- **Clinic Administrators**: Organization management, member access
- **Therapists**: Patient care, treatment planning, documentation
- **Staff**: Billing, scheduling, administrative tasks

## Important Constraints

- **Multi-tenancy**: Strict data isolation between organizations
- **Medical Data**: HIPAA-like compliance for patient information
- **Performance**: Optimized for Cloudflare Workers edge deployment
- **Scalability**: Designed to handle multiple clinics and high patient volumes
- **Data Retention**: Soft-delete patterns for audit trails

## External Dependencies

- **Cloudflare Workers**: Serverless compute platform
- **Cloudflare D1**: SQLite-compatible serverless database
- **Cloudflare R2**: S3-compatible object storage
- **Better Auth**: Authentication and authorization service
- **Nuxt UI**: Component library for consistent UI
- **Drizzle ORM**: Type-safe database operations

## Database Schema Highlights

- **Organizations**: Multi-tenant container with billing and settings
- **Users**: Authentication and role-based access control
- **Patients**: Comprehensive patient records with medical history
- **Treatment Plans**: Structured treatment programs with goals and progress
- **Documents**: File storage with categorization and metadata
- **Sessions**: Consultation tracking with notes and outcomes

## API Patterns

- **RESTful Design**: Standard HTTP methods and status codes
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **Authentication**: JWT-based with organization context
- **File Operations**: Signed URLs for secure uploads/downloads
