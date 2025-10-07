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
  }).index('by_public_id', ['id']),
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
  form_submissions: defineTable({
    userId: v.optional(v.id("users")),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    responses: v.any(),
    normalizedAnswers: v.any(),
    result: v.any(),
    createdAt: v.number(),
  }).index('by_userId', ['userId']).index('by_createdAt', ['createdAt']),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
  // Form Builder tables
  formSets: defineTable({
    name: v.string(),
    version: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index('by_active', ['isActive']),
  formSteps: defineTable({
    formSetId: v.id('formSets'),
    titleKey: v.string(),
    order: v.number(),
    createdAt: v.number(),
    ui: v.optional(v.object({
      labelText: v.optional(v.string()),
      placeholderText: v.optional(v.string()),
    })),
  }).index('by_formSet', ['formSetId']).index('by_formSet_order', ['formSetId','order']),
  formQuestions: defineTable({
    formSetId: v.id('formSets'),
    stepId: v.id('formSteps'),
    key: v.string(),
    labelKey: v.string(),
    type: v.string(), // text, number, radio, select, multi-select, checkbox, date, autocomplete, boolean, textarea
    required: v.boolean(),
    order: v.number(),
    options: v.optional(v.array(v.object({
      value: v.string(),
      labelKey: v.optional(v.string()),
      labelText: v.optional(v.string()),
    }))),
    validation: v.optional(v.object({
      min: v.optional(v.number()),
      max: v.optional(v.number()),
      pattern: v.optional(v.string()),
      scale: v.optional(v.object({ overall: v.optional(v.array(v.number())), sub: v.optional(v.array(v.number())) })),
      requiredWhen: v.optional(v.object({ field: v.string(), equals: v.any() })),
    })),
    ui: v.optional(v.object({
      widget: v.optional(v.string()),
      placeholderKey: v.optional(v.string()),
      placeholderText: v.optional(v.string()),
      icon: v.optional(v.string()),
      labelText: v.optional(v.string()),
    })),
    visibility: v.optional(v.object({ when: v.optional(v.object({ field: v.string(), equals: v.any() })) })),
    mapTo: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_step', ['stepId']).index('by_formSet_step_order', ['formSetId','stepId','order']).index('by_formSet_key', ['formSetId','key']),
  // Result Page Configuration
  resultPageConfig: defineTable({
    ctaText: v.optional(v.string()),
    allFailedMessage: v.optional(v.string()),
    allPassedMessage: v.optional(v.string()),
    passedSomeMessage: v.optional(v.string()),
    allFailedSubheading: v.optional(v.string()),
    allPassedSubheading: v.optional(v.string()),
    passedSomeSubheading: v.optional(v.string()),
    heroImageUrl: v.optional(v.string()),
    fallbackMessage: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_createdAt', ['createdAt']),
  // AI Engine tables
  ai_models: defineTable({
    provider: v.string(),
    model: v.string(),
    aliasKey: v.string(),
    status: v.string(), // 'Active' | 'Testing' | 'Disabled'
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index('by_active', ['isActive']).index('by_provider', ['provider']).index('by_status', ['status']),
  ai_prompts: defineTable({
    layer: v.string(), // e.g., 'Result Page', 'Smart Profile Analysis', 'Email Generator'
    title: v.optional(v.string()),
    version: v.string(),
    template: v.string(),
    modelId: v.id('ai_models'),
    temperature: v.number(),
    language: v.string(), // 'vi' | 'en'
    fallbackText: v.optional(v.string()),
    versionNote: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index('by_layer', ['layer']).index('by_active_layer', ['layer','isActive']),
});
