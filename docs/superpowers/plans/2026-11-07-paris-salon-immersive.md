# 巴黎沙龍・滿版遊戲與聲音改版

**授權**：使用者直接要求改版並明確指定多位 Luna 子代理，最後交由資深遊戲設計總監角色代理審查。沿用現有人物、配色與十二題規則，僅桌面。

## 交付規格

- 插圖滿版作舞台，主選單、任務、少量 HUD、工具及結果面板均疊在圖上；不保留網站式頁首、側欄、底列或頁腳。
- 刪除重複標題、儲存／隱私常駐說明及長篇非必要提示。保留決策證據、教學內容與必要的操作目標；其他資訊按需開啟。
- 新增真正透明 PNG 原創 Logo；主界面直接有分享連結／複製與真實 QR。
- Web Audio 生成 8-bit 點擊、腳步、翻頁、確認、成功與錯誤音效，移動節奏限流；第一次使用者互動解鎖，支援靜音及音量。
- 尋找授權清楚、免費可用的實際背景音樂錄音，下載本機循環播放，保留錄音授權與署名來源，置於設定／製作名單而非頁腳。
- 保留路由、答案、分數、改選重演、本機續玩、鍵盤與焦點管理。

## Luna 分工與檔案界線

1. `luna_immersive_ui`：`SalonGame.tsx`、`GamePanels.tsx`、`game.css` 與必要場景子元件；滿版構圖、浮動操作、精簡文字、接入聲音與 Logo。
2. `luna_audio_music`：`use-salon-audio.ts`、音效模組與測試、`public/audio/paris-salon/`、音樂授權文件；不改 UI。
3. `luna_logo`：`public/images/paris-salon/logo.png` 及美術紀錄；透過 imagegen 生成透明圖，核對中文字與 alpha。
4. 所有工作完成後：派新的 Luna 擔任資深遊戲設計總監，檢查實際桌面畫面、操作與聲音；重要問題須修正後才交付。

主代理負責需求邊界、共享契約、測試、整合審查與最後實際試玩。

## 共用契約

- Logo：`images/paris-salon/logo.png`，`alt="沙龍夫人的經營筆記"`。
- 聲音：`useSalonAudio(moving)` 回傳解鎖、靜音、音量、音樂就緒／錯誤、`unlock/toggleMute/setVolume/play`。
- 音效種類：`click | move | confirm | page | success | error`。
- 錄音：`audio/paris-salon/background.ogg`，音樂 credit 常數由 hook 模組輸出。
- 桌面舞台：`data-game-stage`，供實際 viewport 尺寸與溢出檢查。

## 驗證

- `npm test`、`npm run build`、Logo 真 alpha 與文字目視確認、錄音非 HTML 與授權來源確認。
- Ego Lite 驗證主界面、遊玩、決策、地圖／設定、結果的滿版構圖；保留前版原生截圖逾時時的 DOM 轉繪方式，清楚標示。
- 點擊與持續移動有音效；無手勢前不播放、靜音停止 BGM/SFX、隱藏分頁暫停、播放失敗不阻止遊玩。
- 最後提供新版本機試玩；本輪不部署或推送。
