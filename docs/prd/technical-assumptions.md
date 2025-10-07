# Technical Assumptions

## Repository Structure: Unified Nuxt 4 application

The project will be structured as a unified Nuxt 4 application, where both the frontend and backend (via Nitro server routes) coexist in a single codebase. This approach allows:
- Shared TypeScript configuration and consistent linting across the entire app
- Seamless coordination between client and server deployments
- Centralized dependency management with a single package tree
- A unified CI/CD pipeline handling build, test, and deployment from one place

## Service Architecture

**Unified Nuxt 4 Architecture with Clear Layer Separation**:
The application will follow a monolithic structure built entirely within the Nuxt 4 framework, leveraging its full-stack capabilities while maintaining clean boundaries between layers:
- Frontend — Nuxt 4 pages, layouts, and components handling UI and UX
- Backend API — implemented through Nitro server routes with modular middleware and service layers
- Database layer — powered by PostgreSQL using Drizzle ORM for schema management and type-safe queries
- Authentication — integrated via better-auth (with organization and admin plugins) to support multi-tenant identity and access control


## Testing Requirements

**Full Testing Pyramid** with comprehensive test coverage:
- **Unit Tests**: 80%+ coverage for business logic and utilities
- **Integration Tests**: API endpoints, database interactions, and service integrations
- **E2E Tests**: Critical user workflows using Playwright or Cypress
- **Manual Testing**: UX validation and complex clinical workflow testing
- **Accessibility Testing**: Automated and manual accessibility verification

## Additional Technical Assumptions and Requests

1. **Database**: PostgreSQL with row-level security for multi-tenant data isolation
2. **ORM**: Drizzle ORM for type-safe database interactions and migrations
3. **Authentication**: better-auth with Organization and Admin plugins for multi-tenant user management
4. **State Management**: Pinia for Vuex-style state management in Nuxt.js
5. **Validation**: Zod v4 for runtime type validation and schema definitions
6. **Caching**: Redis for session storage and performance optimization
7. **PDF Generation**: Library for generating professional invoices and reports
8. **Email Service**: Transactional email provider for reminders and notifications
9. **Internationalization**: Vue I18n for French and Arabic language support
10. **UI Framework**: Nuxt UI v4 component library for consistent design system
11. **Code Style**: English identifiers with French UI copy, ESLint and Prettier for consistency
12. **Deployment**: The application will be self-hosted and deployed using Dokploy, leveraging its Docker-based environment for containerized services
