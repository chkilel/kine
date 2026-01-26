# Consultation Smart Tags Specification

## Purpose

Define requirements for smart tags feature that allows therapists to quickly categorize session outcomes with selectable, auto-saved tags.

## ADDED Requirements

### Requirement: Store Smart Tags as JSON Array

The system SHALL store smart tags as a JSON array of strings in the `tags` field of the consultations table.

#### Scenario: Store single tag

- **GIVEN** a consultation with id "consultation-123" exists
- **AND** therapist selects "Douleur Diminuée" tag
- **WHEN** tags endpoint is called with `["Douleur Diminuée"]`
- **THEN** tags field in database is stored as `'["Douleur Diminuée"]'`

#### Scenario: Store multiple tags

- **GIVEN** a consultation is in progress
- **AND** therapist selects "Douleur Diminuée", "Gain Amplitude", and "Renforcement"
- **WHEN** tags endpoint is called with array of 3 tags
- **THEN** tags field in database is stored as `'["Douleur Diminuée","Gain Amplitude","Renforcement"]'`

#### Scenario: Clear all tags

- **GIVEN** a consultation has tags `["Douleur Diminuée","Gain Amplitude"]`
- **AND** therapist deselects all tags
- **WHEN** tags endpoint is called with empty array
- **THEN** tags field in database is set to null

#### Scenario: Update existing tags

- **GIVEN** a consultation has tags `["Douleur Diminuée","Gain Amplitude"]`
- **AND** therapist adds "Renforcement" and removes "Gain Amplitude"
- **WHEN** tags endpoint is called with `["Douleur Diminuée","Renforcement"]`
- **THEN** tags field in database is updated to `'["Douleur Diminuée","Renforcement"]'`

### Requirement: Auto-Save Tags on Toggle

The system SHALL automatically save tags to database when therapist toggles tag selection, providing immediate feedback.

#### Scenario: Auto-save on tag selection

- **GIVEN** a session is in progress
- **AND** tags array is empty
- **WHEN** therapist clicks "Douleur Diminuée" tag button
- **THEN** tag is visually selected with checkmark icon
- **AND** API call to update tags is triggered immediately
- **AND** database stores new tag
- **AND** UI shows "Tags sauvegardés" indicator

#### Scenario: Auto-save on tag deselection

- **GIVEN** a consultation has tag "Douleur Diminuée" selected
- **WHEN** therapist clicks "Douleur Diminuée" tag button again
- **THEN** tag is visually deselected
- **AND** API call to update tags is triggered immediately
- **AND** database removes tag from array
- **AND** UI shows "Tags sauvegardés" indicator

#### Scenario: Handle API error and revert

- **GIVEN** therapist selects a tag
- **AND** API call to update tags fails
- **THEN** UI reverts tag to previous state (deselects if it was selected)
- **AND** error notification is displayed
- **AND** database is not modified

### Requirement: Display Tags with Visual Selection State

The system SHALL display smart tags as clickable buttons that show selection state with appropriate icons and colors.

#### Scenario: Show unselected tags

- **GIVEN** a session is in progress
- **AND** no tags are selected
- **WHEN** smart tags section is rendered
- **THEN** each tag is displayed as outline button
- **AND** button color is neutral
- **AND** button shows "add" icon (`i-hugeicons-add-01`)
- **AND** buttons are clickable

#### Scenario: Show selected tags

- **GIVEN** tags `["Douleur Diminuée","Gain Amplitude"]` are selected
- **WHEN** smart tags section is rendered
- **THEN** "Douleur Diminuée" and "Gain Amplitude" are displayed as solid buttons
- **AND** button color is primary
- **AND** button shows "checkmark" icon (`i-hugeicons-checkmark-01`)
- **AND** other tags remain as outline buttons

#### Scenario: Toggle tag state

- **GIVEN** "Douleur Diminuée" is currently unselected
- **WHEN** therapist clicks the tag button
- **THEN** button immediately changes to selected state (solid, primary color, checkmark)
- **AND** API call is triggered
- **AND** on success, state is confirmed

#### Scenario: Display predefined tag options

- **GIVEN** smart tags section is rendered
- **WHEN** therapist views tags section
- **THEN** following tags are displayed as options:
  - "Douleur Diminuée"
  - "Gain Amplitude"
  - "Proprioception"
  - "Cryothérapie"
  - "Renforcement"

### Requirement: Load Tags from Database on Session Start

The system SHALL load existing tags from database when consultation is opened, preserving tag state across sessions.

#### Scenario: Load existing tags

- **GIVEN** a consultation with tags `["Douleur Diminuée","Renforcement"]` is opened
- **WHEN** ActiveConsultationSlideover component mounts
- **THEN** tags array is populated from database
- **THEN** "Douleur Diminuée" and "Renforcement" are displayed as selected
- **AND** other tags are displayed as unselected

#### Scenario: Handle malformed tags JSON

- **GIVEN** a consultation has tags field containing invalid JSON
- **WHEN** ActiveConsultationSlideover component mounts
- **THEN** error is logged to console
- **AND** tags array is set to empty array
- **AND** UI displays all tags as unselected

#### Scenario: Handle null tags

- **GIVEN** a consultation has tags field set to null
- **WHEN** ActiveConsultationSlideover component mounts
- **THEN** tags array is set to empty array
- **AND** UI displays all tags as unselected

### Requirement: Persist Tags on Session Completion

The system SHALL ensure selected tags are saved to database when consultation is marked as completed.

#### Scenario: Save tags when ending session

- **GIVEN** a consultation has tags `["Douleur Diminuée","Gain Amplitude"]` selected
- **AND** therapist clicks "Terminer la séance"
- **WHEN** session is completed
- **THEN** tags are saved to database
- **AND** consultation can be retrieved with complete tag list

#### Scenario: Preserve tags after auto-save

- **GIVEN** therapist selects "Renforcement" tag
- **AND** auto-save has already saved tags to database
- **WHEN** therapist ends session 5 minutes later
- **THEN** all selected tags are preserved
- **AND** no tags are lost between auto-save and session completion
