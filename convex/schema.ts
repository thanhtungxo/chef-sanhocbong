import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  scholarshipApplications: defineTable({
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
    aasEligible: v.boolean(),
    aasReasons: v.array(v.string()),
    cheveningEligible: v.boolean(),
    cheveningReasons: v.array(v.string()),
  }),
  rulesets: defineTable({
    scholarshipId: v.string(), // 'aas' | 'chevening'
    version: v.string(),
    json: v.string(), // raw JSON text
    isActive: v.boolean(),
    createdAt: v.number(),
    createdBy: v.optional(v.string()),
  }).index('by_scholarshipId', ['scholarshipId']),
  scholarships: defineTable({
    id: v.string(),
    name: v.string(),
    isEnabled: v.boolean(),
  }).index('by_id', ['id']),
  submissions: defineTable({
    fullName: v.string(),
    email: v.string(),
    dateOfBirth: v.string(),
    gender: v.string(),
    countryOfCitizenship: v.string(),
    currentCity: v.string(),
    englishTestType: v.string(),
    englishScore: v.optional(v.number()),
    currentJobTitle: v.string(),
    employerName: v.string(),
    aasEligible: v.boolean(),
    aasReasons: v.array(v.string()),
    cheveningEligible: v.boolean(),
    cheveningReasons: v.array(v.string()),
    createdAt: v.number(),
  }).index('by_createdAt', ['createdAt']),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
