# treatment-session Specification Delta

## ADDED Requirements

### Requirement: Session Pricing Field

The system SHALL store pricing information for treatment sessions.

#### Scenario: Add cost field to treatment_sessions table

- **GIVEN** treatment_sessions table exists
- **WHEN** a new column `cost` is added as integer, nullable
- **THEN** column stores session price in cents
- **AND** null values indicate price has not been calculated yet

### Requirement: Inherited Session Price Calculation

The system SHALL calculate inherited session price based on the appointment context. If the appointment belongs to a treatment plan, the price is inherited from the treatment plan's location-based pricing. If the appointment is an individual consultation (no treatment plan), the price is inherited from the organization's default location-based pricing.

#### Scenario: Calculate price for plan-based session

- **GIVEN** an appointment exists with location "clinic"
- **AND** appointment has treatmentPlanId "plan-123"
- **AND** treatment plan has pricing.clinic = 7000 (70 Dh)
- **AND** organization has sessionRates.clinic = 5000 (50 Dh)
- **WHEN** a session is created for this appointment
- **THEN** session.cost is set to 7000 cents
- **AND** plan pricing takes precedence over organization default

#### Scenario: Calculate price for individual consultation

- **GIVEN** an appointment exists with location "home"
- **AND** appointment has no treatmentPlanId (individual consultation)
- **AND** organization has sessionRates.home = 6500 (65 Dh)
- **WHEN** a session is created for this appointment
- **THEN** session.cost is set to 6500 cents
- **AND** organization default pricing is used

#### Scenario: Calculate price for telehealth session

- **GIVEN** an appointment exists with location "telehealth"
- **AND** appointment belongs to a treatment plan with no telehealth pricing
- **AND** organization has sessionRates.telehealth = 4000 (40 Dh)
- **WHEN** a session is created
- **THEN** session.cost is set to 4000 cents
- **AND** system falls back to organization default when plan has no override

### Requirement: Session Price Display Before Creation

The system SHALL display the inherited session price in the Treatment Session Slideover when opening the slideover, before a treatment session is created or saved. The displayed price shall reflect the inherited value (not 0 or null).

#### Scenario: Display inherited price for plan-based session

- **GIVEN** a therapist opens TreatmentSessionSlideover for an appointment
- **AND** appointment location is "clinic"
- **AND** appointment belongs to a treatment plan with pricing.clinic = 7000
- **AND** no treatment session exists yet
- **WHEN** the slideover is displayed
- **THEN** a price section shows "70,00 Dh"
- **AND** price is calculated from treatment plan pricing
- **AND** price is displayed even though session is not yet saved

#### Scenario: Display inherited price for individual consultation

- **GIVEN** a therapist opens TreatmentSessionSlideover for an appointment
- **AND** appointment location is "home"
- **AND** appointment has no treatment plan
- **AND** organization has sessionRates.home = 6500
- **WHEN** the slideover is displayed
- **THEN** a price section shows "65,00 Dh"
- **AND** price is calculated from organization default pricing
- **AND** price is displayed even though session is not yet saved

### Requirement: Price Capture on Session Creation

The system SHALL calculate and store the inherited session price when creating a treatment session.

#### Scenario: Store inherited price on session creation

- **GIVEN** an appointment exists with location "clinic"
- **AND** appointment belongs to a treatment plan with pricing.clinic = 7000
- **WHEN** POST /api/treatment-sessions is called with body { appointmentId: "appointment-123" }
- **THEN** a treatment session is created
- **AND** session.cost is set to 7000 cents
- **AND** price is calculated and persisted immediately

### Requirement: Price Override in Session UI

The system SHALL allow therapists to modify the session price through the Treatment Session Slideover UI, using the existing session update API. Therapists can set a custom price at any time.

#### Scenario: Override session price

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session.cost is 5000 (inherited)
- **WHEN** therapist enters a custom price of 6000 in the UI and saves
- **THEN** PATCH /api/treatment-sessions/session-123 is called with body { cost: 6000 }
- **THEN** session.cost is updated to 6000 cents
- **AND** displayed price changes to "60,00 Dh"

#### Scenario: Modify price in any session status

- **GIVEN** a treatment session exists in any status (pre_session, in_progress, finished, or completed)
- **WHEN** therapist modifies the price in the UI
- **THEN** price is successfully updated via PATCH API
- **AND** new price is reflected in the UI immediately
- **AND** session status remains unchanged
