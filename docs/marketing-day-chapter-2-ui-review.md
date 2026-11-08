# 第二章 UI 預覽與自由選章審查

> 歷史版本：此工作臺預覽已被「客戶來訪日」偵探式玩法取代，現行內容與驗收請見 [偵探玩法試玩](./marketing-day-detective-playtest.md)。

日期：2026-11-08
範圍：章節大廳、第二章互動預覽、章節路由與共用 dialog。依 PRD 0.3、案例 0.1、implementation plan 與相關原始碼審查。**本審查未親自操作瀏覽器或 Ego Lite**；響應式與實際鍵盤行為仍以 root 的 live review 為準。預覽圖 `marketing-chapter-2-brief.png` 是舊版來源圖，僅供佈局參考，未作為最新文字判斷。

## Important：已完成修正

- **初次審查發現：第二章離開時焦點沒有可靠的返回目標。** `PreviewDialog` 在 unmount 時嘗試聚焦先前元素；若先前元素仍在已卸載的 dialog 內，就退回查 `[data-world-interact]`。第二章預覽沒有這個控制，因此從第二章回大廳後，焦點可能落到 `body`。來源：`src/marketing-day/PreviewDialog.tsx`、`src/marketing-day/ChapterTwoPreview.tsx`、`src/marketing-day/MarketingDayGame.tsx`。
- **root修正與驗證：** ChapterLobby掛載時以穩定ref聚焦可程式聚焦的`md-lobby-title`標題。`chapter-navigation.test.tsx`先重現body焦點失敗，再於修正後通過；Ego實際返回時焦點亦為該H2。無需清除第一章答案。

## 設計與規格核對

- **自由選章與路由：符合來源設計。** 大廳兩章皆可選；第二章直接 hash 路徑略過第一章導正；第一章 session 留在同一個 `MarketingDayGame` 記憶體內。未見對第一章完成狀態的第二章門檻。章節選擇與直接入口都有相應測試，但此審查未重跑測試。
- **第二章方向：符合畫面階段範圍。** 單一客戶「轉角動作室」、委託、研究、Persona、前中後旅程、三方案、四層藍圖、異常卡與示範提案冊均有可操作的暫存狀態。預覽、合成資料、AI 非即時草稿及不計分／不存檔都有文字標示。這些是畫面預覽，不足以證明正式 10–15 分鐘流程或五步完成條件；依分階段要求，本輪不視為缺陷。
- **風格與資訊量：來源呈現接近需求。** 維持辦公室場景、中央原生 dialog、單一主要任務及按需展開；旅程逐階段、藍圖逐任務呈現。CSS 使用相對字級且可見小字至少 1rem，320px 有重新排版規則。此結論是靜態檢視，沒有實測 320px、200% 文字或覆寫間距。
- **音訊與操作回饋：來源實作一致。** 第二章只接收父層 `useGameSound`；選取控制、滑桿滑鼠／鍵盤操作有音效回饋邏輯，音樂與音效可獨立調整。需以瀏覽器驗證音效不重複、鍵盤可達性及 modal 關閉後焦點。
- **Minor 建議：**章節大廳的 CTA「開始第二章」容易讓人以為會進入正式可玩的章節；目前同卡片有「畫面預覽」標記，第二章內亦多次揭露預覽。可將 CTA 改成「查看第二章畫面預覽」以降低歧義。來源：`src/marketing-day/ChapterLobby.tsx`。

## 結論

**焦點返回修正已完成，可交使用者審核畫面。** 不需先完成正式遊戲邏輯，也不應以10–15分鐘真人實玩作為UI交付前置。root的瀏覽器實測、手機／200%重排、七畫面axe及音訊結果見[預覽驗收紀錄](marketing-day-chapter-2-ui-preview.md)；本來源審查沒有替代該驗收。CTA暫保留「開始第二章」，同卡片及章內明示畫面預覽，供使用者一起審核。
