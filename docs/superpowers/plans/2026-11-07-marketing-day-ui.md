# 行銷人的一天 3D 畫面與介面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. 本輪由目前代理執行，完成後獨立審查。

**Goal:** 提供可直接預覽的遊戲畫面，優先審核中央決策彈窗，不實作遊戲邏輯。

**Architecture:** 現有兩份測驗保持既有架構。新增延遲載入的獨立 3D 展示路由，以 Three.js 建立程序化低多邊形辦公室，以 React HTML 介面疊加少量 HUD 與中央模態視窗。展示內容與 UI 狀態獨立，不接題庫計分、存檔或劇情引擎。

**Tech Stack:** React、TypeScript、Vite、Three.js、Vitest、Ego Lite。

**Spec:** `docs/marketing-day-prd.md`；使用者補充：畫面更貼近遊戲、資訊簡潔、字體夠大、避免網頁感。

## Global Constraints

- 只製作階段 1；不做遊戲狀態機、計分、正式存檔與分享服務。
- 以 `#/quiz/marketing-day/1` 作為展示入口，其他遊戲題號安全回入口。
- 不要求登入、不讀寫本遊戲的瀏覽器儲存，不影響原兩份測驗。
- 暗色 HTML 控制＋3D 斜俯視場景，內文至少 1.125rem、輔助文字至少 1rem。
- 同時僅一個主要面板，背景操作在模態視窗開啟時停用；所有決策居中。
- 保留目前工作目錄與未提交 PRD，不部署、不推送。

## Review Focus

- 延遲載入時先顯示可讀載入狀態，錯誤也有文字備援。
- 彈窗 Tab 焦點不能逃到背景；Escape 收合後焦點返回啟動控制。
- 手機 320px、200% 文字與長內容不能裁掉選項或確認按鈕。
- 審稿切換只改展示視窗，不暗中產生答案或結果。
- 既有目錄、兩份測驗與各自進度不能受第三入口影響。

## Task 1: 獨立展示入口

**Files:** `src/App.tsx`、`src/components/Catalog.tsx`、`src/data/quizzes.ts`、`src/types.ts`、`src/marketing-day/MarketingDayPreview.tsx`。

**Interfaces:** 匯出 `marketingDayPreview` 的目錄資訊；正式 `quizzes` 仍只含現有可作答題庫；`MarketingDayPreview` 為無 props 的預設匯出元件。

- [x] 用獨立路由分派遊戲樣稿，避免套用測驗外框與儲存。
- [x] 第三卡片標示「畫面預覽」、6 個情境與約 10 分鐘，支援搜尋分類。
- [x] 執行既有測驗與目錄回歸，檢查不出現首頁連結。

## Task 2: 3D 辦公室與精簡 HUD

**Files:** `src/marketing-day/OfficeScene.tsx`、`src/marketing-day/build-office.ts`、`src/marketing-day/marketing-day.css`。

**Interfaces:** `OfficeScene({ dimmed?: boolean })`；場景無答題或移動遊戲狀態。

- [x] 使用原創模型程序建立地板、牆、工作桌、顯示器、會議桌、看板、植物與五個方塊人物。
- [x] 斜俯視鏡頭、柔和光影、場景標籤，保留足夠視野與走道。
- [x] 上方一列時間／標題／圖鑑；下方一條當前任務與紅色互動按鈕。
- [x] 場景按需渲染、ResizeObserver 響應、完整清理幾何與材質；失敗顯示文字備援。

## Task 3: 中央決策與審稿狀態

**Files:** `src/marketing-day/PreviewDialog.tsx`、`src/marketing-day/preview-content.ts`、`src/marketing-day/MarketingDayPreview.tsx`、`src/marketing-day/marketing-day.css`。

**Interfaces:** 中央面板 `PreviewDialog({ titleId, onClose, children, className? })`；展示狀態不與正式事件路由連動。

- [x] 原生 dialog、模態焦點、收合與焦點返回；單選選中與無選擇不可確認。
- [x] 入口、辦公室、對話、決策、回饋、圖鑑、結案、載入與備援可由收合的審稿選單查看。
- [x] 術語在原面板內展開；證據按需展開，避免一次顯示大量資訊。
- [x] 展示結案明列固定範例，不根據選擇計算；分享面板說明正式短址與 QR 尚未啟用。

## Task 4: 驗證與預覽交付

**Files:** `docs/marketing-day-ui-preview.md`；必要時修正前述檔案。

- [x] 用 Ego Lite 檢查實際 3D Canvas、中央彈窗位置與全套展示狀態。
- [x] 檢查鍵盤、手機重排、文字放大與長內容；修正後重新檢查。
- [x] 執行 `npm test`、`npm run build`，確認原功能通過。
- [x] 獨立審查實作邊界與資源清理，修正重要問題。
- [x] 保留本機預覽伺服器與樣稿分頁，交給使用者審畫面；不發布正式站。

## 執行紀錄

- 基線：6 份測試檔、46 個測試通過。
- 參考補證：成功擷取原站 3D Canvas，確認方塊人物、場景內標籤、斜俯視與低多邊形風格。
- 本輪屬介面樣稿，採瀏覽器畫面與互動檢查驗證，不新增鏡像實作的單元測試。既有正式流程測試保留執行。

- 完成：階段 1 實作與審稿入口；48 個測試、正式建置與瀏覽器 UI 檢查通過。
- 審查修正：模組錯誤邊界、200% 字級 HUD 分列、陰影 render target 清理、圖鑑分類同步。
- 記錄：工作目錄有其他聊天的同步修改，保留其內容；共享路由僅加入 marketing-day 分派。
- 下一步：等待使用者審核畫面，尚未啟動階段 2。
