# Test Plan for Dynamic Form Features

## Overview
This test plan verifies the implementation of three key features for the dynamic form wizard:
1. Correct placeholder display according to priority order
2. Decimal support for number fields with integer-only option
3. Dynamic question numbering that updates based on visibility conditions

## Test Environment
- Application: Scholarship Eligibility Checker App
- Component: BrandedDynamicWizard.tsx, renderer.tsx
- Browser: Latest versions of Chrome, Firefox, Safari, and Edge

## Test Cases

### A) Placeholder Display

**Test Case A1: ui.placeholderText Priority**
- **Preconditions**: Create a text question with `ui.placeholderText = "Nhập họ và tên của bạn"`
- **Steps**: 
  1. Open the form wizard containing this question
  2. Observe the input field
- **Expected Result**: The placeholder text should display exactly "Nhập họ và tên của bạn"

**Test Case A2: ui.placeholderKey with Translation**
- **Preconditions**: Create a select question with `ui.placeholderKey` set to a key that has a valid translation in the i18n system
- **Steps**: 
  1. Open the form wizard containing this question
  2. Observe the select dropdown
- **Expected Result**: The placeholder should display the translated text as the first disabled option

**Test Case A3: ui.placeholderKey without Translation**
- **Preconditions**: Create a text question with `ui.placeholderKey` set to a key that does not have a translation
- **Steps**: 
  1. Open the form wizard containing this question
  2. Observe the input field
- **Expected Result**: The input field should have no placeholder text (not showing the raw key)

**Test Case A4: No Placeholder Properties**
- **Preconditions**: Create a text question without any placeholder properties
- **Steps**: 
  1. Open the form wizard containing this question
  2. Observe the input field
- **Expected Result**: The input field should have no placeholder text

**Test Case A5: Select Component Placeholder**
- **Preconditions**: Create a select question with a valid placeholder
- **Steps**: 
  1. Open the form wizard containing this question
  2. Observe the select dropdown before making a selection
- **Expected Result**: The select should show the placeholder as a disabled option only if a valid placeholder exists

### B) Number Field Handling

**Test Case B1: Default Decimal Support**
- **Preconditions**: Create a number question with default settings (no integer-only restriction)
- **Steps**: 
  1. Open the form wizard containing this question
  2. Try to enter a decimal value (e.g., 3.75)
- **Expected Result**: The field should accept decimal values without validation errors

**Test Case B2: Integer-Only Validation**
- **Preconditions**: Create a number question with `validation.integerOnly = true`
- **Steps**: 
  1. Open the form wizard containing this question
  2. Try to enter a decimal value (e.g., 2.5)
- **Expected Result**: The field should show a validation error with the message "Giá trị phải là một số nguyên"

**Test Case B3: Integer-Only Accepts Whole Numbers**
- **Preconditions**: Create a number question with `validation.integerOnly = true`
- **Steps**: 
  1. Open the form wizard containing this question
  2. Enter a whole number (e.g., 3)
- **Expected Result**: The field should accept the whole number without validation errors

### C) Dynamic Question Numbering

**Test Case C1: Basic Numbering**
- **Preconditions**: Create a step with 3 questions in order, all always visible
- **Steps**: 
  1. Open the form wizard containing these questions
  2. Observe the question numbers
- **Expected Result**: Questions should be numbered 1, 2, 3 in the order they appear

**Test Case C2: Numbering with Hidden Questions**
- **Preconditions**: 
  - Create a step with 3 questions
  - Set question 2 to only appear when question 1 = "Có"
- **Steps**: 
  1. Open the form wizard
  2. Observe initial numbering (should be 1, 2)
  3. Select "Có" for question 1
  4. Observe updated numbering (should be 1, 2, 3)
  5. Change question 1 to "Không"
  6. Observe updated numbering (should return to 1, 2)
- **Expected Result**: Numbering should dynamically update as questions become visible or hidden

**Test Case C3: Numbering After Reorder/Delete**
- **Preconditions**: 
  - Create a step with 3 questions
  - In Admin, reorder the questions or delete one
- **Steps**: 
  1. Reload the form wizard
  2. Observe the question numbers
- **Expected Result**: Questions should be numbered sequentially in their current order, regardless of original order or deletions

**Test Case C4: Accessibility Check**
- **Preconditions**: Create a step with multiple questions
- **Steps**: 
  1. Inspect the HTML of the form labels
- **Expected Result**: Question numbers should be in a separate span with `aria-hidden="true"` attribute

## Acceptance Criteria
- All test cases pass successfully
- Placeholders are displayed according to the specified priority order
- Number fields allow decimal input by default and correctly restrict to integers when specified
- Question numbering updates dynamically based on visible questions and maintains sequential numbering
- No raw keys are displayed as placeholders or labels
- All existing functionality (step navigation, form submission) remains unaffected