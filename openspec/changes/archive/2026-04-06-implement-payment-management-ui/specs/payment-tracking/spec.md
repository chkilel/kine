## ADDED Requirements

### Requirement: Billing Page Layout

The billing tab page SHALL display a 3-column responsive grid layout with a filter bar, sessions-to-bill section, payment history preview, patient balance card, and financial summary card. All data SHALL be static/mock. The "Enregistrer un paiement" button SHALL be placed in the right sidebar above the balance card.

#### Scenario: Billing page renders with all sections

- **GIVEN** a user navigates to the Facturation tab of a patient
- **WHEN** the page loads
- **THEN** the page displays a segment filter bar with plan selector and status filter
- **AND** the page displays a "Séances à facturer" section with session cards
- **AND** the page displays a payment history preview with recent payments
- **AND** the right sidebar displays an "Enregistrer un paiement" primary button above the patient balance card
- **AND** the page displays a financial summary sidebar card with totals and recovery rate progress bar

### Requirement: Plan Segment Filter

The system SHALL display a 3-button segment control for plan filtering: `Toutes` (all sessions), `Sans plan` (sessions without a treatment plan), and `Par plan` (opens a popover dropdown of treatment plans with check mark on selected plan). Each segment shows a session count.

#### Scenario: Filter by Toutes shows all sessions

- **GIVEN** the billing page is displayed
- **WHEN** the user selects the "Toutes" segment
- **THEN** all session cards are displayed regardless of treatment plan association

#### Scenario: Filter by Sans plan shows unlinked sessions only

- **GIVEN** the billing page is displayed
- **WHEN** the user selects the "Sans plan" segment
- **THEN** only session cards not linked to any treatment plan are displayed

#### Scenario: Par plan segment opens plan dropdown

- **GIVEN** the billing page is displayed
- **WHEN** the user clicks the "Par plan" segment
- **THEN** a popover dropdown appears listing available treatment plans
- **AND** clicking a plan name filters sessions to that plan
- **AND** the selected plan shows a check mark indicator

### Requirement: Session Billing Cards

The system SHALL display session cards in the "Séances à facturer" section with status badges (Non facturé, Partiellement payé, Payé), session details, amount, and contextual action buttons.

#### Scenario: Unpaid session card shows payment action

- **GIVEN** a session card has status "Non facturé"
- **WHEN** the card is displayed
- **THEN** it shows an error-colored status badge and an "Enregistrer le paiement" button

#### Scenario: Partially paid session card shows completion action

- **GIVEN** a session card has status "Partiellement payé"
- **WHEN** the card is displayed
- **THEN** it shows a warning-colored status badge with remaining amount and a "Compléter paiement" button

#### Scenario: Paid session card shows receipt action

- **GIVEN** a session card has status "Payé"
- **WHEN** the card is displayed
- **THEN** it shows a success-colored status badge and a receipt download icon button

### Requirement: Payment History Slideover

The system SHALL provide a slideover displaying the full payment history for a patient with filter tabs (Tous, Paiements, Avances, Remboursements, Annulés), payment items with receipt number/date/amount/reference, and action buttons for download and void.

#### Scenario: Open payment history slideover

- **GIVEN** the user clicks "Voir tout l'historique" on the billing page
- **WHEN** the slideover opens
- **THEN** it displays the patient name, filter tabs, and a list of payment items
- **AND** each payment item shows icon, method label, amount, date, receipt number, and linked session references

#### Scenario: Cancelled payment shown with visual distinction

- **GIVEN** a voided payment exists in the history
- **WHEN** the slideover is displayed
- **THEN** the voided payment appears with reduced opacity, strikethrough amount, and "Annulé" badge

### Requirement: Record Payment Slideover

The system SHALL provide a slideover for recording a payment with two steps: session selection (checkbox list with running total) and payment details (amount, credit usage toggle, payment method icons, date, notes).

#### Scenario: Open record payment slideover from session card

- **GIVEN** the user clicks "Enregistrer le paiement" on an unpaid session card
- **WHEN** the slideover opens
- **THEN** it displays the selected session pre-checked in step 1
- **AND** step 2 shows payment details with the session amount pre-filled

#### Scenario: Payment method selection via icon buttons

- **GIVEN** the record payment slideover is open at step 2
- **WHEN** the user clicks a payment method icon button
- **THEN** that method becomes visually selected (border + background highlight)
- **AND** the other methods are deselected

#### Scenario: Credit usage toggle

- **GIVEN** the patient has available credit balance
- **WHEN** the user toggles "Utiliser l'avance disponible"
- **THEN** the credit balance is shown and the payment amount reflects credit usage

### Requirement: Add Deposit Slideover

The system SHALL provide a slideover for adding a deposit (advance) with amount input, payment method icon selector, date field, and notes textarea.

#### Scenario: Open add deposit slideover

- **GIVEN** the user clicks "Ajouter une avance" on the balance card
- **WHEN** the slideover opens
- **THEN** it displays an info banner explaining advance behavior
- **AND** it shows amount, payment method, date, and notes fields

#### Scenario: Deposit payment method selection

- **GIVEN** the add deposit slideover is open
- **WHEN** the user selects a payment method icon
- **THEN** that method is visually highlighted and the others are deselected

### Requirement: Refund Balance Slideover

The system SHALL provide a slideover/modal for refunding unused deposit credit, showing current balance, refund amount input, refund method selector, and a warning about balance reduction.

#### Scenario: Open refund balance slideover

- **GIVEN** the user clicks "Rembourser le solde" on the balance card
- **WHEN** the slideover opens
- **THEN** it displays the current advance balance
- **AND** it shows amount, refund method, and a warning banner

### Requirement: Cancel Payment Modal

The system SHALL provide a confirmation modal for voiding a payment, showing payment details, a warning about session status restoration, and a safety confirmation input requiring the user to type "ANNULER".

#### Scenario: Open cancel payment modal

- **GIVEN** the user clicks the cancel/void button on a payment item
- **WHEN** the modal opens
- **THEN** it displays the payment reference, amount, method, date, and linked sessions
- **AND** it shows a warning that linked sessions will be restored to unpaid status

#### Scenario: Safety confirmation input

- **GIVEN** the cancel payment modal is displayed
- **WHEN** the user types "ANNULER" in the confirmation input
- **THEN** the "Annuler définitivement" button becomes enabled
- **AND** before typing the confirmation, the button is disabled (opacity 50%)
