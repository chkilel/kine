# Treatment Session Specification Deltas

## ADDED Requirements

### Requirement: Session Cost Calculation with Inheritance

The system SHALL calculate treatment session costs following an inheritance chain: session cost override → treatment plan location-based override → organization location-based default. The calculation must be transparent to show therapists the cost breakdown.

#### Scenario: Calculate cost using organization default

- **GIVEN** a treatment session exists with appointment.location "clinic"
- **AND** session has no costOverride
- **AND** treatment plan has no location-specific overrides
- **AND** organization.defaultSessionCostClinic is 5000 (50 Dh)
- **WHEN** GET /api/treatment-sessions/session-123/cost is called
- **THEN** calculated cost is 5000 cents
- **AND** response includes inheritance chain: {
  orgDefault: { location: 'clinic', cost: 5000 },
  planOverride: null,
  sessionOverride: null,
  finalCost: 5000
  }

#### Scenario: Calculate cost using treatment plan override

- **GIVEN** a treatment session exists with appointment.location "home"
- **AND** session has no costOverride
- **AND** treatment plan has sessionCostHomeOverride 7000 (70 Dh)
- **AND** organization.defaultSessionCostHome is 6500 (65 Dh)
- **WHEN** GET /api/treatment-sessions/session-123/cost is called
- **THEN** calculated cost is 7000 cents
- **AND** response includes inheritance chain: {
  orgDefault: { location: 'home', cost: 6500 },
  planOverride: { location: 'home', cost: 7000 },
  sessionOverride: null,
  finalCost: 7000
  }

#### Scenario: Calculate cost using session override

- **GIVEN** a treatment session exists
- **AND** session has costOverride 6000 (60 Dh)
- **AND** treatment plan has location-specific overrides
- **AND** organization has default pricing
- **WHEN** GET /api/treatment-sessions/session-123/cost is called
- **THEN** calculated cost is 6000 cents
- **AND** response includes inheritance chain: {
  orgDefault: { location: 'clinic', cost: 5000 },
  planOverride: { location: 'clinic', cost: 5500 },
  sessionOverride: { cost: 6000 },
  finalCost: 6000
  }

#### Scenario: Calculate cost for different location types

- **GIVEN** a treatment session exists with appointment.location "telehealth"
- **AND** organization.defaultSessionCostTelehealth is 4000 (40 Dh)
- **WHEN** GET /api/treatment-sessions/session-123/cost is called
- **THEN** calculated cost is 4000 cents
- **AND** telehealth pricing is used

### Requirement: Session Cost Override

The system SHALL allow therapists to override the calculated cost for individual treatment sessions, storing the manual override value.

#### Scenario: Override session cost

- **GIVEN** a treatment session exists with status "finished"
- **AND** calculated cost is 5000 cents
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body {
  costOverride: 6000
  }
- **THEN** HTTP response is 200 OK
- **AND** session.costOverride is set to 6000
- **AND** final cost for billing uses 6000 cents

#### Scenario: Remove session cost override

- **GIVEN** a treatment session has costOverride 6000
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body {
  costOverride: null
  }
- **THEN** HTTP response is 200 OK
- **AND** session.costOverride is set to null
- **AND** cost reverts to calculated value from inheritance chain

### Requirement: Immediate Session Billing

The system SHALL allow therapists to immediately bill a completed session as paid, marking it as paid and generating a simple receipt without creating a formal invoice.

#### Scenario: Bill session immediately as paid

- **GIVEN** a treatment session exists with id "session-123"
- **AND** session status is "finished"
- **AND** calculated cost is 5000 cents
- **WHEN** POST /api/treatment-sessions/session-123/bill-immediate is called with body {
  paidDate: "2026-02-20",
  cost: 5000
  }
- **THEN** HTTP response is 200 OK
- **AND** session.cost is set to 5000
- **AND** session.billed is set to "2026-02-20"
- **AND** session.status transitions from "finished" to "completed"
- **AND** a receipt is created linking to the session
- **AND** receipt is marked as paid

#### Scenario: Bill session immediately with custom cost

- **GIVEN** a treatment session exists with calculated cost 5000
- **AND** therapist wants to charge a different amount
- **WHEN** POST /api/treatment-sessions/session-123/bill-immediate is called with body {
  paidDate: "2026-02-20",
  cost: 5500
  }
- **THEN** HTTP response is 200 OK
- **AND** session.cost is set to 5500
- **AND** session.costOverride is set to 5500 (for future reference)
- **AND** session is marked as billed and completed
- **AND** receipt uses the custom cost

#### Scenario: Prevent immediate billing for unfinished session

- **GIVEN** a treatment session exists with status "in_progress"
- **WHEN** POST /api/treatment-sessions/session-123/bill-immediate is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Cannot bill a session that is not finished"
- **AND** no billing occurs

#### Scenario: Prevent immediate billing for already billed session

- **GIVEN** a treatment session already has billed date set
- **WHEN** POST /api/treatment-sessions/session-123/bill-immediate is called
- **THEN** HTTP response is 400 Bad Request
- **AND** error message states "Session is already billed"
- **AND** no duplicate billing occurs

### Requirement: Receipt Generation

The system SHALL generate simple receipts on-demand for immediately billed sessions, displaying session details, amount paid, date, and therapist signature. Receipts are not stored in the database.

#### Scenario: Generate receipt for billed session

- **GIVEN** a treatment session was billed immediately with cost 5000 on 2026-02-20
- **AND** session has billed date, cost, and therapist data
- **WHEN** therapist clicks "Télécharger reçu" button in UI
- **THEN** client-side PDF is generated using jsPDF
- **AND** PDF includes session date and time
- **AND** PDF includes session location (cabinet/domicile/téléconsultation)
- **AND** PDF includes patient name
- **AND** PDF includes amount: "50,00 Dh"
- **AND** PDF includes payment date: "20/02/2026"
- **AND** PDF includes therapist name and signature field
- **AND** PDF includes "REÇU" heading
- **AND** PDF is a simple, printable receipt
- **AND** PDF is downloaded to user's device

### Requirement: Session Cost Display with Inheritance Breakdown

The system SHALL display the calculated session cost with a visible breakdown showing the inheritance chain (org default → plan override → session override) so therapists understand how the cost was determined.

#### Scenario: Display cost breakdown in session slideover

- **GIVEN** a treatment session exists with location "home"
- **AND** org default is 6500, plan override is 7000
- **WHEN** therapist opens TreatmentSessionSlideover after session finishes
- **THEN** a BillingCard component displays
- **AND** final cost is shown: "70,00 Dh"
- **AND** breakdown is displayed:
  - "Tarif cabinet (défaut): 65,00 Dh"
  - "Surcharge plan de traitement: +5,00 Dh"
  - "Total: 70,00 Dh"

#### Scenario: Display cost breakdown with session override

- **GIVEN** a treatment session has costOverride 6000
- **AND** calculated cost from org/plan was 5000
- **WHEN** therapist views session cost
- **THEN** breakdown is displayed:
  - "Tarif calculé: 50,00 Dh"
  - "Ajustement manuel: +10,00 Dh"
  - "Total: 60,00 Dh"

#### Scenario: Display cost breakdown for different locations

- **GIVEN** a treatment session exists with location "telehealth"
- **AND** org default for telehealth is 4000
- **WHEN** therapist views session cost
- **THEN** breakdown shows:
  - "Tarif téléconsultation (défaut): 40,00 Dh"

## MODIFIED Requirements

### Requirement: Treatment Session Billing Data

The system SHALL support storing billing-related data on treatment sessions. Setting `billed` field on a session with `finished` status automatically transitions it to `completed`.

#### Scenario: Update billing information

- **GIVEN** a treatment session exists with id "session-123" with status "finished"
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body {
  billed: "2026-01-16",
  insuranceClaimed: true,
  cost: 6500
  }
- **THEN** HTTP response is 200 OK
- **AND** billing fields are updated
- **AND** status is automatically updated to "completed"
- **AND** cost is stored in cents (6500 = 65.00 Dh)

#### Scenario: Update billing information without status change

- **GIVEN** a treatment session exists with id "session-123" with status "completed"
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body { cost: 7000 }
- **THEN** HTTP response is 200 OK
- **AND** cost is updated to 7000
- **AND** status remains "completed"

#### Scenario: Use cost override when billing information is updated

- **GIVEN** a treatment session has costOverride 6000
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body {
  billed: "2026-01-16"
  }
- **THEN** session.cost is set to 6000 (from costOverride)
- **AND** session is marked as billed
- **AND** status transitions to "completed"

#### Scenario: Calculate cost when billing information is updated without cost override

- **GIVEN** a treatment session has no costOverride
- **AND** session is associated with treatment plan and organization with pricing
- **WHEN** PATCH /api/treatment-sessions/session-123 is called with body {
  billed: "2026-01-16"
  }
- **THEN** session.cost is calculated using inheritance chain
- **AND** calculated cost is stored
- **AND** session is marked as billed
- **AND** status transitions to "completed"
