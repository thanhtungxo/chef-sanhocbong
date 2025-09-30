// Test script để kiểm tra AAS scholarship eligibility sau khi fix
const fs = require('fs');
const path = require('path');

// Load AAS rules
const aasRulesPath = path.join(__dirname, 'types', 'rules', 'aas.json');
const aasRules = JSON.parse(fs.readFileSync(aasRulesPath, 'utf8'));

// Load mappers (giả lập từ client-side)
function mapFormDataToEvaluation(formData) {
  return {
    nhomyeuthe: formData.vulnerableGroups?.includes('disability') ? 'disability' :
                formData.vulnerableGroups?.includes('hardship_area') ? 'hardship_area' : 'khongyeuthe',
    gpa: parseFloat(formData.gpa) || 0,
    englishTestType: formData.englishTestType || '',
    ieltsgrade: formData.englishTestType === 'ielts' ? parseFloat(formData.ieltsScore) || 0 : 0,
    toeflgrade: formData.englishTestType === 'toefl' ? parseFloat(formData.toeflScore) || 0 : 0,
    ptegrade: formData.englishTestType === 'pte' ? parseFloat(formData.pteScore) || 0 : 0,
    workingtime: parseInt(formData.workExperience) || 0,
    militaryService: formData.militaryService || '',
    companyOwnership: formData.companyOwnership || '',
    countryOfResidence: formData.countryOfResidence || '',
    // Các field bổ sung cho AAS
    isVietnameseCitizen: formData.isVietnameseCitizen || false,
    hasAustralianCitizenship: formData.hasAustralianCitizenship || false,
    hasAustralianPR: formData.hasAustralianPR || false,
    spousepr: formData.spousepr || '',
    isMilitary: formData.isMilitary || false,
    countryscholarship: formData.countryscholarship || '',
    criminalRecord: formData.criminalRecord || '',
    workplace: formData.workplace || ''
  };
}

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

// Test data - đầy đủ các field cần thiết cho AAS
const testFormData = {
  vulnerableGroups: [], // Normal group - không có disability hay hardship_area
  gpa: '8.0',
  englishTestType: 'pte',
  pteScore: '68',
  workExperience: '67',
  militaryService: 'completed',
  companyOwnership: 'no',
  countryOfResidence: 'vietnam',
  // Các field bổ sung cho AAS
  isVietnameseCitizen: true,
  hasAustralianCitizenship: false,
  hasAustralianPR: false,
  spousepr: 'spouseprno',
  isMilitary: false,
  countryscholarship: 'Scholarother',
  criminalRecord: 'no',
  workplace: 'valid_workplace'
};

console.log('🧪 Testing AAS Scholarship Fix');
console.log('================================');

// Map form data
const mappedData = mapFormDataToEvaluation(testFormData);
console.log('📋 Mapped Data:', JSON.stringify(mappedData, null, 2));

// Test each rule
console.log('\n🔍 Rule Evaluation Results:');
console.log('----------------------------');

let allPassed = true;
const failedRules = [];

aasRules.forEach(rule => {
  const passed = evaluateRule(rule, mappedData);
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${rule.id}`);
  
  if (!passed) {
    allPassed = false;
    failedRules.push({
      id: rule.id,
      message: rule.message || 'No message provided'
    });
  }
});

console.log('\n📊 Final Result:');
console.log('================');
if (allPassed) {
  console.log('🎉 AAS SCHOLARSHIP: ELIGIBLE');
  console.log('✅ All rules passed successfully!');
} else {
  console.log('❌ AAS SCHOLARSHIP: NOT ELIGIBLE');
  console.log('Failed rules:');
  failedRules.forEach(rule => {
    console.log(`  - ${rule.id}: ${rule.message}`);
  });
}

console.log('\n🎯 Expected: ELIGIBLE (all rules should pass)');
console.log('💡 If this shows NOT ELIGIBLE, there may still be issues with the rules.');