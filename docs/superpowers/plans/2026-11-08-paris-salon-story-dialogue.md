# 沙龍夫人：故事與對話式決策改版

> **For agentic workers:** 使用已授權的 Luna 分工執行；主代理整合驗證，總監獨立審查。

**Goal:** 玩家先理解身分與目的，再點 NPC 依據線索做決策並理解後果；移除沒有意義的移動。

**Architecture:** 沿用 React/TypeScript/Vite、十二題與原本計分重演引擎。新增分段開場與精簡教學呈現資料，第一次開始先看故事、最後才 startSalon。當前題目決定場景與 NPC，角色固定於場景；信箋／邀請函造型承載對話、證據與選項。

**Spec:** 使用者 2026-11-08 本輪的五項直接修正要求，沿用已核准人物、Logo、首頁與配色。

## Global Constraints

- 桌面版、繁體中文；不部署、不推送、不碰正在由其他聊天修改的 marketing-day。
- 保留原人物與配色；四個背景重新按 3–4 頭身人物的舞台比例生成獨立 16:9 圖，不再使用四格場景拼圖。
- 移除 WASD／方向鍵／E、地板點擊移動、地圖傳送與移動提示；點 NPC 為主要互動，Tab／Enter 等標準鍵盤仍可用。
- 第一輪無跳過開場；玩家控制逐段前進、可返回，不用自動播放或強制等候。已開始可續玩，重玩重設故事。
- 每次決策直接提供必要線索、短觀念與選項依據；完整解析仍保留於結果，長說明放按需閱讀的帳冊／手帳。
- 不以裝飾圖取代文字資訊；裝飾以 aria-hidden 原創 SVG／CSS 金色卷草、花飾、信封與火漆構成。
- 調整題目呈現版本為 v2，儲存鍵跟隨題庫版本，舊 v1 不會被改寫。
- 最後三題依時間排序：當晚贊助變更（salon-11）、隔天回訪（salon-10）、結案（salon-12）。保留穩定題目／選項ID與效果，避免玩家先回訪再無提示地倒回活動中。

## Tasks / Ownership

1. Luna 教學敘事：新增 `src/data/paris-salon-story.ts` 與資料測試，四段開場、12 題精簡線索／觀念，以及每個選項的依據、取捨、選後教學。不改計分與 canonical 題目 ID。
2. Luna 場景：產生 `public/images/paris-salon/scenes-v3/{salon,study,print,cafe}.png`，以既有人物作風格和比例參考；人物腳底約畫面88%、全高約36vh，背景門高約52%、椅背到地約26%、桌面到地約16%；中央與兩個站位留空，不畫人物。
3. Luna 介面：`SalonGame.tsx`、`GamePanels.tsx`、`game.css` 與必要子元件；新增逐段開場，移除移動／地圖，當題NPC點擊對話；裝飾式短對話與行動卡，接入新呈現資料及新背景。更新既有 UI 測試以實際完成開場並點 NPC。
4. 主代理：資料型別／v2儲存鍵、引擎版本測試、新故事與無移動回歸測試、整合、桌面實玩與 axe；最後交由總監 Luna 審查。

## Shared Contract

- `salonPrologue`: 四個 `{ id, title, speaker, text, npc, place }`；逐段 `text` 至多兩個短句。
- `salonDecisionBriefs`: 以 decision.id 為鍵；`setup`、`objective`、`clues[{label,text}]`（2–3項）、`principle{title,text}`、`options[option.id]{basis,tradeoff,outcome,lesson}`。
- UI 繼續使用原 `q.options` ID、cost、是否足夠經費；不提前顯示教學分數或最佳解標記。
- `sceneImages`: 介面可使用 `images/paris-salon/scenes-v3/<place>.png`；先有資產再驗收，不用程式畫背景代替正式插圖。

## Review Focus / Verification

- [x] 首次按開始先看故事，沒有題目選項；逐段可前後、結束才進NPC場景。
- [x] 不靠開另一個視窗就能看到做判斷的關鍵證據；每個選項都能回扣資料、觀念與取捨。
- [x] NPC 可直接點擊及鍵盤啟動；地板/方向鍵不改人物位置，不再展示移動說明。
- [x] 未選不能確認、上一頁答案保留、改選重演、重測與損壞儲存安全，v1紀錄不被重用／覆寫。
- [x] 1440×900、1280×720、200%文字：面板、按鈕、線索完整可達，裝飾不壓字，人物與家具同尺度。
- [x] `npm test`、`npm run build`、實際12題路線、axe與鍵盤測試，總監無未修Important後提供本機試玩。

## 完成證據

沙龍7檔46項／全專案23檔136項測試通過，build與diff-check通過。完整53狀態及修正後兩條路線、200%內捲與鍵盤控制、候補及開場人數實機紀錄見 `docs/paris-salon-playtest.md`。本輪另有獨立資深遊戲企劃總監與美術／介面總監兩份正式通過報告；未部署／未推送。
