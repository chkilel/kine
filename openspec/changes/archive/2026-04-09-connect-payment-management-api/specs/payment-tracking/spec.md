## ADDED Requirements

### Requirement: Patient Payment Listing

The system SHALL provide a RESTful endpoint `GET /api/patients/:id/payments` that returns all payments for a patient within the current organization, ordered by most recent first. The endpoint SHALL support query parameters: `type` (filter by payment type), `limit` (max results, default 50), and `includeVoided` (boolean, default false). Each payment SHALL include its `payment_session_items` with linked treatment session references.

#### Scenario: List all payments for a patient

- **GIVEN** a patient has id "patient-456"
- **AND** the patient has 5 payments in the current organization
- **WHEN** GET /api/patients/patient-456/payments is called
- **THEN** HTTP response is 200 OK
- **AND** response contains an array of 5 payment objects
- **AND** each payment includes sessionItems array with treatmentSessionId references
- **AND** payments are ordered by paidOn descending (most recent first)

#### Scenario: Filter payments by type

- **GIVEN** a patient has session_payment, deposit_add, and session_refund payments
- **WHEN** GET /api/patients/patient-456/payments?type=session_payment is called
- **THEN** response contains only session_payment type payments
- **AND** deposit_add and session_refund payments are excluded

#### Scenario: Include voided payments

- **GIVEN** a patient has 3 non-voided payments and 1 voided payment
- **WHEN** GET /api/patients/patient-456/payments?includeVoided=false is called (default)
- **THEN** response contains 3 payments
- **AND** the voided payment is excluded

- **WHEN** GET /api/patients/patient-456/payments?includeVoided=true is called
- **THEN** response contains 4 payments
- **AND** the voided payment is included with voidedAt and voidedById fields

#### Scenario: Limit payment results

- **GIVEN** a patient has 100 payments
- **WHEN** GET /api/patients/patient-456/payments?limit=20 is called
- **THEN** response contains at most 20 payments
- **AND** the most recent 20 payments are returned

#### Scenario: Organization isolation

- **GIVEN** a patient has payments in organization A and organization B
- **WHEN** GET /api/patients/patient-456/payments is called in organization A context
- **THEN** only organization A payments are returned
- **AND** organization B payments are excluded

### Requirement: Session Payment Status Enrichment

The system SHALL enrich the `GET /api/treatment-sessions` endpoint with per-session payment status when `patientId` and `includePaymentStatus=true` query parameters are provided. Each session SHALL include `paidCents` (net amount from non-voided session_payments minus non-voided session_refunds) and `paymentStatus` (one of: `unpaid`, `partial`, `paid`).

#### Scenario: Enrich sessions with payment status

- **GIVEN** a patient has 3 sessions with payment status: session-1 fully paid (15000/15000), session-2 partially paid (10000/15000), session-3 unpaid (0/15000)
- **WHEN** GET /api/treatment-sessions?patientId=patient-456&includePaymentStatus=true is called
- **THEN** session-1 response includes paidCents=15000 and paymentStatus="paid"
- **AND** session-2 response includes paidCents=10000 and paymentStatus="partial"
- **AND** session-3 response includes paidCents=0 and paymentStatus="unpaid"

#### Scenario: Exclude voided payments from status calculation

- **GIVEN** a session has a session_payment of 5000 cents and a voided session_refund of 5000 cents
- **WHEN** session payment status is enriched
- **THEN** paidCents is 5000 (voided refund excluded)
- **AND** paymentStatus reflects the non-voided payment only

#### Scenario: Default behavior without includePaymentStatus

- **GIVEN** a patient has sessions with payments
- **WHEN** GET /api/treatment-sessions?patientId=patient-456 is called without includePaymentStatus
- **THEN** sessions are returned without paidCents or paymentStatus fields
- **AND** behavior is unchanged from current implementation

### Requirement: Payment Voiding Composable

The system SHALL provide a `useVoidPayment` composable that wraps `POST /api/payments/:id/void` with toast notifications and query cache invalidation for patient payments and session data.

#### Scenario: Void payment via composable

- **GIVEN** a payment exists with id "payment-123" and type "session_payment"
- **AND** the user triggers void from the CancelPaymentModal
- **WHEN** useVoidPayment composable is called with paymentId="payment-123"
- **THEN** POST /api/payments/payment-123/void is called
- **AND** on success, a toast notification confirms voiding
- **AND** PAYMENT_KEYS.root cache is invalidated
- **AND** affected session query caches are invalidated

#### Scenario: Void payment error handling

- **GIVEN** a payment cannot be voided (e.g., refund type)
- **WHEN** useVoidPayment composable is called
- **THEN** an error toast is displayed with the server error message
- **AND** no cache invalidation occurs

## MODIFIED Requirements

### Requirement: Billing Page Layout

The billing tab page SHALL display a 3-column responsive grid layout with a filter bar, sessions-to-bill section, payment history preview, patient balance card, and financial summary card. All sessions for the patient SHALL be fetched once with payment status from the API. All filtering (by treatment plan) and financial summary calculations SHALL be performed client-side in the UI.

#### Scenario: Billing page renders with all sections

- **GIVEN** a user navigates to the Facturation tab of a patient
- **WHEN** the page loads
- **THEN** the page fetches all sessions with payment status from GET /api/treatment-sessions?patientId=:id&includePaymentStatus=true
- **AND** the page fetches recent payments from GET /api/patients/:id/payments?limit=5
- **AND** the page fetches patient balance from GET /api/patients/:id/balance
- **AND** the page displays a filter bar with a treatment plan selector (Toutes, Sans plan, Par plan) and per-plan session count badges
- **AND** the page displays a "Séances à facturer" section with session cards showing real payment status
- **AND** the page displays a payment history preview with recent real payments
- **AND** the page displays a patient balance sidebar card with real deposit amount and outstanding sessions
- **AND** the page displays a financial summary sidebar card computed client-side from the fetched session/payment data

#### Scenario: Filter bar groups sessions by treatment plan

- **GIVEN** the billing page is displayed with all patient sessions fetched
- **WHEN** the page renders the filter bar
- **THEN** the filter shows "Toutes" with the total session count
- **AND** the filter shows "Sans plan" with the count of sessions not linked to any treatment plan
- **AND** the filter shows each treatment plan name with its session count
- **AND** selecting a filter option filters the session cards list client-side with no additional API call

#### Scenario: Financial summary computed client-side

- **GIVEN** all patient sessions are fetched with payment status
- **WHEN** the billing page renders the financial summary card
- **THEN** total billed is computed as SUM of all session priceCents
- **AND** total collected is computed as SUM of all session paidCents
- **AND** remaining amount is computed as billed minus collected
- **AND** recovery rate is computed as collected divided by billed
- **AND** these values update instantly when the filter changes

### Requirement: Session Billing Cards

The system SHALL display session cards in the "Séances à facturer" section with status badges (Non facturé, Partiellement payé, Payé), session details, amount, and contextual action buttons based on real payment status from the API.

#### Scenario: Unpaid session card shows payment action

- **GIVEN** a session card has paymentStatus "unpaid" from the API
- **WHEN** the card is displayed
- **THEN** it shows an error-colored status badge and an "Enregistrer le paiement" button
- **AND** clicking the button opens RecordPaymentSlideover with this session pre-selected

#### Scenario: Partially paid session card shows completion action

- **GIVEN** a session card has paymentStatus "partial" from the API
- **WHEN** the card is displayed
- **THEN** it shows a warning-colored status badge with remaining amount and a "Compléter paiement" button
- **AND** clicking the button opens RecordPaymentSlideover with this session pre-selected and amount pre-filled with remaining balance

#### Scenario: Paid session card shows receipt action

- **GIVEN** a session card has paymentStatus "paid" from the API
- **WHEN** the card is displayed
- **THEN** it shows a success-colored status badge and a receipt download icon button
- **AND** clicking the receipt button opens ReceiptModal with the latest payment's receipt

### Requirement: Payment History Slideover

The system SHALL provide a slideover displaying the full payment history for a patient fetched from `GET /api/patients/:id/payments`, with filter tabs (Tous, Paiements, Avances, Remboursements, Annulés) that pass the `type` query parameter, payment items with receipt number/date/amount/reference, and action buttons for receipt download and void.

#### Scenario: Open payment history slideover

- **GIVEN** the user clicks "Voir tout l'historique" on the billing page
- **WHEN** the slideover opens
- **THEN** it fetches payments from GET /api/patients/:id/payments?includeVoided=true
- **AND** it displays the patient name, filter tabs, and a list of real payment items
- **AND** each payment item shows icon, method label, amount, date, receipt number, and linked session references from payment_session_items

#### Scenario: Filter tabs trigger API calls

- **GIVEN** the payment history slideover is open
- **WHEN** the user clicks the "Avances" filter tab
- **THEN** the slideover refetches with GET /api/patients/:id/payments?type=deposit_add
- **AND** only deposit_add payments are displayed

#### Scenario: Cancelled payment shown with visual distinction

- **GIVEN** the "Annulés" tab is selected
- **WHEN** the slideover fetches with includeVoided=true and displays results
- **THEN** voided payments appear with reduced opacity, strikethrough amount, and "Annulé" badge
- **AND** the void button is disabled for voided payments

#### Scenario: Void payment from history

- **GIVEN** a non-voided session_payment is displayed in the history
- **WHEN** the user clicks the void/cancel button
- **THEN** CancelPaymentModal opens with the payment details pre-filled
- **AND** on successful void confirmation, the payment list refreshes

### Requirement: Record Payment Slideover

The system SHALL provide a slideover for recording a payment with two steps: session selection (checkbox list with running total from real session data) and payment details (amount, deposit method toggle, payment method icons, date, notes). On submission, the slideover SHALL call `useCreatePayment` with the correct `PaymentRequestBody` and close on success.

#### Scenario: Open record payment slideover from session card

- **GIVEN** the user clicks "Enregistrer le paiement" on an unpaid session card
- **WHEN** the slideover opens
- **THEN** it fetches the patient's unpaid/partial sessions from the billing page data
- **AND** the selected session is pre-checked in step 1
- **AND** step 2 shows payment details with the session amount pre-filled from session.priceCent

#### Scenario: Submit payment to API

- **GIVEN** the user has selected sessions and filled payment details
- **WHEN** the user submits the form
- **THEN** POST /api/payments is called with type="session_payment", method, amountCents, sessionItems, and paidOn
- **AND** on success, a toast shows the receipt number
- **AND** the slideover closes
- **AND** the billing page data refreshes (sessions, payments, balance)

#### Scenario: Submit deposit-funded payment

- **GIVEN** the patient has credit balance
- **AND** the user selects "deposit" as payment method
- **THEN** the credit balance is displayed from usePatientBalance
- **AND** on submit, POST /api/payments is called with method="deposit"
- **AND** if credit is insufficient, the API error is displayed

### Requirement: Add Deposit Slideover

The system SHALL provide a slideover for adding a deposit (advance) with amount input, payment method icon selector, date field, and notes textarea. On submission, the slideover SHALL call `useCreatePayment` with type="deposit_add" and empty sessionItems.

#### Scenario: Submit deposit to API

- **GIVEN** the user fills the deposit form
- **WHEN** the user submits
- **THEN** POST /api/payments is called with type="deposit_add", method, amountCents, sessionItems=[], and paidOn
- **AND** on success, a toast shows the receipt number
- **AND** the slideover closes
- **AND** the billing page balance card and payment history refresh

### Requirement: Refund Balance Slideover

The system SHALL provide a slideover for refunding unused deposit credit, showing the current balance from `usePatientBalance`, refund amount input, refund method selector, and a warning about balance reduction. On submission, the slideover SHALL call `useCreatePayment` with type="deposit_refund".

#### Scenario: Submit refund to API

- **GIVEN** the user fills the refund form
- **AND** the refund amount does not exceed the current balance
- **WHEN** the user submits
- **THEN** POST /api/payments is called with type="deposit_refund", method, amountCents, sessionItems=[]
- **AND** on success, the slideover closes and balance refreshes

#### Scenario: Refund amount exceeds balance

- **GIVEN** the current balance is 5000 cents
- **AND** the user enters a refund amount of 10000 cents
- **WHEN** the user submits
- **THEN** the form validation prevents submission
- **AND** an error message indicates the amount exceeds available balance

### Requirement: Cancel Payment Modal

The system SHALL provide a confirmation modal for voiding a payment, showing real payment details fetched by payment ID, a warning about session status restoration, and a safety confirmation input requiring the user to type "ANNULER". On confirmation, the modal SHALL call `useVoidPayment` and close on success.

#### Scenario: Open cancel payment modal with real data

- **GIVEN** the user clicks the cancel/void button on a payment item
- **WHEN** the modal opens
- **THEN** it fetches the payment details (amount, method, date, receipt number)
- **AND** it fetches linked session items from the payment
- **AND** it displays the payment reference, amount, method, date, and linked session references
- **AND** it shows a warning that linked sessions may be restored to unpaid status

#### Scenario: Confirm void payment

- **GIVEN** the cancel payment modal is displayed
- **AND** the user has typed "ANNULER" in the confirmation input
- **WHEN** the user clicks "Annuler définitivement"
- **THEN** POST /api/payments/:id/void is called via useVoidPayment
- **AND** on success, the modal closes
- **AND** a toast confirms the payment was voided
- **AND** the billing page and payment history refresh
