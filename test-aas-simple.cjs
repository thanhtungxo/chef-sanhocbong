// Simple test for AAS rules after fix
const fs = require('fs');

// Load AAS rules
const aasRules = JSON.parse(fs.readFileSync('types/rules/aas.json', 'utf8'));

// Test data that matches what the form sends
const testAnswers = {
  nhomyeuthe: 'khongyeuthe',  // Not in vulnerable group
  gpa: 8.0,                   // Good GPA
  pte: 68,                    // Good PTE score
  workingtime: 56,            // 56 months experience
  employmenttype: 'gov_levels' // Government job
};

console.log('=== AAS RULES TEST ===');
console.log('Test data:', JSON.stringify(testAnswers, null, 2));
console.log('\nTotal rules:', aasRules.length);

// Simple rule evaluation function
function evaluateCondition(condition, answers) {
  const { field, operator, value, negate } = condition;
  const fieldValue = answers[field];
  
  let result;
  switch (operator) {
    case 'eq':
      result = fieldValue === value;
      break;
    case 'gte':
      result = fieldValue >= value;
      break;
    case 'in':
      result = Array.isArray(value) ? value.includes(fieldValue) : fieldValue === value;
      break;
    default:
      console.warn(`Unknown operator: ${operator}`);
      return false;
  }
  
  return negate ? !result : result;
}

function evaluateRule(rule, answers) {
  if (rule.type) {
    // Leaf rule - evaluate single condition
    return evaluateCondition(rule, answers);
  } else {
    // Group rule - evaluate conditions
    const { operator, conditions } = rule;
    
    if (!conditions || !Array.isArray(conditions)) {
      console.warn(`Rule ${rule.id} has no conditions`);
      return false;
    }
    
    const results = conditions.map(condition => {
      if (condition.operator) {
        // Nested group
        return evaluateRule(condition, answers);
      } else {
        // Single condition
        return evaluateCondition(condition, answers);
      }
    });
    
    if (operator === 'all') {
      return results.every(r => r);
    } else if (operator === 'any') {
      return results.some(r => r);
    }
    
    return false;
  }
}

// Test specific rules
const disabilityRule = aasRules.find(r => r.id === 'aas_disability_group');
const remoteAreaRule = aasRules.find(r => r.id === 'aas_remote_area_group');

console.log('\n=== DISABILITY RULE TEST ===');
if (disabilityRule) {
  console.log('Rule structure:', JSON.stringify(disabilityRule, null, 2));
  const result = evaluateRule(disabilityRule, testAnswers);
  console.log('Result:', result ? 'PASS' : 'FAIL');
} else {
  console.log('Disability rule not found');
}

console.log('\n=== REMOTE AREA RULE TEST ===');
if (remoteAreaRule) {
  console.log('Rule structure:', JSON.stringify(remoteAreaRule, null, 2));
  const result = evaluateRule(remoteAreaRule, testAnswers);
  console.log('Result:', result ? 'PASS' : 'FAIL');
} else {
  console.log('Remote area rule not found');
}

// Test all rules
console.log('\n=== ALL RULES TEST ===');
let passedRules = 0;
let failedRules = 0;

for (const rule of aasRules) {
  try {
    const result = evaluateRule(rule, testAnswers);
    if (result) {
      passedRules++;
      console.log(`✓ ${rule.id}: PASS`);
    } else {
      failedRules++;
      console.log(`✗ ${rule.id}: FAIL`);
    }
  } catch (error) {
    failedRules++;
    console.log(`✗ ${rule.id}: ERROR - ${error.message}`);
  }
}

console.log('\n=== SUMMARY ===');
console.log(`Passed: ${passedRules}`);
console.log(`Failed: ${failedRules}`);
console.log(`Total: ${aasRules.length}`);
console.log(`Overall: ${failedRules === 0 ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);