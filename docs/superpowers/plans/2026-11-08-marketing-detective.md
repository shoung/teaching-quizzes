# 第二章偵探式提案遊戲 Implementation Plan

> **For agentic workers:** Use subagent-driven development for the independent case, engine and UI tasks, with root integration and one independent final review.

**Goal:** 按使用者具體重設，恢復第一章的3D移動與對話方式，將有限追問、雙池複選及最終老闆／專家評價接成可試玩流程。

**Architecture:** 案例資料、純函式引擎與角色介面分離。MarketingDayGame持有兩章各自的記憶體session；沿用單一音訊hook與OfficeScene。第二章沿用既有hash網址，新增安全的章內進度導正，不設前章解鎖。

**Tech Stack:** React + TypeScript + Vite、Three.js、HTML Drag and Drop、原生dialog、Vitest與Testing Library。

**Spec:** 使用者本輪偵探式玩法重設；`docs/marketing-day-chapter-2-prd.md`的新規格取代先前工作臺預覽。

## Global Constraints

- 繁體中文、同一3D辦公室與角色移動、G帶路／E互動／手機方向鍵、中央彈窗、簡潔大字。
- 第二章一位客戶「轉角動作室林老闆」，五輪：需求痛點、顧客樣貌、顧客旅程、服務方案、服務藍圖；目標10–15分鐘，沒有倒數。
- 每輪客戶先敘述，提供8種追問，最多詢問5種不同問題；重讀筆記、收合、切章與回看不補次數。
- 第一輪20個複選候選，其餘各至少16個；左線索池、右選擇池，可拖放，並有按鈕／鍵盤／觸控等價操作。
- 不即時揭答案；五輪提交後才評分。每輪20分，`max(0, round((正確命中數-錯選數)/本輪正確總數*20))`；漏選不得分、錯選扣分、全選不得高分。
- 分級S90、A75、B60、C40、D低於40。老闆與世界級行銷企劃專家均為虛構教學角色，評語依實際命中、漏選及錯選生成，不冒稱真人背書或即時AI。
- 保留AI三方案比較的故事素材；不串即時AI、不新增金鑰。自由偏好不當成客觀對錯，參考答案須有本案證據。
- 無登入、無存檔；兩章可隨意開始、切章不清掉本頁內的另一章進度。刷新清空。
- 不改第一章題目與評分、不改巴黎沙龍、不部署或提交混合工作區。

## Review Focus

- 第六次詢問、重複詢問、快速連點、關閉重開、切章，不得繞過5次上限。
- 追問上限內可取得必要證據；選項判分不能依未提供的猜測或審美偏好。
- 拖放和點擊效果一致，不重複加入；鍵盤加入後焦點不掉到body。
- 空白不能提交，未完成不得看結果；改前輪需確認且不退還提問額度，後輪答案失效規則清楚。
- 實際world未開窗能移動，開窗暫停；同一audio engine的腳步、點擊、靜音皆正常；320px/200%無功能遺失。

## Task 1：Luna案例資料

Create `src/data/marketing-detective.ts` (export `chapterTwoCase: DetectiveCase`) and content tests. Types已定義於`src/types.ts`。

- [x] 五輪各3段短敘述、8種問答，第一輪20選項其餘至少16，每項有correct/explanation/evidenceIds。
- [x] 每項證據引用`intro`或該輪question.id；全部ID唯一。每輪必要正確線索可由最多5種追問取得。
- [x] 提供三個AI示範服務方案、名詞、資料合成說明；正確答案依固定案例條件，有多個正確選項。

## Task 2：Luna純引擎

Create `src/marketing-day/detective-engine.ts` and tests, exporting:

- `newDetectiveSession(): DetectiveSession`
- `beginDetectiveSession(session): DetectiveSession`
- `currentDetectiveRound(session): number`
- `askDetectiveQuestion(session,index,questionId): DetectiveSession`
- `setDetectiveChoice(session,index,choiceId,selected:boolean): DetectiveSession`
- `commitDetectiveRound(session,index): DetectiveSession`
- `evaluateDetectiveSession(session): DetectiveResult|null`
- `detectiveViewForRound(index): PlanningPreviewView`
- `resolveDetectiveView(view:string,session): PlanningPreviewView`

Session/round/result欄位已在`src/types.ts`，資料import `chapterTwoCase`。

- [x] 先RED後GREEN測限額、重複／無效ID、未開始／未來輪、空白提交、完美100、全錯0、全選0、混合分、錯漏解析、未完結果null與損壞session安全。
- [x] 已提交早輪改選，提交時清後輪selectedIds/submittedIds，保留各輪askedIds；完成後只讀，要重玩明確重設該章。
- [x] 真實選擇導出分級、老闆滿意度與專家評語，至少引用具體命中／錯漏例子。

## Task 3：Luna偵探介面

Create `DetectiveChapter.tsx`、`DetectiveBoard.tsx`、`DetectiveResult.tsx`、`detective.css` and focused UI tests。先寫新檔，資料與引擎就緒後root才切換runtime並移除舊`ChapterTwoPreview`，避免施工期間破壞原入口。

Props: `{audio:ReturnType<typeof useGameSound>;session:DetectiveSession;onSessionChange:Dispatch<SetStateAction<DetectiveSession>>;view:string;onNavigate:(view:string)=>void;onChooseChapters:()=>void;onMovingChange:(moving:boolean)=>void;onPausedChange:(paused:boolean)=>void}`。

- [x] world比照第一章（OfficeScene targetName為林老闆，不再全程paused），主線靠走動／G／E開對話，不自動打開常駐工作臺。
- [x] client intro逐句、5次問答、已問disable／重讀筆記、收合保留狀態、推理雙池、逐輪提交、結算與重玩。
- [x] 雙池拖放／按鈕移動等價；候選不顯示correct，狀態即時回報，鍵盤移卡焦點有返回目標。
- [x] 原生dialog內有關閉／筆記／名詞／音訊等操作，不把需要點的控制放在inert區。
- [x] 結算分老闆反應／專家講評／逐輪對錯回顧，反映實際選擇。五輪分數表，必要時附無微字的雷達圖。
- [x] 新測試取代舊工作臺互動斷言，不保留假示範結果；移除runtime對舊PlanningPanels與planning-preview.css的依賴。

## Task 4：root整合及驗收

- [x] MarketingDayGame持有chapter2Session及chapter2Moving/chapter2Paused，傳入第二章，將實際移動與暫停接入同一audio hook。
- [x] 更新ChapterLobby標籤／第二章續玩與結果，不顯示通關鎖；修改chapter-navigation測試新world行為，保持跨章答案與追問記憶體。
- [x] 移除無使用的舊預覽元件／資料／CSS，文件標示被此重設取代。
- [x] npm test、npm run build、git diff --check、Ego Lite實際5輪、5次額度、拖放、複選、結果、選章、手機與鍵盤／axe。
- [x] 完成後Luna資深遊戲設計總監獨立審查案例可答性、教育性與角色玩法，修正重要問題後交本機試玩。

## 決策紀錄

- 最新使用者已指定完整新玩法及結算方式，本輪將這些指定互動做成可試玩重設，供其審核；未發布。
- 「下一輪也一樣」採每輪各5次，而非全章共5次；重讀不扣額度、重複問題不再消耗，也不給新線索。
- 參考答案以虛構案例證據為準；錯選扣分以防全選。這是本案教學分數，不宣稱真人客戶滿意度或真實工作能力。

## 完成紀錄

案例v6，五輪實際混合試玩61/B與手算一致；178項測試、TypeScript/Vite build、tracked diff check及marketing新增檔案空白/衝突檢查通過。320px/200%雙池與結果及手機世界操作已複驗；結果頁axe無違規。細節見`docs/marketing-day-detective-playtest.md`。本機試玩待使用者體驗回饋，未部署。
