## Context

The organization pricing page currently supports only a single session rate configuration with clinic, home, and telehealth prices stored in the `rateCent` field of the organization's pricing configuration. Organizations want the flexibility to define multiple pricing items for specialized treatments, equipment fees, or other billable services.

This change will migrate the existing `rateCent` structure to become the first item in a new `priceItems` array, allowing organizations to add additional pricing items while maintaining backward compatibility.

The UI should follow the same interactive pattern as PatientEmergencyContacts.vue, which uses a list view with add/edit/delete functionality and inline form management.

## Goals / Non-Goals

**Goals:**
- Refactor pricing structure from single rateCent object to priceItems array
- Migrate existing rateCent to first item in priceItems (code: "DEFAULT", description: "Tarif de séance")
- Enable organizations to define additional pricing items with unique codes, descriptions, and per-context prices
- Provide an intuitive UI to add, edit, and remove priceItems
- Mark one item as the default pricing item
- Maintain backward compatibility with existing session rate structure

**Non-Goals:**
- Multi-currency support (all prices in MAD)
- Versioning of pricing history
- Automatic price increases or scheduled changes
- Integration with billing/invoicing calculation logic (future scope)

## Decisions

### Data Model Extension

**Decision**: Replace `rateCent` object with `priceItems` array in organization pricing configuration

```typescript
interface PriceItem {
  id: string
  code: string // unique identifier like "MASSAGE_30"
  description: string // display name like "Massage de 30 minutes"
  rateCent: {
    clinic?: number | null
    home?: number | null
    telehealth?: number | null
  }
  isDefault?: boolean // only one item can be default
}
```

**Migration Strategy**: During data migration, the existing `rateCent` object will be converted to the first item in `priceItems`:
```typescript
{
  id: generateId(),
  code: "DEFAULT",
  description: "Tarif de séance",
  rateCent: existingRateCent,
  isDefault: true
}
```

**Rationale**: Storing prices in cents (rateCent) maintains consistency with existing pricing structure. Converting rateCent to the first priceItem ensures backward compatibility and provides a clean migration path. The optional fields allow organizations to use an item only in specific contexts (e.g., equipment fees only for clinic sessions).

### UI Pattern

**Decision**: Use the same list-with-inline-form pattern as PatientEmergencyContacts.vue

**Rationale**: This pattern is already familiar to users and provides:
- Clear visual separation between list items and add/edit form
- Immediate feedback when adding/editing
- Consistent UX across the application
- Efficient space usage

### Default Pricing Item

**Decision**: Implement default flag with validation to ensure only one item can be default

**Rationale**: The default item will be used when selecting a pricing item in other parts of the app (e.g., creating treatment sessions). Ensuring only one default exists prevents ambiguity.

### Database Schema

**Decision**: Refactor pricing JSON column from rateCent object to priceItems array

**Migration**: A data migration script will:
1. Read existing organizations with rateCent data
2. Create priceItems array with first item from rateCent (code: "DEFAULT", description: "Tarif de séance")
3. Write priceItems array back to pricing column
4. Remove rateCent field from pricing JSON

**Rationale**: The pricing column is already JSON (stores rateCent, packages). Refactoring to priceItems extends this structure without requiring a new table. This is appropriate since priceItems are organization-scoped and not a core entity that requires querying independently. The migration ensures existing organizations continue to work seamlessly.

## Risks / Trade-offs

**Risk**: JSON array in pricing column may become large for organizations with many custom items

**Mitigation**: Custom pricing items are typically limited (10-20 per organization), which is well within D1's text field limits. No immediate action needed; can refactor to separate table if scale requires.

**Trade-off**: No referential integrity for default pricing item

**Rationale**: The default flag is managed in application layer. This is acceptable because:
- Only admins can edit organization pricing
- The UI enforces single-default rule
- Refactoring to a separate table adds complexity without clear benefit

**Risk**: Pricing items with duplicate codes could cause confusion

**Mitigation**: Add validation in both frontend (Zod schema) and backend to ensure code uniqueness within an organization's priceItems. The migration will use code "DEFAULT" for the migrated item, which is reserved and cannot be used for new items.

**Migration Risk**: Existing organizations must be migrated from rateCent to priceItems structure

**Mitigation**: Create a data migration script that runs on deployment. The script will create a backward-compatible migration that ensures all existing organizations get a DEFAULT item. Test migration on staging before production deployment.