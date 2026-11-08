# 巴黎沙龍遊戲音訊

## 背景音樂

- 曲名：*Gymnopédies – la 1ére. lent et douloureux*（Gymnopédie No. 1）
- 作曲：Erik Satie（1888）
- 錄音／演奏：Robin Alciatore
- 本機檔案：`public/audio/paris-salon/background.ogg`（Ogg Vorbis，44.1 kHz、立體聲，約 3:04，3,696,351 bytes）
- 來源頁：[Wikimedia Commons 錄音頁](https://commons.wikimedia.org/wiki/File:Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg)
- 原始下載：[Wikimedia Commons 原始 Ogg](https://upload.wikimedia.org/wikipedia/commons/9/90/Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg)
- 授權：錄音頁標示 Robin Alciatore 釋出至 Public Domain，並引述 Musopen 可分享、編輯及用於作品的說明。Musopen 禮貌性請求在商業或衍生作品中提及 Musopen，並請勿直接販售該錄音；本教學遊戲遵循其署名請求。
- 授權說明：[Wikimedia Commons 錄音授權記錄](https://commons.wikimedia.org/wiki/File:Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg#Licensing)、[Musopen FAQ](https://musopen.org/faq/)
- 建議展示署名：**《Gymnopédie No. 1》— Erik Satie 作曲，Robin Alciatore 演奏；錄音來源 Musopen／Wikimedia Commons，Public Domain。**
- SHA-256：`419e37656856224227086df32d6d481a00a738961e08fca9f6147e472beea53e`

音樂不會在玩家第一次操作前自動播放；`useSalonAudio().unlock()` 由使用者手勢啟動音訊並播放一次解鎖點擊音。背景音樂循環播放，預設音量低於音效。靜音同時暫停背景音樂並停用音效；切到背景分頁時暫停音樂與 Web Audio。

## 程式生成的音效

點擊、移動、確認、翻頁、成功及錯誤音效由 Web Audio API 即時合成，不包含外部音效素材。玩家移動時每 190 ms 最多播放一個短音，避免逐影格觸發。瀏覽器不支援音訊或載入背景音樂失敗時仍可繼續遊戲。
