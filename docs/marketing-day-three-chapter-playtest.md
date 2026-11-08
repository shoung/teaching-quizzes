# 行銷遊戲三章試玩紀錄

日期：2026-11-08。僅行銷遊戲；Ego Lite任務空間11。

## 新增第三章前的完整試玩

正式版基準提交 `4590fca`，桌面1561×944，所有對話均直接點3D人物啟動，未用E/G或紅色對話按鈕替代。

- 第一章：六位次同事（美玲、子安、小晴、阿哲、阿哲、美玲）→對話→單選→角色回應→結算；100分、六題最高參考分、三面向均100。未選時確認不可用。[結果截圖](previews/marketing-three-chapters/ch1-desktop-result.png)。
- 第二章：五輪林老闆NPC對話，各六段說明及五次追問；問滿後未問題不可再問。筆記、加入／移回卡片、空白不可提交、更換主方案保留理由都可操作。五輪提交24項正確選擇，S級100分，誤選0、漏選0。老闆、專家及逐輪解析可切換。[結果截圖](previews/marketing-three-chapters/ch2-desktop-result.png)。
- 長筆記第一次自動點返回時Ego的定位捲動逾時；截圖及DOM確認按鈕在可捲到底的位置，明確捲動後可正常操作，無遊戲功能修正。後續試玩先捲到目標再以原生輸入操作。

## 手機觸控範圍

使用Ego內Chromium裝置模擬390×844，mobile true、deviceScaleFactor2、maxTouchPoints1。透過原生CDP touchStart/touchEnd，接觸半徑8px；觀測到canvas pointerup為`pointerType: touch`且`isTrusted: true`。不是單純縮視窗後用滑鼠，也不是實體手機／iOS Safari的測試。

- 第一章：直接碰主管人物→自動走近→中央對話；選項與確認也用觸控完成並顯示回應。[觸控對話](previews/marketing-three-chapters/ch1-mobile-dialogue.png)。
- 第二章：直接碰林老闆人物→自動走近→中央對話。[觸控對話](previews/marketing-three-chapters/ch2-mobile-dialogue.png)。
- 自動化工具的裝置模擬只維持當次控制回合，因此每次手機回合重新套用並觀測innerWidth與maxTouchPoints，未將回到桌面尺寸的截圖誤記為手機證據。

第三章及整合後回歸結果在下方完成後補記。

第二章另已用純觸控完整跑完五輪、25次追問及全部複選，結算S級100分；390×844、maxTouchPoints1，文件無水平溢出。[手機結算](previews/marketing-three-chapters/ch2-mobile-result.png)。

第一章也已補做手機純觸控完整六情境到結算，100分／六題最高參考分；四種NPC均由場景人物觸碰開啟。390×844、maxTouchPoints1，文件無水平溢出。[手機結算](previews/marketing-three-chapters/ch1-mobile-result.png)。等待透明radio時改以DOM存在而非可見性判斷，並仍以原生touch點擊；沒有透過JavaScript改答案。

## 第三章與整合版本

- 第三章從三章入口直接開始，沒有先完成前兩章；五次以滑鼠點陳店長的3D人物開啟對話，逐段聽完、每輪五問、整理26張正確卡並提交。S級100分，誤選0、漏選0。[對話](previews/marketing-three-chapters/ch3-desktop-dialogue.png)／[結算](previews/marketing-three-chapters/ch3-desktop-result.png)。
- 主方案A/B/C切換保留支持理由；空白選擇無法提交；問滿五問所有追問按鈕停用。
- 本機Gemini審查95分，Luna總監審查無阻擋問題。[Gemini回覆與採納](marketing-day-ch3-gemini-review.md)／[總監審查](marketing-day-ch3-director-review.md)。
- 最終工作區 `npm test`：40檔246項通過。另以HEAD加本次12個行銷來源檔建立發布快照，排除其他遊戲尚未提交的變更；快照 `npm test`：39檔240項通過，`npm run build`成功。建置仍有原有Three.js分包大小提示，測試環境有既有HTMLMediaElement未實作訊息，均未造成失敗。
- 深度比對發布快照與工作區的12個行銷來源檔完全相同；第一章與第二章原資料檔沒有修改。實際部署仍以GitHub Actions和公開頁面確認為準。

第三章也已用390×844純觸控完整跑完五輪，五次直接碰陳店長人物、25次追問、26張正確卡及提交；可信touch事件共五次，結算S級100分，文件無水平溢出。[手機對話](previews/marketing-three-chapters/ch3-mobile-dialogue.png)／[手機結算](previews/marketing-three-chapters/ch3-mobile-result.png)。

最終發布快照另於5193靜態預覽完整複驗第二章：五次直接點林老闆、每輪六段說明及五次追問、24項正確選擇，結算仍S級100分，客戶回應仍屬轉角健身房，未混入第三章內容。這次複驗在共用引擎與畫面完成之後進行。

三章選單另檢查320px重排，三個選章按鈕仍存在且文件無水平溢出；200%根文字放大後仍可透過選單內捲動到達內容，無水平溢出。此項是局部操作驗證，不宣稱完成整站WCAG符合性稽核。

窄螢幕進一步保留第一／二／三章文字，隱藏重複阿拉伯數字以騰出閱讀寬度；320px重查三個入口均可見、無水平溢出。[選章截圖](previews/marketing-three-chapters/chapters-mobile.png)。此樣式修正後發布快照再驗證240項測試及建置皆通過。
