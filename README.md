# Playwright 相容性測試

這個專案用來驗證 WETPAINT SIT 環境的相容性、RWD 與主要前後台流程。

## 你先看這裡

1. 安裝套件：`npm install`
2. 安裝 Playwright 瀏覽器：`npm run pw:install`
3. 複製 `.env.example` 為 `.env`
4. 先檢查環境：`npm run env:check`
5. 跑基本測試：`npm run test:baseline:report`

## 常用指令

日常檢查：

```bash
npm run env:check
npm run test:baseline:report
npm run report:assert-signal
```

Smoke：

```bash
npm run test:smoke
npm run test:smoke:all-projects
```

功能分類：

```bash
npm run test:compat
npm run test:compat:readonly
npm run test:compat:stateful
npm run test:frontdesk
npm run test:admin
npm run test:shared
npm run test:rwd
npm run test:media
```

手機與平板：

```bash
npm run test:mobile:ios
npm run test:mobile:android
npm run test:mobile:all
npm run test:tablet:ipad16plus
```

需要會改動資料的流程：

```bash
npm run env:check:strict
npm run test:compat:stateful
```

產生摘要：

```bash
npm run report:summary
```

## 測試標籤

- `@smoke`：快速健康檢查
- `@compat`：相容性測試
- `@readonly`：不應改動 SIT 資料
- `@stateful`：可能建立或修改資料
- `@frontdesk`：前台功能
- `@admin`：後台功能
- `@shared`：登入、註冊等共用流程
- `@rwd`：版型與響應式檢查
- `@media`：媒體或錄影流程
- `@mobile`：手機流程

## 測試裝置

- `desktop-chrome`
- `iphone-safari`
- `android-chrome`
- `ipad-safari`
- `ipad-chrome`

補充：

- `macOS Safari` 不在這台 Windows 主機上自動化。
- `iphone-safari` 使用 Playwright 的 `iPhone 14 Pro` 裝置描述。
- `android-chrome` 使用 Playwright 的 `Pixel 7` 裝置描述。
- `ipad-safari`、`ipad-chrome` 使用 Playwright 的 `iPad (gen 11)` 裝置描述。

## 報表輸出

- `reports/compatibility-summary.html`
- `reports/playwright-html/index.html`
- `reports/playwright-results.json`
- `reports/artifacts/`

補充：

- `test:baseline` 只跑 `desktop-chrome`、`iphone-safari`、`android-chrome`、`ipad-safari`
- `report:assert-signal` 會檢查結果是否不全是 skipped
- `compatibility-summary.html` 會內嵌測試截圖

## 錄製與 Trace

產生錄製草稿：

```bash
npm run record:iphone
npm run record:ios16plus
npm run record:android
npm run record:ipad
npm run record:ipad16plus
npm run record:random-mobile
```

手動 trace：

```bash
npm run manual:trace
npm run manual:trace:iphone
npm run manual:trace:ios16plus
npm run manual:trace:android
npm run manual:trace:ipad
npm run manual:trace:ipad16plus
```

開啟 trace：

```bash
npx playwright show-trace "reports/manual-trace/trace-xxxxx.zip"
```

相關環境變數：

- `PW_RECORD_URL`
- `PW_MANUAL_TRACE_URL`
- `PW_MANUAL_TRACE_SLOWMO_MS`

## 目錄

- `src/pages`：page object 與流程 helper
- `src/fixtures`：共用測試資料
- `src/helpers`：環境與 locator 工具
- `tests/smoke`：smoke 測試
- `tests/compat`：相容性與 RWD 測試
- `docs/selector-inventory.md`：前端需補的 selector / accessibility 契約

## 契約說明

這個 repo 只有測試程式，沒有產品前端原始碼。若要提升 selector 穩定性，請在產品前端補上 `docs/selector-inventory.md` 內列出的 `data-testid` 與 accessible name。

目前前台測試以 read-only 為主：

- 註冊頁只驗證欄位可輸入，不實際送出
- 孩童建立流程只驗證表單與頭像選取，不實際送出

## 編碼規範

- 專案統一使用 `UTF-8`
- `.ts`、`.js`、`.mjs`、`.json`、`.md`、`.env*` 一律使用 `UTF-8`
- 若檔案已亂碼，修正時請以 `UTF-8` 重新存檔
- 從外部貼入中文後，提交前先確認沒有亂碼
