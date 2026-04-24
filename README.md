# WETPAINT Compatibility Suite

## 這個 repo 做什麼
- 用 Playwright 做 SIT 相容性測試
- 主要看 RWD、mobile、tablet、media 互動
- 保留 trace、video、screenshot、HTML report 方便查問題

## 目錄
- `tests/compat`: 相容性測試
- `tests/smoke`: 最小 smoke
- `tests/workflow`: 流程驗證
- `tests/exploratory`: 探索或盤點用途

## 常用指令
- 全部測試: `npm test`
- 相容性: `npm run test:compat`
- Media: `npm run test:media`
- Smoke 快速版: `npm run test:smoke`
- Smoke 全平台: `npm run test:smoke:full`
- Workflow: `npm run test:workflow`
- 列出 compat: `npx playwright test --grep "@compat" --list`

## Projects
- `desktop-chrome`
- `desktop-firefox`
- `iphone-safari`
- `android-chrome`
- `ipad-safari`
- `ipad-chrome`

## 報告
- Playwright report: `npx playwright show-report reports/playwright-html`
- 相容性摘要: `npm run report:summary`

報告位置:
- `reports/playwright-html/index.html`
- `reports/playwright-results.json`
- `reports/compatibility-summary.html`

## 報告怎麼看
- `npm run test:smoke` 只跑 `desktop-chrome` 和 `android-chrome`
- `npm run test:smoke:full` 會跑 `desktop-chrome`、`iphone-safari`、`android-chrome`、`ipad-safari`、`ipad-chrome`
- `desktop-firefox` 目前保留在 config，但本機若被 Windows 應用程式控制原則封鎖，請改在其他環境執行
- 先看 `reports/compatibility-summary.html`
- 看 `Projects`: 哪個平台 fail 最多
- 看 `Feature Areas`: 哪個類別 fail 最多
- 看 `Tags`: 問題是不是集中在 `@mobile`、`@media`
- 再看 `reports/playwright-html/index.html`
- 看單支 test 的 fail 細節
- 看 trace、video、screenshot

## 什麼算 compat
建議留在 `tests/compat` 的內容:
- RWD / viewport 行為
- modal / drawer / scroll lock
- upload / preview / retry
- mobile 可點擊性
- 跨裝置導覽差異

不要放進 compat 主體的內容:
- onboarding 全流程
- 後台完整業務流程
- 純資料盤點
- exploratory 類工具測試

## Media 目前測什麼
檔案: `tests/compat/media-flow.spec.ts`

- 可進入 media / assessment 互動區
- upload control 可見且在 viewport 內
- 上傳後 preview / retry 可見且在 viewport 內

## 常見失敗判讀
- `about nav`: 多半是 About selector 或 UI 入口變了
- `frontdesk tab ...`: 多半是 mobile / tablet 導覽差異
- `dashboard nav`: 多半是後台桌機流程被拿去跑 mobile
- `browser has been closed`: 多半是 WebKit 或執行環境問題
