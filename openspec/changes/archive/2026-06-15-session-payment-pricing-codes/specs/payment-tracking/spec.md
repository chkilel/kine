## MODIFIED Requirements

### Requirement: Session Billing Cards

The system SHALL display session cards in the "Séances à facturer" section with status badges, session details, pricing code description (if available), amount, and contextual action buttons based on real payment status from the API.

#### Scenario: Unpaid session card shows pricing code and payment action

- **GIVEN** a session card has paymentStatus "unpaid" from the API
- **AND** the session has priceItem: { code: "CONSULT", description: "Consultation standard", ... }
- **WHEN** the card is displayed
- **THEN** it shows an error-colored status badge
- **AND** it shows the pricing code description "Consultation standard" alongside the amount
- **AND** it shows an "Enregistrer le paiement" button
- **AND** clicking the button opens RecordPaymentSlideover with this session pre-selected

#### Scenario: Partially paid session card shows completion action

- **GIVEN** a session card has paymentStatus "partial" from the API
- **WHEN** the card is displayed
- **THEN** it shows a warning-colored status badge with remaining amount
- **AND** it shows the pricing code description if available
- **AND** it shows a "Compléter paiement" button
- **AND** clicking the button opens RecordPaymentSlideover with this session pre-selected and amount pre-filled with remaining balance

#### Scenario: Paid session card shows receipt action

- **GIVEN** a session card has paymentStatus "paid" from the API
- **WHEN** the card is displayed
- **THEN** it shows a success-colored status badge
- **AND** it shows the pricing code description if available
- **AND** it shows a receipt download icon button
- **AND** clicking the receipt button opens ReceiptModal with the latest payment's receipt

### Requirement: Receipt Document Rendering

The system SHALL generate "reçu de paiement" documents as HTML from payment records, displaying amount, date, payment method, session details (if linked), pricing code description (if available), and organization info.

#### Scenario: Render receipt with pricing code description

- **GIVEN** a payment exists with type "session_payment"
- **AND** the linked appointment has priceItem: { code: "CONSULT", description: "Consultation standard", ... }
- **WHEN** GET /payments/payment-123/receipt is called
- **THEN** the HTML response includes the session details section
- **AND** the session details show the pricing code description "Consultation standard" alongside the amount
