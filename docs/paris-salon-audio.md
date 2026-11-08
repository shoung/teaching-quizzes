# 巴黎沙龍遊戲音訊

## 目前背景音樂（2026-11-08 更換）

- 曲名：蕭邦《降 G 大調圓舞曲，Op. 70 No. 1》（Waltz in G-flat major）。
- 作曲：Frédéric Chopin；鋼琴演奏：Olga Gurevich。
- 來源：Musopen／IMSLP，經 Wikimedia Commons 提供。
- [錄音來源與授權頁](https://commons.wikimedia.org/wiki/File:Chopin_Waltz_Op._70_no._1_in_G_flat_major_Olga_Gurevich.mp3)；[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。Commons 原始頁的 Author 欄明列 Olga Gurevich, piano，Permission 欄為 CC-BY-4.0；這是本次實際下載錄音的授權，沒有只憑作曲年代判斷。
- [原始 MP3](https://upload.wikimedia.org/wikipedia/commons/4/4c/Chopin_Waltz_Op._70_no._1_in_G_flat_major_Olga_Gurevich.mp3)，100.867 秒，2,340,352 bytes。
- 遊戲檔案：`public/audio/paris-salon/chopin-waltz-op70-no1.mp3`。未加速、未改旋律，僅統一響度並轉為 44.1 kHz／192 kbps MP3；檔名更新以避免沿用舊曲快取。
- 成品響度：-18.44 LUFS，true peak -2.24 dBTP。保留原有音量滑桿、靜音與背景暫停；預設滑桿 0.75、音樂倍率 0.8。
- 遊戲設定頁顯示曲名、作曲與演奏者、來源、授權連結及「已調整播放響度」。MP3 亦保留對應署名及修改說明。
- 原檔 SHA-256：`28b8c77da4ca9827b51218162b08a137d086810cb665a83325b9d7acb629d5fd`。
- 成品 SHA-256：`992918bca467c3f80fabb0d34022e725a6977489bdd593ae8737f4e639fefd00`。

## 先前版本紀錄

以下為舊版本音樂與音量調整的來源紀錄；目前遊戲已使用上述華爾茲。

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

## v4 音量調整（2026-11-08）

保留原授權曲目，另輸出 `background-v4.mp3`，避免已快取的舊錄音影響新版。
FFmpeg loudnorm 目標 I=-18 LUFS、TP=-2 dBTP、LRA=9；MP3 實測 mean -20.2 dB、peak -2.0 dB（原始 mean -29.0 dB、peak -6.8 dB）。
音樂滑桿上限的程式倍率從 0.22 改為 0.8，預設滑桿從 0.42 改為 0.75；同樣最大滑桿下平均訊號約提高 20 dB。
8-bit 音效總增益從 0.14 改為 0.36。保留靜音、零音量、頁面隱藏暫停及元件清理。
這是訊號強度的測量，實際聽感仍由使用者的系統音量與播放裝置決定。
