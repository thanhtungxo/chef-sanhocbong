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
    if (out.military == null || typeof out.military === "string") {
        if (out.military === "militaryno") out.military = "militaryno"; // Keep string values
        else if (out.military === "militaryyes") out.military = "militaryyes";
        else if (typeof out.hasMilitaryBackground === "boolean") out.military = out.hasMilitaryBackground ? "militaryyes" : "militaryno";
        else if (typeof out.hasWorkedInMilitaryPolice === "boolean") out.military = out.hasWorkedInMilitaryPolice ? "militaryyes" : "militaryno";
    }

    // Also create boolean version for Chevening
    if (out.militaryBoolean == null) {
        if (out.military === "militaryno") out.militaryBoolean = false;
        else if (out.military === "militaryyes") out.militaryBoolean = true;
        else if (typeof out.hasMilitaryBackground === "boolean") out.militaryBoolean = out.hasMilitaryBackground;
        else if (typeof out.hasWorkedInMilitaryPolice === "boolean") out.militaryBoolean = out.hasWorkedInMilitaryPolice;
    }

    // Government scholarship
    if (out.govscholarship == null) {
        if (typeof out.hasStudiedAbroadOnGovScholarship === "boolean") {
            out.govscholarship = out.hasStudiedAbroadOnGovScholarship;
        }
    }

    // Work experience mapping
    if (out.workingtime == null && out.yearsOfExperience != null) {
        out.workingtime = Number(out.yearsOfExperience) * 12; // Convert years to months
    }

    // Employment type mapping
    if (out.employmenttype == null && out.employmentSector != null) {
        const sectorMapping = {
            'Government': 'government',
            'Private': 'vn_company',
            'NGO': 'ngo',
            'University': 'university',
            'Technology': 'vn_company'
        };
        out.employmenttype = sectorMapping[out.employmentSector] || 'vn_company';
    }

    return out;
}

// Load scholarship rules
function loadScholarshipRules() {
    const rulesDir = join(__dirname, 'types', 'rules');
    const aasRules = JSON.parse(readFileSync(join(rulesDir, 'aas.json'), 'utf-8'));
    const cheveningRules = JSON.parse(readFileSync(join(rulesDir, 'chevening.json'), 'utf-8'));
    
    return {
        aas: aasRules,
        chevening: cheveningRules
    };
}

// Evaluate a single rule or rule group
function evaluateRule(rule, answers) {
    // Handle rule groups with 'all' or 'any' operators
    if (rule.operator) {
        const results = rule.rules.map(subRule => evaluateRule(subRule, answers));
        
        if (rule.operator === 'all') {
            // All sub-rules must pass
            const allPassed = results.every(result => result === null);
            return allPassed ? null : rule.message || 'Group rule failed';
        } else if (rule.operator === 'any') {
            // At least one sub-rule must pass
            const anyPassed = results.some(result => result === null);
            return anyPassed ? null : rule.message || 'Group rule failed';
        }
    }
    
    // Handle individual rules
    const { field, type, value, message } = rule;
    const fieldValue = answers[field];
    
    switch (type) {
        case 'select':
            // Handle comma-separated values for select type
            if (typeof value === 'string' && value.includes(',')) {
                const allowedValues = value.split(',');
                return allowedValues.includes(fieldValue) ? null : message;
            }
            return fieldValue === value ? null : message;
        case 'minScore':
            return Number(fieldValue) >= Number(value) ? null : message;
        case 'boolean':
            return fieldValue === value ? null : message;
        case 'text':
            return (typeof fieldValue === 'string' && fieldValue.trim() !== '') ? null : message;
        default:
            console.warn(`Unknown rule type: ${type}`);
            return message;
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

// Main evaluation function
function submitAndEvaluateForm(responses, fullName, email) {
    const scholarshipRules = loadScholarshipRules();
    const answers = toAnswerSet(responses);
    
    console.log("Mapped answers:", JSON.stringify(answers, null, 2));
    
    const scholarships = [
        evaluateScholarship('aas', scholarshipRules.aas, answers),
        evaluateScholarship('chevening', scholarshipRules.chevening, answers)
    ];
    
    const eligibleCount = scholarships.filter(s => s.eligible).length;
    const totalCount = scholarships.length;
    
    let messageType;
    if (eligibleCount === 0) {
        messageType = 'fail_all';
    } else if (eligibleCount === totalCount) {
        messageType = 'pass_all';
    } else {
        messageType = 'pass_some';
    }
    
    return {
        eligible: eligibleCount > 0,
        messageType,
        scholarships,
        stats: {
            total: totalCount,
            passed: eligibleCount
        }
    };
}

// Test data with all Australia Awards required fields
const completeTestData = {
  fullName: "Nguyen Van Test",
  email: "test@example.com",
  responses: {
    // Basic info
    englishScore: 7.0,
    highestQualification: "bachelor",
    yearsOfExperience: 3,
    countryOfCitizenship: "Vietnam",
    isEmployerVietnameseOwned: true,
    planToReturn: true,
    hasWorkedInMilitaryPolice: false,
    hasStudiedAbroadOnGovScholarship: false,
    age: 28,
    hasLeadershipPotential: true,
    gpa: 7.5,
    
    // Australia Awards specific fields
    citizenship: "citizenshipyes",           // Có quốc tịch Việt Nam
    residency: "residencyyes",               // Cư trú tại Việt Nam
    australiaPrOrCitizen: "australiaPrNo",   // Không phải công dân/PR Úc
    spousepr: "spouseprno",                  // Vợ/chồng không phải PR Úc/NZ
    military: "militaryno",                  // Không phục vụ quân đội
    banATungCoTienAnTienSuChua: "criminalno", // Không có tiền án tiền sự
    govscholarship: "govescholarno",         // Chưa nhận học bổng chính phủ Úc
    workingtime: 36,                         // 36 tháng kinh nghiệm (3 năm)
    ieltsgrade: 7.0,                         // IELTS 7.0
    employmenttype: "vn_company",            // Làm việc tại công ty VN
    
    // English test scores
    ielts: 7.0,
    toefl: 90,
    pte: 65,
    
    // Additional mapping fields
    workExperience: 3,
    englishTestType: "IELTS"
  }
};

console.log("Testing Australia Awards with complete data...");
console.log("Test data:", JSON.stringify(completeTestData.responses, null, 2));

try {
  const result = submitAndEvaluateForm(
    completeTestData.responses, 
    completeTestData.fullName, 
    completeTestData.email
  );
  
  console.log("\n=== EVALUATION RESULT ===");
  console.log(`Overall Eligible: ${result.eligible}`);
  console.log(`Message Type: ${result.messageType}`);
  
  if (result.scholarships) {
    console.log("\n=== SCHOLARSHIP DETAILS ===");
    result.scholarships.forEach(scholarship => {
      console.log(`\n${scholarship.name}:`);
      console.log(`  Eligible: ${scholarship.eligible}`);
      if (scholarship.reasons && scholarship.reasons.length > 0) {
        console.log(`  Failure reasons:`);
        scholarship.reasons.forEach(reason => {
          console.log(`    - ${reason}`);
        });
      } else {
        console.log(`  ✅ All requirements met!`);
      }
    });
  }
  
} catch (error) {
  console.error("Error during evaluation:", error);
}