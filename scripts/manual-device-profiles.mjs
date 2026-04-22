import { devices } from 'playwright';

const manualProfiles = {
  iphone: {
    key: 'iphone',
    label: 'iPhone 14 Pro / Safari',
    browserName: 'webkit',
    deviceName: 'iPhone 14 Pro'
  },
  iphone14: {
    key: 'iphone14',
    label: 'iPhone 14 Pro / Safari',
    browserName: 'webkit',
    deviceName: 'iPhone 14 Pro'
  },
  android: {
    key: 'android',
    label: 'Pixel 7 / Chrome',
    browserName: 'chromium',
    deviceName: 'Pixel 7'
  },
  pixel5: {
    key: 'pixel5',
    label: 'Pixel 5 / Chrome',
    browserName: 'chromium',
    deviceName: 'Pixel 5'
  },
  ipadSafari: {
    key: 'ipad-safari',
    label: 'iPad (gen 11) / Safari',
    browserName: 'webkit',
    deviceName: 'iPad (gen 11)'
  },
  ipadChrome: {
    key: 'ipad-chrome',
    label: 'iPad (gen 11) / Chrome',
    browserName: 'chromium',
    deviceName: 'iPad (gen 11)'
  }
};

const randomMobileCandidates = [
  manualProfiles.iphone,
  manualProfiles.iphone14,
  manualProfiles.android,
  manualProfiles.pixel5,
  manualProfiles.ipadSafari,
  manualProfiles.ipadChrome
];

export function listManualProfiles() {
  return randomMobileCandidates.map((profile) => profile.key);
}

export function resolveManualProfile(input = 'random-mobile') {
  const normalized = String(input || 'random-mobile').trim().toLowerCase();

  if (normalized === 'random-mobile') {
    return randomMobileCandidates[Math.floor(Math.random() * randomMobileCandidates.length)];
  }

  const aliasMap = {
    iphone: manualProfiles.iphone,
    'iphone-safari': manualProfiles.iphone,
    ios16plus: manualProfiles.iphone,
    'ios16plus-safari': manualProfiles.iphone,
    iphone14: manualProfiles.iphone14,
    'iphone14-safari': manualProfiles.iphone14,
    android: manualProfiles.android,
    'android-chrome': manualProfiles.android,
    pixel5: manualProfiles.pixel5,
    'pixel5-chrome': manualProfiles.pixel5,
    ipad: manualProfiles.ipadSafari,
    ipad16plus: manualProfiles.ipadSafari,
    'ipad-safari': manualProfiles.ipadSafari,
    'ipad16plus-safari': manualProfiles.ipadSafari,
    'ipad-chrome': manualProfiles.ipadChrome
  };

  const resolved = aliasMap[normalized];
  if (!resolved) {
    throw new Error(`Unsupported device profile: ${input}`);
  }

  return resolved;
}

export function getDeviceDescriptor(profile) {
  const descriptor = devices[profile.deviceName];
  if (!descriptor) {
    throw new Error(`Playwright device descriptor not found: ${profile.deviceName}`);
  }
  return descriptor;
}
