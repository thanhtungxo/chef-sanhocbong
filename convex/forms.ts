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

export const seedLegacyForm = mutation({
  args: { forceNew: v.optional(v.boolean()) },
  handler: async (ctx: any, { forceNew }: any) => {
    if (!forceNew) {
      const existing = await ctx.db
        .query("formSets")
        .withIndex("by_active", (q: any) => q.eq("isActive", true))
        .first();
      if (existing) return { ok: true, formSetId: existing._id };
    }

    const formSetId = await ctx.db.insert("formSets", {
      name: "Default",
      version: "1.0.0",
      isActive: true,
      createdAt: Date.now(),
    });

    const mkStep = async (titleKey: string, order: number) =>
      await ctx.db.insert("formSteps", { formSetId, titleKey, order, createdAt: Date.now() });

    const s1 = await mkStep('ui.personal.title', 1);
    const s2 = await mkStep('ui.education.title', 2);
    const s3 = await mkStep('ui.employment.title', 3);
    const s4 = await mkStep('ui.final.title', 4);

    const mkQ = async (stepId: any, q: any) =>
      await ctx.db.insert("formQuestions", { formSetId, stepId, createdAt: Date.now(), order: q.order ?? 1, ...q });

    await mkQ(s1, { key: 'fullName', labelKey: 'ui.fullName.label', type: 'text', required: true, order: 1, ui: { widget: 'text', placeholderKey: 'ui.fullName.placeholder' } });
    await mkQ(s1, { key: 'email', labelKey: 'ui.email.label', type: 'text', required: true, order: 2, ui: { widget: 'text', placeholderKey: 'ui.email.placeholder' } });
    await mkQ(s1, { key: 'dateOfBirth', labelKey: 'ui.dob.label', type: 'date', required: true, order: 3 });
    await mkQ(s1, { key: 'gender', labelKey: 'ui.gender.label', type: 'radio', required: true, order: 4, options: [
      { value: 'Male', labelKey: 'ui.gender.male' },
      { value: 'Female', labelKey: 'ui.gender.female' },
      { value: 'Other', labelKey: 'ui.gender.other' },
    ] });
    await mkQ(s1, { key: 'currentProvince', labelKey: 'ui.province.label', type: 'autocomplete', required: true, order: 5, ui: { widget: 'autocomplete', placeholderKey: 'ui.province.placeholder' } });
    await mkQ(s1, { key: 'countryOfCitizenship', labelKey: 'ui.citizenship.label', type: 'radio', required: true, order: 6, options: [
      { value: 'Vietnam', labelKey: 'ui.citizenship.vietnam' },
      { value: 'Other', labelKey: 'ui.citizenship.other' },
    ] });

    await mkQ(s2, { key: 'highestQualification', labelKey: 'ui.education.highest.label', type: 'select', required: true, order: 1, options: [
      { value: 'Bachelor', labelKey: 'ui.education.highest.bachelor' },
      { value: 'Master', labelKey: 'ui.education.highest.master' },
      { value: 'PhD', labelKey: 'ui.education.highest.phd' },
      { value: 'Other', labelKey: 'ui.education.highest.other' },
    ] });
    await mkQ(s2, { key: 'gpa', labelKey: 'ui.education.gpa.label', type: 'number', required: true, order: 2, validation: { min: 0, max: 10 } });
    await mkQ(s2, { key: 'vulnerableGroups', labelKey: 'ui.education.vulnerable.label', type: 'multi-select', required: false, order: 3, options: [
      { value: 'disability', labelKey: 'ui.vulnerable.disability' },
      { value: 'hardship_area', labelKey: 'ui.vulnerable.hardship' },
      { value: 'none', labelKey: 'ui.vulnerable.none' },
    ] });

    await mkQ(s3, { key: 'employerType', labelKey: 'ui.employment.employerType.label', type: 'select', required: true, order: 1, options: [
      { value: 'gov_levels', labelKey: 'ui.employment.employerType.opt.gov_levels' },
      { value: 'vocational_school', labelKey: 'ui.employment.employerType.opt.vocational_school' },
      { value: 'research_institute', labelKey: 'ui.employment.employerType.opt.research_institute' },
      { value: 'provincial_university', labelKey: 'ui.employment.employerType.opt.provincial_university' },
      { value: 'major_city_university', labelKey: 'ui.employment.employerType.opt.major_city_university' },
      { value: 'vn_ngo', labelKey: 'ui.employment.employerType.opt.vn_ngo' },
      { value: 'vn_company', labelKey: 'ui.employment.employerType.opt.vn_company' },
      { value: 'intl_ngo', labelKey: 'ui.employment.employerType.opt.intl_ngo' },
      { value: 'foreign_company', labelKey: 'ui.employment.employerType.opt.foreign_company' },
    ] });
    await mkQ(s3, { key: 'yearsOfExperience', labelKey: 'ui.education.years.label', type: 'number', required: true, order: 2, validation: { min: 0 } });
    await mkQ(s3, { key: 'employerName', labelKey: 'ui.education.employer.label', type: 'text', required: true, order: 3, ui: { placeholderKey: 'ui.education.employer.placeholder' } });
    await mkQ(s3, { key: 'hasWorkedInMilitaryPolice', labelKey: 'ui.employment.military.label', type: 'boolean', required: true, order: 4 });

    await mkQ(s4, { key: 'hasSpouseAuNzCitizenOrPR', labelKey: 'ui.personal.spouse.label', type: 'boolean', required: true, order: 1 });
    await mkQ(s4, { key: 'hasCriminalRecordOrInvestigation', labelKey: 'ui.personal.criminal.label', type: 'boolean', required: true, order: 2 });
    await mkQ(s4, { key: 'governmentScholarship', labelKey: 'ui.final.govscholar2.label', type: 'boolean', required: true, order: 3 });
    await mkQ(s4, { key: 'governmentScholarshipCountry', labelKey: 'ui.final.govscholar.country', type: 'select', required: false, order: 4, options: [
      { value: 'Úc', labelKey: 'Úc' },
      { value: 'Mỹ', labelKey: 'Mỹ' },
      { value: 'Anh', labelKey: 'Anh' },
      { value: 'Pháp', labelKey: 'Pháp' },
      { value: 'New Zealand', labelKey: 'New Zealand' },
      { value: 'Nhật', labelKey: 'Nhật' },
    ], validation: { requiredWhen: { field: 'governmentScholarship', equals: true } } });
    await mkQ(s4, { key: 'englishTestType', labelKey: 'ui.final.testType.label', type: 'select', required: true, order: 5, options: [
      { value: 'IELTS', labelKey: 'ui.final.testType.ielts' },
      { value: 'TOEFL', labelKey: 'ui.final.testType.toefl' },
      { value: 'PTE', labelKey: 'ui.final.testType.pte' },
    ] });
    await mkQ(s4, { key: 'englishOverall', labelKey: 'ui.final.overall.label', type: 'number', required: true, order: 6, validation: { min: 0 } });
    await mkQ(s4, { key: 'englishListening', labelKey: 'Listening', type: 'number', required: true, order: 7, validation: { min: 0 } });
    await mkQ(s4, { key: 'englishReading', labelKey: 'Reading', type: 'number', required: true, order: 8, validation: { min: 0 } });
    await mkQ(s4, { key: 'englishWriting', labelKey: 'Writing', type: 'number', required: true, order: 9, validation: { min: 0 } });
    await mkQ(s4, { key: 'englishSpeaking', labelKey: 'Speaking', type: 'number', required: true, order: 10, validation: { min: 0 } });

    return { ok: true, formSetId };
  }
});
