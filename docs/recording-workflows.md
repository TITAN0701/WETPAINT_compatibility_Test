# 錄製流程說明

## 先用哪一種

- `manual trace`：優先使用，適合真實錄影流程
- `codegen`：需要草稿測試碼時再用

這個專案的錄影功能建議先用 `manual trace`，因為系統是即時錄製，實際按鈕名稱和流程狀態可能和預設假設不同。

## 建議步驟

1. 先用目標裝置跑一次 `manual trace`
2. 手動走完整錄影流程
3. 結束後存下 `trace.zip`
4. 用 trace 確認真實按鈕、狀態、頁面切換
5. 如果需要，再用 `codegen` 錄一次拿草稿程式
6. 最後整理成正式的 Playwright 測試

## 建議錄哪些步驟

建議至少錄一段完整流程：

1. 進入錄影頁
2. 開始錄製
3. 停止錄製
4. 若支援，試一次重錄
5. 送出或進下一步
6. 確認成功頁或下一頁有出現

## Manual Trace

這是最接近真實流程的方式。

```bash
npm run manual:trace
npm run manual:trace:iphone
npm run manual:trace:android
npm run manual:trace:ipad
```

它會做的事：

- 開 headed browser
- 套用手機或平板 profile
- 啟動 Playwright tracing
- 讓你手動操作
- 你按下終端的 `Enter` 後，存出 `trace.zip`

Trace 輸出位置：

- `reports/manual-trace/trace-*.zip`

開啟 trace：

```bash
npx playwright show-trace "reports/manual-trace/trace-xxxxx.zip"
```

## Codegen

這是拿來產生 `.spec.ts` 草稿的方式。

```bash
npm run record:iphone
npm run record:android
npm run record:ipad
npm run record:random-mobile
```

它會做的事：

- 開啟 Playwright Inspector
- 套用指定的手機或平板 profile
- 把你的操作記成 `recordings/recorded-*.spec.ts`

## 裝置 Profile

- `iphone`：iPhone 13 / Safari
- `iphone14`：iPhone 14 Pro / Safari
- `android`：Pixel 7 / Chrome
- `pixel5`：Pixel 5 / Chrome
- `ipad-safari`：iPad Pro 11 / Safari
- `ipad-chrome`：iPad Pro 11 / Chrome
- `random-mobile`：從以上裝置中隨機選一種
