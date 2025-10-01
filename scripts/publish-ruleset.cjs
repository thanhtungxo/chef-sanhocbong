#!/usr/bin/env node
const { ConvexHttpClient } = require('convex/browser');
const fs = require('fs');
const path = require('path');

function usage() {
  console.log('Usage: node scripts/publish-ruleset.cjs <scholarshipId> [version] [--file=path] [--activate]');
  console.log('Example: node scripts/publish-ruleset.cjs aas 2.0.0 --activate');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) usage();

const scholarshipId = args[0];
let version = '1.0.0';
let activate = false;
let fileOverride;
let versionSet = false;

for (const arg of args.slice(1)) {
  if (arg === '--activate') {
    activate = true;
  } else if (arg.startsWith('--file=')) {
    fileOverride = arg.slice('--file='.length);
  } else if (!versionSet) {
    version = arg;
    versionSet = true;
  }
}

const deploymentUrl = process.env.CONVEX_URL || process.env.CONVEX_DEPLOYMENT_URL;
if (!deploymentUrl) {
  console.error('Missing CONVEX_URL environment variable.');
  process.exit(1);
}

const rulesPath = fileOverride
  ? path.resolve(fileOverride)
  : path.resolve(__dirname, `../types/rules/${scholarshipId}.json`);

if (!fs.existsSync(rulesPath)) {
  console.error(`Rules file not found: ${rulesPath}`);
  process.exit(1);
}

const json = fs.readFileSync(rulesPath, 'utf8');

async function main() {
  const client = new ConvexHttpClient(deploymentUrl);
  try {
    const result = await client.mutation('scholarships:publishRuleset', {
      scholarshipId,
      version,
      json,
      isActive: activate,
    });
    if (result?.ok) {
      console.log(`Published ruleset ${scholarshipId}@${version} (${activate ? 'active' : 'inactive'})`);
    } else {
      console.error('Failed to publish:', result?.issues || result);
      process.exit(1);
    }
  } catch (err) {
    console.error('Error publishing ruleset:', err);
    process.exit(1);
  }
}

main();
