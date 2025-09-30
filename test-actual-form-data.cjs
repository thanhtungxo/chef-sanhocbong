// Test script với dữ liệu thực tế từ form
const fs = require('fs');
const path = require('path');

// Load AAS rules
const aasRulesPath = path.join(__dirname, 'types', 'rules', 'aas.json');
const aasRules = JSON.parse(fs.readFileSync(aasRulesPath, 'utf8'));

// Dữ liệu thực tế từ console logs
const actualFormData = {
  australiaPrOrCitizen: 'australiaPrNo',
  banATungCoTienAnTienSuChua: 'criminalno',
  birthday: '1111-12-11',
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
  spousepr: 'No',
  studyfield: 'b',
  workingtime: 67
};

// Simple rule engine
function evaluateCondition(condition, data) {
  switch (condition.type) {
    case 'select':
      const result = data[condition.field] === condition.expectedValue;
      return condition.negate ? !result : result;
    case 'minScore':
      return data[condition.field] >= condition.minScore;
    case 'boolean':
      return data[condition.field] === condition.expectedValue;
    default:
      return true;
  }
}

function evaluateRule(rule, data) {
  if (rule.operator === 'all') {
    return rule.conditions.every(cond => 
      cond.operator ? evaluateRule(cond, data) : evaluateCondition(cond, data)
    );
  } else if (rule.operator === 'any') {
    return rule.conditions.some(cond => 
      cond.operator ? evaluateRule(cond, data) : evaluateCondition(cond, data)
    );
  }
  return false;
}

console.log('🧪 Testing AAS with Actual Form Data');
console.log('====================================');
console.log('📋 Form Data:', JSON.stringify(actualFormData, null, 2));

const results = {};
const failedRules = [];

// Test each rule
for (const [ruleId, rule] of Object.entries(aasRules)) {
  const passed = evaluateRule(rule, actualFormData);
  results[ruleId] = passed;
  
  console.log(`${passed ? '✅' : '❌'} ${passed ? 'PASS' : 'FAIL'} ${ruleId}`);
  
  if (!passed) {
    failedRules.push({
      id: ruleId,
      message: rule.message || `Rule ${ruleId} failed`
    });
  }
}

const allPassed = Object.values(results).every(result => result);

console.log('\n📊 Final Result:');
console.log('================');
console.log(`${allPassed ? '✅' : '❌'} AAS SCHOLARSHIP: ${allPassed ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);

if (!allPassed) {
  console.log('Failed rules:');
  failedRules.forEach(rule => {
    console.log(`  - ${rule.id}: ${rule.message}`);
  });
}

console.log('\n🎯 Expected: ELIGIBLE (nhomyeuthe=khongyeuthe should bypass disability/remote area rules)');