import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { loadRulesServer, evaluateWithRules } from "./utils/rules";
import { validateRules } from "../src/lib/engine/schema";

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
    // Derive age from dateOfBirth to match rule fields
    const birthDate = new Date(args.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    const answers = { ...args, age } as Record<string, any>;

    const [aasRules, cheRules] = await Promise.all([
      loadRulesServer("aas"),
      loadRulesServer("chevening"),
    ]);

    const aas = evaluateWithRules(answers, aasRules);
    const che = evaluateWithRules(answers, cheRules);

    const aasEligible = aas.passed;
    const cheveningEligible = che.passed;
    const aasReasons = aas.failedRules.map((r) => r.message);
    const cheveningReasons = che.failedRules.map((r) => r.message);

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

export const publishRuleset = mutation({
  args: {
    scholarshipId: v.union(v.literal("aas"), v.literal("chevening")),
    version: v.string(),
    json: v.string(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(args.json);
    } catch (e) {
      return { ok: false, issues: ["Invalid JSON: " + String(e)] };
    }
    const { issues } = validateRules(parsed);
    if (issues.length) {
      return { ok: false, issues };
    }

    if (args.isActive) {
      const existing = await ctx.db
        .query("rulesets")
        .withIndex("by_scholarshipId", (q) => q.eq("scholarshipId", args.scholarshipId))
        .collect();
      for (const doc of existing) {
        if (doc.isActive) {
          await ctx.db.patch(doc._id, { isActive: false });
        }
      }
    }

    const id = await ctx.db.insert("rulesets", {
      scholarshipId: args.scholarshipId,
      version: args.version,
      json: args.json,
      isActive: args.isActive ?? false,
      createdAt: Date.now(),
    });
    return { ok: true, id };
  },
});
