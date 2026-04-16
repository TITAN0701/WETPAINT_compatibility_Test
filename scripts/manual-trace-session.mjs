import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { chromium, webkit } from 'playwright';
import { config as loadEnv } from 'dotenv';
import { getDeviceDescriptor, resolveManualProfile } from './manual-device-profiles.mjs';

loadEnv();

function printHelp() {
  console.log(`Usage:
  node scripts/manual-trace-session.mjs <device>

Devices:
  iphone
  iphone14
  android
  pixel5
  ipad-safari
  ipad-chrome
  random-mobile

Behavior:
  1. Launch headed browser with the selected mobile/tablet profile
  2. Start Playwright tracing
  3. Open PW_MANUAL_TRACE_URL or <PW_BASE_URL>/login
  4. Let you operate manually
  5. Save trace.zip when you press Enter in terminal
`);
}

async function main() {
  const requestedProfile = process.argv[2] || 'random-mobile';
  if (requestedProfile === '--help' || requestedProfile === '-h') {
    printHelp();
    return;
  }

  const profile = resolveManualProfile(requestedProfile);
  const descriptor = getDeviceDescriptor(profile);
  const baseURL = (process.env.PW_BASE_URL || 'http://61.220.55.161:47080').trim();
  const targetUrl = (process.env.PW_MANUAL_TRACE_URL || `${baseURL.replace(/\/$/, '')}/login`).trim();
  const slowMo = Number(process.env.PW_MANUAL_TRACE_SLOWMO_MS || 0);

  const manualTraceDir = path.resolve(process.cwd(), 'reports', 'manual-trace');
  const manualVideoDir = path.resolve(process.cwd(), 'test-results', 'manual-trace-video');
  await fs.mkdir(manualTraceDir, { recursive: true });
  await fs.mkdir(manualVideoDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const tracePath = path.join(manualTraceDir, `trace-${profile.key}-${stamp}.zip`);
  const browserType = profile.browserName === 'webkit' ? webkit : chromium;
  const browser = await browserType.launch({
    headless: false,
    slowMo
  });

  const context = await browser.newContext({
    ...descriptor,
    recordVideo: {
      dir: manualVideoDir
    }
  });

  try {
    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true
    });

    const page = await context.newPage();
    await page.goto(targetUrl, { waitUntil: 'load' });

    console.log(`Manual trace started with ${profile.label}`);
    console.log(`URL: ${targetUrl}`);
    console.log('Operate in the browser window. Press Enter here when you want to finish and save trace.zip');

    const rl = readline.createInterface({ input, output });
    await rl.question('');
    rl.close();

    await context.tracing.stop({ path: tracePath });
    console.log(`Trace saved: ${tracePath}`);
    console.log(`Open with: npx playwright show-trace "${tracePath}"`);
  } finally {
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
