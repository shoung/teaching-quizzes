# 巴黎沙龍 v4｜遊戲企劃總監審查

依 `docs/paris-salon-rpg-rounds-spec.md` 核對本輪沙龍遊戲。審查聚焦實際玩法、教學閉環、狀態持續性、結局與主要鍵盤路徑；未修改執行程式或核准美術。結果面板截圖仍在微調，故視覺判斷只作旁證。

## Critical

無。

## Important

無。引擎允許六場各自結算並在無額外行動、現金不足時以免費小聚繼續；規劃會先驗證資金與時段。`holdSeason` 只接受預期場次、待確認回顧與已聽取當場非導師線索；已結算狀態由計畫重播還原，避免重新整理重複扣款或收入（`src/paris-salon/season-engine.ts:166-177, 234-263, 280-336`）。

## Minor

- **結語是專屬場景，但敘事收束大致固定。** 結語有接待人次、達標場次、回訪、期末資產等實際數字，也需完成後才進報告；最後兩句則對所有經營結果相同（`src/data/paris-salon-rpg.ts:128-142`; `src/paris-salon/SalonGame.tsx:72-74, 108-114`）。若能依這一季是否守住口碑、知名度或資金，改變克萊爾的收束句，季末會更像六場故事的回應；現規格沒有要求多結局，故列輕微敘事建議。

## 規格覆核摘要

- **有限 NPC 情報：** 每場固定三位在場角色，NPC 只可於當場呼叫；對話與帳冊線索分開保存，規劃面板不直接顯示 `market.news`（`src/data/paris-salon-rpg.ts:5-72`; `src/paris-salon/season-engine.ts:250-271`; `src/paris-salon/SeasonPanels.tsx:108-119`）。故事資料測試覆蓋場次名單、對話長度、單句字數、未出席角色與主市場線索（`src/data/paris-salon-rpg.test.ts:20-64`）。
- **市場管理教學：** STP 基本配置、需求研究、訊息小樣本限制、渠道漏斗、體驗、人力與座位產能、熟客留存、贊助條件都落在配置與行動卡；模型亦區分觸及、詢問、預約、到場、座位與舒適接待量（`src/data/paris-salon-season.ts:48-178`; `src/paris-salon/season-engine.ts:62-95, 98-143`）。
- **知名度與持續資源：** 初始知名度 50；情境模型同時容許良好體驗提升與失望／超載／候補拉低，宣傳增量有滿意度條件，資產使用 0–100 邊界（`src/paris-salon/season-engine.ts:20-22, 86-95, 109-119`）。引擎測試明確驗證正向與負向案例（`src/paris-salon/season-engine.test.ts:31-52`）。
- **PDCA 與結局：** 每場回顧呈現七項資產前後差、漏斗、到場與候補、收入成本、角色回饋、下一步與按卡片生成的學習細節；建議目前已會依候補、超載、現金、受眾與主題契合、滿意度或參與式行動挑選情境提示，將決策連回後續調整（`src/data/paris-salon-rpg.ts:146-197`）。季報保留六場配置與結果。六場逐場確認後才進露易斯夫人結語，再呈季報；結語完成狀態可還原（`src/paris-salon/SeasonPanels.tsx:142-159`; `src/paris-salon/season-engine.ts:274-336`）。
- **主要鍵盤／輔助路徑：** 場景角色為原生按鈕；對話有單一可聚焦續句按鈕、Enter/Space 推進、Escape 關閉可略過的 NPC 對話、即時文字播報與減少動態；卡牌支援 Tab、Enter/Space、左右鍵與拒絕理由播報；面板有焦點圈選（`src/paris-salon/SalonGame.tsx:78-89, 148-154`; `src/paris-salon/RpgDialogue.tsx:53-64, 101-143`; `src/paris-salon/SalonCardHand.tsx:16-45, 50-70`）。對應測試涵蓋對話鍵盤、卡牌方向鍵、六場主流程與重新整理後只回顧一次（`src/paris-salon/RpgDialogue.test.tsx`; `src/paris-salon/SalonCardHand.test.tsx`; `src/paris-salon/game-flow.test.tsx:40-73`）。

## 結論

**通過，附一項輕微季末敘事潤飾建議。** 沒有發現需要阻擋試玩的玩法或資料狀態問題。核對源碼與既有測試覆蓋；未在本審查另行執行測試或完整建置。
