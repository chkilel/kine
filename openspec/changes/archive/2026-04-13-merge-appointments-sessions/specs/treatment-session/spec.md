## REMOVED Requirements

### Requirement: Treatment Session Creation

**Reason**: Treatment sessions no longer exist as a separate entity. The appointment itself stores all clinical fields. Notes are saved directly on the appointment via PATCH /api/appointments/[id]/clinical-notes. Session start is achieved by transitioning appointment status to in_progress via POST /api/appointments/[id]/start.
**Migration**: Replace all POST /api/treatment-sessions calls with either PATCH /api/appointments/[id]/clinical-notes (for pre-session notes) or POST /api/appointments/[id]/start (to begin the session).

### Requirement: Treatment Session Retrieval

**Reason**: Treatment sessions are merged into appointments. Use GET /api/appointments/[id] to retrieve all data including clinical, timer, and billing fields.
**Migration**: Replace all GET /api/treatment-sessions/[id] calls with GET /api/appointments/[id].

### Requirement: Treatment Session Update

**Reason**: Clinical notes updates now go to PATCH /api/appointments/[id]/clinical-notes. Status-gated field visibility logic is preserved in the appointment endpoint.
**Migration**: Replace all PATCH /api/treatment-sessions/[id]/clinical-notes calls with PATCH /api/appointments/[id]/clinical-notes.

### Requirement: Treatment Session Pause and Resume

**Reason**: Pause and resume are now appointment sub-routes: POST /api/appointments/[id]/pause and POST /api/appointments/[id]/resume.
**Migration**: Update endpoint URLs from /api/treatment-sessions/ to /api/appointments/.

### Requirement: Treatment Session Completion

**Reason**: Session completion (in_progress → finished) is now POST /api/appointments/[id]/end.
**Migration**: Update endpoint URL from /api/treatment-sessions/[id]/end to /api/appointments/[id]/end.

### Requirement: Treatment Session Billing Data

**Reason**: Billing fields (priceCents) are now on the appointment directly. Payment status is enriched via the appointment query endpoint.
**Migration**: Update API calls to reference appointment endpoints.

### Requirement: Data Integrity Constraints

**Reason**: The unique constraint on appointmentId no longer applies since the session IS the appointment. Organization isolation is enforced on the appointments table directly.
**Migration**: Remove unique constraint checks for appointmentId on treatment sessions.

### Requirement: Display Treatment Session Timing Information

**Reason**: Timing information is now displayed from the appointment record directly. The TreatmentSessionTimingCard component reads from the unified appointment object.
**Migration**: Update component to read timing fields from appointment instead of appointment.treatmentSession.

### Requirement: EVA Modal Component

**Reason**: No change to EVA modal behavior — it remains the same component. Only the API call after confirmation changes from POST /api/treatment-sessions/[id]/start to POST /api/appointments/[id]/start.
**Migration**: Update API call URL in the component.

### Requirement: Mandatory Initial EVA at Session Start

**Reason**: EVA capture remains mandatory before starting. The API endpoint changes from /api/treatment-sessions/[id]/start to /api/appointments/[id]/start with identical body schema.
**Migration**: Update API call URL.

### Requirement: EVA Display During Session

**Reason**: EVA display reads painLevelBefore/painLevelAfter from the appointment directly instead of appointment.treatmentSession.
**Migration**: Update component data source from nested treatmentSession to flat appointment fields.

### Requirement: Mandatory End EVA at Session Completion

**Reason**: End EVA capture remains mandatory. API endpoint changes from /api/treatment-sessions/[id]/end to /api/appointments/[id]/end.
**Migration**: Update API call URL.

### Requirement: Pre-Session Preparation Phase

**Reason**: The pre_session status is eliminated. Clinical notes can be saved on scheduled/confirmed appointments directly. The "preparation" is implicit in the scheduled/confirmed state.
**Migration**: Remove pre_session status references. Save notes directly on the appointment.

### Requirement: Post-Session Documentation Phase

**Reason**: The finished status is preserved in the unified state machine. Post-session documentation works identically on the appointment in finished status.
**Migration**: No behavioral change — update data source from treatmentSession to appointment.

### Requirement: Automatic Completion on Billing

**Reason**: When billing is completed (paid in full), the appointment status transitions from finished to completed, same as before.
**Migration**: Update the billing logic to reference appointment.status instead of treatmentSession.status.

### Requirement: Treatment Session Cancellation

**Reason**: Cancellation is now handled by POST /api/appointments/[id]/cancel with the same validation logic (only cancellable from scheduled, confirmed, in_progress).
**Migration**: Update API call URL from /api/treatment-sessions/[id]/cancel to /api/appointments/[id]/cancel.

### Requirement: Session Cost Calculation with Inheritance

**Reason**: Cost inheritance logic remains identical — it reads from treatment plan and organization pricing based on appointment.location. Only the storage location changes from treatment_session.priceCent to appointment.priceCents.
**Migration**: Update field references from treatmentSession.priceCent to appointment.priceCents.

### Requirement: Session Cost Override

**Reason**: Cost override works identically via PATCH /api/appointments/[id]/price instead of PATCH /api/treatment-sessions/[id]/price.
**Migration**: Update API call URL.

### Requirement: Immediate Session Billing

**Reason**: Immediate billing transitions appointment.status from finished to completed, same flow as before.
**Migration**: Update status field references from treatmentSession to appointment.

### Requirement: Receipt Generation

**Reason**: Receipt generation reads session details from the appointment directly. The data shape is the same.
**Migration**: Update data source references.

### Requirement: Session Cost Display with Inheritance Breakdown

**Reason**: Cost display reads from appointment.priceCents. Breakdown calculation is unchanged.
**Migration**: Update field references.

### Requirement: Session Pricing Field

**Reason**: priceCents is now a column on the appointments table.
**Migration**: Update schema references.

### Requirement: Inherited Session Price Calculation

**Reason**: Price calculation logic is unchanged — only the target entity changes from treatment_session to appointment.
**Migration**: Update entity references in calculation logic.

### Requirement: Session Price Display Before Creation

**Reason**: Price display reads from appointment context (treatment plan + organization pricing). No separate session creation needed.
**Migration**: Update component to read from appointment object directly.

### Requirement: Price Capture on Session Creation

**Reason**: priceCents is calculated and set on the appointment when it transitions to in_progress (or can be set at creation time).
**Migration**: Update the start endpoint to calculate and set priceCents.

### Requirement: Price Override in Session UI

**Reason**: Price override works via PATCH /api/appointments/[id]/price.
**Migration**: Update API call URL.

### Requirement: Extend Treatment Session Duration

**Reason**: Duration extension works via PATCH /api/appointments/[id]/extend.
**Migration**: Update API call URL.

### Requirement: Treatment Session Action Endpoints

**Reason**: All session action endpoints move to /api/appointments/[id]/\* sub-routes. The actions are: start, pause, resume, end, cancel.
**Migration**: Update all endpoint URLs.

### Requirement: Session Payment Status Enrichment

**Reason**: Payment status enrichment moves from GET /api/treatment-sessions?includePaymentStatus=true to GET /api/appointments?includePaymentStatus=true.
**Migration**: Update API endpoint and query parameters.
