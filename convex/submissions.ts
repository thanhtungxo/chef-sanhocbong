import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const saveSubmission = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("submissions", {
      ...args,
      createdAt: Date.now(),
    });
    return { id };
  },
});
