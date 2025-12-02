# Design Document: Server Pagination and Search/Filter Implementation

## Architecture Overview

This design outlines the implementation of server-side pagination and filtering for the patients index page, maintaining the existing Nuxt UI components while improving performance and scalability.

## Current Architecture Analysis

### Existing Flow

1. Client fetches all patients via `/api/patients`
2. TanStack Table handles client-side pagination and filtering
3. Nuxt UI components render the table interface
4. Filters applied client-side to complete dataset

### Limitations

- Inefficient for large patient datasets
- Increased memory usage on client
- Slower initial page load
- Network bandwidth waste

## Proposed Architecture

### New Flow

1. Client requests paginated data with query parameters
2. Server processes pagination and filtering
3. Database returns limited result set with metadata
4. Client renders paginated results with Nuxt UI
5. Filter changes trigger new server requests

## API Design

### Request Structure

```typescript
GET /api/patients?page=1&limit=20&search=john&status=active&gender=male
```

### Response Structure

```typescript
{
  data: Patient[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  }
}
```

### Query Parameters

- `page`: Page number (min: 1, default: 1)
- `limit`: Items per page (min: 1, max: 100, default: 20)
- `search`: Search term across name, email, phone
- `status`: Patient status filter
- `gender`: Gender filter
- `insuranceProvider`: Insurance provider filter

## Frontend Implementation

### State Management

```typescript
// Reactive query parameters
const queryParams = computed(() => ({
  page: pagination.value.pageIndex + 1,
  limit: pagination.value.pageSize,
  search: searchFilter.value,
  status: statusFilter.value !== 'all' ? statusFilter.value : undefined
}))
```

### Data Fetching

```typescript
const { data, isPending, error } = useQuery({
  queryKey: ['patients', queryParams],
  queryFn: () => requestFetch('/api/patients', queryParams)
})
```

### Debouncing Strategy

- Search input: 300ms debounce
- Status filter: Immediate (no debounce)
- Pagination: Immediate (no debounce)

## Database Optimization

### Query Strategy

1. Count total records matching filters
2. Apply LIMIT/OFFSET for pagination
3. Use indexed columns for filtering
4. Optimize ORDER BY for consistent pagination

### Performance Considerations

- Add database indexes on filtered columns
- Use efficient ILIKE operations for search
- Implement proper query planning

## UI/UX Considerations

### Loading States

- Show skeleton loaders during data fetching
- Maintain smooth transitions between page changes
- Display loading indicators for filter operations

### Error Handling

- Graceful error messages for network issues
- Retry mechanisms for failed requests
- Fallback to cached data when possible

### Accessibility

- Maintain keyboard navigation
- Screen reader compatibility for pagination
- Proper ARIA labels for filters

## Migration Strategy

### Phase 1: Backend Enhancement

- Modify API endpoint without breaking existing clients
- Add optional pagination parameters
- Maintain backward compatibility

### Phase 2: Frontend Integration

- Update data fetching logic
- Implement server-side filtering
- Remove client-side filtering code

### Phase 3: Optimization

- Add performance monitoring
- Optimize database queries
- Fine-tune debouncing parameters

## Testing Strategy

### Unit Tests

- API endpoint parameter validation
- Pagination logic correctness
- Filter combination scenarios

### Integration Tests

- End-to-end user workflows
- API response handling
- Error scenario recovery

### Performance Tests

- Large dataset handling
- Concurrent user scenarios
- Memory usage optimization

## Security Considerations

### Input Validation

- Sanitize all query parameters
- Validate pagination bounds
- Prevent SQL injection in search queries

### Rate Limiting

- Implement reasonable rate limits
- Prevent abuse of search functionality
- Monitor for unusual patterns

## Future Enhancements

### Advanced Filtering

- Date range filters
- Multi-select filters
- Saved filter presets

### Performance Optimizations

- Result caching strategies
- Database query optimization
- Client-side caching for frequently accessed data
