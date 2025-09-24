#!/usr/bin/env node
import { spawn } from 'node:child_process';

const proc = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['convex', 'run', 'migrations.migrateLegacyWizard'], { stdio: 'inherit' });
proc.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✔ Migration completed. The migrated form set is now active.');
  } else {
    console.error('\n✖ Migration failed with code', code);
  }
  process.exit(code ?? 1);
});

