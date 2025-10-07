# Assumptions & Dependencies

## Technical Assumptions
- PostgreSQL Row Level Security (RLS) can effectively isolate tenant data at scale
- Better-auth library will maintain stability and multi-tenant support
- Nuxt.js v4 has reached stable release
- Drizzle ORM can handle complex multi-tenant queries efficiently
- PDF generation performance will be acceptable for clinical reports

## Business Assumptions
- Target market (Moroccan physiotherapy practices) has sufficient digital readiness
- French language interface will be acceptable for initial market entry
- Practices are willing to migrate from existing tools/processes
- Regulatory environment will remain stable during development period
- Initial pricing model will be competitive with existing solutions

## External Dependencies
- **Regulatory Compliance**: HIPAA guidelines and local healthcare data regulations
- **Third-party Integrations**: Email service providers, payment processors
- **Infrastructure**: Cloud hosting provider reliability and compliance certifications
- **Legal**: Data processing agreements for multi-tenant architecture
- **Market Research**: Ongoing validation of feature priorities with target users

## Critical Success Dependencies
- Early user feedback from pilot physiotherapy practices
- Successful implementation of tenant isolation security model
- Timely completion of compliance certification process
- Effective change management for practice workflow adoption

## Functional Requirements

1. **FR1: Multi-Tenant Organization Management**
   - Support multiple clinics as separate organizations with isolated data, configurable settings, and organization-level user management

   **Acceptance Criteria:**
   - Each organization has completely isolated data with no cross-tenant access
   - Organization admins can configure clinic-specific settings (business hours, billing rules, branding)
   - Support for organization-level user roles (admin, staff, clinician)
   - Organization creation includes setup wizard for initial configuration

2. **FR2: Authentication & Authorization**
   - Implement secure authentication using better-auth with Organization & Admin plugins, role-based access control, and session management

   **Acceptance Criteria:**
   - Users can authenticate with email/password and select their organization
   - Role-based permissions restrict access to appropriate features
   - Session timeout after 30 minutes of inactivity
   - Password requirements meet healthcare security standards
   - Two-factor authentication option for admin users

3. **FR3: Patient Management**
   - Create, read, update, and delete patient records with demographic information, medical history, allergies, and document attachments

   **Acceptance Criteria:**
   - Patient records include all required demographic fields (name, DOB, contact info)
   - Medical history supports structured data entry and free-text notes
   - Allergy information with severity levels and reaction descriptions
   - Document upload supports PDF, images, and common medical file formats
   - Patient search by name, phone, or ID number
   - Audit trail for all patient record modifications

4. **FR4: Appointment Scheduling**
   - Calendar system with day/week/month views, appointment creation/editing/cancellation, status tracking (confirmed/cancelled/no-show)

   **Acceptance Criteria:**
   - Calendar displays appointments in day, week, and month views
   - Appointment creation includes patient selection, time slot, duration, and notes
   - Status updates (confirmed, cancelled, no-show, completed) with timestamp tracking
   - Double-booking prevention with conflict warnings
   - Recurring appointment support for treatment series
   - Color-coding by appointment type or therapist

5. **FR5: Automated Reminders**
   - Email notification system for appointment reminders, treatment plan updates, and billing notifications

   **Acceptance Criteria:**
   - Appointment reminders sent 24 hours and 2 hours before scheduled time
   - Email templates customizable per organization
   - Opt-out mechanism for patients who don't want reminders
   - Delivery status tracking and retry logic for failed emails
   - Billing notifications for overdue payments
   - Treatment plan completion reminders

6. **FR6: Treatment Plan Management**
   - Create and manage treatment plans linked to prescriptions with automatic session decrement and progress tracking

   **Acceptance Criteria:**
   - Treatment plans include prescribed number of sessions and frequency
   - Automatic session count decrement when appointments are marked complete
   - Progress notes linked to each completed session
   - Treatment plan templates for common conditions
   - Renewal workflow when sessions are exhausted
   - Integration with prescription documents

7. **FR7: Clinical Assessment**
   - Comprehensive intake forms for patient history, pain assessment, functional tests, and treatment goals

   **Acceptance Criteria:**
   - Structured intake form with medical history, current symptoms, and functional limitations
   - Pain assessment with visual analog scale and body diagram
   - Standardized functional tests with scoring
   - SMART goal setting for treatment outcomes
   - Assessment comparison over time to track progress
   - Export capability for clinical reports

8. **FR8: Billing & Invoicing**
   - Generate multi-session invoices, track payments (card/check/cash), manage outstanding balances, and support clinic-specific billing rules

   **Acceptance Criteria:**
   - Invoice generation from completed appointments with customizable line items
   - Multiple payment method support (cash, check, card, insurance)
   - Outstanding balance tracking with aging reports
   - Clinic-specific pricing and billing rules configuration
   - Payment plan support for large balances
   - Integration with accounting software export formats

9. **FR9: Multi-Language Support**
   - French UI as default with Arabic language support for patient-facing content, code identifiers in English

   **Acceptance Criteria:**
   - Complete French translation for all UI elements
   - Arabic language support for patient-facing forms and communications
   - RTL (right-to-left) layout support for Arabic interface
   - Language switching without losing session state
   - Date and number formatting appropriate for each locale
   - All code and database identifiers remain in English

10. **FR10: Document Management**
    - Secure file upload/download for patient documents, prescriptions, and clinical assessments

    **Acceptance Criteria:**
    - File upload supports PDF, JPEG, PNG, and DOCX formats up to 10MB
    - Document categorization (prescription, assessment, insurance, other)
    - Version control for updated documents
    - Secure download with access logging
    - Document preview capability within the application
    - Bulk document operations for efficiency

11. **FR11: Reporting & Analytics**
    - Basic dashboards for revenue tracking, patient statistics, and appointment metrics per organization

    **Acceptance Criteria:**
    - Revenue reports by date range, therapist, and treatment type
    - Patient statistics including new patients, retention rates, and demographics
    - Appointment metrics (no-show rates, cancellations, utilization)
    - Exportable reports in PDF and CSV formats
    - Real-time dashboard with key performance indicators
    - Comparative analysis (month-over-month, year-over-year)

12. **FR12: Data Import/Export**
    - CSV import for patient data and export capabilities for reporting and accounting purposes

    **Acceptance Criteria:**
    - CSV import wizard with field mapping and validation
    - Data validation and error reporting during import
    - Export functionality for patient lists, appointments, and financial data
    - Backup export of complete organization data
    - Import rollback capability for failed imports
    - Support for common physiotherapy software export formats

## Non-Functional Requirements

1. **NFR1: Security & Compliance**
   - GDPR compliance, health-data certified hosting (HDS or equivalent), encryption at rest and in transit, auto logout on inactivity

   **Acceptance Criteria:**
   - All data encrypted using AES-256 at rest and TLS 1.3 in transit
   - GDPR compliance with data subject rights (access, rectification, erasure, portability)
   - Health data hosting certification (HDS in France or equivalent)
   - Automatic session timeout after 30 minutes of inactivity
   - Data processing agreements compliant with healthcare regulations
   - Regular security audits and penetration testing

2. **NFR2: Multi-Tenant Data Isolation**
   - Strict data segregation between organizations with no cross-tenant data access

   **Acceptance Criteria:**
   - PostgreSQL Row Level Security (RLS) policies prevent cross-tenant data access
   - Database queries automatically filtered by tenant context
   - No shared data between organizations except system configuration
   - Tenant isolation testing with automated security validation
   - Audit logging of all cross-tenant access attempts
   - Zero data leakage tolerance with comprehensive testing

3. **NFR3: Performance**
   - Responsive UI with <200ms TTI for critical flows, optimized database queries for multi-tenant architecture

   **Acceptance Criteria:**
   - Time to Interactive (TTI) under 200ms for calendar and patient lookup
   - Database query response time under 100ms for 95th percentile
   - Page load times under 2 seconds on 3G connections
   - Optimized multi-tenant queries with proper indexing
   - Client-side caching for frequently accessed data
   - Performance monitoring with alerting on threshold breaches

4. **NFR4: Scalability**
   - Architecture supporting multiple clinics with potential for hundreds of concurrent users

   **Acceptance Criteria:**
   - Support for 100+ concurrent users per organization
   - Horizontal scaling capability for database and application layers
   - Load testing validation up to 500 concurrent users system-wide
   - Auto-scaling infrastructure configuration
   - Database connection pooling and query optimization
   - CDN integration for static asset delivery

5. **NFR5: Internationalization**
   - Support for French and Arabic languages with proper RTL layout support for Arabic

   **Acceptance Criteria:**
   - Complete French localization for all UI elements and messages
   - Arabic language support for patient-facing interfaces
   - RTL (right-to-left) layout rendering for Arabic text
   - Proper date, time, and number formatting for each locale
   - Currency formatting appropriate for target markets
   - Language switching without data loss or session interruption

6. **NFR6: Accessibility**
   - WCAG AA compliance for web accessibility standards

   **Acceptance Criteria:**
   - All interactive elements accessible via keyboard navigation
   - Screen reader compatibility with proper ARIA labels
   - Color contrast ratios meeting WCAG AA requirements (4.5:1 for normal text)
   - Text scaling up to 200% without loss of functionality
   - Focus indicators visible and clearly defined
   - Alternative text for all images and icons

7. **NFR7: Audit Logging**
   - Comprehensive audit trails for all data access and modifications

   **Acceptance Criteria:**
   - All CRUD operations logged with user, timestamp, and data changes
   - Login/logout events and failed authentication attempts tracked
   - Data export and import activities logged with details
   - Audit logs immutable and tamper-evident
   - Log retention for minimum 7 years for healthcare compliance
   - Real-time alerting for suspicious access patterns

8. **NFR8: Backup & Recovery**
   - Regular automated backups with disaster recovery procedures

   **Acceptance Criteria:**
   - Automated daily backups with 30-day retention
   - Point-in-time recovery capability within 15 minutes
   - Backup integrity verification and restoration testing
   - Geographic backup replication for disaster recovery
   - Recovery Time Objective (RTO) of 4 hours maximum
   - Recovery Point Objective (RPO) of 1 hour maximum

9. **NFR9: API Standards**
   - RESTful API design with proper versioning and documentation

   **Acceptance Criteria:**
   - RESTful API following OpenAPI 3.0 specification
   - API versioning strategy with backward compatibility
   - Comprehensive API documentation with examples
   - Rate limiting and throttling for API endpoints
   - Consistent error response format and HTTP status codes

10. **NFR10: Monitoring & Alerting**
   - Application performance monitoring and error tracking

   **Acceptance Criteria:**
   - Real-time application performance monitoring (APM)
   - Error tracking and alerting for application exceptions
   - Infrastructure monitoring (CPU, memory, disk, network)
   - Uptime monitoring with 99.5% availability target
   - Custom dashboards for key business metrics
   - Automated alerting via email, Slack/discord and SMS for critical issues
