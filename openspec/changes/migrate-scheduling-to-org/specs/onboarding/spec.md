## MODIFIED Requirements

### Requirement: Registration form excludes scheduling settings
The registration form (`register.vue`) SHALL NOT include `defaultAppointmentDuration`, `appointmentGapMinutes`, or `slotIncrementMinutes`.

#### Scenario: New user registration
- **WHEN** a new therapist registers
- **THEN** the signup form SHALL only collect: firstName, lastName, email, specialization, licenseNumber, phoneNumbers, password
- **THEN** the `signUpSchema` SHALL NOT validate scheduling fields
- **THEN** the API call to Better Auth signUp SHALL NOT include scheduling fields
