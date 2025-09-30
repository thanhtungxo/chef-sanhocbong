// Simple test for AAS rules after fix
const fs = require('fs');

// Load AAS rules
const aasRules = JSON.parse(fs.readFileSync('types/rules/aas.json', 'utf8'));

// Test data that matches what the form sends (from browser console)
const testData = {
  // Form data from browser console
  australiaPrOrCitizen: 'australiaPrNo',
  banATungCoTienAnTienSuChua: 'criminalno',
  birthday: '1234-12-11',
  citizenship: 'citizenshipyes',
  email: 'trunghieu1991988@gmail.com',
  employerName: 'a',
  employmenttype: 'gov_levels',
  englishProficiency: 'PTE',
  fullname: 'a',
  govscholarship: 'govescholarno',
  gpa: 8,
  highestQualification: 'Bachelor',
  military: 'militaryno',
  nhomyeuthe: 'khongyeuthe',
  ptegrade: '68',
  // spousepr: 'No',  // Original form value
  studyfield: 'b',
  workingtime: 67,
  
  // Mapped boolean fields (from mappers.ts)
  isVietnameseCitizen: true,
  hasAustralianCitizenship: false,
  hasAustralianPR: false,
  isMilitary: false,
  
  // Additional mapped fields
  countryscholarship: 'Scholarother',
  hasCriminalRecordOrInvestigation: false,
  
  // Fix spousepr mapping - "No" should map to "spouseprno"
  spousepr: 'spouseprno'  // Override the "No" value
};

console.log('=== AAS RULES TEST ===');
console.log('Test data:', JSON.stringify(testData, null, 2));
console.log('\nTotal rules:', aasRules.length);

// Simple rule evaluation function
function evaluateCondition(condition, answers) {
  const { field, type, expectedValue, minScore, value, operator, negate } = condition;
  const fieldValue = answers[field];
  
  let result;
  
  if (type === 'select') {
    result = fieldValue === (expectedValue || value);
  } else if (type === 'minScore') {
    result = fieldValue >= (minScore || value);
  } else if (type === 'boolean') {
    result = fieldValue === (expectedValue || value);
  } else if (operator) {
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
  } else {
    console.warn(`Unknown condition type: ${type || 'undefined'}`);
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
    } else {
      console.warn(`Unknown operator: ${operator}`);
      return false;
    }
  }
}

// Test specific rules
const disabilityRule = aasRules.find(r => r.id === 'aas_disability_group');
const remoteAreaRule = aasRules.find(r => r.id === 'aas_remote_area_group');

console.log('\n=== DISABILITY RULE TEST ===');
if (disabilityRule) {
  console.log('Rule structure:', JSON.stringify(disabilityRule, null, 2));
  const result = evaluateRule(disabilityRule, testData);
  console.log('Result:', result ? 'PASS' : 'FAIL');
} else {
  console.log('Disability rule not found');
}

console.log('\n=== REMOTE AREA RULE TEST ===');
if (remoteAreaRule) {
  console.log('Rule structure:', JSON.stringify(remoteAreaRule, null, 2));
  const result = evaluateRule(remoteAreaRule, testData);
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
    const result = evaluateRule(rule, testData);
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