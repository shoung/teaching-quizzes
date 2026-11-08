# 行銷人的一天 完整單章 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans，沿用目前 checkout，依序實作並以獨立審查收尾。

**Goal:** 在已核准 3D 與中央彈窗中完成可試玩的六決策、名詞教學、回饋、結案及重玩。

**Architecture:** 正式章節資料放 `src/data/marketing-day.ts`，從 `src/data/quizzes.ts` 匯出註冊，與其他測驗的持久化引擎隔離。純函式引擎處理當次答案、跳題保護、回看重算與三面向計分；React 管理只存在記憶體的 session、草稿及模態狀態。Three.js 場景接上移動、目標互動與暫停，文字備援能完成同一流程。

**Tech Stack:** React、TypeScript、Vite、Three.js、Vitest、Testing Library、Ego Lite、qrcode/jsQR。

**Spec:** `docs/marketing-day-prd.md`；已核准畫面見 `docs/marketing-day-ui-preview.md`。2026-11-07 使用者已授權開始遊戲邏輯並要求完成後試玩。

## Global Constraints

- 簡潔大字、每次僅一個主要面板，所有決策仍在中央模態彈窗。
- 六題單選，各三選項、0–2 分，共 12 分；三面向各兩題，各依 4 分滿分正規化。
- 不登入、不存檔、不讀取／寫入本遊戲 localStorage、sessionStorage、Cookie 或後端；不改寫另兩份測驗進度。
- 現行專案路由為 `#/quiz/marketing-day/1`（介紹）、`play/1`–`play/6` 與 `result`；舊規劃數字子頁導向對應題目，重新載入無進度則回介紹。
- 主頁第三入口改為正式遊戲；移除審稿捷徑與固定範例成績；不部署正式站。
- 分享只含固定介紹網址，短址預建快取、QR 本機產生並實際解碼驗證。

## Review Focus

- 較早答案修改後必須清除後續答案與完成狀態；取消修改則完全保留。
- 未選不能確認、未答不能跳題、未完成不能讀結果；非法路由與重整安全回入口。
- 模態開啟時移動與快捷鍵暫停；查名詞、關閉彈窗不丟失草稿。
- WebGL／chunk 失敗仍可用 HTML 完成六題；動態文字不得被 320px 或 200% 字級裁掉。
- 分享不帶答案；重玩、儲存遭封鎖及離開重開不影響其他測驗。

## Task 1: 正式資料與純函式引擎

**Files:** `src/types.ts`、`src/data/marketing-day.ts`、`src/data/quizzes.ts`、`src/marketing-day/game-engine.ts`、`src/marketing-day/game-engine.test.ts`。

**Interfaces:** `newMarketingSession()`；`submitMarketingDecision(session,index,optionId)`；`completeMarketingDay(session)`；`getMarketingResult(session)`；`resolveMarketingRoute(hash,session)`。回傳新 session，不突變參數。

- [x] 寫測試並確認失敗：全對 100／全零 0／部分得分、面向各滿分 4、未完結無結果、非法選項與跳題拒絕。
- [x] 六個情境正式資料與 18 則回饋、10 個術語；每題 ID 唯一，每個選項附理由。
- [x] 提交重複選項不重複加分；改早題清後題；計分只由答案推導。
- [x] 測試重整 session 不恢復、後續網址重導、非法／超大題號與完成規則。

## Task 2: 場景移動與互動

**Files:** `src/marketing-day/navigation.ts`、對應測試、`build-office.ts`、`OfficeScene.tsx`。

**Interfaces:** `planWalk(start,end)`、`isWalkable(point)`；場景 handle 提供 `goToTarget()`、`step(direction)`；props 提供 `paused`、`npcId`、`onInteract`。

- [x] 測試路徑不穿桌椅、拒絕邊界外點及可達四個目標。
- [x] 接上 WASD／方向鍵／點地板、畫面方向控制、G 自動走近與 E 互動。
- [x] 只在移動時排 animation frame；關模態後可繼續，失焦清按鍵，清理事件與 GPU 資源。

## Task 3: 中央答題流程與結果

**Files:** `src/marketing-day/MarketingDayGame.tsx`、`GameUi.tsx`、`GamePanels.tsx`、`GameResult.tsx`、`game-flow.test.tsx`、既有 dialog／boundary／CSS；`src/App.tsx`、`Catalog.tsx`。

**Interfaces:** UI 草稿不提交前不影響 session；引擎是唯一分數來源；路由題號決定當前事件。

- [x] 先寫整合測試並確認失敗：完整六題、上一題保留、改選確認與取消、查詞不遺失、重玩清空、不寫儲存。
- [x] 開場 → 場景 → 人物對話 → 單選 → 實際回饋 → 下一頁／查看結果。
- [x] 關閉後可繼續當前決策／回饋，返回先前題目不擅自覆寫後續答案。
- [x] 結案顯示真實得分、最高參考分題數、三軸圖及表、六題回顧、兩項練習與重玩。
- [x] 文中虛線名詞就地解釋；圖鑑所有名詞均可閱讀；保留焦點與大字規格。

## Task 4: 分享、驗證與試玩交付

**Files:** `src/data/sharing.json`、`scripts/generate-sharing.mjs`、`public/qr/marketing-day.png`、驗證文件。

- [x] 快取第三短址、驗證真實重新導向、本機產 QR 並以 jsQR 解碼；入口與結果可複製固定介紹連結。
- [x] `npm test` 與 `npm run build`；原有測驗回歸。
- [x] Ego Lite 走完六題，測試草稿／前後頁／重整／重玩／備援／鍵盤／手機與 200% 字級。
- [x] 獨立審查並修正重要問題，保留本機試玩入口；不推送、不部署。

## 執行紀錄

- 基線：48 個測試、正式建置通過。延續 `codex/marketing-day-ui`，保留未提交畫面與其他聊天檔案。
- 決策：現行 AGENTS 已採 introduction + play 路由，故保留既有介紹網址，使用 play/1–6 作正式決策。

- 完成：正式六題、18 則分級回饋、10 個名詞、真實結案、回看重算、重玩與本機試玩。
- 驗證：84 個全專案測試與正式建置通過；真實 3D 六題混合選擇得到 50 分，文字備援可得 100 分。
- 審查裁定：兩項 Minor 均修正，桌角尋路增加失敗後通過的回歸案例，手機方向控制保留。
- 瀏覽器裁定：320px / 200% 文字下結果與決策無水平溢出；Tab、Escape、草稿、重整與無存檔完成實測。
- 範圍：本輪未部署；三位初學者的實際時長留給試玩回饋，不以開發者快轉操作宣稱完成時長驗證。
