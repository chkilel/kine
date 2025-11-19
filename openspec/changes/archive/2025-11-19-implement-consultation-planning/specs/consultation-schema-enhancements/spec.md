# Enhanced Consultation Schemas

## ADDED Requirements

### Requirement: Consultation Location Support

The system SHALL support consultation location planning with predefined location types.

#### Scenario: Location selection during consultation planning

- **WHEN** creating or updating a consultation
- **THEN** system SHALL provide location options: 'clinic', 'home', 'telehealth'
- **AND** store location preference in consultation record
- **AND** use location for scheduling and availability checks

#### Scenario: Location-based filtering

- **WHEN** viewing consultation lists or schedules
- **THEN** system SHALL allow filtering by location
- **AND** display location information in consultation details

### Requirement: Extended Consultation Types

The system SHALL support extended consultation types for better treatment planning categorization.

#### Scenario: Consultation type selection

- **WHEN** planning consultations within treatment plans
- **THEN** system SHALL provide consultation types: 'initial', 'follow_up', 'evaluation', 'discharge', 'mobilization', 'reinforcement', 'reeducation'
- **AND** allow type-based filtering and organization
- **AND** display consultation type in planning interface

#### Scenario: Type-based treatment plan tracking

- **WHEN** viewing treatment plan progress
- **THEN** system SHALL categorize consultations by type
- **AND** show distribution of consultation types
- **AND** enable type-based progress analysis

## MODIFIED Requirements

### Requirement: Consultation Schema Enhancement

The existing consultation schema SHALL be enhanced to support planning-specific fields while maintaining backward compatibility.

#### Scenario: Schema migration

- **WHEN** implementing consultation planning
- **THEN** system SHALL add location field with default value 'clinic'
- **AND** extend consultationType enum with planning-specific values
- **AND** maintain compatibility with existing consultation records
- **AND** provide proper database migration

#### Scenario: Enhanced consultation creation

- **WHEN** creating new consultations
- **THEN** system SHALL require location selection
- **AND** validate consultation type against extended enum
- **AND** maintain all existing required fields
- **AND** provide proper validation feedback
