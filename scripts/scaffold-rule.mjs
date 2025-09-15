#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const [, , id, displayName] = process.argv;
if (!id) {
  console.error('Usage: node scripts/scaffold-rule.mjs <id> "Display Name"');
  process.exit(1);
}

const root = path.resolve(process.cwd());
const rulesDir = path.join(root, 'types', 'rules');
const metaDir = path.join(rulesDir, 'meta');

fs.mkdirSync(rulesDir, { recursive: true });
fs.mkdirSync(metaDir, { recursive: true });

const rulePath = path.join(rulesDir, `${id}.json`);
if (fs.existsSync(rulePath)) {
  console.error(`Rule file already exists: ${rulePath}`);
  process.exit(1);
}

const metaPath = path.join(metaDir, `${id}.json`);

const ruleTemplate = [
  {
    id: 'example_min_ielts',
    field: 'ielts',
    type: 'minScore',
    value: 6.5,
    messageKey: `${id}.ielts.min`,
    message: 'Your IELTS score does not meet the minimum',
  },
];

const metaTemplate = {
  id,
  name: displayName || id.toUpperCase(),
  country: 'VN',
  cycle: '2025',
};

fs.writeFileSync(rulePath, JSON.stringify(ruleTemplate, null, 2) + '\n');
fs.writeFileSync(metaPath, JSON.stringify(metaTemplate, null, 2) + '\n');

console.log('Scaffolded:');
console.log(' -', rulePath);
console.log(' -', metaPath);
console.log('\nNext:');
console.log(' - Add translations for', `${id}.ielts.min`, 'in src/locales/en.json and vi.json');
console.log(' - Run: npm run validate:rules');

