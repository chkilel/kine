## MODIFIED Requirements

### Requirement: Payment Receipt Viewing

The system SHALL allow users to view a payment receipt by providing a `paymentId`. The `ReceiptModal` component MUST accept a `paymentId` prop and fetch the payment and its receipt directly, without requiring a `sessionId`.

#### Scenario: View receipt for a specific payment

- **WHEN** a user opens the receipt modal with a valid `paymentId`
- **THEN** the system fetches the payment and displays its receipt in an iframe

#### Scenario: No payment found

- **WHEN** a user opens the receipt modal with a `paymentId` that does not resolve to a valid payment
- **THEN** the modal displays "Aucun paiement trouvé"
