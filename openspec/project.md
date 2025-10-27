# Project Specification: Kine

## Project Overview

**Kine** is a multi-tenant physiotherapy practice management application designed to centralize clinic operations including patient management, appointment scheduling, clinical documentation, billing, and reporting. The application targets reducing administrative time by and missed appointments by through automation and streamlined workflows.

## Domain Context

### Core Entities

- **Organizations**: Multi-tenant clinics with isolated data and settings
- **Users**: Clinic staff with role-based access control (admin, physiotherapist, receptionist)
- **Patients**: Comprehensive medical records with demographics, history, and documents
- **Appointments**: Calendar-based scheduling with status tracking and reminders
- **Treatment Plans**: Structured therapy plans linked to prescriptions with session tracking
- **Clinical Assessments**: Intake forms for patient history, pain assessment, and goals
- **Invoices**: Multi-session billing with payment tracking and balance management

### Key Workflows

- **Patient Onboarding**: Registration, assessment, treatment plan creation
- **Appointment Management**: Scheduling, reminders, status updates
- **Clinical Documentation**: Assessment forms, progress notes, treatment tracking
- **Billing & Payments**: Invoice generation, payment processing, financial reporting
- **Multi-language Support**: French UI with Arabic patient-facing content (RTL support)

### User Roles

- **Administrator**: Full system access, organization settings, user management
- **Physiotherapist**: Patient care, clinical documentation, treatment planning
- **Receptionist**: Appointment scheduling, patient registration, billing support

### Primary Goals

- Centralize all physiotherapy practice operations in one secure, efficient platform
- Replace fragmented tools (paper, spreadsheets, calendars, billing software)
- Enable multi-tenant support for multiple clinics
- Offer a French UI with planned Arabic support for patient-facing content
- Ensure all active patients have complete Treatment Plans and Clinical Assessments
- Reduce administrative workload and streamline billing to minimize payment delays
- Improve care plan tracking, treatment monitoring, and appointment adherence through automation
- Deliver affordable, simple, and secure practice management software

## Technology Stack

### Frontend

- **Framework**: Nuxt 4
- **UI Library**: Vue 3
- **Language**: TypeScript
- **Component Library**: Nuxt UI
- **Internationalization**: Vue I18n
- **Styling**: Tailwind CSS (via Nuxt UI)
- **Icons**: Iconify (Lucide, Simple Icons)
- **Charts**: Unovis for data visualization
- **Date Handling**: date-fns
- **State Management**: Pinia (when needed for complex state)

### Backend

- **API**: Nuxt Server Routes
- **Authentication**: Better Auth with Organization and Admin plugins
- **Database**: Drizzle ORM with SQLite (Cloudflare D1)
- **Validation**: Zod v4 for runtime type validation
- **File Storage**: Cloudflare R2
- **Caching**: Cloudflare KV
- **Email**: Transactional email provider for reminders

### Infrastructure & Deployment

- **Platform**: Cloudflare Workers
- **Database**: Cloudflare D1
- **File Storage**: Cloudflare R2
- **Caching**: Cloudflare KV
- **Package Manager**: pnpm
- **Deployment**: Cloudflare Workers with D1 database

## Project Structure

```
kine-web/
├── app/                          # Frontend application
│   ├── components/               # Vue components
│   │   ├── customers/           # Customer management components
│   │   ├── home/               # Dashboard components
│   │   ├── inbox/              # Email/messaging components
│   │   ├── organizations/      # Organization management
│   │   └── settings/           # Settings components
│   ├── composables/            # Vue composables
│   ├── layouts/               # Nuxt layouts
│   ├── middleware/            # Nuxt middleware
│   ├── pages/                 # Nuxt pages
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
├── server/                     # Backend application
│   ├── api/                   # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── r2/                # File storage endpoints
│   │   └── [various].ts       # Other API endpoints
│   ├── database/              # Database configuration
│   │   ├── migrations/        # Database migrations
│   │   └── schema/            # Database schema definitions
│   └── utils/                 # Server utilities
├── shared/                     # Shared code between client/server
│   ├── types/                 # Shared TypeScript types
│   └── utils/                 # Shared utilities
└── openspec/                  # Project specifications
```

## Key Features & Modules

### Authentication & Authorization

- Multi-tenant authentication using Better Auth
- Organization-based access control
- User roles and permissions
- Session management with Cloudflare KV

### Organization Management

- Multi-clinic support
- Organization creation and management
- Member invitations and role assignments
- Organization switching

### Customer Management

- Patient records and profiles
- Treatment plans and clinical assessments
- Appointment scheduling
- Billing and invoicing

### Dashboard & Analytics

- Sales and revenue tracking
- Patient statistics
- Appointment metrics
- Data visualization with Unovis charts

### Communication

- Internal messaging system
- Email notifications and reminders
- Multi-language support (French primary, Arabic planned)

## Development Conventions

### Code Style

- TypeScript for type safety
- Vue 3 Composition API
- Nuxt 4 conventions and best practices
- Tailwind CSS for styling
- Zod for runtime validation

### Database

- Drizzle ORM for database operations
- Cloudflare D1 for production and development
- Migration-based schema changes
- Type-safe database operations

### API Design

- RESTful API design
- Nuxt server routes
- Consistent error handling
- Input validation with Zod

### State Management

- Local component state where possible
- Pinia for complex shared state
- Server state via API calls
- Caching strategies with Cloudflare KV

## Configuration Files

### Key Configuration

- `nuxt.config.ts` - Nuxt configuration
- `drizzle.config.ts` - Database configuration
- `wrangler.jsonc` - Cloudflare Workers configuration
- `package.json` - Dependencies and scripts

### Environment Variables

- Better Auth secret and configuration
- Cloudflare R2 credentials
- Database connection settings
- Email service configuration

## Development Workflow

### Local Development

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server
pnpm db:gen           # Generate database migrations
pnpm db:mig           # Apply local migrations
```

### Database Management

```bash
pnpm db:gen           # Generate migrations
pnpm db:mig           # Apply local migrations
pnpm db:mig-remote    # Apply production migrations
```

### Deployment

```bash
pnpm build            # Build for production
pnpm deploy           # Deploy to Cloudflare Workers
```

## Current Implementation Status

### Completed

- Basic Nuxt 4 setup with TypeScript
- Authentication system with Better Auth
- Organization management
- Basic dashboard components
- Database schema with Drizzle
- Cloudflare Workers deployment setup

### In Progress

- Patients management (placeholder pages exist - customers)
- Advanced dashboard features
- Email integration
- PDF generation for invoices

### Planned

- Arabic language support
- Advanced appointment scheduling
- Billing and payment processing
- Mobile-responsive design improvements
- Advanced reporting features

## Security Considerations

- Multi-tenant data isolation
- Secure authentication flows
- Input validation and sanitization
- Environment variable management
- Cloudflare Workers security features
- Rate limiting and abuse prevention

## Performance Optimizations

- Cloudflare Edge Network
- Database query optimization
- Caching strategies with KV
- Image optimization via R2
- Bundle size optimization
- Lazy loading components
