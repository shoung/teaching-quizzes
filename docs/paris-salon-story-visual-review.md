# 《沙龍夫人的經營筆記》故事與對話改版：美術／介面總監驗收

日期：2026-11-08
狀態：**最終視覺通過，可交付桌面試玩。無尚未修正的 Critical 或 Important 問題。**

## 範圍

只審查本輪故事與對話改版的畫面及相關場景／人物呈現，不操作瀏覽器、不修改產品碼。檢視的 DOM 轉繪圖：

- [序章 1](./previews/paris-salon/story-prologue-1-dom.png)、[序章 2](./previews/paris-salon/story-prologue-2-dom.png)、[序章 3](./previews/paris-salon/story-prologue-3-dom.png)、[序章 4](./previews/paris-salon/story-prologue-4-dom.png)
- [遊戲場景](./previews/paris-salon/story-scene-dom.png)、[人物對話](./previews/paris-salon/story-dialogue-dom.png)、[選項決策](./previews/paris-salon/story-decision-dom.png)

這些圖是 Ego Lite 同頁的實際 DOM、計算樣式與本地素材轉繪，非原生瀏覽器截圖。

## Critical

無。

## Important

無。

## Minor：人物 sprite frame 邊緣混入相鄰人物像素（已修正）

初版在序章第 1 段克萊兒右手旁、場景中克萊兒身側，出現一小截不連續的黑色像素；序章第 3 段茱莉葉左右側也有相鄰像素殘片。這不是場景陰影：現用角色圖以六等分背景定位，素材 frame 邊界確實有相鄰人物伸入。相關實作位於 [PreviewPrimitives.tsx](../../src/paris-salon-preview/PreviewPrimitives.tsx#L23) 的 sprite 背景定位及 [game.css](../../src/paris-salon/game.css#L288) 的 frame clip。

已只對受影響的 frame 做水平 clip，沒有重畫或替換已核准人物素材：frame 0 右側 6%；frame 2 左側 7.5%、右側 10%。最後版序章及場景圖確認 stray pixels 消失，Claire、Juliette 輪廓與包飾完整，關閉此項。

## Minor：Q6 長狀態提示與頂部卷草距離（已修正）

Q6 狀態提示原先會進入頂部中央卷草的視覺區。最終畫面將提示排在標題後；Q6 的提示 top=178.84，裝飾 bottom=81，垂直間距約 97.8px，字句與裝飾不再碰撞。[Q6 畫面](./previews/paris-salon/story-context-6-dom.png)、[Q8 畫面](./previews/paris-salon/story-context-8-dom.png)、[幾何檢查](./previews/paris-salon/story-context-layout-proof.json)。關閉此項。

## 已通過的視覺面向

- 四段序章先介紹克萊兒、藝術之夜目標與資源限制，再引入未來手帳及訪談線索；信箋金框與卷草裝飾呼應巴黎沙龍設定，沒有壓住內容。
- 四張新場景採近景舞台構圖；3–4 頭身角色比例與家具尺度協調，人物腳底落在地板基線上。保留已核准角色、Logo 及綠酒紅金配色。
- 對話面板左側人物、右側引言、底部行動按鈕分區清楚，首要下一步明確。
- 決策面板先給客觀線索與判斷原則，再呈現各選項依據、取捨和成本。三欄文字清楚，裝飾邊框與卷草沒有干擾閱讀；教學內容能在當頁取得，不必另開面板才能作答。
- 本輪介面沒有恢復角色移動提示或多餘網站式資訊；場景的主要互動焦點是目前 NPC。

## 最終裁定

桌面故事／對話／決策的視覺與版面複核通過，適合交付試玩。序章 200% 版面已驗證可捲動，兩次 Tab 可聚焦到可見的「繼續故事」按鈕；決策面板 200% 版面已實際捲動至最後選項，末兩張卡成本皆完整位於 sticky 操作列上方。相關證據見 [序章 200% 畫面](./previews/paris-salon/story-prologue-text200-dom.png)、[200% 選項成本檢查](./previews/paris-salon/story-costs-text200-dom.png) 與 [sticky scroll 量測](./previews/paris-salon/story-sticky-scroll-proof.json)。主代理回報全 53 狀態 axe 無違規；全專案 136 項測試及 build 通過。這些自動驗證不替代本報告對人物構圖與裝飾遮擋的目視判斷。

鍵盤、完整玩法教學及實機路線由主代理與遊戲企劃總監驗收；本報告僅簽視覺／介面範圍。
