# 第一章對白與 NPC 點擊互動 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this approved request.

**Goal:** 以 Gemini 審查並潤飾第一章，保留行銷術語與教學事實；修好兩章直接點目前 NPC 即能走近對話的操作。

**Architecture:** 第一章資料仍放 `src/data/marketing-day.ts`，不改選項ID、順序、分數或專有名詞圖鑑。共用3D場景在地板移動之前辨識角色命中，沿用導航和對話回呼。

**Tech Stack:** React、TypeScript、Vite、Three.js、Vitest；本機 Antigravity `agy` 與 Gemini。

**Spec:** 本session使用者最新要求；沿用既有行銷分支與已授權的完成後GitHub發布流程。

## Global Constraints

- 只修改行銷遊戲，其他遊戲的未追蹤檔保留。
- 繁體中文、自然與淺白；TA、KPI、CTR、CVR、Landing Page、USP、CTA、A/B Test、UTM、ROAS及其定義不改。
- 六個決策、角色職務、數字與產品規格、選項ID和0–2分參考分不變；變更第一章文字時升版。
- 無登入、無存檔；保留角色移動、大字、中央彈窗及快捷鍵。
- 第一章用相同五項權重由Gemini審查；未達85時採Gemini直接改寫，再核對語意。
- 點擊目前NPC後自動走近並開對話，不能誤開其他NPC的對白，彈窗中不穿透操作場景。

## Review Focus

- 角色回應不能冒用旁白或把選錯說成已成功；專業名詞標記仍可點擊。
- CTR 5%、CVR 1%、A/B的2.5/3.0 ROAS和小樣本限制不可改。
- 不把同日測試結果寫成確定因果或統計顯著；防潑水/一年有限保固不可變成防水/終身保固。
- Raycast需命中角色子mesh，地板仍可點；非目前NPC、遮擋、pause與連點都要檢查。
- 兩章共用場景，須實際在第一章與林老闆場景以滑鼠點人物驗證。

### Task 1：對白審查與修稿

- Luna準備第一章人物／硬性事實清單；Root用本機Gemini審稿。
- 視評分採Gemini成品或依直接改句潤飾，升版本；保留題目與教學邏輯。
- 再送Gemini核對，回覆真實分數與人工限制，不預設通過。

### Task 2：NPC 點擊修復

- Luna調查pointerup至導航／互動回呼，先加失敗回歸測試。
- 最小修復NPC命中與導航後開窗，保留移動／E／G與音效。
- Root在Ego Lite重現舊版，再驗證修後兩章、地板、非當前角色與彈窗鎖定。

### Task 3：整體驗證與交付

- 獨立審查改動；執行完整 `npm test`、`npm run build` 與diff範圍檢查。
- 沿用本session授權，只提交行銷相關變更並推送，查Actions與公開頁面後再回報發布。
