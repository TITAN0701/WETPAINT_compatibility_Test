import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv();

const strict = process.argv.includes('--strict');
const envFilePath = path.resolve(process.cwd(), '.env');

const baselineRequired = [
  'PW_BASE_URL',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'ADMIN_PHONE_LOGIN',
  'ADMIN_PHONE_PASSWORD',
  'FRONTDESK_PARENT_EMAIL',
  'FRONTDESK_PARENT_PASSWORD',
  'CHILD_DISPLAY_NAME',
  'FRONTDESK_EXISTING_CHILD_NAME',
  'AI_CHILD_DISPLAY_NAME'
];

const optionalStateful = [
  'FIRST_LOGIN_LOGIN_ID',
  'FIRST_LOGIN_PASSWORD',
  'MEDIA_VIDEO_PATH',
  'CHILD_AVATAR_PATH'
];

const missingRequired = baselineRequired.filter((name) => !(process.env[name] || '').trim());
const missingOptional = optionalStateful.filter((name) => !(process.env[name] || '').trim());
const hasEnvFile = fs.existsSync(envFilePath);

console.log(`Env contract check: ${hasEnvFile ? '.env present' : '.env missing; suite may rely on built-in defaults'}`);
console.log(`Required baseline vars configured: ${baselineRequired.length - missingRequired.length}/${baselineRequired.length}`);

if (missingRequired.length > 0) {
  console.log(`Missing required baseline vars: ${missingRequired.join(', ')}`);
}

if (missingOptional.length > 0) {
  console.log(`Optional stateful vars not configured: ${missingOptional.join(', ')}`);
}

if (missingRequired.length === 0) {
  console.log('Baseline contract is configured for smoke/shared/frontdesk coverage.');
}

if (strict && (!hasEnvFile || missingRequired.length > 0)) {
  process.exitCode = 1;
}
