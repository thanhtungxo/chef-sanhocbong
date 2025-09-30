// Test script to verify eligibility evaluation logic with field name mapping

// Import necessary modules
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory for file path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock toAnswerSet function EXACTLY as it is in the real code
function toAnswerSet(input) {
    const out = { ...input };

    // Normalize age to number if provided as string
    if (out.age != null && typeof out.age !== "number") {
        const n = Number(out.age);
        out.age = Number.isFinite(n) ? n : out.age;
    }

    // English score -> IELTS score used by current rules
    if (out.ielts == null && out.englishScore != null) {
        out.ielts = Number(out.englishScore);
    }

    // Military background
    if (out.military == null) {
        if (typeof out.hasMilitaryBackground === "boolean") out.military = out.hasMilitaryBackground;
        else if (typeof out.hasWorkedInMilitaryPolice === "boolean") out.military = out.hasWorkedInMilitaryPolice;
    }

    // Company ownership
    if (out.companyOwnership == null) {
        if (typeof out.isEmployerVietnameseOwned === "boolean") {
            out.companyOwnership = out.isEmployerVietnameseOwned ? "vietnamese_owned" : "non_vietnamese";
        }
    }

    // Work experience (in years)
    if (out.workExperience == null && out.yearsOfExperience != null) {
        out.workExperience = Number(out.yearsOfExperience);
    }

    // Country of residence
    if (out.countryOfResidence == null) {
        if (out.country) out.countryOfResidence = String(out.country).toLowerCase();
        else if (out.countryOfCitizenship) out.countryOfResidence = String(out.countryOfCitizenship).toLowerCase();
    }

    // Return to home country commitment
    if (out.returnToHomeCountry == null && typeof out.planToReturn === "boolean") {
        out.returnToHomeCountry = out.planToReturn;
    }

    // Leadership potential
    if (out.hasLeadershipPotential == null && typeof out.leadershipPotential === "boolean") {
        out.hasLeadershipPotential = out.leadershipPotential;
    }

    return out;
}

// Mock evaluateEligibility function with our fixed logic
function evaluateEligibility(answers, rules) {
  const failed = [];

  const evalLeaf = (rule) => {
    const userValue = answers[rule.field];
    switch (rule.type) {
      case 'minScore':
        return typeof userValue === 'number' && userValue >= rule.value;
      case 'boolean':
        return userValue === rule.value;
      case 'select':
        return userValue === rule.value;
      case 'text':
        return typeof userValue === 'string' && userValue.trim() !== '';
      default:
        return false;
    }
  };

  const visit = (node) => {
    if ('type' in node) {
      const ok = evalLeaf(node);
      if (!ok) failed.push(node);
      return ok;
    }
    // group
    const results = node.rules.map(visit);
    const ok = node.operator === 'all' ? results.every(Boolean) : results.some(Boolean);
    // If group fails and group has its own message AND severity defined, push a synthetic failure
    if (!ok && node.message && node.severity) {
      failed.push({
        id: node.id,
        type: 'text',
        field: '__group__',
        value: true,
        message: node.message,
        messageKey: node.messageKey,
        severity: node.severity,
      });
    }
    return ok;
  };

  // Handle case when there are no rules
  if (rules.length === 0) {
    return {
      passed: true,
      failedRules: [],
    };
  }

  for (const r of rules) visit(r);

  const hasBlocker = failed.some((r) => (r.severity ?? 'blocker') === 'blocker');
  return {
    passed: !hasBlocker,
    failedRules: failed,
  };
}

// Mock submitAndEvaluateForm function - will be replaced later
let submitAndEvaluateForm = function(responses, fullName, email) {
  console.log("Form submitted:", {
    fullName,
    email,
    responses
  });

  // Mock scholarship data
  const scholarships = [
    { id: 'aas', name: 'Australia Awards Scholarship' },
    { id: 'chevening', name: 'Chevening Scholarship' }
  ];

  const eligibilityResults = [];

  for (const scholarship of scholarships) {
    try {
      // Try to load rules from JSON files
        let rules = [];
        try {
          // In ES modules, we don't have __dirname, so we'll use a relative path
          const rulePath = join('types', 'rules', `${scholarship.id}.json`);
          const ruleData = readFileSync(rulePath, 'utf8');
          rules = JSON.parse(ruleData);
          console.log(`Loaded ${rules.length} rules for ${scholarship.id}`);
        } catch (error) {
          console.log(`Failed to load rules for ${scholarship.id}:`, error.message);
        }

      // Evaluate eligibility
      const evaluation = evaluateEligibility(responses, rules);
      
      console.log(`${scholarship.name} evaluation:`, {
        passed: evaluation.passed,
        failedRules: evaluation.failedRules.map(r => r.message)
      });

      eligibilityResults.push({
        id: scholarship.id,
        name: scholarship.name,
        eligible: evaluation.passed,
        reasons: evaluation.failedRules.map(r => r.message),
      });
    } catch (error) {
      console.error(`Failed to evaluate scholarship ${scholarship.id}:`, error);
      eligibilityResults.push({
        id: scholarship.id,
        name: scholarship.name,
        eligible: false,
        reasons: ["Lỗi trong quá trình đánh giá đủ điều kiện"],
      });
    }
  }

  // Log the results for debugging
  console.log("Form submission results:", {
    fullName,
    email,
    eligibilityResults
  });

  // Calculate messageType based on eligibility results
  const totalScholarships = eligibilityResults.length;
  const passedScholarships = eligibilityResults.filter(result => result.eligible).length;

  console.log(`Form evaluation stats: Total=${totalScholarships}, Passed=${passedScholarships}`);
  console.log(`Scholarship eligibility details:`, eligibilityResults);

  let messageType = "pass_some";
  let overallEligible = false;

  if (passedScholarships === 0) {
    messageType = "fail_all";
    overallEligible = false;
    console.log(`Calculated messageType: ${messageType}, eligible: ${overallEligible}`);
  } else if (passedScholarships === totalScholarships) {
    messageType = "pass_all";
    overallEligible = true;
    console.log(`Calculated messageType: ${messageType}, eligible: ${overallEligible}`);
  } else {
    messageType = "pass_some";
    overallEligible = true;
    console.log(`Calculated messageType: ${messageType}, eligible: ${overallEligible}`);
  }

  // Return all evaluation results with messageType
  return {
    applicationId: "", // This will be populated when saved
    scholarships: eligibilityResults,
    eligible: overallEligible,
    messageType
  };
}

// Enhanced test function with detailed logging for rule evaluation
function enhancedEvaluateEligibility(answers, rules) {
  const failed = [];
  const ruleResults = [];

  const evalLeaf = (rule) => {
    const userValue = answers[rule.field];
    let passed = false;
    
    switch (rule.type) {
      case 'minScore':
        passed = typeof userValue === 'number' && userValue >= rule.value;
        break;
      case 'boolean':
        passed = userValue === rule.value;
        break;
      case 'select':
        passed = userValue === rule.value;
        break;
      case 'text':
        passed = typeof userValue === 'string' && userValue.trim() !== '';
        break;
      default:
        passed = false;
    }
    
    ruleResults.push({
      ruleId: rule.id,
      field: rule.field,
      ruleType: rule.type,
      ruleValue: rule.value,
      userValue: userValue,
      passed: passed,
      message: rule.message
    });
    
    return passed;
  };

  const visit = (node) => {
    if ('type' in node) {
      const ok = evalLeaf(node);
      if (!ok) failed.push(node);
      return ok;
    }
    // group
    const results = node.rules.map(visit);
    const ok = node.operator === 'all' ? results.every(Boolean) : results.some(Boolean);
    // If group fails and group has its own message AND severity defined, push a synthetic failure
    if (!ok && node.message && node.severity) {
      failed.push({
        id: node.id,
        type: 'text',
        field: '__group__',
        value: true,
        message: node.message,
        messageKey: node.messageKey,
        severity: node.severity,
      });
    }
    return ok;
  };

  // Handle case when there are no rules
  if (rules.length === 0) {
    return {
      passed: true,
      failedRules: [],
      ruleResults: []
    };
  }

  for (const r of rules) visit(r);

  const hasBlocker = failed.some((r) => (r.severity ?? 'blocker') === 'blocker');
  return {
    passed: !hasBlocker,
    failedRules: failed,
    ruleResults: ruleResults
  };
}

// Update submitAndEvaluateForm to use enhancedEvaluateEligibility AND FIELD NAME MAPPING
submitAndEvaluateForm = function(responses, fullName, email) {
  console.log("Form submitted:", {
    fullName,
    email,
    responses
  });
  
  // Apply field name mapping using toAnswerSet - THIS IS WHAT WE'RE TESTING
  console.log("\n[TESTING FIX] Applying field name mapping with toAnswerSet...");
  const mappedResponses = toAnswerSet(responses);
  console.log("Original Form Responses:", responses);
  console.log("Mapped Rule Responses:", mappedResponses);
  
  // Verify key field mappings
  if (responses.yearsOfExperience !== undefined) {
    console.log(`- yearsOfExperience (${responses.yearsOfExperience}) mapped to workExperience: ${mappedResponses.workExperience === responses.yearsOfExperience}`);
  }
  if (responses.englishScore !== undefined) {
    console.log(`- englishScore (${responses.englishScore}) mapped to ielts: ${mappedResponses.ielts === responses.englishScore}`);
  }
  if (responses.planToReturn !== undefined) {
    console.log(`- planToReturn (${responses.planToReturn}) mapped to returnToHomeCountry: ${mappedResponses.returnToHomeCountry === responses.planToReturn}`);
  }

  // Mock scholarship data
  const scholarships = [
    { id: 'aas', name: 'Australia Awards Scholarship' },
    { id: 'chevening', name: 'Chevening Scholarship' }
  ];

  const eligibilityResults = [];

  for (const scholarship of scholarships) {
    try {
      // Try to load rules from JSON files
      let rules = [];
      try {
        // In ES modules, we don't have __dirname, so we'll use a relative path
        const rulePath = join('types', 'rules', `${scholarship.id}.json`);
        const ruleData = readFileSync(rulePath, 'utf8');
        rules = JSON.parse(ruleData);
        console.log(`Loaded ${rules.length} rules for ${scholarship.id}`);
      } catch (error) {
        console.log(`Failed to load rules for ${scholarship.id}:`, error.message);
      }

      // Use enhanced evaluation with detailed logging using MAPPED responses
      const evaluation = enhancedEvaluateEligibility(mappedResponses, rules);
      
      console.log(`${scholarship.name} evaluation:`, {
        passed: evaluation.passed,
        failedRules: evaluation.failedRules.map(r => r.message),
        ruleCount: evaluation.ruleResults.length
      });

      // Log detailed rule results for debugging
      console.log(`Detailed rule results for ${scholarship.name}:`);
      evaluation.ruleResults.forEach(result => {
        if (!result.passed && result.message) {
          console.log(`  - FAILED: ${result.message} (Field: ${result.field}, UserValue: ${result.userValue}, RuleValue: ${result.ruleValue})`);
        }
      });

      eligibilityResults.push({
        id: scholarship.id,
        name: scholarship.name,
        eligible: evaluation.passed,
        reasons: evaluation.failedRules.map(r => r.message),
      });
    } catch (error) {
      console.error(`Failed to evaluate scholarship ${scholarship.id}:`, error);
      eligibilityResults.push({
        id: scholarship.id,
        name: scholarship.name,
        eligible: false,
        reasons: ["Lỗi trong quá trình đánh giá đủ điều kiện"],
      });
    }
  }

  // Log the results for debugging
  console.log("Form submission results:", {
    fullName,
    email,
    eligibilityResults
  });

  // Calculate messageType based on eligibility results
  const totalScholarships = eligibilityResults.length;
  const passedScholarships = eligibilityResults.filter(result => result.eligible).length;

  console.log(`Form evaluation stats: Total=${totalScholarships}, Passed=${passedScholarships}`);
  console.log(`Scholarship eligibility details:`, eligibilityResults);

  let messageType = "pass_some";
  let overallEligible = false;

  if (passedScholarships === 0) {
    messageType = "fail_all";
    overallEligible = false;
    console.log(`Calculated messageType: ${messageType}, eligible: ${overallEligible}`);
  } else if (passedScholarships === totalScholarships) {
    messageType = "pass_all";
    overallEligible = true;
    console.log(`Calculated messageType: ${messageType}, eligible: ${overallEligible}`);
  } else {
    messageType = "pass_some";
    overallEligible = true;
    console.log(`Calculated messageType: ${messageType}, eligible: ${overallEligible}`);
  }

  // Return all evaluation results with messageType
  return {
    applicationId: "", // This will be populated when saved
    scholarships: eligibilityResults,
    eligible: overallEligible,
    messageType
  };
};

// Test cases with ORIGINAL FORM FIELD NAMES (not rule field names) to test mapping
const testCases = [
  {
    name: "Test Case 1: Original User with 2 years experience (TESTING FIELD MAPPING)",
    user: {
      fullName: "John Doe",
      email: "john@example.com",
      responses: {
        // Original form field names (not rule field names)
        englishScore: 7.5,  // Should map to ielts
        highestQualification: "bachelor",
        yearsOfExperience: 2,  // Should map to workExperience
        countryOfCitizenship: "Vietnam",
        isEmployerVietnameseOwned: true,
        planToReturn: true,  // Should map to returnToHomeCountry
        hasWorkedInMilitaryPolice: false,  // Should map to military
        hasStudiedAbroadOnGovScholarship: false,
        age: 28,
        hasLeadershipPotential: true
      }
    }
  },
  {
    name: "Test Case 2: User with 3 years experience (TESTING FIELD MAPPING)",
    user: {
      fullName: "Jane Smith",
      email: "jane@example.com",
      responses: {
        englishScore: 7.5,
        highestQualification: "bachelor",
        yearsOfExperience: 3,
        countryOfCitizenship: "Vietnam",
        isEmployerVietnameseOwned: true,
        planToReturn: true,
        hasWorkedInMilitaryPolice: false,
        hasStudiedAbroadOnGovScholarship: false,
        age: 28,
        hasLeadershipPotential: true
      }
    }
  },
  {
    name: "Test Case 3: Ideal Candidate (TESTING FIELD MAPPING)",
    user: {
      fullName: "Ideal Candidate",
      email: "ideal@example.com",
      responses: {
        englishScore: 8.0,
        highestQualification: "bachelor",
        yearsOfExperience: 4,
        countryOfCitizenship: "Vietnam",
        isEmployerVietnameseOwned: true,
        planToReturn: true,
        hasWorkedInMilitaryPolice: false,
        hasStudiedAbroadOnGovScholarship: false,
        age: 30,
        hasLeadershipPotential: true,
        // Additional fields for comprehensive testing
        fieldOfStudy: "Development Studies",
        intendedCourse: "Master",
        country: "vietnam",
        leadershipPotential: true,
        hasMilitaryBackground: false,
        gpa: 7.5
      }
    }
  }
];

// Run all test cases
console.log("Running comprehensive eligibility tests...\n");

testCases.forEach((testCase, index) => {
  console.log(`\n========== Test Case ${index + 1}: ${testCase.name} ==========`);
  const result = submitAndEvaluateForm(testCase.user.responses, testCase.user.fullName, testCase.user.email);
  console.log(`Test Case ${index + 1} Result: Eligible=${result.eligible}, MessageType=${result.messageType}`);
  console.log("==========================================\n");
});

console.log("All tests completed.");