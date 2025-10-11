# Epic List

## Epic 1: Foundation & Authentication System
**Priority**: Critical
**Estimated Effort**: High
**Dependencies**: None
**Description**: Establish core application infrastructure with better-auth integration, organization support, and role-based access control for multi-tenant physiotherapy practice management.

## Epic 2: Patient Management System
**Priority**: Critical
**Estimated Effort**: High
**Dependencies**: Epic 1 (Authentication)
**Description**: Comprehensive patient record management including demographics, medical history, conditions, allergies, referring physician information, and secure document upload capabilities.

## Epic 3: Appointment Scheduling & Calendar
**Priority**: Critical
**Estimated Effort**: Medium
**Dependencies**: Epic 1 (Authentication), Epic 2 (Patient Management)
**Description**: Full-featured calendar system with day/week/month views, appointment booking, editing, cancellation, and automated email reminder functionality.

## Epic 4: Clinical Assessment & Treatment Planning
**Priority**: High
**Estimated Effort**: Medium
**Dependencies**: Epic 2 (Patient Management)
**Description**: Clinical workflow tools including patient assessments, pain evaluation, functional tests, treatment plan creation with goals, and session tracking with automatic decrements.

## Epic 5: Session Management & Check-in System
**Priority**: High
**Estimated Effort**: Medium
**Dependencies**: Epic 3 (Scheduling), Epic 4 (Treatment Planning)
**Description**: Session check-in/check-out processes with time tracking, visit history management, and appointment status updates (confirmed/cancelled/no-show).

## Epic 6: Billing & Payment Management
**Priority**: High
**Estimated Effort**: Medium
**Dependencies**: Epic 2 (Patient Management), Epic 5 (Session Management)
**Description**: Multi-session invoice generation, payment method tracking (card/check/cash), outstanding balance monitoring, and payment status management.

## Epic 7: Search & Reporting Capabilities
**Priority**: Medium
**Estimated Effort**: Low
**Dependencies**: Epic 2 (Patient Management), Epic 3 (Scheduling)
**Description**: Comprehensive search functionality across patient records, appointment history, and basic reporting for practice management insights.

## Epic 8: User Management & Multi-Role Support
**Priority**: Medium
**Estimated Effort**: Low
**Dependencies**: Epic 1 (Authentication)
**Description**: Role-based user management supporting Owner/Practitioner/Secretary/Assistant/Substitute roles with appropriate permission levels and access controls.

---
