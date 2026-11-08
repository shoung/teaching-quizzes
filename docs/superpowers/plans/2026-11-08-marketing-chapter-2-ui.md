# 第二章畫面與自由選章 Implementation Plan

> 歷史計畫：工作臺方向已被使用者本輪指定的 [偵探式玩法計畫](./2026-11-08-marketing-detective.md) 取代。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 提供第二章可點擊畫面預覽，第一、二章皆可直接選擇開始，不設定通關解鎖。

**Architecture:** 延用現有 MarketingDayGame 作章節容器，保留第一章記憶體 session；第二章以獨立預覽元件顯示五個規劃階段、委託與示範提案冊。共用既有 3D 場景、中央 dialog 與同一音訊 hook，資料與畫面分離。

**Tech Stack:** React、TypeScript、Vite、Three.js、Vitest、Testing Library。

**Spec:** `docs/marketing-day-chapter-2-prd.md`、`docs/marketing-day-chapter-2-cases.md`，以及最新使用者指示「任意選章，不需前章過關」。

## Global Constraints

- 繁體中文；每章一客戶，第二章規劃時長10–15分鐘，預覽不冒稱完成遊戲邏輯。
- 本輪執行畫面階段，使用者審核畫面後才串正式遊戲功能；不計分、不建立真實AI呼叫。
- 保留原3D辦公室、簡潔大字、中央彈窗；資料、詞彙與設定按需展開。
- 無登入、不存檔，不新增localStorage/sessionStorage/Cookie寫入。
- 第一章全部既有路徑與計分保留；章節入口固定為 `#/quiz/marketing-day/1`。
- 第二章直接網址 `#/quiz/marketing-day/chapter-2/brief`；畫面view為 brief/research/persona/journey/ideas/blueprint/review。
- 不改巴黎沙龍與其他測驗，不部署、不提交共用工作區的未相關變更。

## Review Focus

- 新分頁直接開第二章不受第一章session或結果影響。
- 切到第二章再回第一章，當前記憶體答案仍存在；重新整理安全重啟。
- 第二章每次聚焦一項任務；旅程與藍圖不靠縮小表格塞滿螢幕。
- 預覽、合成資料與AI示範標示清楚，不生成假分數或假客戶滿意度。
- 320px、200%字級、鍵盤與中央dialog焦點、音訊及模組失敗備援可用。

## Task 1：章節選擇畫面（Luna）

**Files:** `src/marketing-day/ChapterLobby.tsx`、`chapter-lobby.css`、`chapter-lobby.test.tsx`。

**Interface:** default component props `{ firstStarted:boolean; firstCompleted:boolean; onStartFirst:()=>void; onStartSecond:()=>void; onShare:()=>void; onRestartFirst:()=>void }`。

- [x] 測試兩章入口不需完成狀態即啟用；第一章保留「開始上班／繼續今天／查看當日回顧」標籤，第二章「開始第二章」。章節入口測試3/3通過。
- [x] 實作以既有遊戲入口風格為基礎的章節選擇；只兩章，不顯示未開發章節。
- [x] 原生按鈕、可鍵盤操作；第二章標示畫面預覽、不需解鎖與10–15分鐘。

## Task 2：第二章五步互動畫面（Luna）

**Files:** `src/data/marketing-planning-preview.ts`、`src/marketing-day/ChapterTwoPreview.tsx`、`PlanningPanels.tsx`、`planning-preview.css`；必要時拆分小型面板元件。

**Interface:** default component props `{ audio:ReturnType<typeof useGameSound>; view:string; onNavigate:(view:string)=>void; onChooseChapters:()=>void }`。

- [x] 依案例建立教學合成素材；章節名稱「從客戶問題到服務提案」，客戶「轉角動作室」。
- [x] 製作委託、追問與證據卡、Persona素材、三階段旅程、三方案比較、四層藍圖與示範提案冊。
- [x] 每次顯示一張主要卡片，可切換、勾選與改寫；前後畫面不設正式遊戲驗證或分數。
- [x] 以暫存介面狀態展示操作；AI始終標示示範草稿；review標示示範內容。
- [x] 沿用OfficeScene與PreviewDialog，提供名詞解釋、音量／靜音及回章節入口。只使用父層傳入audio，不建立第二個音訊引擎。

## Task 3：章節容器與相容性（root）

**Files:** `MarketingDayGame.tsx`、`chapter-navigation.test.tsx`、`src/types.ts`（新增規劃view型別，如需）、PRD與預覽說明文件。

- [x] 先測新session直接進第二章、選章不查第一章完成、切章回第一章保留答案；看見測試失敗後接入。
- [x] 在既有component內保留第一章session，第二章路徑略過第一章canonical redirect；切章停止moving。
- [x] 介紹頁使用ChapterLobby；第一章HUD中央選章dialog；第二章以回章節入口選擇任意章。
- [x] 保留第一章原路徑與開始按鈕、重玩、分享；無效第二章view回brief。

## Task 4：整合驗收與交付（root，Luna複核）

- [x] `npm test`131項／23檔、`npm run build`、`git diff --check`通過。
- [x] Ego Lite實測未玩第一章即可進第二章、全部預覽畫面、切章保留第一章草稿、名詞／音量、手機與200%重排、axe與鍵盤。
- [x] Luna以遊戲設計總監視角完成來源審查；焦點返回缺陷先RED後GREEN並經實際瀏覽器確認，另收斂資訊重複。
- [x] 保留本機第二章桌面預覽並提供自由選章入口，清楚停在畫面審核階段；未部署。

## 決策紀錄

- 使用者「開始製作」認可前輪內容方向；依最初分階段約定，本輪先做畫面與介面，不重問內容審核，也不提前製作完整遊戲邏輯。
- AI方式尚未選定不阻擋畫面：此輪只呈現有標示的示範草稿，不以此代替未獲同意的即時AI功能。
- 沿用目前共用checkout，保留其他聊天的巴黎沙龍工作，不建立新worktree或改動其內容。
- root已先執行 `chapter-navigation.test.tsx`，3個測試因原版沒有第二章與選章入口而失敗（RED），再接入容器；最終包含無效階段及返回焦點的4個測試通過（GREEN）。
- 章節容器繼續使用同一MarketingDayGame函式元件，所以第一章session/drafts與單一audio hook不會在切章時重建。第二章的第一章canonical redirect略過，hud observer以secondChapter為依賴並容許null ref。
- 原生dialog隔離外部控制，因此選章、靜音與可展開音量均放在第二章dialog內。來源卡瀏覽與引用分開，研究與藍圖各採小任務切換。
- 原生瀏覽器截圖逾時，檢查圖由實際DOM/CSS/Three.js畫布產生並明示來源；互動、鍵盤及掃描仍由Ego實際頁面驗證。
