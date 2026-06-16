## 1. Database Schema

- [x] 1.1 Add nullable `priceItem` JSON column (`text({ mode: 'json' }).$type<PriceItemSnapshot>()`) to `appointments` table in `server/database/schema/appointment.ts`
- [x] 1.2 Generate and apply Drizzle migration (`pnpm db:gen` then `pnpm db:mig`)
- [x] 1.3 Update seed script to set `priceItem` snapshot on seeded appointments (resolve from org pricing items by location)

## 2. Shared Types

- [x] 2.1 Define `PriceItemSnapshot` type in `shared/types/org.types.ts`: `{ code: string; description: string; rateCent: RateCent }` (re-export or extract from existing `priceItemSchema.omit({ id: true, isDefault: true })`)
- [x] 2.2 Update `updatePriceActionSchema` in `shared/types/appointment.type.ts` from `{ priceCents: number }` to `{ priceItemCode: string }`
- [x] 2.3 Update `AppointmentDetail` type to include `priceItem: PriceItemSnapshot | null`
- [x] 2.4 Update `AppointmentWithPaymentStatus` type to include `priceItemDescription: string | null`

## 3. Server — Appointment Creation Auto-Pricing

- [x] 3.1 Update `POST /api/appointments` (`server/api/appointments/index.post.ts`) to auto-populate `priceItem` and `priceCents` on creation: resolve from treatment plan's `priceItem` if linked, else from org default price item, keyed by appointment location
- [x] 3.2 Update `calculateInheritedPrice()` in `server/utils/pricing.ts` to also return the resolved price item snapshot (or create a new `resolveAppointmentPrice()` function that returns both priceCents and priceItem)

## 4. Server — Price Override Endpoint

- [x] 4.1 Update `PATCH /api/appointments/[id]/price` to accept `{ priceItemCode: string }`, resolve the code against the org's `pricing.priceItems`, snapshot the full item on `appointment.priceItem`, and derive `priceCents` from `rateCent[appointment.location]`
- [x] 4.2 Add validation: reject if `priceItemCode` not found in org catalog; reject if raw `priceCents` is provided instead of `priceItemCode`

## 5. Server — Payment Status Enrichment

- [x] 5.1 Update `GET /api/appointments/payments` to include `priceItemDescription` in the enriched response (extract `priceItem.description` from the appointment row)

## 6. Frontend — Session Price Selector Component

- [x] 6.1 Create or adapt a `SessionPriceSelector` component that renders a `USelectMenu` of org pricing codes, showing the current selection and price per location
- [x] 6.2 Replace the free-input price field on the session view with the `SessionPriceSelector` component
- [x] 6.3 Wire the selector to `PATCH /api/appointments/[id]/price` with `{ priceItemCode }` instead of `{ priceCents }`

## 7. Frontend — Billing Cards and Receipts

- [x] 7.1 Update session billing cards in the Facturation tab to display `priceItemDescription` alongside the amount (when available)
- [x] 7.2 Update receipt rendering to include pricing code description in the session details section

## 8. Testing

- [x] 8.1 Add unit tests for `resolveAppointmentPrice()` / updated pricing utility covering: plan inheritance, org default fallback, null when no pricing data, location-based rate selection
- [x] 8.2 Add unit tests for the updated `PATCH /appointments/[id]/price` endpoint: valid code resolution, invalid code rejection, location-based priceCents derivation
- [x] 8.3 Update existing appointment creation tests to verify auto-populated `priceItem` and `priceCents`
