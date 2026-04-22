# Selector Inventory

This repo only contains the Playwright suite. The product frontend should add these `data-testid` and `aria-label` contracts so the suite can stop relying on text and layout fallbacks.

## Phase 1 Required

- `login-username`
- `login-password`
- `login-submit`
- `login-toggle-password`
- `login-register-entry`
- `header-user-menu-trigger`
- `header-menu-dashboard`
- `header-menu-child-list`
- `header-menu-frontdesk`
- `mobile-hamburger-trigger`
- `frontdesk-child-drawer-trigger`
- `frontdesk-faq-link`
- `frontdesk-about-link`
- `frontdesk-tab-development`
- `frontdesk-tab-record`
- `frontdesk-tab-advice`
- `frontdesk-tab-profile`
- `child-form-dialog`
- `child-create-trigger`
- `child-name`
- `child-id`
- `child-birth-date`
- `assessment-start`
- `assessment-resume`
- `assessment-upload-video`
- `assessment-preview-video`
- `assessment-retry-video`

## Accessibility Contract

- Any icon-only control should expose an accessible name through `aria-label` or equivalent visible text.
- Mobile top-nav controls should not rely on bare clickable `img` tags.
- The mobile hamburger currently renders as a Heroicons `bars-3` SVG with path `M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5`; this should be replaced by `mobile-hamburger-trigger`.
- Navigation links for FAQ, About, admin shell, and frontdesk should keep stable accessible names across layouts.

## Auth

- `login-username`
- `login-password`
- `login-submit`
- `login-toggle-password`
- `login-register-entry`
- `login-forgot-password`
- `register-name`
- `register-email`
- `register-phone`
- `register-password`
- `register-confirm-password`
- `register-terms-checkbox`
- `register-submit`

## Shell / Navigation

- `header-user-menu-trigger`
- `header-menu-dashboard`
- `header-menu-child-list`
- `header-menu-question-manage`
- `header-menu-invite-manage`
- `header-menu-about`
- `header-menu-frontdesk`
- `mobile-hamburger-trigger`

## Child Profile

- `child-card`
- `child-card-name`
- `child-create-trigger`
- `child-edit-trigger`
- `child-form-dialog`
- `child-name`
- `child-id`
- `child-birth-city`
- `child-birth-district`
- `child-residence-city`
- `child-residence-district`
- `child-same-residence`
- `child-birth-date`
- `child-gender`
- `child-over37weeks`
- `child-due-date`
- `child-weight`
- `child-is-indigenous`
- `child-indigenous-type`
- `child-avatar-upload`
- `child-form-submit`

## Frontdesk / Tabs

- `frontdesk-child-drawer-trigger`
- `frontdesk-tab-development`
- `frontdesk-tab-record`
- `frontdesk-tab-advice`
- `frontdesk-tab-profile`
- `frontdesk-advice-latest`
- `frontdesk-advice-history`
- `frontdesk-seek-map`
- `frontdesk-faq-link`
- `frontdesk-about-link`

## Assessment / Media

- `assessment-start`
- `assessment-resume`
- `assessment-next`
- `assessment-complete`
- `assessment-upload-video`
- `assessment-preview-video`
- `assessment-retry-video`
- `assessment-result-page`

## RWD / Modal

- `modal-root`
- `modal-close`
- `pagination-next`
- `pagination-page-size`
- `filter-trigger`
- `filter-submit`
- `filter-reset`
