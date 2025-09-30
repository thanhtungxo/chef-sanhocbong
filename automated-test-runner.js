// Automated Test Runner for AAS Form
// This script will run all tests automatically and report results

const puppeteer = require('puppeteer');
const fs = require('fs');

// Test scenarios
const testScenarios = [
  {
    name: "Test 1: Not Disadvantaged (Should be ELIGIBLE)",
    description: "User is not in any disadvantaged group - should pass immediately",
    expectedResult: "AAS: ELIGIBLE",
    formData: {
      fullName: "Nguyen Van Test",
      email: "test@example.com",
      dateOfBirth: "1995-01-01",
      gender: "male",
      educationLevel: "bachelor",
      graduationYear: "2018",
      gpa: "3.5",
      englishScore: "7.0",
      yearsOfExperience: "60", // 5 years = 60 months
      currentEmploymentStatus: "employed",
      hasDisability: "no",
      isFromRemoteArea: "no",
      planToReturn: "yes"
    }
  },
  {
    name: "Test 2: Disability with Sufficient Experience (Should be ELIGIBLE)",
    description: "User has disability but has 30+ months experience",
    expectedResult: "AAS: ELIGIBLE",
    formData: {
      fullName: "Nguyen Thi Binh",
      email: "binh.nguyen@email.com",
      dateOfBirth: "1995-03-15",
      gender: "female",
      educationLevel: "bachelor",
      graduationYear: "2018",
      gpa: "3.2",
      englishScore: "6.5",
      yearsOfExperience: "30", // 30 months > 12 months required
      currentEmploymentStatus: "employed",
      hasDisability: "yes", // ✅ Has disability
      isFromRemoteArea: "no",
      planToReturn: "yes"
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
      gender: "male",
      educationLevel: "bachelor",
      graduationYear: "2018",
      gpa: "3.0",
      englishScore: "6.0",
      yearsOfExperience: "8", // 8 months < 12 months required
      currentEmploymentStatus: "employed",
      hasDisability: "yes", // ✅ Has disability
      isFromRemoteArea: "no",
      planToReturn: "yes"
    }
  }
];

async function runAutomatedTests() {
  console.log("🚀 Starting Automated AAS Form Testing...");
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const results = [];
  
  for (let i = 0; i < testScenarios.length; i++) {
    const test = testScenarios[i];
    console.log(`\n📋 Running ${test.name}...`);
    
    try {
      const result = await runSingleTest(browser, test, i);
      results.push(result);
      console.log(`✅ ${test.name}: ${result.status}`);
    } catch (error) {
      console.error(`❌ ${test.name}: FAILED - ${error.message}`);
      results.push({
        testName: test.name,
        status: 'FAILED',
        error: error.message,
        expectedResult: test.expectedResult,
        actualResult: 'ERROR'
      });
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  await browser.close();
  
  // Generate report
  generateTestReport(results);
  
  return results;
}

async function runSingleTest(browser, test, testIndex) {
  const page = await browser.newPage();
  
  try {
    // Navigate to form
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    console.log(`  📝 Filling form with test data...`);
    
    // Fill form step by step
    await fillFormData(page, test.formData);
    
    // Submit form and wait for results
    console.log(`  🔄 Submitting form...`);
    await submitForm(page);
    
    // Wait for results page
    await page.waitForSelector('[data-testid="result-page"], .result-page, .scholarship-results', { timeout: 15000 });
    
    console.log(`  📊 Checking results...`);
    
    // Extract results
    const actualResult = await extractResults(page);
    
    const testResult = {
      testName: test.name,
      status: actualResult.includes('ELIGIBLE') === test.expectedResult.includes('ELIGIBLE') ? 'PASSED' : 'FAILED',
      expectedResult: test.expectedResult,
      actualResult: actualResult,
      formData: test.formData
    };
    
    return testResult;
    
  } finally {
    await page.close();
  }
}

async function fillFormData(page, formData) {
  for (const [fieldName, value] of Object.entries(formData)) {
    try {
      // Try multiple selectors to find the field
      const selectors = [
        `[name="${fieldName}"]`,
        `#${fieldName}`,
        `input[placeholder*="${fieldName}"]`,
        `select[name="${fieldName}"]`,
        `[data-field="${fieldName}"] input`,
        `[data-field="${fieldName}"] select`
      ];
      
      let fieldFound = false;
      
      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 1000 });
          
          const element = await page.$(selector);
          if (element) {
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            const inputType = await element.evaluate(el => el.type);
            
            if (tagName === 'select') {
              await page.select(selector, value.toString());
            } else if (inputType === 'checkbox' || inputType === 'radio') {
              if (value === 'yes' || value === true) {
                await page.check(selector);
              }
            } else {
              await page.fill(selector, value.toString());
            }
            
            fieldFound = true;
            console.log(`    ✓ Set ${fieldName} = ${value}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!fieldFound) {
        console.warn(`    ⚠ Field ${fieldName} not found`);
      }
      
    } catch (error) {
      console.warn(`    ⚠ Error filling ${fieldName}: ${error.message}`);
    }
  }
  
  // Navigate through form steps
  await navigateFormSteps(page);
}

async function navigateFormSteps(page) {
  let stepCount = 0;
  const maxSteps = 10;
  
  while (stepCount < maxSteps) {
    try {
      // Look for Next button
      const nextButton = await page.$('button:has-text("Next"), button:has-text("Tiếp theo"), [data-testid="next-button"]');
      
      if (nextButton) {
        await nextButton.click();
        await page.waitForTimeout(1000);
        stepCount++;
        console.log(`    📄 Moved to step ${stepCount + 1}`);
      } else {
        // Look for Submit button
        const submitButton = await page.$('button:has-text("Submit"), button:has-text("Gửi"), [data-testid="submit-button"]');
        if (submitButton) {
          console.log(`    📤 Found submit button`);
          break;
        } else {
          console.log(`    ✅ Form navigation complete`);
          break;
        }
      }
    } catch (error) {
      console.log(`    ℹ Navigation step ${stepCount}: ${error.message}`);
      break;
    }
  }
}

async function submitForm(page) {
  try {
    const submitButton = await page.$('button:has-text("Submit"), button:has-text("Gửi"), [data-testid="submit-button"], button[type="submit"]');
    
    if (submitButton) {
      await submitButton.click();
      console.log(`    📤 Form submitted`);
    } else {
      throw new Error('Submit button not found');
    }
  } catch (error) {
    throw new Error(`Failed to submit form: ${error.message}`);
  }
}

async function extractResults(page) {
  try {
    // Wait a bit for results to load
    await page.waitForTimeout(3000);
    
    // Try to find AAS result
    const resultSelectors = [
      '[data-testid="aas-result"]',
      '.scholarship-result:has-text("AAS")',
      '.result-item:has-text("AAS")',
      'text=AAS'
    ];
    
    for (const selector of resultSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text.includes('AAS')) {
            console.log(`    📊 Found AAS result: ${text}`);
            return text;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Fallback: get all text content and look for AAS
    const pageText = await page.textContent('body');
    const aasMatch = pageText.match(/AAS[:\s]*(ELIGIBLE|NOT ELIGIBLE|QUALIFIED|NOT QUALIFIED)/i);
    
    if (aasMatch) {
      return `AAS: ${aasMatch[1].toUpperCase()}`;
    }
    
    return 'AAS: RESULT NOT FOUND';
    
  } catch (error) {
    throw new Error(`Failed to extract results: ${error.message}`);
  }
}

function generateTestReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.testName}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Expected: ${result.expectedResult}`);
    console.log(`   Actual: ${result.actualResult}`);
    
    if (result.status === 'PASSED') {
      passed++;
      console.log(`   ✅ PASSED`);
    } else {
      failed++;
      console.log(`   ❌ FAILED`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`📈 FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(60));
  
  // Save detailed report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: { passed, failed, total: results.length },
    results: results
  };
  
  fs.writeFileSync('test-results.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Detailed report saved to test-results.json');
}

// Run tests if called directly
if (require.main === module) {
  runAutomatedTests()
    .then(results => {
      console.log('\n🎉 Automated testing completed!');
      process.exit(results.every(r => r.status === 'PASSED') ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Automated testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runAutomatedTests, testScenarios };