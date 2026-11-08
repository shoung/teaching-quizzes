# 教學測驗集 · 學習小測所

為教學而設計的測驗網站。目錄導引 → 專屬介紹頁 → 按開始 → 每頁一題 → 下一頁 → 完整前端結果與解析。

- 網站：<https://shoung.github.io/teaching-quizzes/>
- **色彩天賦測驗，給同學的獨立網址：<https://shoung.github.io/teaching-quizzes/#/quiz/chromatic-intuition/1>**
- **顧問入場闖關，給同學的獨立網址：<https://shoung.github.io/teaching-quizzes/#/quiz/ai-consulting/1>**
- 專案規則：[AGENTS.md](./AGENTS.md)

## 課堂快速分享

| 測驗 | 短網址 | QR code 原圖 |
| --- | --- | --- |
| 色彩天賦測驗 | <https://is.gd/HI9zQA> | [下載 PNG](./public/qr/chromatic-intuition.png) |
| 你離麥肯錫入職還差多遠？ | <https://is.gd/SpjRZt> | [下載 PNG](./public/qr/ai-consulting.png) |

兩份測驗的第一頁都是專屬 landing page，包含介紹、題數、時間與開始按鈕，按開始才進入題目；頁面內建短網址複製與 QR 圖片下載；頂部分享按鈕也會複製短網址。QR 圖片由本機產生並用獨立解碼器驗證，不依賴外部 QR 圖片服務。短網址預先建立及驗證重新導向，瀏覽測驗時不呼叫縮址 API。

## 開發

使用 Node.js 24 LTS（最低 22.12），React + TypeScript + Vite。

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## 首份測驗：色彩天賦測驗

沿用使用者指定的[公開範例](https://jsj.top/f/Fpa3XK)之 **28 道題目、2 道複選題與 68 張圖片**（包含封面）；移除姓名、Email、段落過場與行銷解鎖步驟。原始圖片以原始檔案位元組保存，畫面不套濾鏡、不裁切，可放大檢視。題目與選項以原順序呈現，簡體選項轉為繁體。

結果頁由本專案設計：總覽、四面向回饋、心境紀錄、練習建議、逐題筆記、列印與重測。11 道參考題等權計算「教學參考符合度」，複選完全符合且不多選才計入；17 道主觀偏好題只記錄感受。分數不代表常模百分位或天賦診斷。原站未公開的行銷結果沒有被擷取或推定為原始報告。

原始公開題目和圖片 URL 保存於 `sources/chromatic.json`，圖片對照在 `sources/chromatic-assets.json`；不包含提供連結中的存取權杖或原站帳號資料。`scripts/import-chromatic.py` 可重新下載原始圖片；來源若變更，請先審查差異。

## 第二份測驗：你離麥肯錫入職還差多遠？

為大二企業管理／行銷學生設計的 **28 道原創顧問入場闖關題**，題庫版本 3。以淺白的校園、店家、數字和面試小挑戰，測試拆題力（4 題）、數字感（5）、商業直覺（5）、AI 助攻（5）、找破綻（5）、說服力（4）。AI 是團隊日常使用的工具，並非整份測驗的唯一主題。

獨立視覺採奶油色、藍黃與粗描邊插畫：1 張入場主圖、5 張章節插畫，加上 8 組可重排的 HTML 圖解。五站依序是腦袋暖機室、數字不騙人、商業街頭戰、AI 隊友上線、最後一道門。原創圖存入 `public/images/ai-consulting/`，提示詞見 `docs/illustration-prompts.md`。

每題依判斷完整度給 0–3 分，合計滿分 84 再換算為 100；六軸各依自己的滿分換算。結果以入場券、技能徽章、雷達與分數表呈現，附五層企業任務練習方向、兩個升級任務和逐題解析。最高層需總分至少 85、AI 助攻至少 70、找破綻至少 75，其餘軸至少 60。

分級是自訂教學規則，不是官方招募或真實錄取資格判定。使用者已確認不需讀取無法存取的 Notion 課程頁。完整設計見 [顧問闖關設計](./docs/ai-consulting-design.md)。

## 題庫與頁面

```text
src/
  App.tsx                 路由、獨立進度與分享連結
  types.ts                Quiz、Question、Session 型別
  quiz-engine.ts          進度驗證與計分
  data/quizzes.ts         兩份正式題庫目錄
  data/chromatic.ts       色彩測驗資料、教學解析與面向
  data/consulting.ts      原創顧問入場闖關題庫及六面向
  consulting-engine.ts   分級選項計分、六面向與挑戰層級
  data/sharing.json       快取短網址、目的地與 QR 圖片
  components/Catalog.tsx  首頁目錄
  components/QuizLanding.tsx 專屬介紹與開始頁
  components/ChallengeVisual.tsx 題目圖解
  quiz-themes.css         各測驗介紹與闖關專用視覺
  components/QuizPage.tsx  一頁一題與圖片放大
  components/ResultPage.tsx 結果與逐題回顧
  components/ConsultingResult.tsx 顧問入場券與分級
  components/RadarChart.tsx 可存取的雷達圖
  components/ShareCard.tsx 介紹頁分享卡
public/images/chromatic/ 原始題目照片與色卡
public/qr/                本機產生的分享 QR 圖片
```

`#/quiz/<id>/1` 為獨立可分享介紹頁；`#/quiz/<id>/play/<題號>` 為答題步驟，`#/quiz/<id>/result` 為結果。Hash 路由支援 GitHub Pages 專案子路徑與直接重新整理。未答題無法跳題或提前查看結果。結果只在使用者瀏覽器產生。

各份測驗使用獨立的 localStorage 鍵 `learning-lab:quiz:<id>:v<version>`。關閉網頁、重整或回到介紹頁後可按「繼續測驗」；重測只清除該份測驗的答案。沒有後端、追蹤程式或個資表單。禁止瀏覽器儲存時，仍可在當前頁面完成測驗。

測驗子頁採完全獨立版型：頁首為該份測驗標題，題目、結果、頁首與頁腳都沒有目錄或首頁連結。只有主頁負責列出測驗，適合將單一測驗連結直接分享給學生。

## 閱讀與無障礙

依 WCAG 2.2 AA 檢查文字對比、鍵盤、縮放、重排、標籤與狀態訊息。本專案另採小字至少 1rem（預設 16px）、內文 1.125rem（18px）；這是本案閱讀規則，WCAG 並沒有統一最小字號。

雷達圖的文字數值以 HTML 圖例呈現，不會隨 SVG 縮成微小字。使用原生單選、複選、展開區塊及圖片對話框；換題時焦點會移至可見題目，初次載入不搶鍵盤焦點。測驗原圖不套用顏色濾鏡。

本次介紹與闖關回歸：[檢查報告](./docs/accessibility/adventure-report.md)。先前全站修正：[無障礙檢查報告](./docs/accessibility/2026-11-07-report.md)。自動化掃描不代表正式認證，螢幕閱讀器及色彩測驗替代教學仍需人工確認。

可在 Ego Lite 的同一個審查 TaskSpace 透過 `scripts/a11y/full-audit.ego.mjs` 的 `runAudit(task, repoAbsolutePath)` 重跑完整本機流程；此程式只重設 localhost 上的測試進度，拒絕對正式站重設資料。`scripts/a11y/inspect-page.mjs` 提供字級、對比、目標大小與版面量測。

## 新增測驗

1. 在 `src/data/quizzes.ts` 加入一個 `Quiz`，使用唯一 `id`、`version: 1`、標題、分類與題目。
2. 知識型單選題使用零起算的 `correctAnswer`；複選使用 `kind: 'multiple'` 與 `referenceAnswers`；偏好題使用 `reflection: true`。
3. 每題寫下 `explanation`。圖片放入 `public/images/<id>/`，路徑不以 `/` 開頭；共用元件會套用部署 base。
4. 對既有題目、選項或答案的修改必須遞增 `version`。
5. 執行測試與建置；新測驗會出現在目錄，並自動取得獨立網址。

色彩報告使用 `mode: 'assessment'`，AI 企劃使用 `mode: 'consulting'`。色彩的心境摘要與 AI 的分級規則各依對應題庫設計；新增其他評量應建立對應報告並明確分派，不直接套用既有報告。

短網址與 QR 資料可以使用 `node scripts/generate-sharing.mjs` 重新驗證並產生；已存在的縮址會重用。新增測驗時先擴充該腳本的測驗 ID，再產生分享資產。`npm test` 會將實際 PNG 解碼，驗證內容與分享目的地。

## GitHub Pages

`main` 推送後，`.github/workflows/pages.yml` 會使用 Node.js 24 安裝鎖定依賴，執行測試、型別檢查及正式建置，成功後部署 `dist`。Pull request 只驗證，不部署。Pages 的發布來源使用 **GitHub Actions**，流程依照 [GitHub 官方文件](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)設定。

本專案保留範例題目與圖片的來源資訊；原始素材的權利歸各自權利人所有。

## 第三個活動：行銷人的一天

第一章以原創 3D 行銷辦公室呈現新品上線日的六個決策，目標約十分鐘。WASD、方向鍵、畫面方向控制或點地板可走動，「帶我去」自動找當前同事；E／紅色按鈕可直接對話。人物對話與決策使用中央彈窗，名詞就地解釋並附完整圖鑑。

獨立入口 `#/quiz/marketing-day/1` 提供自由選章，不需要先通關第一章。第一章開始後使用 `#/quiz/marketing-day/play/1` 至 `play/6`，結案為 `result`。第二章「客戶來訪日」沿用辦公室走動與中央對話，直接入口為 `#/quiz/marketing-day/chapter-2/brief`。每輪先聽林老闆說明，從八種追問中最多問五次，再把判斷卡由左側候選池移到右側；五輪提案後顯示老闆滿意度、專家講評與逐輪證據解析。目標時間10–15分鐘，仍待學生試玩校正。遊戲特別採**無登入、無存檔**：只使用當次記憶體，重新整理、關閉或新分頁後重來，與原兩份測驗的自動存檔分開。

六題各 0–2 分，共 12 分換算為 100；策略與實驗、數據判讀、查證與協作各依 4 分滿分正規化。結案提供實際分數、三軸圖與分數表、六題回顧和練習建議。修改舊題前先確認，再清除後續答案；重玩不改動其他測驗進度。WebGL 失敗時仍可用文字完成。

正式資料在 `src/data/marketing-day.ts`，由 `src/data/quizzes.ts` 註冊；獨立引擎、場景與 UI 位於 `src/marketing-day/`。遊戲不加入既有測驗持久化迴圈。短址與 QR 已快取，學生載入時不呼叫縮址服務；正式網址須待發布後使用。

正式入口：[行銷人的一天](https://shoung.github.io/teaching-quizzes/#/quiz/marketing-day/1)，分享短網址為 [is.gd/7UAEhN](https://is.gd/7UAEhN)。操作、評分與驗證紀錄見[第一章試玩說明](./docs/marketing-day-playtest.md)及[第二章偵探玩法試玩](./docs/marketing-day-detective-playtest.md)。


## 第四個活動：沙龍夫人的經營筆記

玩家扮演約 1900 年巴黎的克萊爾夫人，以六場一季的經營模擬練習行銷與企管。選擇主受眾、主題與規模，再以四個準備時段自由組合研究、體驗、人手、設施與關係經營行動。現金、熟客、口碑、知名度與設施跨場延續；路易斯在前兩場引導，之後可點人物詢問。沒有逐題正解分數，季末以真實經營紀錄、趨勢與教學筆記回顧。

正式入口：[沙龍夫人的經營筆記](https://shoung.github.io/teaching-quizzes/#/quiz/paris-salon/1)，分享短網址為 [is.gd/4YcrCZ](https://is.gd/4YcrCZ)。兩款遊戲的 QR 圖片均預先產生於 `public/qr/`，不會在學生載入時呼叫縮址服務。

沙龍專注桌面操作，沿用原有插畫與音效；v3 進度使用獨立、版本化的本機儲存，儲存不可用時仍可在分頁中遊玩。實作與驗收見[六場規格](./docs/paris-salon-season-spec.md)、[試玩驗收](./docs/paris-salon-season-playtest.md)及[資深遊戲企劃總監複核](./docs/paris-salon-season-planning-review.md)。
