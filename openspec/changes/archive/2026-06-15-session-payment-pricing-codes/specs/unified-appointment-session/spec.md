## MODIFIED Requirements

### Requirement: Price and Extend on Appointment

The system SHALL support updating the price by selecting a pricing code from the organization's catalog (via `priceItemCode`), NOT by entering a free-form amount. The system resolves the code to a price item snapshot and derives `priceCents` from the selected item's rate for the session's location. Extending duration is unchanged.

#### Scenario: Update appointment price via pricing code

- **GIVEN** an appointment exists with status "finished"
- **AND** appointment location is "clinic"
- **AND** the organization has a price item with code "CONSULT" and rateCent: { clinic: 15000, home: 25000, telehealth: 12000 }
- **WHEN** PATCH /api/appointments/[id]/price is called with body { priceItemCode: "CONSULT" }
- **THEN** appointment.priceItem is set to { code: "CONSULT", description: "Consultation standard", rateCent: { clinic: 15000, home: 25000, telehealth: 12000 } }
- **AND** appointment.priceCents is set to 15000
- **AND** HTTP response is 200 OK

#### Scenario: Extend appointment duration

- **GIVEN** an appointment exists with status "in_progress"
- **WHEN** PATCH /api/appointments/[id]/extend is called with body { extendedDurationMinutes: 10 }
- **THEN** extendedDurationMinutes is incremented by 10
- **AND** HTTP response is 200 OK

### Requirement: Merged Database Schema

The system SHALL store all scheduling, clinical, timer, billing, and locking data in a single `appointments` table. No `treatment_sessions` table exists. The `appointments` table SHALL include a nullable `price_item` JSON column for pricing code snapshots.

#### Scenario: Appointments table includes pricing code column

- **GIVEN** the database schema is migrated
- **WHEN** the appointments table is inspected
- **THEN** it contains a `price_item` column of type TEXT (JSON) that is nullable
- **AND** the column stores pricing code snapshots with shape: { code: string, description: string, rateCent: { clinic: number, home: number, telehealth: number } }

### Requirement: Appointment Payment Status

The system SHALL enrich the GET /api/appointments endpoint with per-appointment payment status when `includePaymentStatus=true` query parameter is provided. Each appointment includes `paidCents`, `paymentStatus`, and `priceItemDescription` (from the price item snapshot, if present).

#### Scenario: Enrich appointments with payment status and pricing code

- **GIVEN** a patient has appointments with payment status: apt-1 paid (15000/15000), apt-2 unpaid (0/10000)
- **AND** apt-1 has priceItem: { code: "CONSULT", description: "Consultation standard", ... }
- **WHEN** GET /api/appointments?patientId=patient-456&includePaymentStatus=true is called
- **THEN** apt-1 response includes paidCents=15000, paymentStatus="paid", and priceItemDescription="Consultation standard"
- **AND** apt-2 response includes paidCents=0 and paymentStatus="unpaid"

#### Scenario: Appointment without price item shows no description

- **GIVEN** an appointment has priceItem null and priceCents 0
- **WHEN** payment status is enriched
- **THEN** priceItemDescription is null
