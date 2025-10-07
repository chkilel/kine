# Testing Strategy

## 1. Unit Tests Setup

```typescript
// tests/unit/composables/usePatients.test.ts
import { describe, it, expect, vi } from 'vitest'
import { usePatients } from '~/composables/usePatients'

describe('usePatients', () => {
  it('should fetch patients successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      data: [{ id: '1', firstName: 'John', lastName: 'Doe' }],
      pagination: { total: 1 }
    })

    // Mock $fetch
    vi.stubGlobal('$fetch', mockFetch)

    const { fetchPatients, patients } = usePatients()
    await fetchPatients()

    expect(patients.value).toHaveLength(1)
    expect(patients.value[0].firstName).toBe('John')
  })
})
```

## 2. Integration Tests

```typescript
// tests/integration/api/patients.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('/api/organizations/[orgId]/patients', () => {
  beforeEach(async () => {
    await setup({
      // Test configuration
    })
  })

  it('should return patients for authenticated user', async () => {
    const response = await $fetch('/api/organizations/test-org/patients', {
      headers: {
        authorization: 'Bearer test-token'
      }
    })

    expect(response.data).toBeDefined()
    expect(response.pagination).toBeDefined()
  })
})
```
