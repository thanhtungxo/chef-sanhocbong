// Browser Testing Instructions
// Copy and paste this into browser console to test automatically

const testScenarios = [
  {
    name: "Scenario 1: Not Disadvantaged (Should be ELIGIBLE)",
    data: {
      nhomyeuthe: "khongyeuthe",
      gpa: "8.0", 
      pte: "68",
      kinhnghiem: "67",
      loaicongviec: "coquannhanuoc"
    }
  },
  {
    name: "Scenario 2: Disability with enough experience (Should be ELIGIBLE)",
    data: {
      nhomyeuthe: "disability",
      gpa: "8.0",
      pte: "68", 
      kinhnghiem: "15",
      loaicongviec: "coquannhanuoc"
    }
  },
  {
    name: "Scenario 3: Disability with insufficient experience (Should be NOT ELIGIBLE)",
    data: {
      nhomyeuthe: "disability",
      gpa: "8.0",
      pte: "68",
      kinhnghiem: "8", 
      loaicongviec: "coquannhanuoc"
    }
  }
];

function fillForm(data) {
  console.log("Filling form with data:", data);
  
  // Fill form fields
  Object.entries(data).forEach(([field, value]) => {
    const input = document.querySelector(`[name="${field}"]`) || 
                  document.querySelector(`#${field}`) ||
                  document.querySelector(`input[placeholder*="${field}"]`) ||
                  document.querySelector(`select[name="${field}"]`);
    
    if (input) {
      if (input.type === 'select-one' || input.tagName === 'SELECT') {
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      console.log(`Set ${field} = ${value}`);
    } else {
      console.warn(`Field ${field} not found`);
    }
  });
}

function submitForm() {
  const submitButton = document.querySelector('button[type="submit"]') ||
                      document.querySelector('button:contains("Submit")') ||
                      document.querySelector('.submit-btn') ||
                      document.querySelector('input[type="submit"]');
  
  if (submitButton) {
    console.log("Submitting form...");
    submitButton.click();
  } else {
    console.error("Submit button not found");
  }
}

function runTest(scenarioIndex = 0) {
  if (scenarioIndex >= testScenarios.length) {
    console.log("All tests completed!");
    return;
  }
  
  const scenario = testScenarios[scenarioIndex];
  console.log(`\n=== ${scenario.name} ===`);
  
  // Fill and submit form
  fillForm(scenario.data);
  
  setTimeout(() => {
    submitForm();
    
    // Wait for results and check
    setTimeout(() => {
      const results = document.querySelectorAll('.scholarship-result, .result-item, .eligibility-result');
      console.log("Results found:", results.length);
      
      results.forEach((result, index) => {
        console.log(`Result ${index + 1}:`, result.textContent);
      });
      
      // Continue to next test
      setTimeout(() => {
        runTest(scenarioIndex + 1);
      }, 3000);
    }, 2000);
  }, 1000);
}

// Instructions
console.log("=== BROWSER TESTING AUTOMATION ===");
console.log("1. Open http://localhost:5173/ in browser");
console.log("2. Open Developer Console (F12)");
console.log("3. Copy and paste this entire script");
console.log("4. Run: runTest()");
console.log("5. Watch the automated testing process");

// Export for manual use
window.testScenarios = testScenarios;
window.fillForm = fillForm;
window.submitForm = submitForm;
window.runTest = runTest;