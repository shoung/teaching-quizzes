# 《沙龍夫人的經營筆記》桌面沉浸版總監審查

日期：2026-11-08
裁定：**通過，可交付桌面教學遊戲試玩。** 本輪沒有尚未修正的 Critical 或 Important 問題。

## 審查範圍與證據

- 檢視 1440 × 900 主選單、沙龍／咖啡館遊戲場景、決策面板及結果頁 DOM 轉繪圖；Ego Lite 原生截圖持續逾時，因此畫面證據是從實際 DOM、計算樣式與本地圖片轉繪，並非原生截圖。
- 以 1280 × 720 檢查一般桌面版及 200% 根字級版。主選單的分享卡、公開 QR、URL、複製按鈕均完整可見；場景的任務卡、HUD、NPC、移動提示互不遮擋。
- 12 題標題下任務卡尺寸一致：200% 字級下 top=224、bottom=526.19；HUD bottom=170，移動提示 top=566。數值見 [world reflow 記錄](./previews/paris-salon/immersive-world-reflow.json)。
- 實際畫面已修正的四項問題：任務卡與 NPC 姓名牌重疊、閒置 NPC 顯示誤導的 `!`、分享卡本機 URL 與公開 QR 目標未區分、200% 字級時分享卡／場景任務卡裁切或壓住場景內容。這些都已由本次最後版畫面核對通過。

## Critical

無。

## Important

無。

## Minor 與驗證限制

- 我在 Ego Lite 對設定面板的「靜音／開啟聲音」兩向切換均確認 UI 反映正確；主代理的同頁音訊探針另確認無手勢時音訊未解鎖、第一次互動後音樂進入播放狀態、移動時合成音振盪器增加、靜音時音樂暫停且音效節點不再增加，解除靜音後恢復。**我沒有可用的聲音輸出，沒有實聽背景音樂或音效，因此不對主觀音色、混音或聽覺舒適度背書。**
- 音樂授權文件詳列曲目、演奏者、錄音來源及署名；Wikimedia Commons 的錄音頁將 Robin Alciatore 的錄音標示為 Public Domain，並收錄 Musopen 的禮貌署名請求。實際 UI 在「設定與操作」中提供曲名、演奏者、授權及來源連結。[Wikimedia Commons 錄音頁](https://commons.wikimedia.org/wiki/File:Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg)
- 我以本機 `pngjs` 讀取 QR、`jsqr` 解碼，確認 `public/qr/paris-salon.png`（480 × 480 RGBA）內容為 `https://is.gd/4YcrCZ`。公開短網址的 HTTP 301 及最後 GitHub Pages 200 由主代理於 2026-11-08 現場驗證，Location 指向 `https://shoung.github.io/teaching-quizzes/#/quiz/paris-salon/1`。新版尚未部署，該 200 僅代表目前正式站可到達，**不代表新版已上線**。
- DOM 轉繪不等於原生像素截圖；瀏覽器輸出設備也沒有提供主觀聽音條件。

## 品質判斷

- **視覺：** 3–4 頭身原創角色、插畫滿版舞台、墨綠／酒紅／古金配色一致。Logo 的 PNG 有真正 alpha（透明度範圍 0–255），主選單、角色與場景的視覺語言吻合。
- **操作與鍵盤：** 主要任務卡提供可直接開始交談的下一步；鍵盤方向鍵／WASD 移動、E 互動及點擊場景前往都有明示。設定、分享、決策及結果面板可鍵盤操作；Escape 關閉後焦點回到呼叫面板的按鈕，結果面板開啟時背景內容設為 inert。未選答案時不能提交、上一題保留答案、改選會重新推演等流程由遊戲測試覆蓋。
- **教學結果：** 結果頁清楚呈現經營數值、教學參考分數、答對題數、逐題解析、雷達圖及其數值表，並把虛構情境與計分規則說明清楚。200% 字級下結果內層可捲動，沒有水平溢出；分數資料與按鈕仍可到達。
- **互動完成度：** 主代理提供的成功路線結果為 12／12 題教學參考標準、100／100 分，畫面同時顯示到場、知名度、信任、接待及剩餘經費，不以單一總分掩蓋經營成果。
- **驗證：** 主代理回報本輪沙龍範圍 5 個檔案、33 項測試通過；全專案 111 項測試通過、最後一次 `npm run build` 成功。任務卡最終定位後，主選單與場景 axe 檢查均為 0 項；紀錄見 [最後版面掃描](./previews/paris-salon/immersive-final-layout.json)。本報告依主代理提供的驗證結果記錄，沒有自行重跑測試。

## 審查所用畫面

- [主選單 1440 × 900](./previews/paris-salon/immersive-title-dom.png)
- [主選單 200% 根字級](./previews/paris-salon/immersive-title-text200-dom.png)
- [遊戲場景 1440 × 900](./previews/paris-salon/immersive-world-dom.png)
- [遊戲場景 200% 根字級](./previews/paris-salon/immersive-world-text200-dom.png)
- [結果頁 1440 × 900](./previews/paris-salon/immersive-result-dom.png)
