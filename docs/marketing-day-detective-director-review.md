# 第二章偵探式提案遊戲｜資深遊戲設計總監審查

審查版本：案例 v6
日期：2026-11-08
範圍：PRD、實作計畫、案例資料、引擎、章節／雙池／結算元件、樣式與測試；未修改 source。

## 總評

**設計內容可進入本機試玩，這次 source review 沒有 Critical blocker，也沒有尚未解決的 Important blocker。** 五輪教學目標清楚，證據與推論有區分，第四輪現在要求選一項本週主方案並提供理由，第五輪明確承接既有核定體驗時段。結果也能引用實際選擇，並將老闆與專家標為虛構教學角色。

這是案例、互動程式與已有測試的靜態審查，不代表我親自完成五輪遊戲或學生試玩。已查看[3D辦公室預覽](/Users/macminix/Documents/Works/教學測驗集/docs/previews/marketing-detective-world.png)、[中央對話預覽](/Users/macminix/Documents/Works/教學測驗集/docs/previews/marketing-detective-interview.png)與最新[雙池預覽](/Users/macminix/Documents/Works/教學測驗集/docs/previews/marketing-detective-pools.png)。root 另回報 live QA 操作與音訊、axe 檢查，細節列於下方；這些是 root 的驗證結果，不是我親自操作所得。實際 10–15 分鐘時長與現場學生滿意度仍須試玩確認。

## Critical / Important blockers

- **Critical：無。**
- **Important：無未解項目。** v4 曾缺少第四輪主方案選擇與理由；v6 已以互斥主方案卡、理由卡及提交條件補齊。Blueprint 首句曾讓人不確定是否新增參觀班；v6 已明示沿用既有核定名額且不新增班次。

## 逐輪設計判斷

1. **需求與痛點 — 通過。** 20 張卡中有數種可由原話判斷的痛點，也有因果、樣本外推、價格歸因與營運假設等錯誤推論。資料測試指定 q2、q3、q4、q5 即可取得四個正項，符合每輪五問上限。參考：[案例資料](/Users/macminix/Documents/Works/教學測驗集/src/data/marketing-detective.ts:15)、[內容測試](/Users/macminix/Documents/Works/教學測驗集/src/data/marketing-detective.test.ts:4)。
2. **Persona — 通過。** 角色以「考慮體驗、尚未買月票的初訪者」為情境，列出具體資訊需求與報到痛點，保留年齡、性別、運動經驗與接待偏好為未知；「先看資訊再自行決定」則有明確引言支持。這比填入虛構人口特徵更適合教二年級學生辨認研究界線。[案例資料](/Users/macminix/Documents/Works/教學測驗集/src/data/marketing-detective.ts:59)
3. **Journey — 通過。** 正項涵蓋使用前資訊、使用中報到／尖峰服務，以及使用後方案比較和自願回饋；至少兩個痛點與兩個服務機會均有呈現，沒有把未知的流失原因或情緒當成事實。[案例資料](/Users/macminix/Documents/Works/教學測驗集/src/data/marketing-detective.ts:98)
4. **服務方案與 AI — v6 通過。** 玩家需選一張主方案卡並選至少一項理由；第四輪資料測試確認三張 A/B/C 主方案卡，A 為本週有條件可行方案，B/C 保留為未來可討論的創意，不被寫成普遍錯誤。AI 是草擬、分類和排程輔助，並保留人工覆核與安全界線。此前 v4 只讓玩家挑方案元素、沒有「選最佳方案＋理由」的步驟，屬規格落差；v6 案例與雙池互斥／提交條件已補上。[案例資料](/Users/macminix/Documents/Works/教學測驗集/src/data/marketing-detective.ts:139)、[雙池互動](/Users/macminix/Documents/Works/教學測驗集/src/marketing-day/DetectiveBoard.tsx:8)、[內容測試](/Users/macminix/Documents/Works/教學測驗集/src/data/marketing-detective.test.ts:82)
5. **服務藍圖 — 通過。** 正項涵蓋顧客行動、前台、後台、支援工具和異常人工補救。v6 開場特別寫明頁面接既有核定時段與名額、當週不新增參觀班，避免與前輪未核定新增排班互相矛盾。[案例資料](/Users/macminix/Documents/Works/教學測驗集/src/data/marketing-detective.ts:184)

## 評級與教學回饋

每輪 20 分的正規化計分、錯選扣分、漏選不加分與全選受罰都符合 PRD。結算顯示實際分級、命中／錯選／漏選與逐輪解析。老闆評語會帶出實選主方案及一項實際命中；專家評語會指出具體例子與分數最低的一輪，避免只有泛用鼓勵。虛構角色與模擬反應有清楚標示，沒有冒稱真實客戶或真人專家。[計分與評語](/Users/macminix/Documents/Works/教學測驗集/src/marketing-day/detective-engine.ts:152)、[結算介面](/Users/macminix/Documents/Works/教學測驗集/src/marketing-day/DetectiveResult.tsx:9)、[評分測試](/Users/macminix/Documents/Works/教學測驗集/src/marketing-day/detective-engine.test.ts:168)

## 重要改善建議（不阻擋本機試玩）

- **讓錯誤選項不容易靠語氣排除。** 需求輪仍有一串以「所有、已證明、足以、只」等絕對化措辭露餡的錯卡；雖然也有價格歸因、把名額數據當成成功證明、把詢問誤讀成抱怨等較有辨識價值的干擾，比例仍可再平衡。下一輪內容修訂可加入不帶絕對詞、但混淆「觀察到什麼」與「能推論什麼」的選項，避免學生只記住文字線索。[需求卡](/Users/macminix/Documents/Works/教學測驗集/src/data/marketing-detective.ts:34)
- **用試玩確認雙池閱讀負荷。** 桌面兩池各自捲動，手機改為上下排列且限制高度；在 16–20 張卡的情況下，請留意反覆切換內部捲動是否使學生忘記已選內容，及 320px 寬度時卡片與操作鈕是否仍容易閱讀。[樣式](/Users/macminix/Documents/Works/教學測驗集/src/marketing-day/detective.css:50)
- **驗證 10–15 分鐘目標。** 案例設定 12 分鐘，但 PRD 已正確把時長留作實作後驗證。先讓幾位目標年級學生各自完成並記錄實際時間和卡住點，再決定是否要縮短敘述或選項；不需先增加倒數或強迫跳題。[PRD](/Users/macminix/Documents/Works/教學測驗集/docs/marketing-day-chapter-2-prd.md:13)
- **保留 3D 場景的遊戲節奏。** 同一辦公室、移動、G 帶路、E 直接對話和中央彈窗，讓五輪題目仍位於同一客戶來訪情境。若試玩者覺得像重複做五次卡片題，可先用現有章節提示／音效加強每輪交付變化，不必新增頁式工作臺或另一套流程。[章節入口](/Users/macminix/Documents/Works/教學測驗集/src/marketing-day/DetectiveChapter.tsx:94)

## 證據界線

- **root 回報的 live QA：**WASD 移動角色、G 帶路後自動開訪談、E 直接互動皆已確認；音訊 fresh run 為一個 running `AudioContext` 及一個 loop MP3，world/modal 音量分別為 0.25／0.145，靜音與關閉音樂後保持靜音；沒有 storage writes；intro 與 board 的 axe 掃描未報違規。這些結果由 root 執行，本審查者未操作 Ego Lite。
- **執行時間限制：**root 在 Ego Lite 測得五個無動畫 requestAnimationFrame 共 4,022ms（約 1 FPS）；可能是瀏覽器背景節流，因此不當作遊戲 FPS 結論。這也不能代替學生完成五輪的 10–15 分鐘計時。
- **整局回饋檢查（root live QA）：**一局實際錯漏混合選擇得到 61 分 B，總計命中 19／誤選 4／漏選 5，各輪 10／16／13／10／12；老闆評語提及實選 B，專家回饋指出具體誤判及最低分輪。AI 筆記呈現三份草案；拖放改選 B 會移回 A 並保留三項理由；沒有 storage writes。這證明該次 QA 樣本的結果與選擇相符，不是學生滿意度或時長證據。
- 已閱讀案例資料及其內容測試；測試碼包含每輪正項可在五問內取得、選項數量、證據引用、三方案唯一正解、藍圖層次與評語對應實選等檢查。引擎測試亦覆蓋計分、重玩／回看與不同主方案的評語。[內容測試](/Users/macminix/Documents/Works/教學測驗集/src/data/marketing-detective.test.ts:47)、[引擎測試](/Users/macminix/Documents/Works/教學測驗集/src/marketing-day/detective-engine.test.ts:217)
- 我沒有在這次總監審查中重新執行測試或親自完成整段遊戲操作。預覽截圖有桌面辦公室、對話及雙池畫面，沒有結算或手機畫面；相關 mobile／結果頁即時複驗與 axe 結果已由 root 回報於下段。尚未確認的項目是目標年級完成五輪的實際時間與學生反應，需後續試玩補證。

## 整合後更新

最後一輪靜態檢查涵蓋 `DetectiveChapter.tsx`、`DetectiveResult.tsx`、`DetectiveBoard.tsx` 與 `detective.css`。**沒有新增 Important blocker。** 第二章現以自己的 HUD ref 與 `ResizeObserver` 設定手機主區域高度；手機主區域可捲動且底部控制採直向 flex。結果頁在手機隱藏寬表格，改用逐輪大字分數卡；桌面仍保留有 caption 的表格。工具面板間互切保留原返回面板，Esc 可退出 utility 面板；UI 測試新增「設定→操作說明→Esc」回歸案例。[章節高度與 utility 狀態](/Users/macminix/Documents/Works/教學測驗集/src/marketing-day/DetectiveChapter.tsx:22)、[結果卡片](/Users/macminix/Documents/Works/教學測驗集/src/marketing-day/DetectiveResult.tsx:17)、[手機樣式](/Users/macminix/Documents/Works/教學測驗集/src/marketing-day/detective.css:84)、[回歸測試](/Users/macminix/Documents/Works/教學測驗集/src/marketing-day/detective-ui.test.tsx:154)

root 已發現並修正先前 200% 手機結果表溢出與第二章錯量第一章 HUD 高度兩項問題，並完成以下複驗：320×740、root font 32px（200%）與 spacing override 下，結果區 clientWidth／scrollWidth 皆為 271px，文件寬 320px，五張等價分數卡可讀；結果頁 axe 以 WCAG 2／2.1／2.2 AA tags 掃描為 `violations: []`。world header 底部與 main 起點同為 317.375px；方向鍵位於 y=484.34–572.34 可實點，Tab 到「查看結算」後按 Enter 能開啟 61 分結果。曾遮住操作的 604px sticky 工具列已改為 static 並完成 live 複驗。移卡焦點改在 `selectedIds` 更新後由元件 root 聚焦，以避免受控資料較晚更新時失焦。root 回報 UI／parent 測試 13 項、full 測試 178 項／28 檔與 build 均通過。以上均為 root 執行的複驗，不是本審查者親自操作；時長與學生反應仍需目標年級試玩確認。
