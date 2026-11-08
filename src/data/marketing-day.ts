import type { MarketingGameDefinition } from '../types';

export const marketingDayGame: MarketingGameDefinition = {
  id: 'marketing-day', version: 1,
  title: '行銷人的一天', subtitle: 'A DAY IN MARKETING',
  description: '走進 3D 行銷辦公室，在新品上線日做出六個抉擇，練習數據判讀、查證與提案。',
  category: '情境遊戲', minutes: 10, color: 'peach', icon: 'briefcase', scenarioCount: 6,
  decisions: [
    {
      id: 'morning-brief', time: '09:15', title: '先有聲量，還是先有方向？',
      npcId: 'lead', speaker: '美玲', role: '行銷主管', task: '找美玲，確認今天的活動方向。', dimension: 'strategy',
      dialogue: [
        '早！今天是輕行通勤背包的新品上線日。它主打輕量與收納，希望成為每天上班的好夥伴。',
        '老闆想要聲量，也想看到預購。但我們得先說清楚 [[TA]] 是誰、要完成什麼，再選 [[KPI]]。',
      ],
      question: '同事都在等你安排工作。你會先做什麼？',
      evidence: [
        { label: '產品', value: '輕行通勤背包，主打輕量與收納。' },
        { label: '任務', value: '今天決定活動方向；預購是可以追蹤的行動。' },
        { label: '目前缺口', value: '受眾、主要目標與分工尚未對齊。' },
      ], terms: ['TA', 'KPI'],
      options: [
        { id: 'post-first', label: '先排好今天的貼文，再看互動來調整。', score: 1, feedback: '先有執行節奏是好事，但若目標還沒對齊，互動高也不一定帶來預購。先補上受眾與主要指標，貼文才知道要把人帶去哪裡。', outcome: '貼文排程先動起來，團隊仍需要補齊目標共識。' },
        { id: 'align-goal', label: '先對齊受眾、活動目標與衡量指標。', score: 2, feedback: '先把方向說清楚，大家才有共同的取捨依據。美玲決定以通勤族為主要受眾、預購為核心行動，聲量則作為觀察指標。', outcome: '團隊先對齊受眾與預購目標，再開始分工。' },
        { id: 'visual-first', label: '先做最吸睛的主視覺，讓活動有記憶點。', score: 0, feedback: '有記憶點的視覺值得做，但它不能代替活動方向。受眾與目標未定就先做圖，後續可能為不同需求反覆重做。', outcome: '主視覺先開始製作，但活動方向需要再確認。' },
      ],
      explanation: '先定義受眾與商業目標，再選能對應目標的 KPI。預購活動可以觀察曝光與互動，但不應只用按讚數宣告成功。',
    },
    {
      id: 'read-the-funnel', time: '10:00', title: '點擊很多，為什麼沒人買？',
      npcId: 'analyst', speaker: '子安', role: '數據分析', task: '找子安，看看點擊後發生了什麼。', dimension: 'data',
      dialogue: [
        '上午的廣告已經有一些初步資料。看起來很多人願意點，但預購還沒有跟上。',
        '[[CTR]] 看廣告有沒有帶來點擊；[[CVR]] 看點擊之後有沒有完成預購。我們也得看看 [[Landing Page]]。',
      ],
      question: '看到這組數據，你會優先怎麼處理？',
      evidence: [
        { label: '同一觀察期間', value: '曝光 10,000 次 → 點擊 500 次 → 預購 5 筆。' },
        { label: '本案口徑', value: 'CTR＝點擊 ÷ 曝光；CVR＝預購 ÷ 點擊。' },
        { label: '已知限制', value: '尚未核對追蹤事件與預購頁載入、流程是否正常。' },
      ], terms: ['CTR', 'CVR', 'Landing Page'],
      options: [
        { id: 'verify-funnel', label: '先確認追蹤，再檢查預購頁的流失。', score: 2, feedback: 'CTR 是 5%，但點擊到預購的 CVR 只有 1%。先核對事件與分母，再檢查頁面載入、訊息銜接及預購流程，才知道問題發生在哪一段。', outcome: '子安列出追蹤與預購頁檢查清單，先確認漏斗。' },
        { id: 'scale-clicks', label: '點擊率看起來不錯，先增加廣告預算。', score: 0, feedback: '500 次點擊不代表預購流程健康。若追蹤錯誤或頁面有阻礙，加預算可能只放大流失；應先確認 5 筆預購的口徑與流程。', outcome: '廣告準備加碼，但子安提醒先排除預購流失。' },
        { id: 'change-audience', label: '先調整受眾，測試能不能找到更想買的人。', score: 1, feedback: '受眾品質可能影響轉換，值得列入假設。不過這組數字還無法證明問題在受眾，應先排除追蹤與到達頁問題，再安排比較。', outcome: '受眾成為待測假設，追蹤與頁面仍需先核對。' },
      ],
      explanation: '本案 CTR＝500／10,000＝5%，CVR＝5／500＝1%。這些數字指出值得調查的環節，不能單憑它們認定原因或保證加碼有效。',
    },
    {
      id: 'check-ai-copy', time: '11:00', title: '這句文案，真的可以說嗎？',
      npcId: 'designer', speaker: '小晴', role: '品牌設計', task: '找小晴，確認新品文案的產品承諾。', dimension: 'collaboration',
      dialogue: [
        'AI 幫我們寫了「100% 防水、終身保固」。句子很有力，可是我找不到這兩項承諾的依據。',
        '主視覺需要清楚的 [[USP]]，預購按鈕也要有 [[CTA]]。但再好的文案，都不能越過產品真的能做到的事。',
      ],
      question: '距離素材交件只剩一點時間，你會怎麼做？',
      evidence: [
        { label: 'AI 草稿', value: '「100% 防水、終身保固，現在就預購。」' },
        { label: '產品資料', value: '防潑水材質；一年有限保固，依保固條款適用。' },
        { label: '可確認窗口', value: '產品負責人可以核對正式規格與保固條款。' },
      ], terms: ['USP', 'CTA'],
      options: [
        { id: 'soften-and-publish', label: '把「100%」刪掉，保留防水與終身保固先上線。', score: 0, feedback: '刪掉百分比仍沒有修正錯誤承諾。「防水」與「終身保固」都超出目前資料，不能只靠換語氣就發布；需要查證並改寫。', outcome: '小晴先暫停交件，請你補核對產品承諾。' },
        { id: 'remove-benefits', label: '先刪除所有產品賣點，只留下預購按鈕。', score: 1, feedback: '先避免無依據承諾，比直接發布更穩妥。但全部刪掉也失去溝通價值；可以保留輕量、收納等有依據的資訊，並向產品窗口確認。', outcome: '誇大承諾被拿掉，素材還需要補回可靠的賣點。' },
        { id: 'verify-and-rewrite', label: '核對規格，改寫可證實的賣點並請產品窗口確認。', score: 2, feedback: '小晴將文案改成資料能支持的防潑水與保固內容，保留輕量、收納的訴求，再送產品窗口確認。AI 可以加速草稿，最後承諾仍由團隊查證。', outcome: '團隊換上經查證的產品承諾，素材可以繼續準備。' },
      ],
      explanation: 'USP 需要產品證據，CTA 則引導讀者下一步。AI 草稿不能被當成規格來源；防潑水不等於完全防水，一年有限保固不等於終身保固。',
    },
    {
      id: 'design-an-experiment', time: '13:30', title: '兩張素材，要怎麼比？',
      npcId: 'media', speaker: '阿哲', role: '廣告投放', task: '找阿哲，安排下午的素材測試。', dimension: 'strategy',
      dialogue: [
        '午休後有兩張素材：一張講輕量，一張講收納。我們想知道哪個訴求更能帶來預購。',
        '做 [[A/B Test]] 時，主要條件要盡量一致。再用 [[UTM]] 分辨來源，才不會把不同流量混成同一筆。',
      ],
      question: '怎樣安排，才比較能回答這次的問題？',
      evidence: [
        { label: '本次比較', value: '輕量訴求 vs 收納訴求。' },
        { label: '共同條件', value: '相同受眾條件、預購頁與觀察期間，使用可比較的分配方式。' },
        { label: '追蹤需求', value: '分開標記素材來源，事先訂好指標、觀察條件與限制。' },
      ], terms: ['A/B Test', 'UTM'],
      options: [
        { id: 'change-everything', label: '兩張圖各配不同受眾，也各用不同的頁面。', score: 0, feedback: '同時改受眾、素材與頁面，結果出現差異也無法知道是哪一項造成。這次要比較訴求，應先固定其他主要條件。', outcome: '阿哲發現變因太多，測試結果將難以解讀。' },
        { id: 'one-variable', label: '固定主要條件，只比較訴求並分開追蹤來源。', score: 2, feedback: '阿哲把兩版導到同一預購頁、安排可比較的流量與來源標記，再事先寫好觀察方式。這樣累積的資料，才較能回答訴求差異的問題。', outcome: '素材測試保留單一重點，來源與觀察規則也寫清楚。' },
        { id: 'team-vote', label: '先由團隊投票選出一版，之後觀察整體表現。', score: 1, feedback: '內部投票可以幫助團隊快速選稿，但不能取代受眾行為的比較。若想知道哪個訴求較有效，仍需要設計可比較的實驗。', outcome: '團隊先選出喜歡的素材，但尚未取得受眾比較證據。' },
      ],
      explanation: '本次 A/B 測試只比較主訴求，固定主要條件並分別追蹤。UTM 有助辨識來源，但不能修復錯誤實驗設計，也不保證還原全部轉換。',
    },
    {
      id: 'budget-with-small-samples', time: '15:00', title: '看到領先，就能把預算押上去？',
      npcId: 'media', speaker: '阿哲', role: '廣告投放', task: '再找阿哲，討論預算要不要擴大。', dimension: 'data',
      dialogue: [
        '下午先看到這些結果。B 的歸因營收比較高，可是訂單只有兩筆，還不能知道明天是否也會一樣。',
        '[[ROAS]] 能描述廣告花費與歸因營收的關係，但沒有扣掉商品等成本。現在怎麼決定，才不會太早下結論？',
      ],
      question: '剩下的預算，你會怎麼安排？',
      evidence: [
        { label: '同一觀察期間 A', value: '花費 1,000 元；歸因營收 2,500 元；5 筆訂單。' },
        { label: '同一觀察期間 B', value: '花費 1,000 元；歸因營收 3,000 元；2 筆訂單。' },
        { label: '目前限制', value: '樣本小；歸因與毛利待核對，未證明差異穩定。' },
      ], terms: ['ROAS'],
      options: [
        { id: 'all-in-b', label: 'B 的 ROAS 較高，把剩餘預算全部投給 B。', score: 0, feedback: 'B 的 ROAS 是 3.0，暫時高於 A 的 2.5，但只有兩筆訂單。小樣本、歸因與成本都還有不確定性，不能據此認定擴量後仍會領先。', outcome: '預算準備集中到 B，阿哲提醒這個判斷仍很不穩定。' },
        { id: 'all-in-a', label: 'A 的訂單較多，把剩餘預算全部投給 A。', score: 1, feedback: '你留意到訂單數，避免只看營收；但五筆訂單同樣不足以證明穩定，而且客單價、毛利與追蹤都還沒核對。全部押 A 仍然太早。', outcome: '訂單數被納入考量，但預算決策還需要更多證據。' },
        { id: 'observe-and-check', label: '保留觀察，先核對樣本、追蹤與毛利，再分段調整。', score: 2, feedback: 'A 的 ROAS 是 2.5，B 是 3.0，兩者都不是淨利。阿哲先保留可比較的觀察，核對歸因與成本，再訂好逐步調整條件，而不是一次全押。', outcome: '團隊把預算調整分成小步驟，避免被少量訂單帶著走。' },
      ],
      explanation: 'ROAS＝歸因營收／廣告花費。A＝2.5、B＝3.0；數字尚未扣成本，也沒有證明統計顯著。應交代樣本與歸因限制，再討論可承受的調整。',
    },
    {
      id: 'handoff-the-day', time: '17:30', title: '明天怎麼做？給主管一個方向。',
      npcId: 'lead', speaker: '美玲', role: '行銷主管', task: '找美玲，交付今天的觀察與明天的建議。', dimension: 'collaboration',
      dialogue: [
        '今天辛苦了。活動上線不是句點，我們還需要把已知的事與不確定的事分清楚。',
        '不用把每張圖都唸一遍。告訴我：看見什麼、還不知道什麼，明天要先做哪件事，又要用哪個 [[KPI]] 檢查。',
      ],
      question: '你會怎麼交付這份結案建議？',
      evidence: [
        { label: '已知', value: '今天的任務、選擇與觀察資料可以回顧。' },
        { label: '限制', value: '素材與預算的短期結果尚不能代表長期成效。' },
        { label: '交付需求', value: '提出具體下一步、負責對象與要觀察的指標。' },
      ], terms: ['KPI'],
      options: [
        { id: 'evidence-next-step', label: '說明已知、限制與下一步，指定要追蹤的指標。', score: 2, feedback: '美玲收到一個可以接手的建議：先說明證據，再標記限制與假設，列出下一步、負責人及指標。團隊知道明天從哪裡接著做。', outcome: '你把今天的選擇整理成有依據、可接手的下一步。' },
        { id: 'charts-only', label: '附上全部圖表，讓主管挑選想採取的做法。', score: 1, feedback: '留下資料有助核對，但圖表本身還不是建議。美玲仍需要你指出最重要的觀察、限制，以及為什麼某個行動值得優先做。', outcome: '資料已交付，團隊仍需要你補上取捨與建議。' },
        { id: 'promise-growth', label: '承諾明天預購翻倍，讓團隊更有信心。', score: 0, feedback: '信心不能代替證據。今天的少量資料無法支持明天翻倍的保證；更好的交付是說清楚可驗證的假設與下一步。', outcome: '美玲要求把成效保證改成可以追蹤、可以驗證的計畫。' },
      ],
      explanation: '好的提案把事實、假設、限制與行動連起來，讓別人能理解並接手。KPI 用來驗證工作，不應用沒有依據的成效保證取代它。',
    },
  ],
};

export const marketingTerms = [
  {name:'TA',zh:'目標受眾',group:'方向',meaning:'這次溝通想接觸的那一群人。先知道他們遇到什麼問題，再決定要說什麼。',example:'例如：每天通勤、需要輕量背包的上班族。',caution:'「所有人」通常不足以幫你做行銷取捨。'},
  {name:'KPI',zh:'關鍵績效指標',group:'方向',meaning:'用來確認工作是否接近目標的指標。要先知道活動要達成什麼，再選擇數字。',example:'本次目標是預購，就不能只看貼文按讚數。',caution:'看起來漂亮的數字，不一定代表目標達成。'},
  {name:'CTR',zh:'點擊率',group:'數據',meaning:'看過廣告之後，有多少次點擊。計算方式是點擊數除以曝光數。',example:'500 次點擊 ÷ 10,000 次曝光 = 5%。',caution:'高點擊率不保證高預購或高利潤。'},
  {name:'CVR',zh:'轉換率',group:'數據',meaning:'指定母數中，完成目標行動的比例。本次遊戲採「預購數 ÷ 點擊數」。',example:'5 筆預購 ÷ 500 次點擊 = 1%。',caution:'比較之前，先確認兩邊的轉換事件與分母一致。'},
  {name:'Landing Page',zh:'到達頁',group:'素材',meaning:'讀者點擊廣告之後進入的頁面。它應承接廣告訊息，讓下一步清楚易做。',example:'背包廣告點進去，能直接看到產品資訊與預購按鈕。',caution:'點擊不等於頁面一定成功載入或完成購買。'},
  {name:'USP',zh:'獨特賣點',group:'素材',meaning:'產品相對特別、又能被驗證的價值。讓人知道為什麼值得選它。',example:'「輕量、通勤收納」可以是待具體說明的賣點方向。',caution:'賣點需要證據，不能把防潑水改寫成完全防水。'},
  {name:'CTA',zh:'行動呼籲',group:'素材',meaning:'清楚告訴讀者接下來可以做什麼。最好對應本次溝通的目標。',example:'「查看收納細節」或「前往預購」。',caution:'同時給太多行動，反而容易讓人不知道先做哪個。'},
  {name:'A/B Test',zh:'A/B 測試',group:'數據',meaning:'固定主要條件，讓兩個版本比較特定差異。藉此累積證據，而不只是憑感覺。',example:'同一受眾、同一頁面，比較「輕量」與「收納」訴求。',caution:'少量結果暫時領先，不代表已經證明哪個版本更好。'},
  {name:'UTM',zh:'連結追蹤標記',group:'數據',meaning:'在網址加上活動來源標記，方便分辨訪客是由哪個活動或素材進來。',example:'把不同廣告素材標成不同的活動內容來源。',caution:'標記有助分析，但不能保證完整還原所有轉換。'},
  {name:'ROAS',zh:'廣告投資報酬',group:'數據',meaning:'歸因營收除以廣告花費，描述每一元廣告費帶回多少歸因營收。',example:'2,500 元歸因營收 ÷ 1,000 元廣告費 = 2.5。',caution:'尚未扣除商品等成本，不等於淨利，也不同於 ROI。'},
];
