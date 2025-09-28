# Test Plan for Form Visibility Fix

## Issue
Main and sub-questions were disappearing after saving due to inconsistent type handling in visibility conditions.

## Fix Implemented
- Modified `FormBuilder.tsx` to ensure visibility values are saved as strings (`String(form.visibilityValue)`)
- This matches our frontend comparison logic which converts both values to strings

## Test Scenarios

### Scenario 1: Basic Visibility Condition
1. Create a main question (e.g., "Do you have previous experience?" with options "Yes" and "No")
2. Create a sub-question (e.g., "How many years of experience?") with visibility condition set to show only when the main question equals "Yes"
3. Save both questions
4. Preview the form and verify:
   - The sub-question only appears when "Yes" is selected
   - The sub-question correctly shows/hides when switching between options

### Scenario 2: Number vs String Type Handling
1. Create a main question with numeric options (e.g., "Select a number" with options "1", "2", "3")
2. Create a sub-question with visibility condition set to show only when the main question equals "2"
3. Save both questions
4. Preview the form and verify:
   - The sub-question appears correctly when "2" is selected
   - The sub-question behavior is consistent after saving and reloading

### Scenario 3: Multiple Dependent Questions
1. Create a multi-level dependency chain:
   - Question A: "Do you have a degree?" (Yes/No)
   - Question B: "What field is your degree in?" (visible when A = Yes)
   - Question C: "How many years since graduation?" (visible when B = specific value)
2. Save all questions
3. Preview the form and verify all visibility conditions work correctly across multiple levels

### Scenario 4: Different Question Types
1. Test visibility conditions with different question types:
   - Radio button to text field
   - Select dropdown to checkbox
   - Boolean/checkbox to number field
2. Save and verify correct behavior

## Verification Steps
1. Save the form with visibility conditions
2. Reload the page to ensure data persistence
3. Test each visibility condition by selecting different values
4. Verify that questions show/hide correctly based on the conditions

## Expected Results
- All questions with visibility conditions should show/hide correctly based on the selected values
- The behavior should be consistent after saving and reloading the form
- There should be no issues with type mismatches between saved values and comparison logic