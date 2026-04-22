import path from 'node:path';

export interface Credentials {
  loginId: string;
  password: string;
  label: string;
}

export interface AppAccounts {
  admin: Credentials;
  adminPhone: Credentials;
  parent: Credentials;
  parentPhone: Credentials;
  frontdeskParent: Credentials;
  firstLogin?: Credentials;
}

export interface AppAssets {
  avatarPath?: string;
  mediaVideoPath?: string;
}

export interface AppNames {
  childDisplayName: string;
  frontdeskExistingChildName: string;
  aiChildDisplayName: string;
}

function resolveAssetPath(rawValue: string | undefined): string | undefined {
  if (!rawValue) {
    return undefined;
  }

  return path.isAbsolute(rawValue) ? rawValue : path.resolve(process.cwd(), rawValue);
}

function env(name: string, fallback = ''): string {
  return (process.env[name] || fallback).trim();
}

export const appAccounts: AppAccounts = {
  admin: {
    loginId: env('ADMIN_EMAIL', '0999999993'),
    password: env('ADMIN_PASSWORD', 'password123'),
    label: 'admin-email'
  },
  adminPhone: {
    loginId: env('ADMIN_PHONE_LOGIN', '0999999993'),
    password: env('ADMIN_PHONE_PASSWORD', 'password123'),
    label: 'admin-phone'
  },
  parent: {
    loginId: env('PARENT_EMAIL', '0999999993'),
    password: env('PARENT_PASSWORD', 'password123'),
    label: 'parent-email'
  },
  parentPhone: {
    loginId: env('PARENT_PHONE_LOGIN', '0999999993'),
    password: env('PARENT_PHONE_PASSWORD', 'password123'),
    label: 'parent-phone'
  },
  frontdeskParent: {
    loginId: env('FRONTDESK_PARENT_EMAIL', '0999999993'),
    password: env('FRONTDESK_PARENT_PASSWORD', 'password123'),
    label: 'frontdesk-parent'
  },
  firstLogin: env('FIRST_LOGIN_LOGIN_ID')
    ? {
        loginId: env('FIRST_LOGIN_LOGIN_ID'),
        password: env('FIRST_LOGIN_PASSWORD'),
        label: 'first-login'
      }
    : undefined
};

export const appNames: AppNames = {
  childDisplayName: env('CHILD_DISPLAY_NAME', '阿古'),
  frontdeskExistingChildName: env('FRONTDESK_EXISTING_CHILD_NAME', '阿古'),
  aiChildDisplayName: env('AI_CHILD_DISPLAY_NAME', 'test')
};

export const appAssets: AppAssets = {
  avatarPath: resolveAssetPath(process.env.CHILD_AVATAR_PATH) || path.resolve(process.cwd(), 'fixtures/files/sample-avatar.svg'),
  mediaVideoPath: resolveAssetPath(process.env.MEDIA_VIDEO_PATH)
};
