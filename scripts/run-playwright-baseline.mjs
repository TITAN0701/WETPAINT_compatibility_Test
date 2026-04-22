import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const withSummary = process.argv.includes('--summary');
const nodeCommand = process.execPath;
const reportsDir = path.resolve(process.cwd(), 'reports');
const playwrightCliPath = path.resolve(process.cwd(), 'node_modules', 'playwright', 'cli.js');
const reportArtifacts = [
  path.join(reportsDir, 'playwright-results.json'),
  path.join(reportsDir, 'compatibility-summary.html')
];

const baselineArgs = [
  playwrightCliPath,
  'test',
  '--project=desktop-chrome',
  '--project=iphone-safari',
  '--project=android-chrome',
  '--project=ipad-safari',
  '--workers=2',
  '--grep=(?=.*@readonly)(?=.*(@smoke|@shared|@frontdesk|@rwd))',
  '--grep-invert=@ui|@workflow|@media|@stateful'
];

async function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: options.shell ?? false
    });

    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

async function main() {
  await fs.mkdir(reportsDir, { recursive: true });
  await Promise.all(reportArtifacts.map((target) => fs.rm(target, { force: true }).catch(() => undefined)));

  const envCheckCode = await run(nodeCommand, ['scripts/check-env-contract.mjs']);
  if (envCheckCode !== 0) {
    process.exitCode = envCheckCode;
    return;
  }

  const playwrightCode = await run(nodeCommand, baselineArgs);
  const signalCode = await run(nodeCommand, ['scripts/assert-playwright-signal.mjs']);

  let summaryCode = 0;
  if (withSummary && signalCode === 0) {
    summaryCode = await run(nodeCommand, ['scripts/summarize-playwright-report.mjs']);
  }

  process.exitCode = playwrightCode || signalCode || summaryCode;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
