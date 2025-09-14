import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submitApplication = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    dateOfBirth: v.string(),
    gender: v.string(),
    countryOfCitizenship: v.string(),
    currentCity: v.string(),
    highestQualification: v.string(),
    yearsOfExperience: v.number(),
    currentJobTitle: v.string(),
    employerName: v.string(),
    isEmployerVietnameseOwned: v.boolean(),
    employmentSector: v.string(),
    hasWorkedInMilitaryPolice: v.boolean(),
    planToReturn: v.boolean(),
    hasStudiedAbroadOnGovScholarship: v.boolean(),
    englishTestType: v.string(),
    englishScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Calculate age
    const birthDate = new Date(args.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    // Check AAS eligibility
    const aasReasons: string[] = [];
    let aasEligible = true;

    // Must be Vietnamese citizen and currently living in Vietnam
    if (args.countryOfCitizenship !== "Vietnam") {
      aasReasons.push("You must be a Vietnamese citizen");
      aasEligible = false;
    }

    // Must have Bachelor's degree or higher
    if (args.highestQualification === "Other") {
      aasReasons.push("You must have a Bachelor's degree or higher");
      aasEligible = false;
    }

    // Must have at least 2 years of work experience
    if (args.yearsOfExperience < 2) {
      aasReasons.push("You must have at least 2 years of full-time work experience");
      aasEligible = false;
    }

    // Must not be in military/security sector
    if (args.employmentSector === "Military/Security") {
      aasReasons.push("You must not be currently serving in military/security sector");
      aasEligible = false;
    }

    // Must not have worked in military/police
    if (args.hasWorkedInMilitaryPolice) {
      aasReasons.push("You must not have previously worked for or served in the military or police");
      aasEligible = false;
    }

    // Must not have received Australian Government scholarship before
    if (args.hasStudiedAbroadOnGovScholarship) {
      aasReasons.push("You must not have received another Australian Government scholarship before");
      aasEligible = false;
    }

    // Employer must be Vietnamese-owned
    if (!args.isEmployerVietnameseOwned) {
      aasReasons.push("Your employer must be Vietnamese-owned");
      aasEligible = false;
    }

    // English requirements
    if (args.employmentSector === "Private" || args.employmentSector === "NGO") {
      if (args.englishTestType === "None") {
        aasReasons.push("You must have English proficiency test results (IELTS ≥ 7.0 or equivalent)");
        aasEligible = false;
      } else if (args.englishScore !== undefined) {
        let requiredScore = 7.0;
        if (args.englishTestType === "TOEFL") requiredScore = 94;
        if (args.englishTestType === "PTE") requiredScore = 65;
        
        if (args.englishScore < requiredScore) {
          aasReasons.push(`Your English score is too low. Required: ${args.englishTestType === "IELTS" ? "7.0" : args.englishTestType === "TOEFL" ? "94" : "65"} for ${args.englishTestType}`);
          aasEligible = false;
        }
      }
    }

    // Check Chevening eligibility
    const cheveningReasons: string[] = [];
    let cheveningEligible = true;

    // Must be Vietnamese citizen
    if (args.countryOfCitizenship !== "Vietnam") {
      cheveningReasons.push("You must be a Vietnamese citizen");
      cheveningEligible = false;
    }

    // Must have Bachelor's degree or higher
    if (args.highestQualification === "Other") {
      cheveningReasons.push("You must have a Bachelor's degree or higher");
      cheveningEligible = false;
    }

    // Must have at least 2 years of work experience
    if (args.yearsOfExperience < 2) {
      cheveningReasons.push("You must have at least 2 years of full-time work experience");
      cheveningEligible = false;
    }

    // Must plan to return to Vietnam
    if (!args.planToReturn) {
      cheveningReasons.push("You must plan to return to Vietnam for at least 2 years after study");
      cheveningEligible = false;
    }

    // Must not have studied in UK under UK Government funding
    if (args.hasStudiedAbroadOnGovScholarship) {
      cheveningReasons.push("You must not have previously studied in the UK under UK Government funding");
      cheveningEligible = false;
    }

    // Must have IELTS ≥ 6.5 or equivalent
    if (args.englishTestType === "None") {
      cheveningReasons.push("You must have English proficiency test results (IELTS ≥ 6.5 or equivalent)");
      cheveningEligible = false;
    } else if (args.englishScore !== undefined) {
      let requiredScore = 6.5;
      if (args.englishTestType === "TOEFL") requiredScore = 79;
      if (args.englishTestType === "PTE") requiredScore = 58;
      
      if (args.englishScore < requiredScore) {
        cheveningReasons.push(`Your English score is too low. Required: ${args.englishTestType === "IELTS" ? "6.5" : args.englishTestType === "TOEFL" ? "79" : "58"} for ${args.englishTestType}`);
        cheveningEligible = false;
      }
    }

    // Save to database
    const applicationId = await ctx.db.insert("scholarshipApplications", {
      ...args,
      aasEligible,
      aasReasons,
      cheveningEligible,
      cheveningReasons,
    });

    return {
      applicationId,
      aasEligible,
      aasReasons,
      cheveningEligible,
      cheveningReasons,
    };
  },
});

export const getApplication = query({
  args: { applicationId: v.id("scholarshipApplications") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.applicationId);
  },
});
