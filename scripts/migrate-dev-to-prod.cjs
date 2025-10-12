#!/usr/bin/env node
/**
 * Migrate data (Active Form + AI Models) from a source Convex deployment to a target Convex deployment.
 * Usage:
 *   node scripts/migrate-dev-to-prod.cjs --source=https://<source>.convex.cloud --target=https://strong-ermine-969.convex.cloud
 *
 * Notes:
 * - This script copies:
 *   1) Active Form Set (formSets + formSteps + formQuestions)
 *   2) AI Models (ai_models)
 * - It preserves order fields and activation flags.
 * - It DOES NOT copy environment variables. You must set alias API keys in Convex (target) manually.
 */

const { ConvexHttpClient } = require('convex/browser');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (const a of args) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function normalizeUrl(u) {
  if (!u) return u;
  return u.trim().replace(/\/$/, '');
}

async function migrateForms(sourceClient, targetClient) {
  console.log('\n=== Migrating Active Form ===');
  const srcActive = await sourceClient.query('forms:getActiveForm', {});
  if (!srcActive) {
    console.log('No active form found on source, skipping forms migration.');
    return { skipped: true };
  }
  const { formSet, steps: srcSteps, questionsByStep } = srcActive;
  console.log('Source active form:', formSet?.name, 'version:', formSet?.version);

  // Create new form set on target
  const tgtFormSetId = await targetClient.mutation('forms:createFormSet', {
    name: formSet?.name || 'Imported',
    version: formSet?.version || '1.0.0',
    activate: true,
  });
  console.log('Created target form set:', tgtFormSetId);

  // Create steps in order, preserve UI
  const stepIdMap = new Map();
  const orderedSrcSteps = [...(srcSteps || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  for (const s of orderedSrcSteps) {
    const createdStepId = await targetClient.mutation('forms:createStep', {
      formSetId: tgtFormSetId,
      titleKey: s.titleKey,
      order: s.order,
      ui: s.ui ?? undefined,
    });
    const srcId = (s._id && s._id.id) ? s._id.id : s._id;
    stepIdMap.set(srcId, createdStepId);
    console.log('  + Step', s.titleKey, '=>', createdStepId.id || createdStepId);
  }

  // Create questions per step, preserving order and metadata
  for (const s of orderedSrcSteps) {
    const srcStepIdKey = (s._id && s._id.id) ? s._id.id : s._id;
    const qs = (questionsByStep && questionsByStep[srcStepIdKey]) ? questionsByStep[srcStepIdKey] : [];
    const orderedQs = [...qs].sort((a, b) => (a.order || 0) - (b.order || 0));
    for (const q of orderedQs) {
      const tgtStepId = stepIdMap.get(srcStepIdKey);
      const payload = {
        formSetId: tgtFormSetId,
        stepId: tgtStepId,
        key: q.key,
        labelKey: q.labelKey,
        type: q.type,
        required: !!q.required,
        options: q.options || undefined,
        validation: q.validation || undefined,
        ui: q.ui || undefined,
        visibility: q.visibility || undefined,
        mapTo: q.mapTo || undefined,
        order: q.order || undefined,
      };
      const createdQId = await targetClient.mutation('forms:createQuestion', payload);
      console.log('    - Question', q.key, '=>', createdQId.id || createdQId);
    }
  }

  console.log('✔ Forms migration completed.');
}

async function migrateModels(sourceClient, targetClient) {
  console.log('\n=== Migrating AI Models ===');
  const models = await sourceClient.query('aiEngine:listModels', {});
  if (!models || models.length === 0) {
    console.log('No AI models found on source, skipping models migration.');
    return { skipped: true };
  }

  // Copy all models; preserve isActive/status/provider/model/aliasKey
  for (const m of models) {
    const payload = {
      provider: m.provider,
      model: m.model,
      aliasKey: m.aliasKey,
      status: m.status,
      isActive: !!m.isActive,
    };
    const createdId = await targetClient.mutation('aiEngine:addModel', payload);
    console.log('  + Model', m.provider, m.model, 'active:', !!m.isActive, '=>', createdId.id || createdId);
  }

  console.log('✔ Models migration completed.');
}

async function main() {
  const args = parseArgs();
  const source = normalizeUrl(args.source);
  const target = normalizeUrl(args.target || 'https://strong-ermine-969.convex.cloud');

  if (!source) {
    console.error('Missing --source. Example: --source=https://dependable-quail-10.convex.cloud');
    process.exit(1);
  }
  if (!/^https:\/\/.*\.convex\.cloud$/.test(source)) {
    console.error('Invalid --source URL, must be https://<name>.convex.cloud');
    process.exit(1);
  }
  if (!/^https:\/\/.*\.convex\.cloud$/.test(target)) {
    console.error('Invalid --target URL, must be https://<name>.convex.cloud');
    process.exit(1);
  }

  console.log('Source:', source);
  console.log('Target:', target);

  const sourceClient = new ConvexHttpClient(source);
  const targetClient = new ConvexHttpClient(target);

  try {
    await migrateForms(sourceClient, targetClient);
    await migrateModels(sourceClient, targetClient);
    console.log('\n=== Migration Summary ===');
    console.log('✔ Data migrated from', source, '\n  =>', target);
    console.log('\nNext steps:');
    console.log('- Open Convex dashboard for target and set environment variables for alias keys (e.g. OPENAI_API_KEY, Gemini_15_Flash, etc.)');
    console.log('- Reload your production Admin page and verify Form Builder and AI Engine show data.');
  } catch (err) {
    console.error('✖ Migration failed:', err?.message || err);
    process.exit(1);
  }
}

main();