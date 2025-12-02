# server-pagination-api Specification

## ADDED Requirements

### Requirement: Paginated Patients API Response

The system SHALL return a paginated response when clients request the patients index endpoint with pagination parameters.

#### Scenario: Paginated request handling

- **WHEN** a client requests `/api/patients` with `page` and `limit` parameters
- **THEN** the system SHALL return a response with `data` array containing Patient objects for the requested page
- **AND** include a `pagination` object with total count, current page, page size, and total pages
- **AND** use default values of page=1 and limit=20 when parameters are missing
- **AND** enforce maximum limit of 100 to prevent excessive data transfer
- **AND** use 1-indexed pagination for user-friendly URLs

### Requirement: Total Count Query Optimization

The system SHALL efficiently determine the total number of patients matching applied filters to provide accurate pagination metadata.

#### Scenario: Count query execution

- **WHEN** processing a paginated request with filters
- **THEN** the system SHALL execute a separate COUNT query to get total filtered records
- **AND** apply the same filters to the COUNT query as the data query
- **AND** ensure total count reflects all records matching filters, not just the current page
- **AND** optimize the COUNT operation with proper database indexes

### Requirement: Pagination Parameter Validation

The system SHALL validate and sanitize pagination parameters to ensure proper API behavior and prevent abuse.

#### Scenario: Parameter validation

- **WHEN** clients provide pagination parameters
- **THEN** the system SHALL validate that `page` is a positive integer (minimum: 1)
- **AND** validate that `limit` is between 1 and 100
- **AND** return HTTP 400 error with descriptive message for invalid parameters
- **AND** use sensible defaults (page: 1, limit: 20) for missing parameters
- **AND** properly type and validate parameters using Zod schemas

### MODIFIED Requirement: Enhanced Patients List Endpoint

The system SHALL support both legacy and paginated response formats to ensure backward compatibility during migration.

#### Scenario: Backward compatibility

- **WHEN** accessing the patients API endpoint
- **THEN** the system SHALL detect presence of pagination parameters to determine response format
- **AND** return complete patient array for legacy requests (no pagination params)
- **AND** return structured paginated response for new requests (with pagination params)
- **AND** maintain consistent patient data structure across both formats
- **AND** preserve existing error handling patterns for both formats

### Requirement: Filter Integration with Pagination

The system SHALL correctly apply filters before pagination to ensure accurate results across all pages.

#### Scenario: Filtered pagination

- **WHEN** clients apply search and status filters along with pagination
- **THEN** the system SHALL apply search filters before LIMIT/OFFSET operations
- **AND** ensure status filters work correctly with pagination
- **AND** maintain consistent ordering of filtered results across pages
- **AND** ensure total count reflects filtered results, not all records
- **AND** preserve filter state during page navigation
