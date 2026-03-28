## 1. Database Schema Implementation

- [x] 1.1 Create `server/database/schema/payment.ts` with `payments` table definition
  - Define table with all required fields (id, organizationId, patientId, recordedById, amountCents, currency, type, method, receiptNumber, notes, paidOn, createdAt, updatedAt, voidedAt, voidedById)
  - Add indexes: (organizationId, patientId, paidOn), (organizationId, type)
  - Define relations to organizations, patients, users

- [x] 1.2 Create `server/database/schema/payment-session-items.ts` with `payment_session_items` table definition
  - Define table with fields (id, paymentId, treatmentSessionId, amountCents)
  - Add indexes: (paymentId), (treatmentSessionId)
  - Define relations to payments and treatmentSessions

- [x] 1.3 Update `server/database/schema/treatment-session.ts` to remove `billed` field
  - Remove `billed` field from table definition
  - Keep `priceCent` and `insuranceClaimed` fields

- [x] 1.4 Update `shared/types/org.types.ts` to add receipt config to `orgFiscalSchema`
  - Add `receiptPrefix: z.string().default('REC')`
  - Add `nextReceiptNumber: z.number().min(1).default(1)`
  - Update `OrgFiscal` type to include new fields

- [x] 1.5 Update `server/database/schema/index.ts` to export new schema files
  - Add export for payments
  - Add export for paymentSessionItems

- [x] 1.6 Create database migration to add new tables and modify existing tables
  - Run Drizzle migration to create `payments` table
  - Run Drizzle migration to create `payment_session_items` table
  - Run Drizzle migration to drop `billed` column from `treatment_sessions`

- [x] 1.7 Update database seed data to include receipt configuration
  - Add `receiptPrefix` and `nextReceiptNumber` to organizations.fiscal
  - Seed sample payment records for testing

## 2. Database View and Utilities

- [x] 2.1 Create `patient_credit_balances` view for convenient balance queries
  - Define view query: `SELECT patientId, organizationId, SUM(CASE WHEN type='deposit' THEN amountCents ELSE 0 END) - SUM(CASE WHEN type='credit_usage' THEN amountCents ELSE 0 END) AS balanceCents FROM payments WHERE voidedAt IS NULL GROUP BY patientId, organizationId`

- [x] 2.2 Create utility function `generateReceiptNumber()` in `server/utils/receipt-number.ts`
  - Implement transactional read-modify-write pattern
  - Read organization fiscal config
  - Format receipt number: `{prefix}-{year}-{padded number}`
  - Increment nextReceiptNumber atomically
  - Return formatted receipt number

## 3. API Endpoints - Payment Creation

- [x] 3.1 Create `server/api/payments/index.post.ts` endpoint
  - Implement Zod validation schema for payment request body
  - Validate payment type, amount, method, date
  - Validate session items for non-deposit types (sum must equal amount)
  - Validate session items absence for deposit type
  - Check credit balance for credit_usage type
  - Generate receipt number using `generateReceiptNumber()`
  - Create payment record in transaction
  - Create payment_session_items records if applicable
  - Update session status to 'completed' if session was 'finished' and payment type is 'payment' or 'credit_usage'
  - Return created payment with receipt number

- [x] 3.2 Add error handling for payment validation failures
  - Return 400 Bad Request for invalid inputs with descriptive error messages
  - Return 409 Conflict for insufficient credit balance
  - Handle transaction rollbacks gracefully

## 4. API Endpoints - Payment Voiding

- [x] 4.1 Create `server/api/payments/[id]/void.post.ts` endpoint
  - Validate user has voiding permissions
  - Check payment exists and is not already voided
  - Set voidedAt to current timestamp
  - Set voidedById to authenticated user ID
  - Update related session status from 'completed' to 'finished' if this was the only non-voided payment
  - Return success message

- [x] 4.2 Add authorization check for payment voiding
  - Ensure only authorized users can void payments
  - Return 403 Forbidden if user lacks permissions

## 5. API Endpoints - Receipt Generation

- [x] 5.1 Create `server/api/payments/[id]/receipt.get.ts` endpoint
  - Fetch payment record by ID with relations (patient, organization, therapist)
  - Fetch session details via payment_session_items if linked
  - Render HTML receipt template with payment details
  - Include receipt number, date, amount, method
  - Include session details for non-deposit payments
  - Include organization details (name, address, contact)
  - Return HTML with proper content-type

- [x] 5.2 Create receipt HTML template in `server/templates/receipt.html`
  - Design printable receipt layout
  - Include styling for print output
  - Handle different payment types (payment, deposit, credit_usage, refund)
  - Show "Avance sur soins" for deposit type
  - Show "Remboursement d'avance" for refund type (no session details)

## 6. API Endpoints - Balance Query

- [x] 6.1 Create `server/api/patients/[id]/balance.get.ts` endpoint
  - Query patient credit balance from ledger or view
  - Filter by organization ID (multi-tenant isolation)
  - Exclude voided payments
  - Calculate: `SUM(deposit) - SUM(credit_usage)`
  - Return balanceCents value

- [ ] 6.2 Add caching for balance queries (optional)
  - Consider caching recent balance calculations
  - Invalidate cache on payment creation/voiding

## 7. Shared Types and Validation

- [x] 7.1 Create `shared/types/payment.types.ts` with Zod schemas
  - Define `paymentTypeSchema`: enum('payment', 'deposit', 'credit_usage', 'refund')
  - Define `paymentMethodSchema`: enum('cash', 'card', 'bank_transfer', 'check', 'other')
  - Define `paymentInsertSchema` for POST /payments request body
  - Define `paymentResponseSchema` for API responses
  - Define `paymentSessionItemSchema` for session items

- [x] 7.2 Create `server/api/payments/[id]/index.get.ts` endpoint for fetching payment details
  - Return payment by ID with relations
  - Include payment_session_items and linked session data
  - Handle not found (404)

## 8. UI Components - Payment Card

- [x] 8.1 Create `app/components/payment/PaymentCard.vue` component
  - Implement segmented control for transaction type (Paiement/Avance/Remboursement)
  - Add amount input field with MAD currency suffix
  - Add "Utiliser le solde disponible" button (visible only if credit > 0)
  - Add payment method dropdown (Espèces, Carte bancaire, Virement bancaire, Chèque, Autre)
  - Add info banner for "Avance" type explaining deposit behavior
  - Add notes text area for transaction context
  - Add submit button with dynamic text based on transaction type
  - Implement validation rules inline

- [x] 8.2 Integrate PaymentCard into TreatmentSessionSlideover
  - Add PaymentCard to session slideover layout
  - Pass session cost as default amount for "Paiement" type
  - Pass patient credit balance for "Utiliser le solde" button
  - Wire submit handler to POST /payments API

- [x] 8.3 Implement state management for PaymentCard
  - Track selected transaction type
  - Track amount value
  - Track payment method selection
  - Show/hide UI elements based on transaction type
  - Handle validation errors display
  - Handle API success/error responses

## 9. UI Components - Receipt Display

- [x] 9.1 Create `app/components/ReceiptDisplay.vue` component
  - Accept payment data as prop
  - Render receipt in printable format
  - Show receipt number, date, amount, method
  - Show session details if linked
  - Show "Avance sur soins" for deposit type
  - Add "Télécharger/Imprimer" button

- [x] 9.2 Add receipt viewer modal to session slideover
  - Show "Voir reçu" button for paid sessions
  - Open ReceiptDisplay in modal on click
  - Allow download/print of receipt

## 10. UI Updates - Session Payment Status

- [ ] 10.1 Update session list to show payment status
  - Add visual indicator for "Payé" vs "Non payé"
  - Query payment status via GET /patients/:id/balance or derived query
  - Show payment icon/badge on session cards

- [x] 10.2 Update TreatmentSessionSlideover to display payment status
  - Show current payment status in header
  - Display "Déjà payé" if payment exists
  - Show "En attente de paiement" if no payment
  - Add "Voir reçu" button for paid sessions
  - Add "Enregistrer le paiement" button for unpaid sessions

## 11. Integration and Testing

- [ ] 11.1 Test payment creation workflow (cash/card)
  - Create payment for session
  - Verify receipt number generation
  - Verify payment_session_items creation
  - Verify session status transition to 'completed'
  - Verify receipt rendering

- [ ] 11.2 Test deposit and credit usage workflow
  - Create deposit (no session items)
  - Verify credit balance increases
  - Create credit_usage payment for session
  - Verify credit balance decreases
  - Verify session is marked paid

- [ ] 11.3 Test payment voiding workflow
  - Void existing payment
  - Verify voidedAt and voidedById are set
  - Verify session status reverts to 'finished'
  - Verify credit balance updates correctly

- [ ] 11.4 Test receipt number generation under concurrency
  - Simulate concurrent payment creation
  - Verify no duplicate receipt numbers
  - Verify sequential increment without gaps

- [ ] 11.5 Test validation rules
  - Test invalid payment types
  - Test missing session items for non-deposit
  - Test session items present for deposit
  - Test insufficient credit balance
  - Test voiding already voided payment

## 12. Documentation and Cleanup

- [x] 12.1 Add API documentation for payment endpoints
  - Document POST /payments
  - Document POST /payments/:id/void
  - Document GET /payments/:id/receipt
  - Document GET /patients/:id/balance

- [x] 12.2 Update existing API docs to reflect changes
  - Document removal of treatment_sessions.billed field
  - Document derived payment status calculation
  - Document organization fiscal config changes

- [x] 12.3 Remove deprecated code
  - Remove references to `billed` field in session APIs
  - Remove old payment-related code if any
  - Clean up temporary migration scripts

## 13. Performance Optimization

- [x] 13.1 Add database query optimization for balance calculation
  - Ensure proper indexes are created
  - Test balance query performance with large datasets
  - Consider materialized view if needed

- [x] 13.2 Add caching for frequently accessed data
  - Cache organization fiscal config
  - Cache patient credit balance with invalidation on payment changes
