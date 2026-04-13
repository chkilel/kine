## MODIFIED Requirements

### Requirement: Payment Recording

The system SHALL record financial events as immutable ledger entries in the `payments` table. Payment types are: `session_payment`, `session_refund`, `insurance_payment`, `insurance_refund`, `deposit_add`, `deposit_refund`, `credit_note_applied`, `write_off`. Payment methods are: `cash`, `bank-card`, `check`, `bank-transfer`, `deposit`, `insurance-electronic`. Every payment SHALL have a type, a method, and a `payerType` (`patient` | `insurance_company`). When `payerType` is `insurance_company`, `payerInsuranceCompanyId` is required.

#### Scenario: Record cash payment for appointment (co-pay)

- **GIVEN** an appointment exists with id `apt-123` with `expectedCoPayCents = 1000`
- **AND** patient has id `patient-456`
- **WHEN** POST /payments is called with body:
  ```
  patientId: "patient-456", amountCents: 1000,
  type: "session_payment", method: "cash", payerType: "patient",
  paidOn: "2026-03-24",
  allocations: [{ appointmentId: "apt-123", invoiceId: "inv-456", portion: "copay", amountCents: 1000 }]
  ```
- **THEN** a payment record is created with `type="session_payment"`, `method="cash"`, `payerType="patient"`
- **AND** a `payment_allocations` row links payment to appointment and invoice with `portion="copay"`
- **AND** appointment `coPayPaidCents` is updated to 1000
- **AND** receiptNumber is generated

#### Scenario: Record insurance payment

- **GIVEN** a convention invoice exists with `insuranceCompanyId = "cnss-123"`
- **AND** appointment `apt-123` has `expectedInsuranceCents = 4000`
- **WHEN** POST /payments is called with body:
  ```
  amountCents: 4000, type: "insurance_payment", method: "bank-transfer",
  payerType: "insurance_company", payerInsuranceCompanyId: "cnss-123",
  paidOn: "2026-03-24",
  allocations: [{ appointmentId: "apt-123", invoiceId: "inv-456", portion: "insurance", amountCents: 4000 }]
  ```
- **THEN** a payment record is created with `payerType="insurance_company"`
- **AND** `payerInsuranceCompanyId="cnss-123"`
- **AND** appointment `insurancePaidCents` is updated to 4000
- **AND** appointment `paymentStatus` transitions to `paid`

#### Scenario: Record advance deposit

- **WHEN** POST /payments is called with `type: "deposit_add"`, `amountCents: 20000`
- **THEN** a payment record is created with `payerType="patient"`
- **AND** NO `payment_allocations` rows are created (no appointment/invoice link)
- **AND** patient deposit balance increases by 20000 cents

## ADDED Requirements

### Requirement: Payment Allocations Replace Session Items

The V1 `payment_session_items` table is replaced by `payment_allocations` junction table linking payments to BOTH invoices AND appointments with a `portion` field.

#### Scenario: Allocation links payment to invoice and appointment

- **WHEN** a payment allocation is created
- **THEN** it SHALL reference `paymentId`, `invoiceId`, `appointmentId`
- **AND** `portion` is one of: `full`, `copay`, `insurance`
- **AND** `amountCents` is the portion of the payment allocated

#### Scenario: One payment covers multiple appointments

- **WHEN** a 10000 cents payment covers `apt-123` (5000) and `apt-456` (5000)
- **THEN** two `payment_allocations` rows are created
- **AND** each has its own `portion` and `amountCents`

### Requirement: Payment Immutable Ledger

Payment amounts SHALL NEVER be updated. Corrections use compensating records (refunds, new payments). The original payment record is preserved for audit.

#### Scenario: Correct overpayment

- **WHEN** a payment of 6000 was made but should have been 5000
- **THEN** a `session_refund` payment of 6000 is created
- **AND** a new `session_payment` of 5000 is created
- **AND** the original 6000 payment is NOT modified
