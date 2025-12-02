# frontend-server-integration Specification

## Purpose
TBD - created by archiving change 2025-12-02-implement-server-pagination-search-filter. Update Purpose after archive.
## Requirements
### Requirement: Reactive Query Parameters

The system SHALL automatically update query parameters and trigger new server requests when users interact with search, filters, or pagination controls.

#### Scenario: Parameter reactivity

- **WHEN** users change filters, search, or pagination controls
- **THEN** the system SHALL immediately update query parameters reactively
- **AND** apply 300ms debouncing delay to search input parameter updates
- **AND** trigger immediate parameter updates for status filter changes
- **AND** trigger immediate parameter updates for pagination changes
- **AND** ensure all query parameters are properly typed and validated

### Requirement: Server-Side Data Fetching Integration

The system SHALL use pinia-colada's useQuery to fetch paginated data from the server with proper error handling and loading states.

#### Scenario: Data fetching with useQuery

- **WHEN** the patients page loads or filters change
- **THEN** the system SHALL use `useQuery` composable with reactive query key based on all parameters
- **AND** include page, limit, search, and all filter parameters in the query key
- **AND** properly manage loading state during data fetching
- **AND** handle error states gracefully with user-friendly messages
- **AND** cache data appropriately to avoid unnecessary requests

### Requirement: Search Input Debouncing

The system SHALL debounce search input to reduce API calls while maintaining responsive user experience.

#### Scenario: Search debouncing

- **WHEN** users type in the search input
- **THEN** the system SHALL apply 300ms debounce delay to search input
- **AND** reset debounce timer on each keystroke
- **AND** trigger API request with final search value after debounce period
- **AND** show loading indicator during debounced API request
- **AND** cancel previous pending requests when new search is initiated

### MODIFIED Requirement: Pagination Component Integration

The system SHALL sync Nuxt UI pagination component with server-side pagination and display accurate information from API response.

#### Scenario: Pagination synchronization

- **WHEN** users navigate between pages or change page size
- **THEN** the system SHALL use total count from server response in `UPagination` component
- **AND** sync current page with server page parameter
- **AND** update both UI and API request when page size changes
- **AND** disable pagination controls during loading states
- **AND** use server-provided counts for "Showing X of Y results" text

### Requirement: Filter State Management

The system SHALL maintain filter state across page navigation and ensure filters are properly applied to all server requests.

#### Scenario: Filter state persistence

- **WHEN** users apply search, status, or other filters
- **THEN** the system SHALL preserve filter values in component state
- **AND** include filters in all API requests
- **AND** sync filter state with URL parameters for bookmarkable links
- **AND** reset all filter parameters when clear filter functionality is used
- **AND** ensure filter combinations work correctly with pagination

### Requirement: Table Data Rendering

The system SHALL render paginated results from server without applying client-side filtering or pagination.

#### Scenario: Server-side table rendering

- **WHEN** server data is received
- **THEN** the system SHALL display exactly the data received from server in the table
- **AND** remove or disable client-side filtering logic
- **AND** maintain table sorting if supported by server
- **AND** display appropriate empty state messages for filtered results
- **AND** continue row selection and navigation functionality as before

### Requirement: Loading and Error States

The system SHALL provide appropriate feedback to users during data fetching and error scenarios while maintaining existing UI design patterns.

#### Scenario: Loading and error feedback

- **WHEN** data is being fetched or errors occur
- **THEN** the system SHALL show skeleton loaders or spinners in table area during loading
- **AND** display error messages prominently with retry options
- **AND** disable pagination controls during loading
- **AND** keep filter inputs usable during loading states
- **AND** allow users to retry failed requests through error recovery

