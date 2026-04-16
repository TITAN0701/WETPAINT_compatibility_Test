# Playwright 相容性測試

這個專案是 WETPAINT SIT 環境的 Playwright 相容性與 RWD 測試專案。

## 測試分類

- `@smoke`：核心流程快速回歸，例如登入、切角色、前台入口、AI 題組入口
- `@compat`：功能與裝置相容性檢查
- `@rwd`：版型與響應式行為檢查
- `@media`：媒體或錄影流程相關檢查
- `@mobile`：手機流程

## 測試裝置

- `desktop-chrome`
- `iphone-safari`
- `android-chrome`
- `ipad-safari`
- `ipad-chrome`

`macOS Safari` 目前不在這台 Windows 主機上自動化，需另用 macOS runner 或手測補上。

## 安裝

1. 安裝套件

```bash
npm install
```

2. 安裝 Playwright 瀏覽器

```bash
npm run pw:install
```

3. 複製 `.env.example` 成 `.env`，再填入測試帳號或環境設定

## 執行測試

```bash
npm run test:smoke
npm run test:compat
npm run test:rwd
npm run test:media
```

執行完要產生摘要：

```bash
npm run report:summary
```

輸出位置：

- `reports/generated/compatibility-summary.json`
- `reports/generated/compatibility-summary.md`
- `reports/generated/compatibility-matrix.csv`

## 錄製與 Trace

這個專案支援兩種錄製方式，和你之前桌面 `Playwright Trace Viewer` 的用法相同。

1. `codegen`
說明：
你手動操作，Playwright 幫你產生 `.spec.ts` 草稿

2. `manual trace`
說明：
你手動操作，Playwright 幫你保留 `trace.zip`，之後可用 Trace Viewer 回看

### 即時錄影流程建議順序

如果系統是「即時錄製後送出」，不是選檔上傳，建議這樣做：

1. 先跑 `manual trace`
2. 手動走一次真實錄影流程
3. 看 `trace.zip`，確認實際按鈕名稱與頁面切換
4. 需要草稿時再跑 `codegen`
5. 最後再整理成正式 Playwright 測試

簡單記：

- 要看真實流程：先用 `manual trace`
- 要產生草稿程式：再用 `codegen`

### Codegen 錄製

```bash
npm run record:iphone
npm run record:android
npm run record:ipad
npm run record:random-mobile
```

- 輸出到 `recordings/`
- 預設入口是 `<PW_BASE_URL>/login`
- 若要指定完整網址，可用 `PW_RECORD_URL`

### Manual Trace

```bash
npm run manual:trace
npm run manual:trace:iphone
npm run manual:trace:android
npm run manual:trace:ipad
```

- 會開啟 headed browser
- 會套用手機或平板 profile
- 你可以手動操作整段流程
- 操作完成後回到終端按 `Enter`
- Trace 會存到 `reports/manual-trace/trace-*.zip`

開啟 trace：

```bash
npx playwright show-trace "reports/manual-trace/trace-xxxxx.zip"
```

可用環境變數：

- `PW_RECORD_URL`：`codegen` 使用的完整網址
- `PW_MANUAL_TRACE_URL`：`manual trace` 使用的完整網址
- `PW_MANUAL_TRACE_SLOWMO_MS`：手動 trace 時的慢速模式

## 目錄說明

- `src/pages`：page object 與流程 helper
- `src/fixtures`：共用測試資料
- `src/helpers`：環境與 locator 工具
- `tests/smoke`：smoke 測試
- `tests/compat`：相容性與 RWD 測試
- `docs/selector-inventory.md`：建議前端補的 `data-testid` 清單
