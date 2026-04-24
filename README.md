# WETPAINT Compatibility Suite

## 這個 repo 做什麼

- Playwright 相容性測試
- RWD / mobile / tablet 檢查
- media upload / preview / retry 檢查

不是以完整 SIT 業務流程為主。

## 目錄

- `tests/compat`：主要 compat 測試
- `tests/smoke`：最小存活檢查
- `tests/workflow`：業務流程驗證
- `tests/exploratory`：探索 / 盤點用途

## 常用指令

- 全部測試：`npm test`
- 相容性：`npm run test:compat`
- media：`npm run test:media`
- smoke：`npm run test:smoke`
- workflow：`npm run test:workflow`
- 列出 compat：`npx playwright test --grep "@compat" --list`

## Project

- `desktop-chrome`
- `iphone-safari`
- `android-chrome`
- `ipad-safari`
- `ipad-chrome`

## 報告

- Playwright report：`npx playwright show-report reports/playwright-html`
- 相容性摘要：`npm run report:summary`

檔案位置：

- `reports/playwright-html/index.html`
- `reports/playwright-results.json`
- `reports/compatibility-summary.html`

## 報告怎麼看

先看 `reports/compatibility-summary.html`：

- `Projects`：哪個平台 fail 最多
- `Feature Areas`：哪個類別 fail 最多
- `Tags`：問題是否集中在 `@mobile`、`@media`

再看 `reports/playwright-html/index.html`：

- 單支 test fail 細節
- trace
- video
- screenshot

## 什麼算 compat

保留在 `tests/compat`：

- 小螢幕按鈕是否可點
- modal / drawer 背景是否鎖定
- upload control 是否可見
- preview / retry 是否出現
- 表單欄位在 mobile 是否被遮住

不要當主要 compat 覆蓋：

- 完整 onboarding 流程
- 後台整段導覽流程
- 前台 tab 全流程切換
- exploratory / 盤點腳本

## media 目前測什麼

`tests/compat/media-flow.spec.ts`

- 可進入題目或上傳互動區
- upload control 可見且位於 viewport 內
- 上傳後 preview / retry 可見且位於 viewport 內

## 常見失敗判讀

- `about nav` 找不到：先查 `About` selector 或 UI 入口
- `frontdesk tab ... advice` 找不到：多半是 mobile / tablet 入口不同
- `dashboard nav` 找不到：多半是 workflow 不適合跑在 mobile / tablet
- `browser has been closed`：多半是 WebKit / 執行環境問題
