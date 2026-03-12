# Design: Organization Slug Prefix Implementation

## Context

The application is a multi-tenant SaaS for physical therapy clinics. Users can belong to multiple organizations, and the system already tracks `activeOrganizationSlug` in the session. Current routing is flat with organization context implied but not visible in URLs.

### Current Session Structure

```typescript
{
  session: {
    activeOrganizationId: string
    activeOrganizationSlug: string // Already available
  }
}
```

## Goals / Non-Goals

### Goals

- Make organization context explicit in all dashboard URLs
- Prevent cross-organization URL manipulation (invalid slug handling)
- Maintain clean separation between org-scoped and global routes
- Provide composable for easy org-scoped URL generation

### Non-Goals

- Changing auth routes (login, register, onboarding)
- Changing the organizations list page (used for org switching)
- API route changes (server routes can remain as-is)

## Decisions

### 1. Route Structure

**Decision**: Nest all dashboard pages under `[slug]/` directory
**Rationale**:

- Nuxt's file-based routing makes this natural
- Clear visual separation in codebase
- Easy to identify org-scoped vs global pages

**Alternatives considered**:

- Keep flat structure and add middleware - rejected (less explicit in URLs)
- Use query param `?org=slug` - rejected (non-standard for route hierarchy)

### 2. Slug Validation

**Decision**: Middleware validates slug matches session's `activeOrganizationSlug`
**Rationale**:

- Centralized validation prevents cross-org access
- Automatic redirect to correct org slug if mismatch
- Maintains security without adding complexity to each page

**Behavior**:

- If slug doesn't match session: redirect to `/[activeOrganizationSlug]/[currentPath]`
- If no active organization: redirect to `/onboarding`

### 3. URL Building Composable

**Decision**: Create `useOrgRoute()` composable for org-scoped links
**Rationale**:

- Reduces boilerplate across components
- Centralizes org slug retrieval
- Type-safe URL generation

**API**:

```typescript
const { orgPath, orgNavigate } = useOrgRoute()

// Build path: '/my-org/patients'
orgPath('/patients')

// Navigate
orgNavigate('/patients/123')
orgNavigate({ path: '/patients', query: { search: 'term' } })
```

### 4. Navigation Updates

**Decision**: Update all hardcoded navigation to use composable
**Rationale**:

- Consistency across app
- Future-proof if org slug changes
- Easier to maintain

### 5. Backward Compatibility

**Decision**: No backward compatibility for old routes
**Rationale**:

- This is a breaking change by design
- Old URLs won't work, which is acceptable for early-stage application
- Simplifies implementation

## Migration Plan

### Phase 1: Infrastructure

1. Create `useOrgRoute()` composable
2. Update middleware with slug validation
3. Create `[slug]/` directory structure

### Phase 2: Page Migration

1. Move dashboard pages under `[slug]/`
2. Update `app/layouts/default.vue` navigation
3. Test navigation flow end-to-end

### Phase 3: Component Updates

1. Audit all `navigateTo()` calls
2. Audit all `:to=` bindings
3. Replace with composable where applicable

### Rollback

If critical issues arise:

1. Revert page directory structure
2. Revert middleware changes
3. Keep composable for future use

## Risks / Trade-offs

### Risk: URL Bookmarking

**Risk**: Users may bookmark old URLs that no longer work
**Mitigation**: This is early-stage, minimal bookmarking expected

### Risk: Cross-component References

**Risk**: Components may reference routes with hardcoded strings
**Mitigation**: Comprehensive audit and testing

### Trade-off: Code Changes Volume

**Impact**: Large number of navigation calls to update
**Mitigation**: Systematic approach with composable to reduce future maintenance

## Open Questions

None - requirements are clear from user request

## Implementation Notes

- Use `route.params.slug` to access org slug in pages
- Session's `activeOrganizationSlug` is available via `useAuth()` composable
- Global routes (auth, organizations list) don't have `[slug]/` prefix
