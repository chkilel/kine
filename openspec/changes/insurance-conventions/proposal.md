## Why

Morocco's insurance billing model is convention-based — coverage is a therapist-insurer attribute, NOT a patient-policy attribute. Currently, there's no way to manage insurance company relationships, track coverage percentages, or calculate co-pays automatically. This makes billing tedious and error-prone for Moroccan kinésithérapeutes.

## What Changes

- **NEW**: `insurance_companies` table — store convention partners with billing attributes (coverage %, session price, co-pay rules)
- **ENHANCEMENT**: `treatment_plans` table — add `insuranceCompanyId` FK as source of truth for insurance context
- **ENHANCEMENT**: `appointments` table — add `insuranceCompanyId` FK (inherited from treatment plan), add co-pay tracking fields (`expectedCoPayCents`, `expectedInsuranceCents`, `coPayPaidCents`, `insurancePaidCents`)
- **NEW**: Enum `VALID_CONVENTION_STATUSES` in `base.types.ts` (`active`, `suspended`, `terminated`)

## Capabilities

### New Capabilities

- `insurance-conventions`: Insurance company management, convention attributes, coverage calculation, co-pay tracking, insurance context inheritance

### Modified Capabilities

- `treatment-plan`: Add `insuranceCompanyId` FK as source of truth for insurance context inheritance
- `appointment`: Add `insuranceCompanyId` FK and co-pay tracking fields

## Impact

- **Database**: 1 new table (`insurance_companies`), 2 existing tables enhanced (`treatment_plans`, `appointments`)
- **Shared types**: 1 new enum (`VALID_CONVENTION_STATUSES`)
- **API routes**: Add CRUD for insurance companies, enhance treatment plan and appointment APIs
- **Frontend**: Add insurance company management UI, enhance treatment plan and appointment forms
- **Compliance**: Proper Morocco convention billing support

## UI/UX Requirements

### 1. Insurance Companies Management Page

**Location:** `/settings/insurance-companies`

**Features:**

- List view displaying all insurance companies with:
  - Company name and code
  - Status badge (active/suspended/terminated) with color coding
  - Coverage percentage
  - Session price
  - Co-pay rule summary
- Filter by status (active/suspended/terminated)
- "New Insurance Company" button
- Actions per company: Edit, Delete (with confirmation)
- Soft-delete confirmation dialog
- Form validation on create/edit

**Form Fields (Create/Edit):**

- Name (text, required)
- Code (text, required, unique per organization)
- Status (select: active/suspended/terminated, default: active)
- Coverage percentage (number, 0-100, required)
- Session price (currency, required, min 1 MAD)
- Co-pay rule (select: fixed/percentage, required)
- Co-pay amount (currency, shown when rule=fixed, required)
- Co-pay percentage (number, shown when rule=percentage, 0-100, required)
- Notes (textarea, optional)

### 2. Treatment Plan Form Enhancement

**Changes to Create/Edit Forms:**

- Add "Insurance Company" selector dropdown
- Show only active insurance companies in selector
- Display selected company's coverage summary (percentage, session price)
- Show company details card when selected
- Allow changing insurance company on edit (with validation)
- Clear indication when no insurance selected

**Treatment Plan Detail View:**

- Display associated insurance company information card
- Show coverage percentage and session price
- Link to insurance company details

### 3. Appointment Form & View Enhancement

**Creation Form:**

- Display inherited insurance company from treatment plan
- Show coverage summary (read-only)
- Calculate and display expected amounts:
  - Expected co-pay amount
  - Expected insurance payment
- Show total session price

**Appointment Detail View:**

- Insurance information card showing:
  - Company name and status
  - Coverage percentage
  - Session price
  - Co-pay rule and amount
- Payment tracking section with:
  - Expected co-pay vs. Co-pay paid
  - Expected insurance payment vs. Insurance paid
  - Progress indicators for partial payments
  - "Record Payment" button/modal
- Payment tracking form with:
  - Co-pay paid amount input
  - Insurance paid amount input
  - Save button
- Visual indicators for payment status:
  - Green: Fully paid
  - Yellow: Partially paid
  - Gray: Not paid

### 4. Payment Tracking Interface

**Payment Modal/Form:**

- Accessible from appointment detail view
- Two payment sections:
  1. Patient Co-Pay: Input field, shows expected amount for reference
  2. Insurance Payment: Input field, shows expected amount for reference
- Validation: Cannot exceed expected amounts (with override option)
- Payment history display (if applicable)
- Auto-calculate remaining balance

**Payment Display:**

- Show payment breakdown in appointment card
- Visual progress bars for each payment type
- Color-coded payment status indicators
- Quick action to update payments

### 5. Navigation & Access

**Settings Menu:**

- Add "Assurances" link in settings navigation
- Icon: Insurance card/health icon
- Position: After "Thérapeutes" or similar

**Breadcrumb Structure:**

- Settings → Assurances (list)
- Settings → Assurances → [Company Name] (edit)
- Treatment Plan → [Plan Name] → Insured (with company info)
- Appointment → [Patient] → [Date/Time] → Insurance & Payments

### 6. UX Guidelines

**Display Priorities:**

1. **Insurance Company List**: Status and coverage percentage are most important
2. **Treatment Plan Form**: Insurance selector should be prominent but optional
3. **Appointment View**: Payment tracking is primary, company info secondary
4. **Payment Form**: Clear expected vs. paid amounts

**User Flow:**

1. Admin sets up insurance companies in Settings
2. Therapist selects company when creating treatment plan
3. Appointments auto-inherit insurance context
4. After each session, therapist records actual payments
5. System tracks partial/complete payments

**Error Handling:**

- Prevent selecting suspended companies for new plans
- Show validation errors for invalid co-pay configurations
- Prevent negative payment amounts
- Warn when payment exceeds expected amount

**Mobile Considerations:**

- Stacked layout for payment form on mobile
- Swipe actions on insurance company list (edit/delete)
- Collapsible insurance info card on appointment view
