// Browser-based Form Testing Script
// Copy and paste this entire script into the browser console at http://localhost:5173/

console.log("=== AAS FORM TESTING SCRIPT ===");
console.log("This script will help you test the form systematically");
console.log("");

// Test scenarios based on corrected AAS rules
const testScenarios = [
  {
    name: "Test 1: Not Disadvantaged (Should be ELIGIBLE)",
    description: "User is not in any disadvantaged group - should pass immediately",
    expectedResult: "AAS: ELIGIBLE",
    formData: {
      fullName: "Nguyen Van Test",
      email: "test@example.com",
      dateOfBirth: "1995-01-01",
      gender: "Male",
      countryOfCitizenship: "Vietnam",
      currentCity: "Ho Chi Minh City",
      highestQualification: "bachelor",
      yearsOfExperience: 5,
      currentJobTitle: "Software Engineer",
      employerName: "Tech Company",
      isEmployerVietnameseOwned: true,
      employmentSector: "Technology",
      hasWorkedInMilitaryPolice: false,
      planToReturn: true,
      hasStudiedAbroadOnGovScholarship: false,
      englishTestType: "PTE",
      englishScore: 68
    }
  },
  {
    name: "Test 2: Disability with Sufficient Experience (Should be ELIGIBLE)",
    description: "User has disability but has 24+ months experience",
    expectedResult: "AAS: ELIGIBLE",
    formData: {
      fullName: "Nguyen Van Disability",
      email: "disability@example.com",
      dateOfBirth: "1995-01-01",
      gender: "Male",
      countryOfCitizenship: "Vietnam",
      currentCity: "Ho Chi Minh City",
      highestQualification: "bachelor",
      yearsOfExperience: 2.5, // 30 months > 12 months required
      currentJobTitle: "Software Engineer",
      employerName: "Tech Company",
      isEmployerVietnameseOwned: true,
      employmentSector: "Technology",
      hasWorkedInMilitaryPolice: false,
      planToReturn: true,
      hasStudiedAbroadOnGovScholarship: false,
      englishTestType: "PTE",
      englishScore: 68
    }
  },
  {
    name: "Test 3: Disability with Insufficient Experience (Should be NOT ELIGIBLE)",
    description: "User has disability but only has 8 months experience",
    expectedResult: "AAS: NOT ELIGIBLE",
    formData: {
      fullName: "Nguyen Van DisabilityFail",
      email: "disabilityfail@example.com",
      dateOfBirth: "1995-01-01",
      gender: "Male",
      countryOfCitizenship: "Vietnam",
      currentCity: "Ho Chi Minh City",
      highestQualification: "bachelor",
      yearsOfExperience: 0.67, // 8 months < 12 months required
      currentJobTitle: "Software Engineer",
      employerName: "Tech Company",
      isEmployerVietnameseOwned: true,
      employmentSector: "Technology",
      hasWorkedInMilitaryPolice: false,
      planToReturn: true,
      hasStudiedAbroadOnGovScholarship: false,
      englishTestType: "PTE",
      englishScore: 68
    }
  }
];

// Helper function to fill form fields
function fillFormField(fieldName, value) {
  // Try multiple selectors to find the field
  const selectors = [
    `[name="${fieldName}"]`,
    `#${fieldName}`,
    `input[placeholder*="${fieldName}"]`,
    `select[name="${fieldName}"]`,
    `textarea[name="${fieldName}"]`,
    `input[data-field="${fieldName}"]`,
    `select[data-field="${fieldName}"]`
  ];
  
  let input = null;
  for (const selector of selectors) {
    input = document.querySelector(selector);
    if (input) break;
  }
  
  if (input) {
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.checked = Boolean(value);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (input.tagName === 'SELECT') {
      input.value = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    console.log(`✓ Set ${fieldName} = ${value}`);
    return true;
  } else {
    console.warn(`⚠ Field ${fieldName} not found`);
    return false;
  }
}

// Helper function to click next button
function clickNext() {
  const nextButtons = [
    'button[type="submit"]',
    'button:contains("Tiếp theo")',
    'button:contains("Next")',
    '.btn-next',
    '[data-testid="next-button"]'
  ];
  
  for (const selector of nextButtons) {
    const button = document.querySelector(selector);
    if (button && !button.disabled) {
      button.click();
      console.log('✓ Clicked next button');
      return true;
    }
  }
  
  // Try finding button by text content
  const buttons = document.querySelectorAll('button');
  for (const button of buttons) {
    if (button.textContent.includes('Tiếp theo') || button.textContent.includes('Next') || button.textContent.includes('Hoàn thành')) {
      button.click();
      console.log('✓ Clicked next/finish button');
      return true;
    }
  }
  
  console.warn('⚠ Next button not found');
  return false;
}

// Helper function to wait for a condition
function waitFor(condition, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      if (condition()) {
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

// Main test function
async function runTest(testIndex = 0) {
  if (testIndex >= testScenarios.length) {
    console.log("🎉 All tests completed!");
    return;
  }
  
  const test = testScenarios[testIndex];
  console.log(`\n=== ${test.name} ===`);
  console.log(`Description: ${test.description}`);
  console.log(`Expected: ${test.expectedResult}`);
  
  // Step 1: Personal Information
  console.log("\n📝 Step 1: Personal Information");
  fillFormField('fullName', test.formData.fullName);
  fillFormField('email', test.formData.email);
  fillFormField('dateOfBirth', test.formData.dateOfBirth);
  fillFormField('gender', test.formData.gender);
  fillFormField('countryOfCitizenship', test.formData.countryOfCitizenship);
  fillFormField('currentCity', test.formData.currentCity);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  clickNext();
  
  // Wait for next step to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 2: Education
  console.log("\n🎓 Step 2: Education");
  fillFormField('highestQualification', test.formData.highestQualification);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  clickNext();
  
  // Wait for next step to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 3: Employment
  console.log("\n💼 Step 3: Employment");
  fillFormField('yearsOfExperience', test.formData.yearsOfExperience);
  fillFormField('currentJobTitle', test.formData.currentJobTitle);
  fillFormField('employerName', test.formData.employerName);
  fillFormField('isEmployerVietnameseOwned', test.formData.isEmployerVietnameseOwned);
  fillFormField('employmentSector', test.formData.employmentSector);
  fillFormField('hasWorkedInMilitaryPolice', test.formData.hasWorkedInMilitaryPolice);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  clickNext();
  
  // Wait for next step to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 4: Final Questions
  console.log("\n✅ Step 4: Final Questions");
  fillFormField('planToReturn', test.formData.planToReturn);
  fillFormField('hasStudiedAbroadOnGovScholarship', test.formData.hasStudiedAbroadOnGovScholarship);
  fillFormField('englishTestType', test.formData.englishTestType);
  fillFormField('englishScore', test.formData.englishScore);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  clickNext();
  
  // Wait for results
  console.log("\n⏳ Waiting for results...");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Check results
  console.log("\n🔍 Checking results...");
  const resultElements = document.querySelectorAll('*');
  let foundResult = false;
  
  for (const element of resultElements) {
    const text = element.textContent || '';
    if (text.includes('AAS') && (text.includes('ELIGIBLE') || text.includes('NOT ELIGIBLE') || text.includes('Đủ điều kiện') || text.includes('Không đủ điều kiện'))) {
      console.log(`📊 Found result: ${text}`);
      foundResult = true;
      
      // Check if result matches expected
      const isEligible = text.includes('ELIGIBLE') || text.includes('Đủ điều kiện');
      const expectedEligible = test.expectedResult.includes('ELIGIBLE');
      
      if (isEligible === expectedEligible) {
        console.log(`✅ Test ${testIndex + 1} PASSED: Result matches expected outcome`);
      } else {
        console.log(`❌ Test ${testIndex + 1} FAILED: Expected ${test.expectedResult}, got ${text}`);
      }
      break;
    }
  }
  
  if (!foundResult) {
    console.log(`❓ Test ${testIndex + 1} INCONCLUSIVE: Could not find result on page`);
    console.log("Please check the page manually for results");
  }
  
  console.log(`\n✨ Test ${testIndex + 1} completed. Check the result page UI for proper formatting.`);
  console.log("Press any key to continue to next test or refresh page to start over...");
}

// Manual test functions
window.testAAS = {
  // Run a specific test
  runTest: runTest,
  
  // Run all tests sequentially
  runAllTests: async function() {
    for (let i = 0; i < testScenarios.length; i++) {
      await runTest(i);
      if (i < testScenarios.length - 1) {
        console.log("\n🔄 Refreshing page for next test...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        location.reload();
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  },
  
  // Fill form with specific test data
  fillForm: function(testIndex = 0) {
    const test = testScenarios[testIndex];
    console.log(`Filling form with ${test.name} data...`);
    
    Object.entries(test.formData).forEach(([field, value]) => {
      fillFormField(field, value);
    });
  },
  
  // Helper to check current form values
  checkFormValues: function() {
    const inputs = document.querySelectorAll('input, select, textarea');
    console.log("Current form values:");
    inputs.forEach(input => {
      if (input.name || input.id) {
        console.log(`${input.name || input.id}: ${input.value}`);
      }
    });
  },
  
  // Show test scenarios
  showTests: function() {
    testScenarios.forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}`);
      console.log(`   Expected: ${test.expectedResult}`);
    });
  }
};

console.log("\n=== TESTING COMMANDS ===");
console.log("Available commands:");
console.log("• testAAS.runTest(0) - Run Test 1 (Not Disadvantaged)");
console.log("• testAAS.runTest(1) - Run Test 2 (Disability with sufficient experience)");
console.log("• testAAS.runTest(2) - Run Test 3 (Disability with insufficient experience)");
console.log("• testAAS.runAllTests() - Run all tests sequentially");
console.log("• testAAS.fillForm(0) - Fill form with Test 1 data");
console.log("• testAAS.checkFormValues() - Check current form values");
console.log("• testAAS.showTests() - Show all test scenarios");
console.log("");
console.log("🚀 Start testing by running: testAAS.runTest(0)");