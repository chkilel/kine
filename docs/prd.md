# Product Requirements Document (PRD)
## Physiotherapy Practice Management App v2

**Document Version**: 1.0
**Last Updated**: October 2025
**Product Manager**: AI Assistant
**Project**: Kine Web App

---

## Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0 | Oct 2025 | Initial PRD creation based on project brief | PM Agent |

---

## Goals and Background Context

### Product Vision
Transform physiotherapy practice management through a comprehensive, user-friendly digital platform that streamlines administrative workflows, enhances patient care delivery, and provides robust business management capabilities for modern healthcare practices.

### Business Context
This represents the second iteration (v2) of a physiotherapy practice management system, building upon lessons learned from the previous version. The application addresses the critical need for integrated practice management that combines patient care, scheduling, clinical documentation, and financial management in a single, cohesive platform.

### Primary Goals
1. **Operational Efficiency**: Reduce administrative burden by 40% through streamlined workflows and automated processes
2. **Patient Experience**: Improve patient satisfaction through better communication, scheduling flexibility, and reduced wait times
3. **Clinical Quality**: Enhance treatment outcomes through comprehensive patient tracking, assessment tools, and treatment plan management
4. **Financial Management**: Provide clear visibility into practice finances with automated billing, payment tracking, and outstanding balance management
5. **Compliance & Security**: Ensure GDPR compliance and healthcare data protection standards throughout all system interactions

### Success Metrics
- **User Adoption**: 90% daily active usage within 3 months of deployment
- **Efficiency Gains**: 40% reduction in administrative task completion time
- **Patient Satisfaction**: Improved appointment scheduling satisfaction scores
- **Financial Visibility**: 100% accuracy in billing and payment tracking
- **Compliance**: Zero GDPR violations and full audit trail maintenance

---

## Requirements

### Functional

**FR1:** The system shall authenticate users with secure login credentials and maintain session security with automatic logout on inactivity.

**FR2:** The system shall support multi-user access with role-based permissions (Owner/Practitioner/Secretary/Assistant/Substitute).

**FR3:** The system shall manage comprehensive patient records including demographics, medical conditions, allergies, referring physician information, and document uploads.

**FR4:** The system shall provide calendar functionality with day/week/month views for appointment scheduling, editing, and cancellation.

**FR5:** The system shall automatically send email reminders for scheduled appointments.

**FR6:** The system shall track appointment statuses (confirmed/cancelled/no-show) and maintain visit history.

**FR7:** The system shall support clinical assessments including patient history, pain evaluation, and functional tests.

**FR8:** The system shall manage treatment plans with goals per prescription and automatic decrement of remaining sessions.

**FR9:** The system shall handle session check-in/check-out processes with time tracking.

**FR10:** The system shall generate multi-session invoices and track payment methods (card/check/cash).

**FR11:** The system shall monitor outstanding balances and payment status for all patients.

**FR12:** The system shall provide search functionality across patient records and appointment history.

### Non Functional

**NFR1:** The system shall achieve responsive UI performance with target <200ms time-to-interactive for critical user flows.

**NFR2:** The system shall comply with GDPR requirements for health data privacy and protection.

**NFR3:** The system shall support modern browsers with desktop-first design and responsive tablet compatibility.

**NFR4:** The system shall implement strong password policies and secure session management.

**NFR5:** The system shall maintain data integrity and provide reliable backup mechanisms.

**NFR6:** The system shall support concurrent multi-user access without performance degradation.

**NFR7:** The system shall ensure 99.5% uptime during business hours (8 AM - 6 PM local time).

---

## UI Design Goals

### Primary Design Principles

**Clean and Professional Interface**: Implement a modern, healthcare-appropriate design that builds trust and confidence with medical professionals while maintaining visual clarity for efficient daily operations.

**Desktop-First Responsive Design**: Optimize for desktop workflows as the primary use case, with responsive tablet support for mobile access scenarios, ensuring consistent functionality across devices.

**Intuitive Navigation Structure**: Design clear information hierarchy with logical grouping of related functions (Patient Management, Scheduling, Clinical, Billing) to minimize cognitive load and training requirements.

**Efficient Data Entry Workflows**: Streamline form designs with smart defaults, auto-complete functionality, and keyboard shortcuts to reduce administrative burden during busy clinical hours.

**Accessibility and Compliance**: Ensure WCAG 2.1 AA compliance for accessibility while maintaining GDPR-compliant data handling in all UI interactions.

### Key UI Components

**Dashboard Overview**: Central hub displaying today's appointments, pending tasks, and key metrics with quick-access navigation to primary functions.

**Patient Record Interface**: Comprehensive yet organized patient information display with tabbed sections for demographics, medical history, treatment plans, and billing information.

**Calendar Management**: Intuitive scheduling interface with drag-and-drop functionality, color-coded appointment types, and integrated reminder management.

**Clinical Assessment Forms**: Streamlined assessment interfaces with progressive disclosure to capture detailed clinical information without overwhelming the user experience.

**Billing and Payment Tracking**: Clear financial overview with outstanding balance alerts, payment history, and invoice generation capabilities integrated into patient workflows.

---

## Technical Assumptions

### Unified Nuxt 4 Architecture with Clear Layer Separation

**Monolithic Full-Stack Structure**: The application will follow a unified monolithic structure built entirely within the Nuxt 4 framework, leveraging its enhanced full-stack capabilities while maintaining clean architectural boundaries between distinct layers.

**Frontend Layer**: Nuxt 4 pages, layouts, and components handling all UI and UX interactions, utilizing the enhanced Vue.js composition API and improved server-side rendering capabilities for optimal performance.

**Backend API Layer**: Implemented through Nitro server routes with modular middleware and service layers, providing clean separation of concerns and maintainable API architecture within the Nuxt ecosystem.

**Database Layer**: Powered by PostgreSQL using Drizzle ORM for schema management and type-safe queries, ensuring robust data integrity and developer experience with compile-time query validation.

**Authentication System**: Integrated via better-auth with organization and admin plugins to support multi-tenant identity and access control, enabling role-based permissions across different practice environments.

### Technology Stack Integration

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

### Development and Deployment

**Type Safety**: End-to-end TypeScript implementation with Drizzle's type-safe queries ensuring compile-time validation across the entire application stack.
**Modular Architecture**: Clear service layer separation within Nitro server routes, enabling maintainable business logic and easy testing of individual components.
**Multi-Tenant Support**: better-auth organization plugin enabling future expansion to multiple physiotherapy practices with isolated data and user management.
**Performance Optimization**: Nuxt 4's enhanced SSR capabilities and optimized build system for fast loading times and improved user experience.
**Code Style**: English identifiers with French UI copy, ESLint and Prettier for consistency
**Deployment**: The application will be self-hosted and deployed using Dokploy, no need for any production environment, for dev provide docker-compose file for local setup (including database, cache, minio for file storage, and email service).

---

## Epic List

### Epic 1: Foundation & Authentication System
**Priority**: Critical
**Estimated Effort**: High
**Dependencies**: None
**Description**: Establish core application infrastructure with better-auth integration, organization support, and role-based access control for multi-tenant physiotherapy practice management.

### Epic 2: Patient Management System
**Priority**: Critical
**Estimated Effort**: High
**Dependencies**: Epic 1 (Authentication)
**Description**: Comprehensive patient record management including demographics, medical history, conditions, allergies, referring physician information, and secure document upload capabilities.

### Epic 3: Appointment Scheduling & Calendar
**Priority**: Critical
**Estimated Effort**: Medium
**Dependencies**: Epic 1 (Authentication), Epic 2 (Patient Management)
**Description**: Full-featured calendar system with day/week/month views, appointment booking, editing, cancellation, and automated email reminder functionality.

### Epic 4: Clinical Assessment & Treatment Planning
**Priority**: High
**Estimated Effort**: Medium
**Dependencies**: Epic 2 (Patient Management)
**Description**: Clinical workflow tools including patient assessments, pain evaluation, functional tests, treatment plan creation with goals, and session tracking with automatic decrements.

### Epic 5: Session Management & Check-in System
**Priority**: High
**Estimated Effort**: Medium
**Dependencies**: Epic 3 (Scheduling), Epic 4 (Treatment Planning)
**Description**: Session check-in/check-out processes with time tracking, visit history management, and appointment status updates (confirmed/cancelled/no-show).

### Epic 6: Billing & Payment Management
**Priority**: High
**Estimated Effort**: Medium
**Dependencies**: Epic 2 (Patient Management), Epic 5 (Session Management)
**Description**: Multi-session invoice generation, payment method tracking (card/check/cash), outstanding balance monitoring, and payment status management.

### Epic 7: Search & Reporting Capabilities
**Priority**: Medium
**Estimated Effort**: Low
**Dependencies**: Epic 2 (Patient Management), Epic 3 (Scheduling)
**Description**: Comprehensive search functionality across patient records, appointment history, and basic reporting for practice management insights.

### Epic 8: User Management & Multi-Role Support
**Priority**: Medium
**Estimated Effort**: Low
**Dependencies**: Epic 1 (Authentication)
**Description**: Role-based user management supporting Owner/Practitioner/Secretary/Assistant/Substitute roles with appropriate permission levels and access controls.

---

## Next Steps

1. **Architecture Phase**: Engage @architect to design the technical architecture based on this PRD
2. **Epic Breakdown**: Create detailed user stories for Epic 1 (Foundation & Authentication System)
3. **Data Schema Design**: Define database entities and relationships for core business objects
4. **Development Planning**: Establish sprint planning and development timeline
5. **Stakeholder Review**: Present PRD to key stakeholders for final approval

---

*This PRD serves as the foundation for the Physiotherapy Practice Management App v2 development. All subsequent development decisions should align with the goals, requirements, and technical assumptions outlined in this document.*