# 沙龍 RPG 卡牌回合 Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development. 使用者已明確列出改動並要求實作；沿用既有 Luna 分工方式，不重複要求批准。

**Goal:** 完成 NPC 情報、三行打字機、卡牌手牌、舉辦演出與 PDCA 的六回合經營遊戲。
**Architecture:** `season-engine` 管狀態和資源，`paris-salon-rpg` 管場景及說話，三個獨立互動元件由主控制器整合；保留全部圖像。
**Tech Stack:** React、TypeScript、Vite、Vitest、Web Audio、Ego Lite。
**Spec:** docs/paris-salon-rpg-rounds-spec.md

## Global Constraints
- 繁體中文、桌面、保留現有美術；導師稱「露易斯夫人」。
- 本輪只改沙龍，不修改行銷遊戲、不提交／推送／部署。
- v4新儲存鍵；舊v3保留；六回合、存檔不重複結算。
- 檔案所有權互不重疊，先依共用rpg-types契約實作，不自行改其他代理檔案。

## Review Focus
- 缺席NPC與未聽市場資訊不可直接從計畫全文洩漏；先聽一位非導師才可舉辦。
- 打字機點擊只完成當頁，不連跳；長句不能用裁切偽裝三行。
- 卡牌搬移後保留焦點，僅hover的內容也必須能用鍵盤讀；超額不得搬移或扣款。
- 舉辦演出期間重新整理／略過不得重複資源交易。
- 知名度50基準不讓開局必定爆量；必須有正成長與負變化的真實路線。

## Tasks
- [x] Root：共用介面、音量診斷與修正、主控制器、HUD、PDCA面板及整合測試。
- [x] Luna engine：v4 heard/endingSeen/聽消息閘門、知名度新模型、儲存／路由／恢復及平衡測試。只改 season-types/engine/engine.test 與導師helper必要更新。
- [x] Luna story：新資料 paris-salon-rpg.ts/.test，六組場上NPC、每人多頁口語稿、開場結語、HUD提示、結算聲音（文案）。
- [x] Luna components：RpgDialogue、SalonCardHand、HostingSequence 各自CSS及互動測試，介面在rpg-types.ts。
- [x] Root/Luna visual：引擎或內容完成後，空出席位製作世界與新規劃版面CSS，與元件CSS分工。
- [x] Root：整合完整六回合、鍵盤／放大、音量訊號與無障礙、npm test/build。
- [x] Fresh Luna senior game planning director：獨立檢查回合清晰度、有限情報、PDCA、卡牌、經濟與演出；重要問題修正再複核。
- [x] Root：保留本機新一季試玩頁並回報；不自動更新正式網站。

## Contract and ownership
`src/paris-salon/rpg-types.ts` 為資料／元件約定。引擎公開 heardSeasonNpc、canPlanSeason、completeSeasonEnding（具體簽章見契約）；主控制器負責呼叫。所有事件仍從 plans 重播，不信任已存資產。

## Ledger
- 沿用目前已發布版本的 checkout（fdc63f3）；僅改沙龍，發布需另外明確指示。
- 每回合導師加兩位同伴，完成一位非導師對話即可計畫，其他情報可自行探索；這是依使用者回合順序所作的實作選擇。
