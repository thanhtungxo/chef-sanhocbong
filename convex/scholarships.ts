import { mutation, query } from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { loadRulesServer, evaluateWithRules } from "./utils/rules";
import { toAnswerSet } from "./shared/mappers";
import { validateRules } from "./shared/engine/schema";
import type { EligibilityRule } from "./shared/eligibility";

const SCHOLARSHIP_PRESETS = [
  { id: "aas", name: "Australia Awards Scholarship (AAS)" },
  { id: "chevening", name: "Chevening Scholarship" },
] as const;

type PresetId = typeof SCHOLARSHIP_PRESETS[number]["id"];
const DEFAULT_ENABLED = new Set<PresetId>(["aas", "chevening"]);

const ensurePresetName = (id: string) => {
  const preset = SCHOLARSHIP_PRESETS.find((p) => p.id === id);
  return preset ? preset.name : id.toUpperCase();
};

type ScholarshipDoc = Doc<"scholarships">;

type ScholarshipSummary = {
  id: string;
  name: string;
  isEnabled: boolean;
  _id?: Id<"scholarships">;
};

function mergeScholarships(docs: ScholarshipDoc[]): ScholarshipSummary[] {
  const byId = new Map<string, ScholarshipDoc>();
  for (const doc of docs) {
    byId.set(doc.id, doc);
  }
  const result: ScholarshipSummary[] = SCHOLARSHIP_PRESETS.map((preset) => {
    const doc = byId.get(preset.id);
    return {
      id: preset.id,
      name: doc?.name ?? preset.name,
      isEnabled: doc?.isEnabled ?? true,
      _id: doc?._id,
    };
  });
  for (const doc of docs) {
    if (!SCHOLARSHIP_PRESETS.some((preset) => preset.id === doc.id)) {
      result.push({ id: doc.id, name: doc.name, isEnabled: doc.isEnabled, _id: doc._id });
    }
  }
  return result;
}

const isScholarshipEnabled = (summaries: ScholarshipSummary[], id: string) => {
  const match = summaries.find((s) => s.id === id);
  if (match) return match.isEnabled;
  if (DEFAULT_ENABLED.has(id as PresetId)) return true;
  return true;
};

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
    const birthDate = new Date(args.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    const answers = toAnswerSet({ ...args, age } as Record<string, any>);

    const summaries = mergeScholarships(await ctx.db.query("scholarships").collect());
    const evalAas = isScholarshipEnabled(summaries, "aas");
    const evalChe = isScholarshipEnabled(summaries, "chevening");

    const [aasRules, cheRules] = await Promise.all([
      evalAas ? loadRulesServer(ctx, "aas") : Promise.resolve([]),
      evalChe ? loadRulesServer(ctx, "chevening") : Promise.resolve([]),
    ]);

    const aas = evalAas
      ? evaluateWithRules(answers, aasRules)
      : { passed: false, failedRules: [] as EligibilityRule[] };
    const che = evalChe
      ? evaluateWithRules(answers, cheRules)
      : { passed: false, failedRules: [] as EligibilityRule[] };

    const aasEligible = evalAas ? aas.passed : false;
    const cheveningEligible = evalChe ? che.passed : false;
    const aasReasons = evalAas ? aas.failedRules.map((r: EligibilityRule) => r.message) : [];
    const cheveningReasons = evalChe ? che.failedRules.map((r: EligibilityRule) => r.message) : [];

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

export const getActiveRules = query({
  args: { scholarshipId: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("rulesets")
      .withIndex("by_scholarshipId", (q) => q.eq("scholarshipId", args.scholarshipId))
      .collect();
    const active = rows.find((r) => r.isActive);
    if (!active) {
      return {
        ok: false,
        source: "db",
        id: null,
        version: null,
        json: null,
        rules: [] as any[],
        issues: ["No active ruleset"],
      };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(active.json);
    } catch (e) {
      return {
        ok: false,
        source: "db",
        id: active._id,
        version: active.version,
        json: active.json,
        rules: [] as any[],
        issues: ["Invalid JSON: " + String(e)],
      };
    }
    const { rules, issues } = validateRules(parsed);
    return {
      ok: issues.length === 0,
      source: "db",
      id: active._id,
      version: active.version,
      json: active.json,
      rules: rules as any[],
      issues,
    };
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

export const listScholarships = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("scholarships").collect();
    return mergeScholarships(docs).map(({ id, name, isEnabled }) => ({ id, name, isEnabled }));
  },
});

export const toggleScholarship = mutation({
  args: { id: v.string(), enabled: v.boolean() },
  handler: async (ctx, args) => {
    const existing = (await ctx.db.query("scholarships").collect()).find((doc) => doc.id === args.id);
    if (!existing) {
      const name = ensurePresetName(args.id);
      const _id = await ctx.db.insert("scholarships", { id: args.id, name, isEnabled: args.enabled });
      return { id: args.id, name, isEnabled: args.enabled, _id };
    }
    await ctx.db.patch(existing._id, { isEnabled: args.enabled });
    return { id: existing.id, name: existing.name, isEnabled: args.enabled, _id: existing._id };
  },
});

export const addScholarship = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const raw = args.name.trim();
    if (!raw) throw new Error("Name is required");
    const base = raw
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    let id = base || "scholarship";
    let suffix = 1;
    // ensure unique public id by checking index
    while (true) {
      const existing = await ctx.db
        .query("scholarships")
        .withIndex("by_public_id", (q) => q.eq("id", id))
        .collect();
      if (!existing.length) break;
      suffix += 1;
      id = `${base || "scholarship"}-${suffix}`;
    }
    const _id = await ctx.db.insert("scholarships", { id, name: raw, isEnabled: false });
    return { id, name: raw, isEnabled: false, _id };
  },
});
