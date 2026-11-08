# 行銷第二章 Gemini 修稿 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this approved revision task-by-task.

**Goal:** 依 Gemini 審稿改寫第二章訪談與結算，驗證後推送 GitHub。

**Architecture:** 保留資料與純前端引擎結構。案例 v7 升為 v8，改寫角色台詞；結算以實際選擇對應服務影響，保留原計分。

**Tech Stack:** React、TypeScript、Vite、Vitest。

**Spec:** `docs/marketing-day-gemini-revision-guide.md`；使用者已明確要求開始修正並推送，沿用既有分支 `codex/marketing-day-ui`，不另開規劃核准流程；推送前核對遠端 main，以 fast-forward 更新正式分支，避免覆蓋其他已發布工作。

## Global Constraints

- 僅行銷遊戲第二章，不納入其他遊戲的工作檔。
- 繁體中文、健身房、月卡／年卡；自然、務實、合作的老闆口吻。
- 保留 ID、正確答案、選項順序、每輪最多五次追問及計分；不新增個資或存檔。
- 保留 12 名額、7 人預約、2 人未到；未到／離開原因未知。
- 保留小安 22 歲、大學生、兼職與空檔浮動，未體驗／未購卡；不推定性別、收入或裝置。
- 保留尖峰單人櫃檯與教練不能離課、A 可做而 B/C 人力時段未定、紙本待確認與恢復後核對。
- 中央彈窗、足夠情境篇幅、大字與既有操作不變。

## Review Focus

- 任意五問的回答仍對題，不新增錯誤選項的證據；人工核對 40 則回答。
- 結算不直接朗讀選項全名；依 A/B/C/未選與實際錯誤指出影響。
- 高分但方案選錯、低分但選對方案，評語不與實際提案矛盾。
- 五輪題數與正卡集合不變；版本更新，不接續舊版本 session。
- 工作區有其他遊戲的未提交內容；明列提交檔案，檢查 staged diff 與推送範圍。

### Task 1：角色訪談

**Files:** `src/data/marketing-detective.ts`；既有內容檢查 `src/data/marketing-detective.test.ts`。

- [x] Luna 重寫開場與 40 則回答，升 v8，不改選項判定或 ID。
- [x] Root 對照 v7 快照，核對數據、未知資訊、用語與每輪線索。
- [x] 執行資料測試，只有過度鎖定舊措辭的斷言才依語意調整。

### Task 2：結算講評

**Files:** `src/marketing-day/detective-engine.ts`、`src/marketing-day/detective-engine.test.ts`。

- [x] 補有意義的評語回歸測試：方案與資源、錯誤原因、漏選、完美結果。
- [x] Luna 改寫 bossComment/expertComment，以既有選擇決定具體反應，不改計分。
- [x] Root 核對所有評級與三方案樣本，執行引擎測試。

### Task 3：整體驗證與推送

- [x] 獨立 Luna 審稿；Root 處理具體問題並更新修訂記錄。
- [x] 再用同一 Gemini 模型評分；若低於 85 分，依使用者追加要求改由 Gemini 直接撰寫台詞，核對後放入，再驗證。
- [ ] `npm test`、`npm run build`、diff 檢查通過；只暫存行銷相關檔。
- [ ] 核對待推送提交歷史與遠端；建立提交並推送現有行銷分支。
- [ ] 以遠端 SHA 驗證推送；僅在實際 Actions 與公開頁均驗證時宣稱部署。
