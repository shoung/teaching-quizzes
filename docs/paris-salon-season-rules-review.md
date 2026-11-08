# 六場沙龍規則審查

範圍：針對原審查提出的三項 Important 與一項 Minor 修正複核題庫文案、引擎計算和導師 helper。未審 UI，未修改實作或執行測試。

## 結論：原列問題已修正，可進入整合

- **贊助條件一致。** [season-engine.ts](/Users/macminix/Documents/Works/教學測驗集/src/paris-salon/season-engine.ts:102) 仍以「選擇行動且主題契合玩家所選受眾」決定模型收入；題庫現在明說支持者已提出符合條件的方案，條件成立就提供支持金，未符合則為零，並把它界定為簡化模型 [paris-salon-season.ts](/Users/macminix/Documents/Works/教學測驗集/src/data/paris-salon-season.ts:163)。舊有「不保證談成」矛盾已消除。
- **訊息實驗已標明為模擬。** [season-engine.ts](/Users/macminix/Documents/Works/教學測驗集/src/paris-salon/season-engine.ts:127) 現在呈現固定的 4/10 與 3/10，說明為同一受眾、兩組只改措辭，並明示樣本小、差異不是因果證明；題庫也列出「本季再次測試不再增加模型效益」[paris-salon-season.ts](/Users/macminix/Documents/Works/教學測驗集/src/data/paris-salon-season.ts:145)。後續宣傳的 +5 觸及是明示的簡化模型假設，回顧有交代其條件與假設性，沒有再把它說成測試已證實的因果效果。
- **季末建議優先處理。** [season-mentor.ts](/Users/macminix/Documents/Works/教學測驗集/src/paris-salon/season-mentor.ts:7) 先檢查最後一場；低現金訊息併入季末建議，避免說把投資留待不存在的下場。新增回歸案例涵蓋第五場後只剩 3 點的情況 [season-mentor.test.ts](/Users/macminix/Documents/Works/教學測驗集/src/paris-salon/season-mentor.test.ts:22)。
- **重複研究／實驗的邊際效益已提前揭露。** 研究文案指出首次研究縮窄預測、再次研究不會再縮窄 [paris-salon-season.ts](/Users/macminix/Documents/Works/教學測驗集/src/data/paris-salon-season.ts:103)；實驗文案則明說當季再測不增加模型效益 [同檔](/Users/macminix/Documents/Works/教學測驗集/src/data/paris-salon-season.ts:145)。這讓重複投入仍可選，但其取捨已清楚呈現。

本次是範圍限定複核；完整引擎、題庫、平衡性和 UI 整合仍依主流程驗收。未執行測試，父任務正在重跑純邏輯測試。
