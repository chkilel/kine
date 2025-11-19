# Manual Consultation Planning Interface

## ADDED Requirements

### Requirement: Manual Planning Mode Implementation

The system SHALL implement manual consultation planning mode replacing mock data with real database integration.

#### Scenario: Manual consultation creation workflow

- **WHEN** therapist opens ConsultationPlanningSlideover in manual mode
- **THEN** system SHALL load existing consultations from database
- **AND** display real consultation data instead of mock data
- **AND** provide calendar interface for date selection
- **AND** show available time slots for selected date
- **AND** allow consultation details configuration

#### Scenario: Real-time consultation management

- **WHEN** therapist adds, edits, or deletes consultations
- **THEN** system SHALL immediately update database
- **AND** reflect changes in UI without page refresh
- **AND** provide success/error feedback via toast notifications
- **AND** maintain consultation list ordering and filtering

## MODIFIED Requirements

### Requirement: ConsultationPlanningSlideover Data Integration

The existing ConsultationPlanningSlideover component SHALL be refactored to use real data sources.

#### Scenario: Component data initialization

- **WHEN** ConsultationPlanningSlideover component mounts
- **THEN** system SHALL fetch patient consultations via API
- **AND** fetch treatment plan information if provided
- **AND** display loading states during data fetching
- **AND** handle API errors gracefully with retry options

#### Scenario: Form state management

- **WHEN** user interacts with planning interface
- **THEN** system SHALL use reactive form state with proper validation
- **AND** validate consultation data using Zod schemas
- **AND** provide real-time validation feedback
- **AND** maintain form state consistency across mode switches

### Requirement: Consultation Status Management

The system SHALL provide comprehensive consultation status management within planning interface.

#### Scenario: Status transition workflow

- **WHEN** therapist changes consultation status
- **THEN** system SHALL support status transitions: scheduled → confirmed → completed/cancelled
- **AND** validate status change permissions
- **AND** update consultation record in database
- **AND** reflect status changes in UI immediately
- **AND** provide appropriate status badges and colors

#### Scenario: Bulk status operations

- **WHEN** therapist selects multiple consultations
- **THEN** system SHALL allow bulk status changes
- **AND** provide confirmation dialog for bulk operations
- **AND** update all selected consultations efficiently
- **AND** show progress indicator during bulk updates
