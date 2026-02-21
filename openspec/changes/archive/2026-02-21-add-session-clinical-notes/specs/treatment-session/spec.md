## MODIFIED Requirements

### Requirement: Treatment Session Creation

The system SHALL provide ability to create a treatment session from an existing appointment, establishing a 1:1 relationship between appointment and treatment session. The session is created in `pre_session` status to allow preparation before starting. Pain level is not captured at creation. Sessions can be created either via explicit save button click on clinical notes fields, or directly when starting a session.

#### Scenario: Create treatment session from appointment

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** appointment has patientId "patient-456"
- **AND** appointment has therapistId "therapist-789"
- **AND** appointment has treatmentPlanId "plan-abc"
- **AND** no treatment session exists for this appointment
- **WHEN** POST /api/treatment-sessions is called with body { appointmentId: "appointment-123" }
- **THEN** a treatment session is created
- **AND** treatment session appointmentId is "appointment-123"
- **AND** treatment session patientId is "patient-456" (copied from appointment)
- **AND** treatment session therapistId is "therapist-789" (copied from appointment)
- **AND** treatment session treatmentPlanId is "plan-abc" (copied from appointment)
- **AND** treatment session status is "pre_session"
- **AND** treatment session actualStartTime is null
- **AND** treatment session painLevelBefore is null
- **AND** HTTP response is 201 Created
- **AND** response body includes the created treatment session with relations

#### Scenario: Prevent duplicate treatment session creation

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** a treatment session already exists for appointment "appointment-123"
- **WHEN** POST /api/treatment-sessions is called with body { appointmentId: "appointment-123" }
- **THEN** HTTP response is 409 Conflict
- **AND** error message states "Treatment session already exists for this appointment"
- **AND** no new treatment session is created

#### Scenario: Prevent treatment session creation for non-existent appointment

- **GIVEN** no appointment exists with id "appointment-999"
- **WHEN** POST /api/treatment-sessions is called with body { appointmentId: "appointment-999" }
- **THEN** HTTP response is 404 Not Found
- **AND** error message states "Appointment not found"

#### Scenario: Prevent treatment session creation for cancelled appointment

- **GIVEN** an appointment exists with status "cancelled"
- **WHEN** POST /api/treatment-sessions is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Cannot create treatment session for cancelled appointment"

#### Scenario: No session created when no fields saved

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** no treatment session exists for this appointment
- **WHEN** therapist opens TreatmentSessionSlideover for appointment "appointment-123"
- **THEN** no treatment session is created
- **AND** primaryConcern and treatmentSummary fields are visible and editable
- **AND** observations and nextSteps fields are not visible

#### Scenario: Create session in pre_session when save button clicked on primaryConcern

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** no treatment session exists for this appointment
- **WHEN** therapist fills primaryConcern field with "Lower back pain"
- **AND** therapist clicks save button on primaryConcern field
- **THEN** a treatment session is automatically created
- **AND** treatment session status is "pre_session"
- **AND** primaryConcern field is saved to treatment session
- **AND** no other fields are saved yet

#### Scenario: Create session in pre_session when save button clicked on treatmentSummary

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** no treatment session exists for this appointment
- **WHEN** therapist fills treatmentSummary field with "Initial assessment"
- **AND** therapist clicks save button on treatmentSummary field
- **THEN** a treatment session is automatically created
- **AND** treatment session status is "pre_session"
- **AND** treatmentSummary field is saved to treatment session
- **AND** no other fields are saved yet

#### Scenario: Save second field after session already created

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** a treatment session exists with status "pre_session"
- **AND** primaryConcern was already saved
- **WHEN** therapist fills treatmentSummary field with "Initial assessment"
- **AND** therapist clicks save button on treatmentSummary field
- **THEN** treatment session status remains "pre_session"
- **AND** treatmentSummary field is saved to existing session
- **AND** no new session is created

#### Scenario: No session created when fields filled without save

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** no treatment session exists for this appointment
- **WHEN** therapist fills primaryConcern field with "Lower back pain"
- **AND** therapist fills treatmentSummary field with "Initial assessment"
- **AND** therapist closes TreatmentSessionSlideover without clicking any save buttons
- **THEN** no treatment session is created
- **AND** appointment has no treatment session associated

### Requirement: Treatment Session Update

The system SHALL allow updating treatment session data including clinical notes (primaryConcern, treatmentSummary, observations, nextSteps) at different stages, pain levels, and timer state. Users can modify **ANY field that is visible** regardless of when it was initially filled. Updates are triggered by clicking save buttons on individual fields.

#### Scenario: Update clinical notes

- **GIVEN** a treatment session exists with id "session-123"
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body { treatmentSummary: "Patient showed improvement in range of motion" }
- **THEN** HTTP response is 200 OK
- **AND** treatmentSummary field is updated
- **AND** updatedAt timestamp is updated

#### Scenario: Update pain levels

- **GIVEN** a treatment session exists with id "session-123"
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body { painLevelBefore: 7, painLevelAfter: 3 }
- **THEN** HTTP response is 200 OK
- **AND** both pain level fields are updated

#### Scenario: Update session tags

- **GIVEN** a treatment session exists with id "session-123"
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body { tags: ["Douleur Diminuée", "Renforcement"] }
- **THEN** HTTP response is 200 OK
- **AND** tags are stored as JSON string

#### Scenario: Update observations and next steps

- **GIVEN** a treatment session exists with id "session-123"
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body {
  observations: "Patient fatigue noted during exercises",
  nextSteps: "Continue with same protocol next session"
  }
- **THEN** HTTP response is 200 OK
- **AND** both fields are updated

#### Scenario: Modify any visible field in any session status

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session status is any status (pre_session, in_progress, finished, or completed)
- **WHEN** therapist opens TreatmentSessionSlideover and sees a visible field
- **AND** therapist modifies that visible field
- **AND** therapist clicks save button on that field
- **THEN** the field is updated via API call
- **AND** update is successful
- **AND** session status remains unchanged

#### Scenario: Update clinical notes in pre_session status

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session status is "pre_session"
- **WHEN** therapist fills primaryConcern field with "Lower back pain"
- **AND** therapist fills treatmentSummary field with "Initial assessment completed"
- **AND** therapist clicks save button on primaryConcern field
- **AND** therapist clicks save button on treatmentSummary field
- **THEN** both fields are saved via API calls
- **AND** primaryConcern and treatmentSummary fields are updated
- **AND** observations and nextSteps fields are not visible (cannot be modified in pre_session)
- **AND** status remains "pre_session"

#### Scenario: Update clinical notes in in_progress status

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session status is "in_progress"
- **WHEN** therapist fills primaryConcern field with "Updated concern"
- **AND** therapist fills treatmentSummary field with "Patient responding well to treatment"
- **AND** therapist fills observations field with "Pain level decreased during exercises"
- **AND** therapist clicks save buttons on each field
- **THEN** all three fields are saved via API calls
- **AND** primaryConcern, treatmentSummary, and observations fields are updated
- **AND** nextSteps field is not visible (cannot be modified in in_progress)
- **AND** status remains "in_progress"

#### Scenario: Update clinical notes in finished status

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session status is "finished"
- **WHEN** therapist fills primaryConcern field with "Updated concern"
- **AND** therapist fills treatmentSummary field with "Session completed successfully"
- **AND** therapist fills observations field with "Patient showed good improvement"
- **AND** therapist fills nextSteps field with "Continue with strengthening exercises next session"
- **AND** therapist clicks save buttons on each field
- **THEN** all four fields are saved via API calls
- **AND** primaryConcern, treatmentSummary, observations, and nextSteps fields are updated
- **AND** status remains "finished"

#### Scenario: Re-modify field that was previously saved

- **GIVEN** a treatment session exists with id "session-123"
- **AND** primaryConcern field was previously saved with "Lower back pain"
- **AND** session status is "in_progress"
- **WHEN** therapist modifies primaryConcern field to "Updated: Lower back pain improved"
- **AND** therapist clicks save button on primaryConcern field
- **THEN** primaryConcern field is updated via API call
- **AND** new value "Updated: Lower back pain improved" is saved
- **AND** previous value is overwritten
- **AND** session status remains "in_progress"

#### Scenario: Prevent updating observations in pre_session status

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session status is "pre_session"
- **WHEN** therapist attempts to PATCH /api/treatment-sessions/session-123 with action "updateClinicalNotes" and body { observations: "Some observations" }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Cannot update observations in pre_session status"

#### Scenario: Prevent updating nextSteps before finished status

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session status is "in_progress"
- **WHEN** therapist attempts to PATCH /api/treatment-sessions/session-123 with action "updateClinicalNotes" and body { nextSteps: "Some next steps" }
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Cannot update nextSteps before session is finished"

## ADDED Requirements

### Requirement: Clinical Notes Progressive Visibility

The system SHALL display clinical notes fields in Treatment Session Slideover with progressive visibility based on session status. The `primaryConcern` field is only visible for independent appointments (not part of a treatment plan) and is editable in all statuses when visible. The `treatmentSummary` field is visible and editable in all statuses. **Users can modify ANY field that is displayed**. Each visible field has an associated save button.

#### Scenario: Display primaryConcern in pre_session for independent appointment

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** appointment has no treatmentPlanId (independent appointment)
- **AND** a treatment session exists for this appointment with status "pre_session"
- **WHEN** therapist opens TreatmentSessionSlideover for appointment "appointment-123"
- **THEN** primaryConcern textarea field is visible
- **AND** primaryConcern field can be edited
- **AND** save button is displayed next to primaryConcern field
- **AND** placeholder text indicates this is for primary concern

#### Scenario: Display primaryConcern in in_progress for independent appointment

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** appointment has no treatmentPlanId (independent appointment)
- **AND** a treatment session exists for this appointment with status "in_progress"
- **WHEN** therapist opens TreatmentSessionSlideover for appointment "appointment-123"
- **THEN** primaryConcern textarea field is visible
- **AND** primaryConcern field can be edited
- **AND** save button is displayed next to primaryConcern field

#### Scenario: Display primaryConcern in finished for independent appointment

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** appointment has no treatmentPlanId (independent appointment)
- **AND** a treatment session exists for this appointment with status "finished"
- **WHEN** therapist opens TreatmentSessionSlideover for appointment "appointment-123"
- **THEN** primaryConcern textarea field is visible
- **AND** primaryConcern field can be edited
- **AND** save button is displayed next to primaryConcern field

#### Scenario: Hide primaryConcern for treatment plan appointment

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** appointment has treatmentPlanId "plan-abc" (part of treatment plan)
- **AND** a treatment session exists for this appointment
- **WHEN** therapist opens TreatmentSessionSlideover for appointment "appointment-123"
- **THEN** primaryConcern textarea field is not visible
- **AND** no save button is displayed for primaryConcern

#### Scenario: Display treatmentSummary in pre_session status

- **GIVEN** a treatment session exists with status "pre_session"
- **WHEN** therapist opens TreatmentSessionSlideover
- **THEN** treatmentSummary textarea field is visible
- **AND** treatmentSummary field can be edited
- **AND** save button is displayed next to treatmentSummary field

#### Scenario: Display treatmentSummary in in_progress status

- **GIVEN** a treatment session exists with status "in_progress"
- **WHEN** therapist opens TreatmentSessionSlideover
- **THEN** treatmentSummary textarea field is visible
- **AND** treatmentSummary field can be edited
- **AND** save button is displayed next to treatmentSummary field

#### Scenario: Display treatmentSummary in finished status

- **GIVEN** a treatment session exists with status "finished"
- **WHEN** therapist opens TreatmentSessionSlideover
- **THEN** treatmentSummary textarea field is visible
- **AND** treatmentSummary field can be edited
- **AND** save button is displayed next to treatmentSummary field

#### Scenario: Hide observations in pre_session status

- **GIVEN** a treatment session exists with status "pre_session"
- **WHEN** therapist opens TreatmentSessionSlideover
- **THEN** observations textarea field is not visible
- **AND** no save button is displayed for observations

#### Scenario: Hide nextSteps in pre_session status

- **GIVEN** a treatment session exists with status "pre_session"
- **WHEN** therapist opens TreatmentSessionSlideover
- **THEN** nextSteps textarea field is not visible
- **AND** no save button is displayed for nextSteps

#### Scenario: Display observations in in_progress status

- **GIVEN** a treatment session exists with status "in_progress"
- **WHEN** therapist opens TreatmentSessionSlideover
- **THEN** observations textarea field is visible
- **AND** observations field can be edited
- **AND** save button is displayed next to observations field
- **AND** placeholder text indicates this is for session observations

#### Scenario: Hide nextSteps in in_progress status

- **GIVEN** a treatment session exists with status "in_progress"
- **WHEN** therapist opens TreatmentSessionSlideover
- **THEN** nextSteps textarea field is not visible
- **AND** no save button is displayed for nextSteps

#### Scenario: Display observations and nextSteps in finished status

- **GIVEN** a treatment session exists with status "finished"
- **WHEN** therapist opens TreatmentSessionSlideover
- **THEN** observations textarea field is visible
- **AND** observations field can be edited
- **AND** save button is displayed next to observations field
- **AND** nextSteps textarea field is visible
- **AND** nextSteps field can be edited
- **AND** save button is displayed next to nextSteps field
- **AND** placeholder text indicates this is for next steps

#### Scenario: Display observations and nextSteps in completed status

- **GIVEN** a treatment session exists with status "completed"
- **WHEN** therapist opens TreatmentSessionSlideover
- **THEN** observations textarea field is visible
- **AND** observations field can be edited
- **AND** save button is displayed next to observations field
- **AND** nextSteps textarea field is visible
- **AND** nextSteps field can be edited
- **AND** save button is displayed next to nextSteps field

#### Scenario: Save clinical notes via save button

- **GIVEN** a treatment session exists
- **WHEN** therapist types in a visible clinical notes field
- **AND** therapist clicks to save button for that field
- **THEN** updateClinicalNotes action is called for that specific field
- **AND** loading indicator is displayed on save button during update
- **AND** field content is saved to treatment session
- **AND** no auto-save occurs without button click

### Requirement: Direct Session Start Without Pre-Session

The system SHALL allow starting a session directly to `in_progress` status without saving clinical notes first, bypassing `pre_session` status entirely. In this case, a session is created in `in_progress` status when "Démarrer la séance" button is clicked.

#### Scenario: Start session directly without clinical notes

- **GIVEN** an appointment exists with id "appointment-123"
- **AND** no treatment session exists for this appointment
- **AND** therapist has not filled or saved any clinical notes fields
- **WHEN** therapist clicks "Démarrer la séance" button
- **THEN** EVA modal is displayed for initial pain level
- **AND** therapist sets pain level and confirms
- **THEN** a treatment session is created with status "in_progress"
- **AND** actualStartTime is set
- **AND** painLevelBefore is recorded
- **AND** session bypasses pre_session status

#### Scenario: Start session from pre_session after saving notes

- **GIVEN** a treatment session exists with status "pre_session"
- **AND** primaryConcern and treatmentSummary fields are saved
- **WHEN** therapist clicks "Démarrer la séance" button
- **THEN** EVA modal is displayed for initial pain level
- **AND** therapist sets pain level and confirms
- **THEN** treatment session status is updated to "in_progress"
- **AND** actualStartTime is set
- **AND** painLevelBefore is recorded
- **AND** primaryConcern and treatmentSummary values are preserved
