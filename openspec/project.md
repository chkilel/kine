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
- **CSS**: Nuxt UI base classes first especially for colors and then Tailwind CSS utility classes
- **Naming**: PascalCase for components, camelCase for functions/variables
- **File Organization**: Feature-based structure with clear separation of concerns

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
