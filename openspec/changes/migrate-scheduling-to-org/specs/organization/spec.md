## MODIFIED Requirements

### Requirement: Organization scheduling schema
The `OrgScheduling` Zod schema SHALL be extended with three new optional fields:

```ts
export const orgSchedulingSchema = z.object({
  bookingWindowDays: z.number().min(1).max(365).default(30),
  cancellationHours: z.number().min(0).max(168).default(24),
  allowSameDay: z.boolean().default(false),
  requirePaymentUpfront: z.boolean().default(false),
  remindersEnabled: z.boolean().default(true),
  reminderIntervals: z.array(z.number()).default([24, 48]),
  defaultAppointmentDuration: z.number().int().min(15).max(180).default(30),
  appointmentGapMinutes: z.number().int().min(0).max(60).default(5),
  slotIncrementMinutes: z.number().int().min(5).max(30).default(15),
})
```

#### Scenario: Backwards compatibility
- **WHEN** an existing organization has a `scheduling` JSON without the new fields
- **THEN** the Zod parse SHALL succeed and apply defaults for the new fields
- **THEN** existing scheduling data SHALL remain unchanged
