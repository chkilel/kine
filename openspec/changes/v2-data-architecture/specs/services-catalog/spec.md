## ADDED Requirements

### Requirement: Services Table Schema

The system SHALL store configurable appointment types in a `services` table, replacing the hardcoded `VALID_APPOINTMENT_TYPES` enum. Each service is org-scoped and represents an appointment type (e.g., "Bilan kiné", "Rééducation post-op", "Massage sportif").

#### Scenario: Create a service

- **WHEN** a service is created with name `Bilan kiné` and default duration 60 minutes
- **THEN** the record is org-scoped (`orgId` set)
- **AND** `name` is stored (unique within org)
- **AND** `defaultDurationMinutes` is 60
- **AND** `isActive` is `true`

#### Scenario: Services are org-scoped

- **WHEN** organization A creates a service `Bilan kiné`
- **THEN** organization B SHALL NOT see it in their services list

### Requirement: Service Default Pricing

Services MAY store default pricing per location type (`clinic`, `home`, `telehealth`) as a JSON object matching treatment plan pricing structure. When a service is selected for an appointment, its default pricing can be used to pre-populate treatment plan pricing.

#### Scenario: Service with default pricing

- **WHEN** a service `Bilan kiné` is created with `defaultPricing: { clinic: 5000, home: 6500, telehealth: 4000 }`
- **THEN** the pricing is stored as JSON

#### Scenario: Service without pricing

- **WHEN** a service is created without pricing
- **THEN** `defaultPricing` is NULL
- **AND** pricing falls back to organization defaults

### Requirement: Service Activation State

Services SHALL support soft activation/deactivation via `isActive` boolean. Deactivated services are excluded from appointment creation dropdowns but remain in historical data.

#### Scenario: Deactivate a service

- **WHEN** a service's `isActive` is set to `false`
- **THEN** it SHALL NOT appear in appointment creation service selection
- **AND** existing appointments referencing this service remain valid

#### Scenario: Reactivate a service

- **WHEN** a service's `isActive` is set back to `true`
- **THEN** it SHALL appear in appointment creation service selection again

### Requirement: Service Soft Delete

Services SHALL support soft delete via `deletedAt`. Soft-deleted services are excluded from all queries.

#### Scenario: Soft delete a service

- **WHEN** DELETE is called on a service
- **THEN** `deletedAt` is set to current timestamp
- **AND** existing appointments referencing this service remain valid (FK not nullified)

### Requirement: Appointment References Service

Appointments SHALL reference a service via `serviceId` FK. This replaces the old `type` enum field.

#### Scenario: Appointment created with service

- **WHEN** an appointment is created with `serviceId = "bilan-kine-123"`
- **THEN** the appointment is linked to the service
- **AND** the service name and details can be resolved via the FK

#### Scenario: Appointment without service (legacy/manual)

- **WHEN** an appointment is created without `serviceId`
- **THEN** `serviceId` is NULL
- **AND** the appointment type is unspecified
