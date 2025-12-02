# Implement Server Pagination and Search/Filter for Patients Index

## Summary

This change implements server-side pagination, search, and filtering functionality for the patients index page (`/app/pages/patients/index.vue`). The current implementation fetches all patients and performs client-side filtering, which is inefficient for large datasets. This proposal will move pagination and filtering to the server side using the existing API structure and Nuxt UI components.

## Why

The current client-side pagination approach has significant limitations that impact user experience and system scalability:

1. **Performance Issues**: As the patient database grows, loading all records becomes increasingly slow and memory-intensive
2. **Bandwidth Waste**: Transferring entire patient datasets when users typically only view a subset of records
3. **Scalability Concerns**: The approach doesn't scale well for clinics with hundreds or thousands of patients
4. **Resource Inefficiency**: Client-side filtering requires maintaining large datasets in browser memory

Moving to server-side pagination addresses these issues by:

- Reducing initial page load time through smaller data transfers
- Improving scalability for large patient databases
- Providing consistent performance regardless of dataset size
- Enabling more sophisticated server-side filtering and search capabilities
- Following modern web development best practices for data-intensive applications

## Current State

The patients index page currently:

- Fetches all patients from `/api/patients` endpoint
- Performs client-side filtering and pagination using TanStack Table
- Uses Nuxt UI components for the table interface
- Has basic search and status filter functionality

## Proposed Changes

### Backend Changes

1. **Enhance API Response**: Modify `/api/patients` endpoint to return paginated results with metadata
2. **Add Total Count**: Include total patient count for pagination UI
3. **Optimize Query Parameters**: Use existing `patientQuerySchema` for consistent parameter handling

### Frontend Changes

1. **Update Data Fetching**: Replace client-side filtering with server-side query parameters
2. **Integrate with Nuxt UI**: Use `useQuery` from pinia-colada for data fetching
3. **Maintain UI Components**: Keep existing Nuxt UI table and filter components
4. **Update Pagination**: Sync server pagination with Nuxt UI pagination component

## Technical Approach

### API Enhancement

- Return paginated response structure: `{ data: Patient[], pagination: { total, page, limit, totalPages } }`
- Support existing query parameters: `page`, `limit`, `search`, `status`, `gender`, `insuranceProvider`
- Maintain backward compatibility during transition

### Frontend Integration

- Use `useQuery` with reactive query parameters
- Debounce search input to reduce API calls
- Maintain current UI/UX with Nuxt UI components
- Preserve existing filter functionality (status, search, column visibility)

## Benefits

1. **Performance**: Reduced data transfer and faster initial load
2. **Scalability**: Handles large patient datasets efficiently
3. **Consistency**: Aligns with existing API patterns in the codebase
4. **User Experience**: Maintains current UI while improving performance
5. **Resource Efficiency**: Reduces client-side memory usage

## Dependencies

- Uses existing `patientQuerySchema` for type safety
- Leverages current Nuxt UI table implementation
- Maintains existing authentication and authorization patterns
- Uses established error handling patterns

## Risk Assessment

**Low Risk**:

- Builds on existing API structure
- Maintains current UI components
- Uses established patterns from the codebase

**Mitigations**:

- Preserve backward compatibility during implementation
- Test with various filter combinations
- Ensure proper error handling for network issues
