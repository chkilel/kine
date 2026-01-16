## 1. API Development

- [x] 1.1 Create API endpoint: GET /api/therapists/consultations
- [x] 1.2 Add authentication check for therapist endpoint
- [x] 1.3 Implement date query parameter validation (Zod schema)
- [x] 1.4 Query consultations with patient and room joins
- [x] 1.5 Filter by authenticated therapistId and date
- [x] 1.6 Order results by startTime ascending
- [x] 1.7 Add error handling for invalid dates and API errors
- [ ] 1.8 Write unit tests for therapist consultations endpoint

## 2. Composable Development

- [x] 2.1 Create composable: useTherapistConsultations
- [x] 2.2 Implement query with caching key based on date
- [ ] 2.3 Add enabled check for authenticated user
- [x] 2.4 Handle loading and error states
- [ ] 2.5 Write unit tests for useTherapistConsultations

## 3. Session Status Update Functionality

- [x] 3.1 Create composable: useUpdateConsultationStatus
- [x] 3.2 Implement mutation using existing PUT endpoint
- [x] 3.3 Add toast notifications for success/error
- [x] 3.4 Invalidate therapist consultations query on success
- [x] 3.5 Invalidate patient consultations query on success
- [ ] 3.6 Write unit tests for useUpdateConsultationStatus composable

## 4. Page Development

- [x] 4.1 Create page: /app/pages/therapists/day.vue
- [x] 4.2 Implement date parameter reading from URL query
- [x] 4.3 Set up date navigation (previous/next day, date picker)
- [x] 4.4 Implement summary statistics calculation
- [x] 4.5 Create summary cards component (total, completed, upcoming, cancelled)
- [x] 4.6 Implement consultations list display
- [x] 4.7 Add chronological sorting by startTime
- [x] 4.8 Create consultation card for daily overview
- [x] 4.9 Add "Start Session" button on consultation cards (for scheduled/confirmed status)
- [x] 4.10 Add "Complete Session" button on consultation cards (for in_progress status)
- [x] 4.11 Add "View Details" button on consultation cards (always visible)
- [x] 4.12 Implement session start confirmation dialog
- [x] 4.13 Integrate useUpdateConsultationStatus composable for button actions
- [x] 4.14 Implement navigation to patient details page
- [ ] 4.15 Implement navigation to consultation details page
- [x] 4.16 Add empty state for days with no consultations
- [x] 4.17 Implement loading states with skeleton UI
- [x] 4.18 Add error state with retry button

## 5. Consultation Details Page Integration

- [x] 5.1 Add "Start Session" button to consultation details page (for scheduled/confirmed status)
- [x] 5.2 Add "Complete Session" button to consultation details page (for in_progress status)
- [x] 5.3 Reuse useUpdateConsultationStatus composable on details page
- [ ] 5.4 Test session start/complete workflow from details page

## 6. UI/UX Polish

- [x] 6.1 Apply Nuxt UI design system colors and components
- [x] 6.2 Add status badges for consultation status
- [x] 6.3 Ensure responsive design for mobile devices
- [x] 6.4 Add hover effects on consultation cards
- [x] 6.5 Implement dark mode compatibility
- [ ] 6.6 Add transition animations for date navigation
- [ ] 6.7 Add keyboard shortcuts for date navigation (left/right arrows)

## 7. Navigation and Routing

- [x] 7.1 Add link to therapist day page from main navigation/sidebar
- [x] 7.2 Update URL when date changes
- [x] 7.3 Handle browser back/forward navigation
- [x] 7.4 Set page title dynamically based on selected date

## 8. Testing

- [ ] 8.1 Manual testing with development environment
- [ ] 8.2 Test with empty consultation list (no consultations)
- [ ] 8.3 Test with single consultation
- [ ] 8.4 Test with multiple consultations on same day
- [ ] 8.5 Test date navigation between days
- [ ] 8.6 Test navigation to patient details
- [ ] 8.7 Test navigation to consultation details
- [ ] 8.8 Test session start workflow from daily view card
- [ ] 8.9 Test session start workflow from consultation details page
- [ ] 8.10 Test session complete workflow
- [ ] 8.11 Test session start confirmation dialog
- [ ] 8.12 Test error handling (invalid date, API errors, status update failures)
- [ ] 8.13 Test authentication (unauthenticated user redirect)
- [ ] 8.14 Test with different consultation statuses
- [ ] 8.15 Test responsive design on mobile
- [ ] 8.16 Test dark mode

## 9. Code Quality

- [x] 9.1 Run lint and fix any issues
- [x] 9.2 Run typecheck and fix any type errors
- [ ] 9.3 Add inline comments for complex logic
- [x] 9.4 Verify code follows project conventions
- [x] 9.5 Ensure all user-facing text is in French
