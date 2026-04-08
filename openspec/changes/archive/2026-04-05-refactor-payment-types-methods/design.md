## Context

The payment system currently has 4 types (`payment`, `deposit`, `credit_usage`, `refund`) and 4 methods (`cash`, `bank-card`, `check`, `bank-transfer`). The `credit_usage` type conflates "what happens" (paying for a session) with "how it's funded" (using deposit balance), and `deposit` as a type describes funding rather than the action. This creates inconsistency in the data model where some payments have no method at all.

This is a pre-production system — no migration path is needed. We can do a clean break.

## Goals / Non-Goals

- Goals:
  - Every payment has both a **type** (what happens) and a **method** (how it's funded)
  - `credit_usage` is eliminated — deposit usage is expressed as `method='deposit'`
  - Types are semantic: `session_payment`, `session_refund`, `deposit_add`, `deposit_refund`
  - `method` field becomes NOT NULL in DB
  - Balance calculation uses new types (`deposit_add` instead of `deposit`, method filtering for deposit-funded sessions)

- Non-Goals:
  - Data migration from old types (no production data exists)
  - Backward compatibility with old type/method values
  - Changing the receipt numbering or voiding systems
  - Changing the payment_session_items linking mechanism

## Decisions

### Decision 1: Add `'deposit'` to PAYMENT_METHODS

When a patient uses their deposit balance to pay for a session, the payment will be `type='session_payment'` + `method='deposit'`. This makes "using deposit" a funding source, consistent with how other methods work.

Alternatives considered:

- Keep `credit_usage` as a type and add `method='credit'`: Still conflates type with funding source, requires special-case logic
- Use a separate `fundingSource` field: Over-engineering for the current domain

### Decision 2: Use prefixed semantic types (`session_payment`, `deposit_add`, etc.)

Prefixes group related types and make the intent clear from the name alone. A `session_payment` is always linked to sessions. A `deposit_add` is always standalone.

Alternatives considered:

- Keep unprefixed (`payment`, `deposit`, `refund`): Ambiguous — "payment" could mean any payment, "deposit" conflates with the method
- Use camelCase (`sessionPayment`, `depositAdd`): Inconsistent with existing kebab-case convention for enum values

### Decision 3: `method` becomes required on all payments

Even `deposit_add` has a method (how did the patient give us the money: cash, card, etc.). Even `deposit_refund` has a method (how are we returning the money).

### Decision 4: Balance calculation changes

Old: `SUM(type='deposit') - SUM(type='credit_usage')`
New: `SUM(type='deposit_add') - SUM(type='session_payment' AND method='deposit') - SUM(type='deposit_refund')`

This is more explicit and allows future scenarios where session payments can be partially deposit-funded.

### Decision 5: Session payment status query changes

Old: `WHERE type IN ('payment', 'credit_usage')`
New: `WHERE type IN ('session_payment')`

Refunds are a separate type (`session_refund`) that would subtract from session coverage.

## Risks / Trade-offs

- **Breaking change across all payment code**: Large surface area of changes, but system is pre-production so no data migration. Risk is developer time, not data loss.
- **Seed data must be rewritten**: Seed file references old types. Low risk, straightforward.
- **Mock data in slideovers**: Several billing slideovers use hardcoded mock data that references old types. Must be updated to compile.

## Open Questions

- None — the user request is clear and unambiguous.
