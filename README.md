# 教學測驗集 · 學習小測所

為教學而設計的測驗網站。目錄導引 → 每頁一題 → 下一頁 → 完整前端結果與解析。

- 網站：<https://shoung.github.io/teaching-quizzes/>
- **色彩天賦測驗，給同學的獨立網址：<https://shoung.github.io/teaching-quizzes/#/quiz/chromatic-intuition/1>**
- 專案規則：[AGENTS.md](./AGENTS.md)

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

結果頁由本專案設計：總覽、四面向回饋、心境紀錄、練習建議、逐題筆記、列印與重測。15 道參考題等權計算「教學參考符合度」，複選完全符合且不多選才計入；13 道主觀偏好題只記錄感受。分數不代表常模百分位或天賦診斷。原站未公開的行銷結果沒有被擷取或推定為原始報告。

原始公開題目和圖片 URL 保存於 `sources/chromatic.json`，圖片對照在 `sources/chromatic-assets.json`；不包含提供連結中的存取權杖或原站帳號資料。`scripts/import-chromatic.py` 可重新下載原始圖片；來源若變更，請先審查差異。

## 題庫與頁面

```text
src/
  App.tsx                 路由、獨立進度與分享連結
  types.ts                Quiz、Question、Session 型別
  quiz-engine.ts          進度驗證與計分
  data/quizzes.ts         題庫目錄與知識型示範題
  data/chromatic.ts       色彩測驗資料、教學解析與面向
  components/Catalog.tsx  首頁目錄
  components/QuizPage.tsx  一頁一題與圖片放大
  components/ResultPage.tsx 結果與逐題回顧
public/images/chromatic/ 原始題目照片與色卡
```

`#/quiz/<id>/<題號>` 為獨立可分享子頁。Hash 路由支援 GitHub Pages 專案子路徑與直接重新整理。未答題無法跳題或提前查看結果。結果只在使用者瀏覽器產生。

各份測驗使用獨立的 localStorage 鍵 `learning-lab:quiz:<id>:v<version>`。關閉網頁、重整或回到目錄後可繼續；重測只清除該份測驗的答案。沒有後端、追蹤程式或個資表單。禁止瀏覽器儲存時，仍可在當前頁面完成測驗。

## 新增測驗

1. 在 `src/data/quizzes.ts` 加入一個 `Quiz`，使用唯一 `id`、`version: 1`、標題、分類與題目。
2. 知識型單選題使用零起算的 `correctAnswer`；複選使用 `kind: 'multiple'` 與 `referenceAnswers`；偏好題使用 `reflection: true`。
3. 每題寫下 `explanation`。圖片放入 `public/images/<id>/`，路徑不以 `/` 開頭；共用元件會套用部署 base。
4. 對既有題目、選項或答案的修改必須遞增 `version`。
5. 執行測試與建置；新測驗會出現在目錄，並自動取得獨立網址。

色彩專用結果中的四面向需使用 `dimension`。其心境摘要目前依色彩題庫設計；新增其他主題若需自訂評量報告，應建立對應結果元件並以測驗 ID 明確分派，不套用色彩報告。

## GitHub Pages

`main` 推送後，`.github/workflows/pages.yml` 會使用 Node.js 24 安裝鎖定依賴，執行測試、型別檢查及正式建置，成功後部署 `dist`。Pull request 只驗證，不部署。Pages 的發布來源使用 **GitHub Actions**，流程依照 [GitHub 官方文件](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)設定。

本專案保留範例題目與圖片的來源資訊；原始素材的權利歸各自權利人所有。
