# MODIFIED Requirements: Exceptions Management UI

## ADDED Requirements

### Requirement: Display exceptions as cards with date indicators

The system SHALL display exceptions as individual cards with visual date indicators.

#### Scenario: Display exceptions as cards with date indicators

**WHEN** the user views the exceptions section  
**THEN** the system **SHALL** display each exception as an individual card with:

- Date indicator showing day number and month abbreviation
- Date range or full date information
- Exception type badge with appropriate color coding
- Availability toggle switch
- Edit and delete action buttons that appear on hover

### Requirement: Implement date-based visual indicators

The system SHALL create visual date indicators with day numbers and month abbreviations.

#### Scenario: Implement date-based visual indicators

**WHEN** displaying exception dates  
**THEN** the system **SHALL** show:

- A rounded container with day number (15, 01, 22, etc.)
- Month abbreviation below (Août, Sept., Nov., etc.)
- Consistent styling with weekly template day indicators
- Proper visual hierarchy

### Requirement: Add exception type color coding

The system SHALL implement color-coded badges for different exception types.

#### Scenario: Add exception type color coding

**WHEN** displaying exception types  
**THEN** the system **SHALL** show:

- `text-warning` badge for "Congés annuels"
- `text-info` badge for "Formation"
- `text-error` badge for "RDV personnel"
- Consistent badge styling using Nuxt UI UBadge component

### Requirement: Implement availability toggles

The system SHALL add toggle switches for managing exception availability status.

#### Scenario: Implement availability toggles

**WHEN** managing exception availability  
**THEN** the interface **SHALL**:

- Show USwitch component for availability status
- Display `text-muted` "Indisponible" text for unavailable exceptions
- Maintain proper state management
- Provide clear visual feedback using `text-error` for unavailable states

### Requirement: Display date ranges and times

The system SHALL format and display date ranges and times for exceptions.

#### Scenario: Display date ranges and times

**WHEN** showing exception date information  
**THEN** the system **SHALL**:

- Show date ranges for multi-day exceptions (15 - 19 Août 2024)
- Show single dates with time if specified (01 Sept. 2024 (Journée complète))
- Show time-only exceptions (10:00 - 11:00 AM)
- Maintain consistent formatting

## MODIFIED Requirements

### Requirement: Replace table layout with card-based design

The system SHALL transform exceptions table into a modern card-based layout.

#### Scenario: Replace table layout with card-based design

**WHEN** the user views the exceptions management interface  
**THEN** the system **SHALL** display the exceptions as individual cards instead of table rows, maintaining all existing functionality while improving visual hierarchy and user experience
