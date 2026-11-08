# 巴黎 1900 介面展示實作計畫

> **For agentic workers:** 僅執行本介面展示計畫，不實作遊戲邏輯。依已核准 PRD 與使用者本輪要求，直接在目前工作區製作隔離的展示頁；全部介面核准後才另排功能計畫。

**Goal:** 提供桌面／手機可檢視的第四子頁完整介面樣稿。

**Architecture:** 獨立 `salon-preview.html` 入口與 `src/paris-salon-preview/`，不修改正式 App、題庫或分享資料。React 只管理展示畫面、卡牌選中與示範面板切換；所有經費、進度與結果均為固定展示資料。

**Tech Stack:** 現有 React、TypeScript、Vite，獨立 CSS 與本地生成場景圖片，不加套件。

**Spec:** `docs/paris-salon-prd.md` 第 9 節。

## Global Constraints

- 本輪僅介面；無角色移動規則、計分、扣款、儲存、正式路由、縮址建立與部署。
- 繁體中文、小字至少 1rem、內文 1.125rem、手機 320px 重排；所有數據標示為展示資料。
- 本工作區有其他工作正在修改正式 App 與第三個遊戲，僅編輯本計畫列出的獨立檔案。

## Review Focus

- 手機與文字放大後長卡牌／對話不得遮住確認操作。
- 模態面板支援 Escape、焦點限制與關閉回復；畫面切換後焦點可預期。
- 分享樣稿不得冒充真實短網址或可掃描 QR。
- 結果明示展示分數，不將按鈕選擇算成真實能力或成果。
- 本地圖片失敗保留文字與展示畫面切換。

## Task 1：展示入口、場景與設計系統

**Files:** `salon-preview.html`、`src/paris-salon-preview/main.tsx`、`PreviewApp.tsx`、`preview.css`、`preview-data.ts`、`public/images/paris-salon/environment-sheet.png`。

- [x] 建立獨立入口、展示工具列與桌面／手機切換。
- [x] 製作四個場景、開場、HUD、目的地與對話樣稿。
- [x] 在瀏覽器檢查圖片與窄螢幕排版。

## Task 2：全部審核畫面

**Files:** `src/paris-salon-preview/PreviewPanels.tsx`、`PreviewApp.tsx`、`preview.css`。

- [x] 決策、資料、回饋、幕間、帳冊、手帳、分享、四種結果與異常展示。
- [x] 所有卡牌與結果採固定內容，人工切換展示狀態。
- [x] 驗證鍵盤、焦點、展示操作及 320px 重排，不增加遊戲功能測試。

## Task 3：交付桌面與手機畫面

**Files:** `docs/previews/paris-salon/README.md`、桌面／手機截圖與驗證紀錄。

- [x] 使用 Ego Lite 檢查主要畫面、四場景、四結局與異常狀態。
- [x] 執行 `npm test` 與 `npm run build`，另建置獨立展示入口；記錄其他工作造成的失敗，不改寫他人工作。
- [x] 交付預覽網址、桌面與手機截圖及尚待核准的介面範圍。

## 執行紀錄

- 2026-11-07：使用者核准 PRD，授權開始全部介面展示，保留功能開發核准關卡。
- 素材：使用內建 imagegen 生成四場景聯圖。聯圖只作裝飾背景分區顯示，非作答證據；不變更作答圖片。

- 介面交付：十三類畫面與人物總覽、四場景、四結局；人物與配色方向已獲肯定，全部介面仍待核准。
- 驗證：77 個狀態掃描及鍵盤驗證完成；原生截圖逾時，使用同一 Ego 分頁 DOM 轉繪交付。素材已改為使用者指定的 3–4 頭身手繪方向。
- 展示元件另拆 `PreviewPrimitives.tsx`，避免展示入口與面板互相匯入。
