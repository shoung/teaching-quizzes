# 沙龍六場經營模擬 Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development. User explicitly approved execution and Luna delegation; proceed without another confirmation.

**Goal:** 交付保留原畫面、可試玩、跨六場累積資源的教學經營模擬。
**Architecture:** 純資料、可重播純函式引擎、React 全畫面場景分離，以 season-types.ts 作為唯一介面契約。舊 v2 題目引擎保留為歷史相容測試但不作為新版本執行路徑。新儲存鍵固定 v3，不覆寫 v2。
**Tech Stack:** React、TypeScript、Vite、Vitest、Ego Lite。
**Spec:** docs/paris-salon-season-spec.md

## Global Constraints
- 繁體中文，保留現有美術、場景、人物、音效、音樂與首頁分享。
- 六場、資源延續、自由組合，沒有單題正解分數。
- 導師路易斯；玩家克萊爾夫人。桌面對話及選擇，不做移動。
- 不改 marketing-day、不提交或部署、不開新工作樹；延續目前使用者授權中的工作區。
- 新狀態合約在 src/paris-salon/season-types.ts；不得擅改合約，向根代理提出必要修正。

## Review Focus
- 零現金與過度投資仍有低成本恢復路線（引擎）。
- 重複舉辦、重整、損壞存檔不可重複獲利（引擎＋整合）。
- 擴座與宣傳組合有過載與閒置風險（引擎＋企劃審查）。
- UI 能看懂下一步且沒有重回十二題測驗（介面＋整體品控）。
- 200% 文字放大時費用、確認與關閉按鈕不遺失（瀏覽器）。

## Tasks / ownership
- [x] Root：建立共用型別；分派三位 Luna、記錄決策與驗證；不碰他們正在修改的檔案。
- [x] Luna engine：新增 season-engine.ts 與測試；驗證資源、成本、留存、回復、兩種策略、六場、合法計畫與安全還原；先測失敗再實作。
- [x] Luna content：新增 src/data/paris-salon-season.ts 與測試；三受眾、三主題、三規模、11 可組合行動、六場市場、序章與路易斯指引、每項教學連結；不改舊題庫。
- [x] Luna UI：替換 SalonGame.tsx、新增 SeasonPanels.tsx/season.css 與新的整合測試；保留圖像聲音分享；移除／改寫舊 UI 流程測試；舊純資料引擎測試維持。與引擎、內容依共用合約整合。
- [x] Root：整合檢查、測試與 build、全六場本機試玩、不同策略與恢復、鍵盤與放大；更新現行 PRD/試玩紀錄。
- [x] Fresh Luna senior planning director：獨立審查整季模擬的體驗、教學因果、平衡與可理解性；書面 Critical/Important/Minor、證據與裁決；修正重要項後重審。
- [x] Root：完成驗證後保留本機試玩頁給使用者，明確說明沒有部署。

## Contract
見 src/paris-salon/season-types.ts，所有 exported function 簽章由該檔定義。metadata 的新版本由 Root 以新增 seasonGame 匯出及 Catalog/App 匯入替換，不修改 legacy salonGame.version，以免歷史測試被迫耦合。

## Decisions ledger
- 2026-11-08：沿用現有 checkout；使用者明確要求保留目前成果並繼續，避免工作樹遺漏尚未提交的美術。
- 2026-11-08：三個互不重疊的檔案所有權同步製作；共用合約先落地，整合後獨立總監審查。

- Content task review：完整性 6/6；根代理發現研究時點、留存分母與 STP 文案缺口後，內容代理已修正並重跑 6/6。
- Engine first review：修正安全接待與硬座位混淆、零效用擴座、熟客未增加需求、錯誤 canonical 路由、預測過於精確等問題，待完成後驗證。
- UI first review：要求留存分母一致、阻止無回饋的無效選擇、結果摘要與實際決策回顧，待完成後驗證。

- Engine task review：獨立 Luna 完成規則品控；三項 Important（贊助條件、實驗數據、季末導師優先序）與一項 Minor（重複情報行動效益揭露）均修正並複核通過。純引擎／內容／導師共 21 項通過。
- Native flow：Ego Lite TaskSpace 65，實際 click/selectOption 完成六場：17/23/26/32/32/32 人，季末資金 134、熟客 16、口碑 44、知名度 68、座位 32、培訓 3。未用腳本派送 DOM click。
- Whole project verification：2026-11-08 最新 npm test 28 檔 174 項通過，npm run build 通過，git diff --check 通過。JSDOM 對 HTMLMediaElement 的非實作提示為測試環境限制；音效 hook 另有測試，實際瀏覽器待最後音訊與無障礙檢查。
- Planning director review：發現預付款後餘額文案可能被當作活動後現金，已改「支出後現金（未計收入）」；收入規則在舉辦前可展開。200% 文字改用容器重排，季報按鈕改為自然排版，待最後驗收。

- Final review：資深遊戲企劃總監 Pass；收入文案、預估需求／硬容量／候補，以及第二場自動導師指引已修正並關閉所有原列項目。純引擎 12、UI flow 6 項含回歸；全專案最後確認 28 檔 178 項通過。
- Final accessibility：計畫、回顧、設定、分享、首頁與季報 axe WCAG tags 掃描均零違規；1280×720、200% 字級與文字間距覆寫時資料表可鍵盤捲動，季報按鈕不再遮表；圖像證據為 DOM 渲染，非原生截圖。
