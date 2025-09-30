import type { AnswerSet } from "./eligibility";

// Normalize different UI field names to the rule engine's expected keys.
// This is intentionally tolerant: it copies all incoming keys and fills
// canonical ones if possible.
export function toAnswerSet(input: Record<string, any>): AnswerSet {
  const out: Record<string, any> = { ...input };

  // Normalize age to number if provided as string
  if (out.age != null && typeof out.age !== "number") {
    const n = Number(out.age);
    out.age = Number.isFinite(n) ? n : out.age;
  }

  // English score -> IELTS score used by current rules
  if (out.ielts == null && out.englishScore != null) {
    out.ielts = Number(out.englishScore);
  }

  // Military background - handle both boolean and string formats
  if (out.military == null) {
    if (typeof out.hasMilitaryBackground === "boolean") {
      out.military = out.hasMilitaryBackground ? "militaryyes" : "militaryno";
    } else if (typeof out.hasWorkedInMilitaryPolice === "boolean") {
      out.military = out.hasWorkedInMilitaryPolice ? "militaryyes" : "militaryno";
    }
  }
  
  // Also create boolean version for Chevening
  if (out.militaryBoolean == null) {
    if (out.military === "militaryno") out.militaryBoolean = false;
    else if (out.military === "militaryyes") out.militaryBoolean = true;
    else if (typeof out.hasMilitaryBackground === "boolean") out.militaryBoolean = out.hasMilitaryBackground;
    else if (typeof out.hasWorkedInMilitaryPolice === "boolean") out.militaryBoolean = out.hasWorkedInMilitaryPolice;
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

  // Employment type mapping for Australia Awards
  if (out.employmenttype == null && out.employmentSector != null) {
    const sectorMapping: Record<string, string> = {
      "Government": "gov_levels",
      "Private": out.isEmployerVietnameseOwned ? "vn_company" : "foreign_company",
      "NGO": out.isEmployerVietnameseOwned ? "vn_ngo" : "intl_ngo",
      "Military/Security": "gov_levels"
    };
    out.employmenttype = sectorMapping[out.employmentSector] || "vn_company";
  }

  // Additional mappings for Australia Awards fields
  if (out.citizenship == null) {
    if (out.countryOfCitizenship === "Vietnam") out.citizenship = "citizenshipyes";
  }
  
  if (out.residency == null) {
    if (out.countryOfCitizenship === "Vietnam") out.residency = "residencyyes";
  }
  
  if (out.australiaPrOrCitizen == null) {
    out.australiaPrOrCitizen = "australiaPrNo"; // Default assumption
  }
  
  // Map spouse PR status from form field
  if (out.spousepr == null) {
    if (typeof out.hasSpouseAuNzCitizenOrPR === "boolean") {
      out.spousepr = out.hasSpouseAuNzCitizenOrPR ? "spousepryes" : "spouseprno";
    } else if (out.spousepr === "No" || out.spousepr === "Yes") {
      // Handle direct string values from form
      out.spousepr = out.spousepr === "Yes" ? "spousepryes" : "spouseprno";
    } else {
      out.spousepr = "spouseprno"; // Default assumption
    }
  }
  
  // Map criminal record from form field
  if (out.banATungCoTienAnTienSuChua == null) {
    if (typeof out.hasCriminalRecordOrInvestigation === "boolean") {
      out.banATungCoTienAnTienSuChua = out.hasCriminalRecordOrInvestigation ? "criminalyes" : "criminalno";
    } else {
      out.banATungCoTienAnTienSuChua = "criminalno"; // Default assumption
    }
  }
  
  // Map government scholarship from form field
  if (out.govscholarship == null) {
    if (typeof out.governmentScholarship === "boolean") {
      out.govscholarship = out.governmentScholarship ? "govescholaryes" : "govescholarno";
    } else if (typeof out.hasStudiedAbroadOnGovScholarship === "boolean") {
      out.govscholarship = out.hasStudiedAbroadOnGovScholarship ? "govescholaryes" : "govescholarno";
    } else {
      out.govscholarship = "govescholarno"; // Default assumption
    }
  }
  
  if (out.workingtime == null && out.yearsOfExperience != null) {
    out.workingtime = Number(out.yearsOfExperience) * 12; // Convert years to months
  }
  
  // Map English test type from englishProficiency field
  if (out.englishProficiency && !out.englishTestType) {
    const proficiency = out.englishProficiency.toLowerCase();
    if (proficiency === 'ielts') {
      out.englishTestType = 'ielts';
    } else if (proficiency === 'toefl') {
      out.englishTestType = 'toefl';
    } else if (proficiency === 'pte') {
      out.englishTestType = 'pte';
    }
  }

  // Map English test scores from form fields
  if (out.ieltsgrade == null) {
    if (out.englishTestType === "ielts" && out.englishOverall != null) {
      out.ieltsgrade = Number(out.englishOverall);
    } else if (out.englishScore != null) {
      out.ieltsgrade = Number(out.englishScore);
    }
  }
  
  if (out.toeflgrade == null) {
    if (out.englishTestType === "toefl" && out.englishOverall != null) {
      out.toeflgrade = Number(out.englishOverall);
    }
  }
  
  if (out.ptegrade == null) {
    if (out.englishTestType === "pte" && out.englishOverall != null) {
      out.ptegrade = Number(out.englishOverall);
    }
  } else if (out.ptegrade != null) {
    out.ptegrade = Number(out.ptegrade);
  }
  
  // Map highest qualification - keep original case for rule matching
  // (Rules now expect exact case matching like "Bachelor")
  
  // Map vulnerable groups to nhomyeuthe - ensure it's always a string
  // Handle nhomyeuthe if it comes as an array (from multi-select field)
  if (out.nhomyeuthe && Array.isArray(out.nhomyeuthe)) {
    // If nhomyeuthe is already an array, convert to single value
    const nonKhongYeuThe = out.nhomyeuthe.find((group: string) => group !== 'khongyeuthe');
    out.nhomyeuthe = nonKhongYeuThe || 'khongyeuthe';
  } 
  
  // Handle vulnerableGroups multi-select field
  if (out.vulnerableGroups && Array.isArray(out.vulnerableGroups)) {
    // Map from vulnerableGroups array to nhomyeuthe string
    const nonNoneGroups = out.vulnerableGroups.filter(group => group !== 'none');
    if (nonNoneGroups.length > 0) {
      // Map specific vulnerable groups
      if (nonNoneGroups.includes('disability')) {
        out.nhomyeuthe = 'disability';
      } else if (nonNoneGroups.includes('hardship_area')) {
        out.nhomyeuthe = 'hardship_area';
      } else {
        out.nhomyeuthe = nonNoneGroups[0]; // Take the first non-none value
      }
    } else {
      out.nhomyeuthe = 'khongyeuthe'; // Default to "not vulnerable"
    }
  } 
  
  // Ensure nhomyeuthe is set with default
  if (!out.nhomyeuthe) {
    out.nhomyeuthe = 'khongyeuthe'; // Default to "not vulnerable"
  }
  
  // Default employmenttype if not set
  if (out.employmenttype == null && out.employerType != null) {
    out.employmenttype = out.employerType;
  }
  
  if (out.gpa == null) {
    out.gpa = 7.5; // Default GPA assumption for testing
  }

  // AAS-specific field mappings
  // Map citizenship to isVietnameseCitizen boolean
  if (out.isVietnameseCitizen == null) {
    if (out.citizenship === "citizenshipyes") {
      out.isVietnameseCitizen = true;
    } else if (out.citizenship === "citizenshipno") {
      out.isVietnameseCitizen = false;
    } else {
      out.isVietnameseCitizen = true; // Default assumption for Vietnamese applicants
    }
  }

  // Map Australian citizenship/PR status
  if (out.hasAustralianCitizenship == null) {
    if (out.australiaPrOrCitizen === "australiaPrNo") {
      out.hasAustralianCitizenship = false;
    } else if (out.australiaPrOrCitizen === "australiaPrYes") {
      out.hasAustralianCitizenship = true;
    } else {
      out.hasAustralianCitizenship = false; // Default assumption
    }
  }

  if (out.hasAustralianPR == null) {
    if (out.australiaPrOrCitizen === "australiaPrNo") {
      out.hasAustralianPR = false;
    } else if (out.australiaPrOrCitizen === "australiaPrYes") {
      out.hasAustralianPR = true;
    } else {
      out.hasAustralianPR = false; // Default assumption
    }
  }

  // Map military status to isMilitary boolean
  if (out.isMilitary == null) {
    if (out.military === "militaryno") {
      out.isMilitary = false;
    } else if (out.military === "militaryyes") {
      out.isMilitary = true;
    } else {
      out.isMilitary = false; // Default assumption
    }
  }

  // Map government scholarship to countryscholarship
  if (out.countryscholarship == null) {
    if (out.govscholarship === "govescholarno") {
      out.countryscholarship = "Scholarother";
    } else if (out.govscholarship === "govescholaryes") {
      out.countryscholarship = "AustraliaScholar";
    } else {
      out.countryscholarship = "Scholarother"; // Default assumption
    }
  }

  // Map criminal record
  if (out.criminalRecord == null) {
    if (out.banATungCoTienAnTienSuChua === "criminalno") {
      out.criminalRecord = "no";
    } else if (out.banATungCoTienAnTienSuChua === "criminalyes") {
      out.criminalRecord = "yes";
    } else {
      out.criminalRecord = "no"; // Default assumption
    }
  }

  // Map workplace validity based on employment type
  if (out.workplace == null) {
    if (out.employmenttype === "gov_levels" || 
        out.employmenttype === "vn_company" || 
        out.employmenttype === "vn_ngo") {
      out.workplace = "valid_workplace";
    } else {
      out.workplace = "invalid_workplace";
    }
  }

  return out as AnswerSet;
}

