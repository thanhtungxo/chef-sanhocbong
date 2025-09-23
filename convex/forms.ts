import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getActiveForm = query({
  args: {},
  handler: async (ctx: any) => {
    const active = await ctx.db
      .query("formSets")
      .withIndex("by_active", (q: any) => q.eq("isActive", true))
      .first();
    if (!active) return null;
    const steps = await ctx.db
      .query("formSteps")
      .withIndex("by_formSet", (q: any) => q.eq("formSetId", active._id))
      .collect();
    const byStep: Record<string, any[]> = {};
    for (const s of steps) byStep[s._id.id] = [];
    const qs = await ctx.db
      .query("formQuestions")
      .withIndex("by_formSet_step_order", (q: any) => q.eq("formSetId", active._id))
      .collect();
    for (const qn of qs) {
      const key = qn.stepId.id;
      if (!byStep[key]) byStep[key] = [];
      byStep[key].push(qn);
    }
    steps.sort((a: any, b: any) => a.order - b.order);
    for (const s of steps) (byStep[s._id.id] ?? []).sort((a: any, b: any) => a.order - b.order);
    return { formSet: active, steps, questionsByStep: byStep };
  }
});

export const listFormSets = query({ args: {}, handler: async (ctx: any)=> ctx.db.query("formSets").collect() });

export const createFormSet = mutation({
  args: { name: v.string(), version: v.string(), activate: v.optional(v.boolean()) },
  handler: async (ctx: any, args: any) => {
    const id = await ctx.db.insert("formSets", { name: args.name, version: args.version, isActive: !!args.activate, createdAt: Date.now() });
    if (args.activate) {
      const actives = await ctx.db
        .query("formSets")
        .withIndex("by_active", (q: any) => q.eq("isActive", true))
        .collect();
      for (const a of actives) if (a._id.id !== id.id) await ctx.db.patch(a._id, { isActive: false });
    }
    return id;
  }
});

export const publishFormSet = mutation({
  args: { formSetId: v.id("formSets") },
  handler: async (ctx: any, { formSetId }: any) => {
    const actives = await ctx.db
      .query("formSets")
      .withIndex("by_active", (q: any) => q.eq("isActive", true))
      .collect();
    for (const a of actives) await ctx.db.patch(a._id, { isActive: false });
    await ctx.db.patch(formSetId, { isActive: true });
    return { ok: true };
  }
});

export const createStep = mutation({
  args: { formSetId: v.id("formSets"), titleKey: v.string(), order: v.optional(v.number()) },
  handler: async (ctx: any, { formSetId, titleKey, order }: any) => {
    let ord = order ?? 0;
    if (order == null) {
      const latest = await ctx.db
        .query("formSteps")
        .withIndex("by_formSet_order", (q: any)=> q.eq("formSetId", formSetId))
        .order("desc")
        .first();
      ord = latest ? latest.order + 1 : 1;
    }
    return await ctx.db.insert("formSteps", { formSetId, titleKey, order: ord, createdAt: Date.now() });
  }
});

export const updateStep = mutation({
  args: { stepId: v.id("formSteps"), titleKey: v.optional(v.string()), order: v.optional(v.number()) },
  handler: async (ctx: any, { stepId, ...patch }: any) => { await ctx.db.patch(stepId, patch as any); return { ok: true }; }
});

export const deleteStep = mutation({
  args: { stepId: v.id("formSteps") },
  handler: async (ctx: any, { stepId }: any) => {
    const qs = await ctx.db
      .query("formQuestions")
      .withIndex("by_step", (q: any)=> q.eq("stepId", stepId))
      .collect();
    for (const q of qs) await ctx.db.delete(q._id);
    await ctx.db.delete(stepId);
    return { ok: true };
  }
});

export const reorderSteps = mutation({
  args: { formSetId: v.id("formSets"), orderedStepIds: v.array(v.id("formSteps")) },
  handler: async (ctx: any, { formSetId, orderedStepIds }: any) => {
    let i = 1;
    for (const sid of orderedStepIds) await ctx.db.patch(sid, { order: i++ });
    return { ok: true };
  }
});

export const createQuestion = mutation({
  args: {
    formSetId: v.id("formSets"), stepId: v.id("formSteps"), key: v.string(), labelKey: v.string(), type: v.string(), required: v.boolean(),
    options: v.optional(v.array(v.object({ value: v.string(), labelKey: v.string() }))),
    validation: v.optional(v.any()), ui: v.optional(v.any()), visibility: v.optional(v.any()), mapTo: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const exists = await ctx.db
      .query("formQuestions")
      .withIndex("by_formSet_key", (q: any)=> q.eq("formSetId", args.formSetId))
      .filter((q: any) => q.eq(q.field("key"), args.key))
      .first();
    if (exists) return { ok: false, error: "DUPLICATE_KEY" } as any;
    let ord = args.order ?? 0;
    if (args.order == null) {
      const last = await ctx.db
        .query("formQuestions")
        .withIndex("by_formSet_step_order", (q: any)=> q.eq("formSetId", args.formSetId).eq("stepId", args.stepId))
        .order("desc")
        .first();
      ord = last ? last.order + 1 : 1;
    }
    const id = await ctx.db.insert("formQuestions", { ...args, order: ord, createdAt: Date.now() } as any);
    return id;
  }
});

export const updateQuestion = mutation({
  args: { questionId: v.id("formQuestions"), patch: v.object({
    labelKey: v.optional(v.string()), type: v.optional(v.string()), required: v.optional(v.boolean()),
    options: v.optional(v.array(v.object({ value: v.string(), labelKey: v.string() }))),
    validation: v.optional(v.any()), ui: v.optional(v.any()), visibility: v.optional(v.any()), mapTo: v.optional(v.string()), order: v.optional(v.number()), stepId: v.optional(v.id("formSteps")),
  }) },
  handler: async (ctx: any, { questionId, patch }: any) => { await ctx.db.patch(questionId, patch as any); return { ok: true }; }
});

export const deleteQuestion = mutation({ args: { questionId: v.id("formQuestions") }, handler: async (ctx: any, { questionId }: any) => { await ctx.db.delete(questionId); return { ok: true }; } });

export const reorderQuestions = mutation({
  args: { stepId: v.id("formSteps"), orderedQuestionIds: v.array(v.id("formQuestions")) },
  handler: async (ctx: any, { stepId, orderedQuestionIds }: any) => {
    let i = 1;
    for (const qid of orderedQuestionIds) await ctx.db.patch(qid, { order: i++ });
    return { ok: true };
  }
});
