# Technical Assumptions

## Unified Nuxt 4 Architecture with Clear Layer Separation

**Monolithic Full-Stack Structure**: The application will follow a unified monolithic structure built entirely within the Nuxt 4 framework, leveraging its enhanced full-stack capabilities while maintaining clean architectural boundaries between distinct layers.

**Frontend Layer**: Nuxt 4 pages, layouts, and components handling all UI and UX interactions, utilizing the enhanced Vue.js composition API and improved server-side rendering capabilities for optimal performance.

**Backend API Layer**: Implemented through Nitro server routes with modular middleware and service layers, providing clean separation of concerns and maintainable API architecture within the Nuxt ecosystem.

**Database Layer**: Powered by PostgreSQL using Drizzle ORM for schema management and type-safe queries, ensuring robust data integrity and developer experience with compile-time query validation.

**Authentication System**: Integrated via better-auth with organization and admin plugins to support multi-tenant identity and access control, enabling role-based permissions across different practice environments.

## Technology Stack Integration

**Framework Foundation**: Nuxt 4 with enhanced TypeScript support, leveraging the latest Vue.js features and improved developer experience tools.
**Database**: PostgreSQL with row-level security for multi-tenant data isolation
**ORM**: Drizzle ORM for type-safe database operations, automated migrations, and robust relational data management
**Authentication Architecture**: better-auth implementation with organization plugin for multi-practice support and admin plugin for comprehensive user management and role-based access control.
**Server Infrastructure**: Nitro-powered server routes with middleware layers for authentication, validation, and business logic separation, maintaining clean API architecture.
**State Management**: Pinia for Vuex-style state management in Nuxt.js
**Validation**: Zod v4 for runtime type validation and schema definitions
**Caching**: Redis for session storage and performance optimization
**PDF Generation**: Library for generating professional invoices and reports
**Email Service**: Transactional email provider for reminders and notifications
**Internationalization**: Vue I18n for French and Arabic language support
**UI Framework**: Nuxt UI v4 component library for consistent design system

## Development and Deployment

**Type Safety**: End-to-end TypeScript implementation with Drizzle's type-safe queries ensuring compile-time validation across the entire application stack.
**Modular Architecture**: Clear service layer separation within Nitro server routes, enabling maintainable business logic and easy testing of individual components.
**Multi-Tenant Support**: better-auth organization plugin enabling future expansion to multiple physiotherapy practices with isolated data and user management.
**Performance Optimization**: Nuxt 4's enhanced SSR capabilities and optimized build system for fast loading times and improved user experience.
**Code Style**: English identifiers with French UI copy, ESLint and Prettier for consistency
**Deployment**: The application will be self-hosted and deployed using Dokploy, no need for any production environment, for dev provide docker-compose file for local setup (including database, cache, minio for file storage, and email service).

---
