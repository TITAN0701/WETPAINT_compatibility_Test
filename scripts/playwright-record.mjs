import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import { resolveManualProfile } from './manual-device-profiles.mjs';

loadEnv();

function printHelp() {
  console.log(`Usage:
  node scripts/playwright-record.mjs <device>

Devices:
  iphone
  iphone14
  android
  pixel5
  ipad-safari
  ipad-chrome
  random-mobile

Environment:
  PW_BASE_URL         Default base url, fallback http://61.220.55.161:47080
  PW_RECORD_URL       Optional override full url, fallback <baseUrl>/login
`);
}

async function main() {
  const requestedProfile = process.argv[2] || 'random-mobile';
  if (requestedProfile === '--help' || requestedProfile === '-h') {
    printHelp();
    return;
  }

  const profile = resolveManualProfile(requestedProfile);
  const baseURL = (process.env.PW_BASE_URL || 'http://61.220.55.161:47080').trim();
  const recordUrl = (process.env.PW_RECORD_URL || `${baseURL.replace(/\/$/, '')}/login`).trim();

  const recordingsDir = path.resolve(process.cwd(), 'recordings');
  await fs.mkdir(recordingsDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(recordingsDir, `recorded-${profile.key}-${stamp}.spec.ts`);
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  const args = [
    'playwright',
    'codegen',
    '--browser',
    profile.browserName,
    '--device',
    profile.deviceName,
    recordUrl,
    '-o',
    outputFile
  ];

  console.log(`Recording with ${profile.label}`);
  console.log(`URL: ${recordUrl}`);
  console.log(`Output: ${outputFile}`);

  await new Promise((resolve, reject) => {
    const child = spawn(npxCommand, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`playwright codegen exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
