import { action, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Internal query: get active form set's question keys (latest active)
export const getActiveQuestionKeys = internalQuery({
  args: {},
  handler: async (ctx) => {
    const actives = await ctx.db
      .query("formSets")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    if (!actives || actives.length === 0) return [] as string[];
    const active = actives
      .slice()
      .sort((a: any, b: any) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      .at(-1);
    if (!active) return [] as string[];
    const qs = await ctx.db
      .query("formQuestions")
      .withIndex("by_formSet_step_order", (q) => q.eq("formSetId", active._id))
      .collect();
    const keys = Array.from(new Set(qs.map((q) => String((q as any).key || "").trim()).filter(Boolean)));
    return keys;
  },
});

// Internal query: list all form submissions
export const listAllSubmissions = internalQuery({
  args: {},
  handler: async (ctx) => {
    const subs = await ctx.db.query("form_submissions").collect();
    return subs as any[];
  },
});

// Internal mutation: ensure an answer row exists for a submission/key
export const ensureAnswerForSubmission = internalMutation({
  args: { submissionId: v.id("form_submissions"), key: v.string(), defaultValue: v.optional(v.any()) },
  handler: async (ctx, { submissionId, key, defaultValue }) => {
    const existing = await ctx.db
      .query("form_submission_answers")
      .withIndex("by_submission", (q) => q.eq("submissionId", submissionId))
      .filter((q) => q.eq(q.field("key"), key))
      .first();
    if (existing) {
      // Do not overwrite value if it exists; only ensure presence
      return { ok: true, existed: true } as any;
    }
    await ctx.db.insert("form_submission_answers", {
      submissionId,
      key,
      value: defaultValue ?? null,
      createdAt: Date.now(),
    } as any);
    return { ok: true, existed: false } as any;
  },
});

// Public action: sync all submissions to have rows for all active question keys
export const syncAnswers = action({
  args: {},
  handler: async (ctx) => {
    const keys: string[] = await ctx.runQuery(internal.answers.getActiveQuestionKeys, {});
    const subs: any[] = await ctx.runQuery(internal.answers.listAllSubmissions, {});
    let created = 0;
    for (const sub of subs as any[]) {
      for (const key of keys as string[]) {
        const r = await ctx.runMutation(internal.answers.ensureAnswerForSubmission, {
          submissionId: (sub as any)._id,
          key,
          defaultValue: null,
        });
        if (r && (r as any).existed === false) created++;
      }
    }
    return { ok: true, keysCount: keys.length, submissionsCount: subs.length, created } as any;
  },
});