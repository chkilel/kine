## MODIFIED Requirements

### Requirement: Component Interface for Exception Management

The AvailabilityExceptionSlideover component MUST provide a modern interface matching AvailabilityTemplateSlideover.vue design patterns while preserving all existing props and events for adding and editing availability exceptions.

#### Scenario: Component accepts exception data for edit mode

**Given** AvailabilityExceptionSlideover component is opened via useOverlay
**When** an exception prop is provided through overlay.open()
**Then** the component should populate form fields with the exception data using UI matching AvailabilityTemplateSlideover.vue patterns
**And** display in edit mode with appropriate title using USlideover title prop
**And** preserve all existing prop interface without modification

#### Scenario: Component emits close event when cancelled

**Given** AvailabilityExceptionSlideover is open via useOverlay
**When** user clicks cancel button styled to match AvailabilityTemplateSlideover.vue (variant="outline", color="neutral")
**Then** the component should emit a close event with false value
**And** the overlay should close automatically with proper transition

#### Scenario: Component emits save event with form data

**Given** AvailabilityExceptionSlideover has valid form data
**When** user clicks save button styled to match AvailabilityTemplateSlideover.vue (color="primary", shadow-primary/25)
**Then** the component should emit a close event with AvailabilityExceptionCreate data
**And** the overlay should close automatically
**And** preserve all existing event emission behavior

### Requirement: Form Validation for Exception Data

The component MUST validate all form inputs using UForm validation including required fields and optional time consistency with visual feedback matching AvailabilityTemplateSlideover.vue patterns.

#### Scenario: Required fields validation

**Given** exception form is displayed with UForm and UFormField components
**When** required fields (date, availability status) are empty
**Then** validation errors should be displayed using UFormField error styling
**And** save button should be disabled using UButton disabled state

#### Scenario: Optional time validation

**Given** start and end times are provided using UInputTime components with icon="i-lucide-clock"
**When** only one time is provided
**Then** validation error should be displayed using UFormField error styling
**And** user should be prompted to provide both or neither with clear messaging

### Requirement: UI Layout and Interactive Elements Matching AvailabilityTemplateSlideover.vue Patterns

The component MUST display form sections using UCard components and provide interactive elements using Nuxt UI components with Lucide icons, matching AvailabilityTemplateSlideover.vue design patterns.

#### Scenario: Form sections display correctly

**Given** exception slideover is open with styling matching AvailabilityTemplateSlideover.vue
**When** viewing form organized in UCard sections with headers
**Then** date section should have header with i-lucide-calendar icon and text-primary color
**And** time section should have header with i-lucide-clock icon and text-primary color
**And** availability section should have header with appropriate Lucide icon and text-primary color
**And** reason section should have header with appropriate Lucide icon and text-primary color
**And** each section should use text-foreground for titles and text-muted-foreground for descriptions

#### Scenario: Calendar component integration

**Given** date section is displayed using UCalendar component within UCard
**When** user interacts with calendar
**Then** calendar should be displayed within UCard with proper styling
**And** UCalendar should replace the current UPopover approach
**And** calendar should integrate properly with form validation
**And** selected date should be highlighted with primary color

#### Scenario: Time inputs with Lucide icons

**Given** time section is displayed using UInputTime components
**When** viewing time input fields
**Then** each UInputTime should have icon="i-lucide-clock" prop
**Then** inputs should use size="lg" matching template pattern
**Then** inputs should be styled consistently with AvailabilityTemplateSlideover.vue
**Then** proper validation should be maintained

#### Scenario: Toggle switches with proper styling

**Given** form sections include toggle elements
**When** viewing full day or availability toggles
**Then** USwitch components should be used with proper styling
**Then** toggle labels should use text-foreground color
**Then** toggle descriptions should use text-muted-foreground color
**Then** toggle behavior should match existing functionality

#### Scenario: Reason selection with consistent styling

**Given** reason section is displayed for unavailable exceptions
**When** selecting reason options
**Then** reason options should be displayed using UButton components
**Then** buttons should use consistent styling with proper colors
**Then** selected state should use primary color (text-primary)
**Then** "Autre" option should show UInput for custom text
**Then** all styling should match AvailabilityTemplateSlideover.vue patterns

#### Scenario: Footer actions matching template

**Given** form footer is displayed
**When** viewing action buttons
**Then** cancel button should use variant="outline" and color="neutral"
**Then** submit button should use color="primary" with shadow-primary/25
**Then** submit button should include i-lucide-check icon
**Then** button layout should match AvailabilityTemplateSlideover.vue footer pattern
**Then** proper spacing and responsive behavior should be maintained

#### Scenario: Color scheme and styling consistency

**Given** component matches AvailabilityTemplateSlideover.vue design patterns
**When** viewing any interactive element
**Then** text-primary should be used for primary elements and icons
**And** text-foreground should be used for main text and titles
**And** text-muted-foreground should be used for descriptions and secondary text
**And** bg-elevated should be used for card backgrounds
**And** border-default should be used for consistent borders
**And** Lucide icons should be used throughout (i-lucide-\* format)
