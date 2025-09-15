#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const rulesDir = path.join(root, 'types', 'rules');
const localesDir = path.join(root, 'src', 'locales');

const RuleTypeEnum = z.enum(["minScore", "boolean", "select", "text"]);
const SeverityEnum = z.enum(["blocker", "warn"]).optional();
const LeafRuleSchema = z.object({
  id: z.string().optional(),
  type: RuleTypeEnum,
  field: z.string().min(1),
  value: z.any(),
  message: z.string().min(1),
  messageKey: z.string().optional(),
  severity: SeverityEnum,
});
const GroupRuleSchema = z.lazy(() => z.object({
  id: z.string().min(1).optional(),
  operator: z.enum(["all", "any"]),
  rules: z.array(RuleNodeSchema),
  message: z.string().optional(),
  messageKey: z.string().optional(),
  severity: SeverityEnum,
}));
const RuleNodeSchema = z.union([LeafRuleSchema, GroupRuleSchema]);
const RulesArraySchema = z.array(RuleNodeSchema);

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function collectLocaleKeys() {
  const keys = new Set();
  for (const lang of ['en', 'vi']) {
    const p = path.join(localesDir, `${lang}.json`);
    if (!fs.existsSync(p)) continue;
    const obj = loadJson(p);
    for (const k of Object.keys(obj)) keys.add(k);
  }
  return keys;
}

const localeKeys = collectLocaleKeys();
let failed = false;
const files = fs.readdirSync(rulesDir).filter(f => f.endsWith('.json'));

for (const f of files) {
  const full = path.join(rulesDir, f);
  const id = path.basename(f, '.json');
  try {
    const json = loadJson(full);
    const res = RulesArraySchema.safeParse(json);
    if (!res.success) {
      failed = true;
      console.error(`[rules:${id}] Invalid JSON schema:`);
      for (const issue of res.error.issues) console.error('  -', issue.path.join('.'), issue.message);
      continue;
    }
    // Validate messageKey presence in locales (if provided)
    for (const rule of res.data) {
      if ('type' in rule) {
        if (rule.messageKey && !localeKeys.has(rule.messageKey)) {
          failed = true;
          console.error(`[rules:${id}] Missing locale key: ${rule.messageKey}`);
        }
      } else {
        if (rule.messageKey && !localeKeys.has(rule.messageKey)) {
          failed = true;
          console.error(`[rules:${id}] Missing locale key (group): ${rule.messageKey}`);
        }
      }
    }
  } catch (e) {
    failed = true;
    console.error(`[rules:${id}] Failed to parse:`, e.message);
  }
}

if (failed) {
  console.error('\nValidation failed.');
  process.exit(1);
} else {
  console.log('All rule files valid and localized.');
}

