# MODIFIED Requirements: Weekly Availability Templates UI

## ADDED Requirements

### Requirement: Display weekly availability templates as cards

The system SHALL display weekly availability templates as individual cards instead of table rows.

#### Scenario: Display weekly availability templates as cards

**WHEN** the user views the weekly availability section  
**THEN** the system **SHALL** display each availability template as an individual card with:

- Day indicator showing abbreviated day name and calendar icon
- Time range displayed prominently
- Location badge with appropriate color coding
- Maximum sessions information with icon
- Edit and delete action buttons that appear on hover

### Requirement: Implement visual day indicators

The system SHALL create visual day indicators with rounded containers and calendar icons.

#### Scenario: Implement visual day indicators

**WHEN** displaying availability templates  
**THEN** the system **SHALL** show:

- A rounded container with day abbreviation (Lun, Mar, Mer, etc.)
- Calendar icon below the day text
- Consistent sizing and Nuxt UI color scheme
- Proper spacing and alignment

### Requirement: Add location-based color coding

The system SHALL implement color-coded badges for different location types using Nuxt UI components.

#### Scenario: Add location-based color coding

**WHEN** displaying location information  
**THEN** the system **SHALL** show:

- `text-success` badge for "Cabinet" location
- `text-warning` badge for "Domicile" location
- `text-info` badge for "Téléconsultation" location
- Consistent badge styling using Nuxt UI UBadge component

### Requirement: Implement hover interactions

The system SHALL add hover states and micro-interactions for better user engagement.

#### Scenario: Implement hover interactions

**WHEN** user hovers over availability template cards  
**THEN** the interface **SHALL**:

- Show subtle `bg-accented` background color change
- Reveal edit (`text-primary`) and delete (`text-error`) action buttons
- Maintain smooth transitions
- Provide visual feedback for interactive elements

### Requirement: Display capacity information

The system SHALL show maximum session capacity with appropriate icons and text.

#### Scenario: Display capacity information

**WHEN** showing maximum sessions  
**THEN** the system **SHALL**:

- Show group icon with session count
- Display "X patients simultanés" for multiple sessions
- Display "1 patient max" for single session
- Use appropriate icons for different scenarios

## MODIFIED Requirements

### Requirement: Replace table layout with card-based design

The system SHALL transform the table-based layout into a modern card-based design.

#### Scenario: Replace table layout with card-based design

**WHEN** the user views the availability management interface  
**THEN** the system **SHALL** display the weekly templates as individual cards instead of table rows, maintaining all existing functionality while improving visual hierarchy and user experience
