// Test script to compare local evaluation vs Convex evaluation
const fs = require('fs');
const path = require('path');

// Load local evaluation functions
function loadRules(scholarshipId) {
    const rulesPath = path.join(__dirname, 'types', 'rules', `${scholarshipId}.json`);
    if (!fs.existsSync(rulesPath)) {
        console.error(`Rules file not found: ${rulesPath}`);
        return [];
    }
    const content = fs.readFileSync(rulesPath, 'utf8');
    return JSON.parse(content);
}

// Load mappers
function toAnswerSet(responses) {
    const out = { ...responses };
    
    // Handle military field mapping
    if (out.hasMilitaryBackground !== undefined || out.hasWorkedInMilitaryPolice !== undefined) {
        const hasMilitary = out.hasMilitaryBackground || out.hasWorkedInMilitaryPolice;
        out.military = hasMilitary ? "militaryyes" : "militaryno";
        out.militaryBoolean = hasMilitary;
    }
    
    // Handle other mappings
    if (out.englishTestType && out.englishScore !== undefined) {
        if (out.englishTestType === 'ielts') {
            out.ielts = out.englishScore;
        } else if (out.englishTestType === 'toefl') {
            out.toefl = out.englishScore;
        }
    }
    
    if (out.dateOfBirth) {
        const birthDate = new Date(out.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        out.age = age;
    }
    
    return out;
}

// Rule evaluation function
function evaluateRule(rule, answers) {
    const { field, operator, value, message } = rule;
    const fieldValue = answers[field];
    
    switch (operator) {
        case 'eq':
            return fieldValue !== value ? message : null;
        case 'ne':
            return fieldValue === value ? message : null;
        case 'gt':
            return fieldValue <= value ? message : null;
        case 'gte':
            return fieldValue < value ? message : null;
        case 'lt':
            return fieldValue >= value ? message : null;
        case 'lte':
            return fieldValue > value ? message : null;
        case 'in':
            return !value.includes(fieldValue) ? message : null;
        case 'nin':
            return value.includes(fieldValue) ? message : null;
        default:
            console.warn(`Unknown operator: ${operator}`);
            return null;
    }
}

// Evaluate scholarship eligibility
function evaluateScholarship(scholarshipId, rules, answers) {
    const reasons = [];
    
    for (const rule of rules) {
        const failureReason = evaluateRule(rule, answers);
        if (failureReason) {
            reasons.push(failureReason);
        }
    }
    
    return {
        id: scholarshipId,
        name: scholarshipId === 'aas' ? 'Australia Awards Scholarship' : 'Chevening Scholarship',
        eligible: reasons.length === 0,
        reasons: reasons
    };
}

// Test data - same as our previous test
const testData = {
    fullname: 'Nguyen Van A',
    email: 'test@example.com',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    countryOfCitizenship: 'Vietnam',
    currentCity: 'Ho Chi Minh City',
    highestQualification: 'bachelor',
    yearsOfExperience: 5,
    currentJobTitle: 'Software Engineer',
    employerName: 'Tech Company',
    isEmployerVietnameseOwned: true,
    employmentSector: 'technology',
    hasWorkedInMilitaryPolice: false,
    planToReturn: true,
    hasStudiedAbroadOnGovScholarship: false,
    englishTestType: 'ielts',
    englishScore: 7.0
};

console.log('=== LOCAL EVALUATION TEST ===');
console.log('Test data:', JSON.stringify(testData, null, 2));

// Load rules
const aasRules = loadRules('aas');
const cheveningRules = loadRules('chevening');

console.log('\nAAS Rules loaded:', aasRules.length, 'rules');
console.log('Chevening Rules loaded:', cheveningRules.length, 'rules');

// Map answers
const mappedAnswers = toAnswerSet(testData);
console.log('\nMapped answers:', JSON.stringify(mappedAnswers, null, 2));

// Evaluate scholarships
const aasResult = evaluateScholarship('aas', aasRules, mappedAnswers);
const cheveningResult = evaluateScholarship('chevening', cheveningRules, mappedAnswers);

console.log('\n=== LOCAL EVALUATION RESULTS ===');
console.log('AAS Result:', JSON.stringify(aasResult, null, 2));
console.log('Chevening Result:', JSON.stringify(cheveningResult, null, 2));

console.log('\n=== SUMMARY ===');
console.log(`AAS: ${aasResult.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
console.log(`Chevening: ${cheveningResult.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);

if (!aasResult.eligible) {
    console.log('AAS Failure reasons:', aasResult.reasons);
}
if (!cheveningResult.eligible) {
    console.log('Chevening Failure reasons:', cheveningResult.reasons);
}