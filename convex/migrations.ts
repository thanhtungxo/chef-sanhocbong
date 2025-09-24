import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const migrateLegacyWizard = mutation({
  args: { name: v.optional(v.string()), version: v.optional(v.string()) },
  handler: async (ctx: any, { name = 'Legacy Wizard', version = '1.0.0' }) => {
    // If any form set exists with this name, do nothing and just activate it.
    const existing = (await ctx.db.query('formSets').collect()).find((f: any) => f.name === name);
    let formSetId = existing?._id;
    if (!formSetId) {
      formSetId = await ctx.db.insert('formSets', { name, version, isActive: false, createdAt: Date.now() });

      const mkStep = async (titleKey: string, order: number) => {
        return await ctx.db.insert('formSteps', { formSetId, titleKey, order, createdAt: Date.now() });
      };
      const mkQ = async (stepId: any, q: any) => {
        await ctx.db.insert('formQuestions', { formSetId, stepId, createdAt: Date.now(), order: q.order ?? 1, ...q });
      };

      const s1 = await mkStep('ui.step.personal', 1);
      const s2 = await mkStep('ui.step.education', 2);
      const s3 = await mkStep('ui.step.employment', 3);
      const s4 = await mkStep('ui.step.final', 4);

      // Step 1: Personal
      await mkQ(s1, { key: 'fullName', labelKey: 'ui.fullName.label', type: 'text', required: true, order: 1, ui: { placeholderKey: 'ui.fullName.placeholder' } });
      await mkQ(s1, { key: 'email', labelKey: 'ui.email.label', type: 'text', required: true, order: 2, ui: { placeholderKey: 'ui.email.placeholder' }, validation: { pattern: '^.+@.+\..+$' } });
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

      // Step 2: Education
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

      // Step 3: Employment
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

      // Step 4: Final
      await mkQ(s4, { key: 'hasSpouseAuNzCitizenOrPR', labelKey: 'ui.personal.spouse.label', type: 'boolean', required: true, order: 1 });
      await mkQ(s4, { key: 'hasCriminalRecordOrInvestigation', labelKey: 'ui.personal.criminal.label', type: 'boolean', required: true, order: 2 });
      await mkQ(s4, { key: 'governmentScholarship', labelKey: 'ui.final.govscholar2.label', type: 'boolean', required: true, order: 3 });
      await mkQ(s4, { key: 'governmentScholarshipCountry', labelKey: 'ui.final.govscholar.country', type: 'select', required: false, order: 4, options: [
        { value: 'Asc', labelKey: 'Asc' },
        { value: 'My', labelKey: 'Mỹ' },
        { value: 'Anh', labelKey: 'Anh' },
        { value: 'Phap', labelKey: 'Pháp' },
        { value: 'New Zealand', labelKey: 'New Zealand' },
        { value: 'Nhat', labelKey: 'Nhật' },
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
    }

    // Activate the migrated form set and deactivate others
    const actives = await ctx.db
      .query('formSets')
      .withIndex('by_active', (q: any) => q.eq('isActive', true))
      .collect();
    for (const a of actives) await ctx.db.patch(a._id, { isActive: false });
    await ctx.db.patch(formSetId, { isActive: true });
    return { ok: true, formSetId };
  }
});

