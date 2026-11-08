import type { SalonDecision, SalonDimension, SalonGameDefinition } from '../types';

export const salonActs = ['一間無人知曉的沙龍', '讓巴黎開始談論你', '名聲背後的工作', '藝術之夜與下一封邀請'];

export const salonDimensions: { id: SalonDimension; label: string; practice: string }[] = [
  { id: 'insight', label: '顧客洞察與定位', practice: '找三位需求不同的同學訪談，用「需要完成的事」分群，再寫一句可交付的價值主張。' },
  { id: 'resources', label: '目標與資源配置', practice: '替一次校園活動列出目標、容量與預算，說明追加一筆宣傳會犧牲哪項準備。' },
  { id: 'relationships', label: '傳播與關係經營', practice: '比較兩種渠道的受眾契合，分別寫給願意回訪者與未同意者的後續處理方式。' },
  { id: 'data', label: '數據判讀與實驗', practice: '把曝光、有效回覆與實際參加分開列出分母，再設計一次只有主要訊息不同的小測試。' },
  { id: 'ai', label: 'AI 工作流與查證', practice: '替 AI 草稿逐句標示事實、推論與待查證，查原始來源後再由人核准發布。' },
  { id: 'operations', label: '組織協作與危機處理', practice: '為一個活動流程指定負責人、交接時點與超過容量時的處理，演練一次合作方臨時變更。' },
];

export const salonTerms: Record<string, { title: string; definition: string; then: string; now: string; pitfall: string }> = {
  stp: { title: 'STP：分群、選受眾、定位', definition: '先辨認需求差異，再選本次優先服務的人，最後說清楚值得來的理由。', then: '從咖啡館訪談挑出首場主受眾，不靠衣著或職業猜需求。', now: '為校園活動選一群有共同任務的人，設計相符訊息與體驗。', pitfall: '分群不是貼標籤，也不是宣稱其他人不能參加。' },
  value: { title: '價值主張', definition: '說明為誰解決什麼問題，以及自己能交付的具體體驗。', then: '承諾作品交流或易懂導覽，並安排時間與人手做到。', now: '把「最好最棒」改成可觀察、可交付的使用者利益。', pitfall: '好聽口號不等於價值；不能承諾自己辦不到的內容。' },
  goals: { title: 'SMART 與 KPI', definition: '把目標寫得明確、有期限且可檢查，選能反映進展的指標。', then: '本場分開看知名度、到場、信任與接待準備。', now: '設定活動完成數與體驗護欄，不只看貼文瀏覽。', pitfall: '指標是觀察工具；挑容易上升的數字會忽略真正目標。' },
  mix: { title: '行銷組合', definition: '讓提供的體驗、觸及方式、資源安排與服務過程相互配合。', then: '邀請函寫交流，就要留討論時間並安排引導。', now: '宣傳承諾、報名流程與現場服務需要一致。', pitfall: '只加宣傳而不補交付能力，可能帶來更多失望。' },
  disclosure: { title: '口碑與合作揭露', definition: '讓推薦者確實理解內容，並讓讀者知道是否存在資源或付費合作。', then: '寫作者受邀合作時在文末說明，熟客引薦也附真實活動資訊。', now: '清楚標示業配與合作，不捏造體驗或背書。', pitfall: '觸及大不代表需求吻合；揭露合作也不保證內容可信。' },
  funnel: { title: '轉換漏斗', definition: '把認識、回覆、確認與到場視為不同步驟，逐層檢查流失。', then: '寄出邀請函不等於收到有效回函，更不等於本人到場。', now: '曝光、點擊、有效報名、參加各有自己的分母。', pitfall: '不能把回函率寫成出席率，或把候補算成已到場。' },
  experiment: { title: 'A/B 測試', definition: '讓可比較的兩組接受主要差異明確的版本，再觀察同一定義的結果。', then: '兩批邀請函名單與寄送時間相近，先比較有效回函。', now: '先寫衡量方式，小規模比較訊息，再保留驗證空間。', pitfall: '一次樣本較好不保證永遠有效，也不能直接宣稱統計顯著。' },
  opportunity: { title: '機會成本', definition: '做一個選擇時，放棄的下一個可行用途也是代價。', then: '錢用於大報刊後，就不能同時拿來改善入口與導覽。', now: '預算、時間與人手要一起比較，而非只看付款金額。', pitfall: '零花費仍可能耗費時間；保留現金也要說明延後什麼機會。' },
  crm: { title: 'CRM：關係與名單管理', definition: '依對方意願、需求與互動紀錄安排合適的後續聯繫。', then: '區分確認、候補、攜伴與未回覆，活動後尊重回訪意願。', now: '只保存必要資料並提供停止聯繫方式，不購買陌生個資。', pitfall: '名單越長不一定越好，未回覆不是同意接收行銷。' },
  responsibility: { title: '分工責任', definition: '讓每項工作有清楚負責人、完成標準與交接對象。', then: '入口核對與作品導覽分派到人，遇到滿額由管家統一處理。', now: '任務表寫出誰執行、誰決策、何時交接。', pitfall: '大家一起注意容易變成沒有人負責；不能以無限加班補洞。' },
  stakeholders: { title: '利害關係人', definition: '辨認受到決策影響的人，理解承諾與限制，再協調可接受方案。', then: '贊助人、畫家與來賓各有需求，臨時更動要一起考慮。', now: '合作變更先確認使用者體驗與團隊能力，再談替代安排。', pitfall: '出資最多者不會自動擁有推翻所有承諾的權利。' },
  verification: { title: 'AI 查證', definition: '把工具輸出當草稿，回到原始證據確認事實、授權與適用範圍。', then: '未來手帳是架空的預寫助手；原信未承諾，就不能印成名人必來。', now: '讓人審核來源、事實與風險後才對外發布。', pitfall: '語氣流暢不代表正確；AI 不替使用者承擔查證責任。' },
};

const decisions: SalonDecision[] = [
  {
    id: 'salon-01', act: 1, place: 'cafe', npc: 5, speaker: '露易絲', role: '常客代表',
    title: '第一封邀請，要先寫給誰？', question: '首場只能把一種需求做到突出，你先服務哪一群？',
    scenario: '咖啡杯旁攤著三張訪談卡。克萊兒不缺漂亮房間，卻還說不清誰會特地前來。這次選擇決定優先需求，不限制其他人參加。',
    evidence: [
      { label: '創作者', value: '想帶一件未完成作品，交換具體回饋；不想整晚只聽名人演說。' },
      { label: '收藏愛好者', value: '想理解作品脈絡與創作選擇，願意聽有引導的作品故事。' },
      { label: '好奇的來賓', value: '想輕鬆進入藝術話題，希望不用先懂專業名詞。' },
      { label: '遊戲說明', value: '人物、訪談與所有數據均為原創虛構教學情境；任何受眾皆可採取合理策略。' },
    ], terms: ['stp'], dimension: 'insight',
    options: [
      { id: 'q1-artists', title: '作品互評的創作者', label: '先解決創作卡關', text: '以想交換回饋的人為主，下一步安排互評體驗。', cost: 0, score: 3, target: 'artists', effects: { awareness: 4, trust: 4, confirmed: 4 }, feedback: '你從「需要什麼幫助」選定主受眾，沒有把職業當成固定偏好。接下來若承諾互評，需真的留出交換作品與回饋的時間；選這群人本身不會自動比其他策略高分。' },
      { id: 'q1-collectors', title: '想聽作品故事的人', label: '先解決理解脈絡', text: '以需要作品脈絡的愛好者為主，準備有引導的對談。', cost: 0, score: 3, target: 'collectors', effects: { awareness: 4, trust: 4, confirmed: 4 }, feedback: '你用訪談中的理解需求選擇受眾，這是完整的分群依據。後續應以作品故事與提問引導支持承諾，而非假定收藏愛好者只在意身價或購買。' },
      { id: 'q1-curious', title: '初次走近藝術的人', label: '先降低參與門檻', text: '以希望輕鬆理解的來賓為主，避免把懂術語當入場條件。', cost: 0, score: 3, target: 'curious', effects: { awareness: 4, trust: 4, confirmed: 4 }, feedback: '你根據進入話題的障礙選定需求，而不是替來賓貼上不懂藝術的標籤。接下來的文案、引導與現場氣氛都要讓初次參與者容易開口。' },
    ],
    explanation: '分群要根據需求，選擇主受眾則是資源優先順序。三群都有證據支持，皆達完整教學標準；差異在後續定位與渠道是否連貫。本遊戲不以階級、年齡或性別推定偏好。',
  },
  {
    id: 'salon-02', act: 1, place: 'salon', npc: 4, speaker: '安東', role: '新銳畫家',
    title: '把「盛大」換成能做到的承諾', question: '你要把哪一種體驗印在邀請函最醒目的地方？',
    scenario: '路易指著舊邀請函：「最盛大的藝術之夜，大家都會來。」三十六個座位無法承諾全巴黎，但可以承諾一種值得來的體驗。',
    evidence: [
      { label: '互評桌', value: '每人帶一件作品，分桌輪流提問與給回饋；最契合創作者。' },
      { label: '作品故事', value: '畫家解釋兩件作品的選擇，再開放提問；最契合作品脈絡需求。' },
      { label: '輕鬆入門', value: '以生活問題帶看作品，沒有術語測驗；最契合初次走近藝術的人。' },
      { label: '契合規則', value: '三方案都能辦到；符合前題主需求時，才達完整定位標準並增加相應回應。' },
    ], terms: ['stp', 'value', 'mix'], dimension: 'insight',
    options: [
      { id: 'q2-feedback', title: '一件作品，三個新看法', label: '輪流互評作品', text: '安排分桌互評，適合前題選創作者；其他受眾仍可參與但核心需求較弱。', cost: 0, score: 2, positioning: 'feedback', effects: { awareness: 6, trust: 5, confirmed: 5 }, fit: { targets: ['artists'], score: 3, effects: { trust: 3, confirmed: 2 } }, feedback: '承諾有明確的活動形式，能檢查是否做到。若你先選創作者，這正回應其需求，達完整標準；其他受眾也可能喜歡，但需要另補其主要需求，因此本次定位只有部分契合。' },
      { id: 'q2-stories', title: '畫布背後的一個選擇', label: '有引導的作品故事', text: '預留畫家說明與提問，適合前題選想懂脈絡的愛好者。', cost: 0, score: 2, positioning: 'stories', effects: { awareness: 7, trust: 5, confirmed: 5 }, fit: { targets: ['collectors'], score: 3, effects: { trust: 3, confirmed: 2 } }, feedback: '作品故事是可交付的價值，不是空泛口號。對以理解作品脈絡為主的受眾，安排直接符合訪談；若主受眾想互評或降低開口門檻，仍需補充設計，不能只因文案漂亮就說定位完整。' },
      { id: 'q2-open', title: '從一個生活問題看藝術', label: '無術語入門交流', text: '用日常感受開場，適合前題選初次走近藝術的來賓。', cost: 0, score: 2, positioning: 'open', effects: { awareness: 8, trust: 4, confirmed: 5 }, fit: { targets: ['curious'], score: 3, effects: { awareness: 1, trust: 3, confirmed: 2 } }, feedback: '你把低門檻變成具體的引導方式，對好奇但不熟悉藝術的來賓尤其契合。若前題選其他主需求，這仍是友善活動，卻尚未突出作品回饋或脈絡深度，教學評分會反映這個缺口。' },
    ],
    explanation: '定位不是挑一句自己喜歡的口號，而是讓優先服務的人知道能得到什麼。前題主受眾與本題承諾相符時得三分；不同定位沒有固定高低，判準在選擇前已公開。',
  },
  {
    id: 'salon-03', act: 1, place: 'study', npc: 1, speaker: '艾米爾', role: '沙龍管家',
    title: '三十六個座位，怎樣才算辦得好？', question: '帳冊首頁要寫哪一組管理目標？',
    scenario: '管家把一百點經費分成可移動的紙籌碼。你需要人來，也希望大家記得沙龍；若體驗失約，第一晚的熱鬧可能無法延續。',
    evidence: [
      { label: '共同通關規則', value: '到場至少28人、最終知名度至少70、最終信任至少60、開場接待至少60，經費不可透支。此為課堂遊戲門檻，不是真實預測。' },
      { label: '限制', value: '容量36人、初始經費100點；知名度是遊戲指數，並非巴黎人口認知率。' },
      { label: '可管理流程', value: '有效確認與候補分開；宣傳、接待與備用金爭用同一筆經費。' },
    ], terms: ['goals', 'funnel'], dimension: 'resources',
    options: [
      { id: 'q3-guardrails', title: '把成長與服務一起追蹤', label: '目標加護欄', text: '每幕核對人潮、名聲、信任、接待與餘額；確認席位不超過36。', cost: 0, score: 3, effects: { preparation: 8, awareness: 2, trust: 2, confirmed: 2 }, feedback: '你用可檢查的目標搭配容量、信任與預算護欄，能在籌備途中修正。這不會更改共同通關門檻；增加的準備代表開始建立檢查節點，而不是寫下目標就保證成功。' },
      { id: 'q3-checkpoints', title: '每幕用缺口安排下一步', label: '設立檢查節點', text: '沿用共同目標，先查確認席位，再查信任與接待缺口，記錄每次取捨。', cost: 0, score: 3, effects: { preparation: 10, awareness: 1, trust: 3, confirmed: 1 }, feedback: '你把共同目標轉成逐幕可執行的檢查流程，也沒有把單一數字當全部成果。較細的準備與信任有幫助，但對外聲量成長較慢，後續仍需安排符合受眾的宣傳。' },
      { id: 'q3-buzz', title: '先讓全城聽過名字', label: '只追宣傳聲量', text: '每幕只記錄知名度，把接待與確認名單留到活動前處理。', cost: 0, score: 1, effects: { awareness: 9, preparation: -5, trust: -2 }, feedback: '你有明確的單一指標，但尚未處理真正到場、容量與承諾交付。聲量可以先上升，接待缺口也會一起累積；之後仍能補救，本題不會阻止你完成故事。' },
    ],
    explanation: '目標需要可衡量、可執行與有期限，也需要避免為一個數字犧牲整體體驗。前兩案都是完整方法，差別在成長節奏；只追知名度則缺少必要護欄。',
  },
  {
    id: 'salon-04', act: 2, place: 'cafe', npc: 2, speaker: '茱莉葉', role: '藝文寫作者',
    title: '誰替你把邀請送到對的人手上？', question: '你如何安排這輪傳播合作？',
    scenario: '寫作者帶來三種渠道。昂貴版面可以讓更多人聽過名字，熟客則願意花時間說明為什麼值得來；沒有所有受眾都最好的渠道。',
    evidence: [
      { label: '藝文小刊', value: '18點；讀者常交換創作方法與作品脈絡，最契合創作者、作品故事愛好者。合作文會揭露資源支持。' },
      { label: '熟客引薦', value: '0點；由熟客帶著活動說明逐一引薦，觸及較慢，最能降低初次來賓的不安。' },
      { label: '大報版面', value: '35點；觸及廣但需求混雜，會清楚標示合作，仍可能擠壓接待預算。' },
      { label: '自己寄信', value: '0點；可逐封解釋，但目前名單有限，無法立刻擴大規模。' },
    ], terms: ['disclosure', 'stp', 'opportunity'], dimension: 'relationships',
    options: [
      { id: 'q4-writer', title: '請小刊說清楚活動內容', label: '需求吻合的合作', text: '提供可查核簡介，揭露合作；主受眾是創作者或作品故事愛好者時最契合。', cost: 18, score: 2, effects: { awareness: 14, confirmed: 8, trust: 3 }, fit: { targets: ['artists', 'collectors'], score: 3, effects: { awareness: 3, confirmed: 3 } }, feedback: '你把渠道讀者需求、內容與合作揭露一起考慮。對創作者或作品脈絡需求，這是完整的契合方案；若主受眾是初次來賓，還缺降低參與門檻的引導，不能只憑藝文標籤推定合適。' },
      { id: 'q4-referrals', title: '讓熟客陪新朋友跨出第一步', label: '小規模引薦', text: '熟客說明活動與參加方式，不冒充無條件推薦；最契合初次走近藝術的人。', cost: 0, score: 2, effects: { awareness: 8, confirmed: 6, trust: 5 }, fit: { targets: ['curious'], score: 3, effects: { awareness: 6, confirmed: 4 } }, feedback: '你以真實資訊和關係降低參加的不確定，沒有把人情當成保證出席。若主需求是藝術入門，這能完整回應障礙；對互評或作品脈絡受眾仍有幫助，但尚未直接接上其需求圈層。' },
      { id: 'q4-newspaper', title: '買下醒目的大報版面', label: '擴大觸及', text: '標示合作並保留真實承諾，接受名單契合較低與預算取捨。', cost: 35, score: 2, effects: { awareness: 24, confirmed: 5, preparation: -6 }, feedback: '你沒有隱瞞合作，也理解廣泛觸及的用途。但目前主受眾需求已知，這次尚未說明如何從混雜讀者中找到他們；名聲成長快、確認成長慢，也壓縮了現場準備。' },
      { id: 'q4-letters', title: '只向手上熟悉的名單寄信', label: '保守的直接溝通', text: '逐封說明內容與聯絡意願，先不擴大渠道。', cost: 0, score: 2, effects: { awareness: 4, confirmed: 3, trust: 4 }, feedback: '你保留預算，直接溝通也能讓承諾清楚，這是合理的小規模選擇。不過目前名單有限，距離讓更多合適來賓知道仍有缺口；需要在後續補上觸及計畫。' },
    ],
    explanation: '渠道要看受眾需求、可交付訊息與成本，不是越大越好。小刊與熟客方案在明示的相符受眾下可得三分；其他方案並非不能用，而是未完整處理此題的受眾契合。',
  },
  {
    id: 'salon-05', act: 2, place: 'print', npc: 3, speaker: '馬塞爾', role: '印刷店經營者',
    title: '二十份回函，能說明多少？', question: '你如何使用這次邀請函測試？',
    scenario: '印刷店把兩批測試放在桌上。甲版寫具體活動，乙版只寫氣派場面；回函數有差異，但你還沒看見任何人真正到場。',
    evidence: [
      { label: '可比條件', value: '甲、乙各寄100封，名單來源與寄送時間相近；主要差異是訊息。這是虛構的小規模測試。' },
      { label: '結果', value: '甲20份有效回函、乙12份；兩者分母皆為100封，回函率分別20%與12%。' },
      { label: '限制', value: '回函不等於實際到場；本題未提供統計檢定，不能宣稱顯著或保證擴大後維持相同率。' },
      { label: '成本', value: '12點可有限擴印甲版；零成本可先整理並沿用小量溝通，觀察節奏較慢。' },
    ], terms: ['experiment', 'funnel'], dimension: 'data',
    options: [
      { id: 'q5-pilot', title: '有限擴印甲版並持續核對', label: '採用較好線索', text: '比較20%與12%回函率，花12點小幅擴大，保留名單與到場追蹤。', cost: 12, score: 3, effects: { awareness: 8, confirmed: 5, preparation: 2, trust: 2 }, feedback: '你用相同分母比較本次回函率，把甲版當較好的暫時線索，再用有限擴大控制風險。新增確認是故事後續觀察到的結果，不是把20%直接外推成保證到場。' },
      { id: 'q5-cautious', title: '先用現有名單小量確認', label: '保留驗證空間', text: '記下甲版較好但尚有不確定，先沿用訊息並追蹤有效確認，不追加印刷。', cost: 0, score: 3, effects: { awareness: 4, confirmed: 3, trust: 3, preparation: 2 }, feedback: '你正確判讀甲版的回函線索，也區分了回函與到場。小量確認保留預算，成長較慢但符合證據；完整標準不要求一定花錢，只要求說清楚比較口徑與限制。' },
      { id: 'q5-guarantee', title: '宣告甲版保證兩成到場', label: '把線索當保證', text: '不再核對回函與席位，直接以「兩成一定會來」安排宣傳。', cost: 0, score: 0, effects: { awareness: 10, trust: -8, preparation: -4, confirmed: 1 }, feedback: '你把有效回函率換成到場率，跨過了尚未觀察的步驟，也把小樣本結果當成保證。訊息可能帶來聲量，但核對不足削弱信任與準備；補救時要恢復追蹤並更正口徑。' },
    ],
    explanation: '甲版在本次測試的有效回函率較高，這支持暫時採用與續測，不支持保證出席或宣稱統計顯著。擴印與保守確認都可達完整標準，代價是花費和成長速度不同。',
  },
  {
    id: 'salon-06', act: 2, place: 'study', npc: 1, speaker: '艾米爾', role: '沙龍管家',
    title: '下一筆錢，是海報還是接待？', question: '查看目前帳冊後，你把這一輪資源放在哪裡？',
    scenario: '入口核對和作品提問都需要人手。帳冊顯示目前餘額與指標；以下方案的已知成本固定，資金不足時仍有兩個零成本安排。',
    evidence: [
      { label: '接待報價', value: '22點可增加一次助手演練與清楚動線，較大幅改善準備，也讓確認來賓安心。' },
      { label: '無追加支出', value: '可縮減裝飾、重排既有人手並留備用金，改善較慢；也可先做排班而不再宣傳。' },
      { label: '追加海報', value: '28點增加觸及，但原團隊須分神處理，會降低接待準備。預期方向已知，不保證人數。' },
      { label: '取捨提示', value: '請在經營帳冊比較目前名聲、確認與接待缺口。花費高低不直接決定教學分數。' },
    ], terms: ['opportunity', 'mix', 'goals'], dimension: 'resources',
    options: [
      { id: 'q6-hospitality', title: '先把承諾接得住', label: '演練與動線', text: '用22點改善入口與導覽，放棄這輪追加海報，保留可用餘額。', cost: 22, score: 3, effects: { preparation: 24, trust: 5, confirmed: 3, awareness: 2 }, feedback: '你把接待當成成長的交付能力，清楚承認放棄追加觸及的機會成本。準備提升較大但會消耗經費；本題不是保證這筆支出在所有狀態最適，而是要求把用途與放棄的機會一起看。' },
      { id: 'q6-reserve', title: '挪出人手，留下備用金', label: '重排而不加支出', text: '減少非必要裝飾，讓既有助手演練；接受改善幅度較小。', cost: 0, score: 3, effects: { preparation: 12, trust: 3, confirmed: 2, awareness: 1 }, feedback: '你用縮減裝飾換取人手，說明了零追加支出仍有取捨，並保留後續應變經費。準備改善比付費演練小，若帳冊仍有缺口，要在後續分工補上；省錢本身不會自動保證成功。' },
      { id: 'q6-roster', title: '先把現有人力排清楚', label: '暫停擴張', text: '停止這輪宣傳，把時間都用在工作表與交接，接受觸及停滯。', cost: 0, score: 3, effects: { preparation: 17, trust: 3, awareness: -2 }, feedback: '你把時間視為有限資源，選擇暫停擴張以補交付能力，這是有理由的完整取捨。代價是本輪知名度略降、沒有新增確認；需要把這個速度損失納入整體目標，而非認為零付款等於沒有成本。' },
      { id: 'q6-posters', title: '再貼一輪大型海報', label: '優先追求聲量', text: '用28點加大觸及，明知會占用接待準備時間，仍延後處理缺口。', cost: 28, score: 1, effects: { awareness: 21, confirmed: 4, preparation: -16, trust: -5 }, feedback: '你選擇了成長，卻在已知接待吃緊時延後交付缺口，沒有提出補位安排。聲量增加不能抵銷現場失約風險；後續仍能透過查核與分工修正，但不能只用人多證明資源配置完整。' },
    ],
    explanation: '機會成本包含放棄的觸及、準備時間與備用能力。三個完整方案有不同節奏與後果；此處分數判斷是否明示取捨和處理限制，經營結果則由整條策略是否協調決定。',
  },
  {
    id: 'salon-07', act: 3, place: 'study', npc: 2, speaker: '茱莉葉', role: '藝文寫作者',
    title: '未來手帳把「再議」寫成「必到」', question: '這張邀請草稿要如何對外發布？',
    scenario: '架空的2026手帳給了一段流暢文案：「知名畫家已答應出席。」茱莉葉找出原信，紙上卻沒有這項承諾。手帳是預寫教學模擬，不連接即時AI服務。',
    evidence: [
      { label: '原始信件', value: '「若行程允許，有機會再議。」沒有承諾出席，也沒有同意公開使用姓名。' },
      { label: 'AI草稿', value: '「大師已答應出席，歡迎把握與他交流的機會。」草稿把可能性寫成事實。' },
      { label: '發布責任', value: '可向本人確認；未取得明確回覆前，只能寫已核准的活動內容，仍由人核准發布。' },
    ], terms: ['verification', 'disclosure'], dimension: 'ai',
    options: [
      { id: 'q7-verify', title: '查原信、改稿，再由人核准', label: '刪除未證實背書', text: '先撤掉姓名承諾，僅發布已確認的活動內容；另行詢問授權。', cost: 0, score: 3, effects: { awareness: 5, trust: 10, confirmed: 2 }, feedback: '你辨認出草稿與原始證據的差距，也把查證、授權和人類核准接成工作流程。可信內容仍能帶來適合的回應；信任增加來自更正與確認，不是因為拒用工具就比較專業。' },
      { id: 'q7-hold', title: '暫停這段，改用已確認介紹', label: '保留查核紀錄', text: '將爭議段落標為待查，先使用人工核准版本，不等名人回信才工作。', cost: 0, score: 3, effects: { awareness: 3, trust: 11, preparation: 2, confirmed: 2 }, feedback: '你將未確認事實隔離，同時保留正常宣傳，不讓等待回信阻斷全部工作。這同樣達完整查證標準；成長較保守，但明確留下待查狀態與人工核准責任。' },
      { id: 'q7-hype', title: '先印，之後再爭取本人同意', label: '以聲量換時間', text: '使用「已答應出席」與姓名，打算活動前再補齊承諾。', cost: 0, score: 0, effects: { awareness: 23, trust: -32, confirmed: 5, preparation: -4 }, feedback: '你把未證實的可能寫成已發生事實，也跳過姓名使用授權。短期聲量與回函可以上升，信任卻受損；之後即使真的邀到本人，也不能把先前的不實承諾改寫成已查證。' },
    ],
    explanation: '工具產出是草稿，不是原始證據。先查來源、區分事實與可能、取得授權、由人核准，是完整工作流；查核與暫用人工版本都可得滿分，差異在工作節奏。',
  },
  {
    id: 'salon-08', act: 3, place: 'print', npc: 3, speaker: '馬塞爾', role: '印刷店經營者',
    title: '六筆回函，不是六個座位', question: '你如何處理抽查資料，再整理目前名單？',
    scenario: '印刷店留下六筆匿名範例，讓你練習核對規則。抽查結論要用來清理真正的活動名單，而不是把六筆範例直接當成現在的人數。',
    evidence: [
      { label: '資料口徑', value: '這是獨立抽查樣本，不是目前全部即時確認名單，也不會覆寫帳冊上的有效確認總數。人物代碼均為虛構。' },
      { label: '六筆紀錄', value: '甲確認1人；甲重複寄回1人；乙表示考慮1人；丙確認本人及攜伴共2人；丁婉拒；戊確認1人。' },
      { label: '核對結果', value: '抽查有效確認為甲1＋丙2＋戊1＝4人；乙仍待確認，重複與婉拒不占席。不能把四人外推為整份名單的固定比例。' },
      { label: '現場限制', value: '整理後新增確認仍須有座位；超過36人的部分只列候補，候補不自動成為到場。' },
    ], terms: ['crm', 'funnel'], dimension: 'data',
    options: [
      { id: 'q8-clean', title: '按四人規則去重並確認席位', label: '清理現有資料', text: '依同一規則整理完整名單，分開確認、待覆與候補，不任意外推抽查比率。', cost: 0, score: 3, effects: { awareness: 2, trust: 8, preparation: 4, confirmed: 4 }, feedback: '你算對獨立樣本的四人，也把規則用於完整名單而非拿樣本覆寫總數。帳冊新增確認來自後續核對情節，若座位已滿便轉候補；這些人仍不等於當晚一定到場。' },
      { id: 'q8-contact', title: '核對規則後逐一補問未明事項', label: '清理加主動確認', text: '花10點處理待覆與攜伴細節，遵守相同去重、容量與候補規則。', cost: 10, score: 3, effects: { awareness: 3, trust: 9, preparation: 4, confirmed: 6 }, feedback: '你同樣正確核對四人抽查，並投入資源補問不明回覆，提高名單的可用性。新增人數是模擬後續確認的結果，沒有假定每位待覆都會來，也不把抽查樣本冒充全體。' },
      { id: 'q8-count', title: '每筆紙張都算一位，先加邀', label: '忽略重複與狀態', text: '把六筆當六人，用紙張數決定席位，不再確認攜伴與回覆狀態。', cost: 0, score: 0, effects: { awareness: 5, trust: -10, preparation: -8, confirmed: -3 }, feedback: '紙張數混入重複、待覆和婉拒，又漏看攜伴，不能代表有效確認。名單不清讓接待更難安排，部分原先記錄需撤回；應先統一定義與去重，再判斷是否有餘位加邀。' },
    ],
    explanation: '資料品質比名單看起來長更重要。抽查四人用來檢查計數規則，不是全體總數或外推比例；完整名單需分開確認、待回覆、攜伴與候補，避免重複計人。',
  },
  {
    id: 'salon-09', act: 3, place: 'salon', npc: 1, speaker: '艾米爾', role: '沙龍管家',
    title: '開門前，誰守入口、誰帶交流？', question: '兩位助手的最後一輪工作如何交接？',
    scenario: '馬車聲逐漸靠近。兩位助手都想幫忙，卻可能一起跑去引導作品、留下無人核對的入口。這是開場前最後一次安排。',
    evidence: [
      { label: '工作限制', value: '兩位助手、36個座位；入口與導覽同時需要照看，沒有無限加班或臨時擴場。' },
      { label: '交接條件', value: '入口以確認名單核對，滿額交由管家處理；導覽負責人照約定節奏帶交流，替班須口頭確認。' },
      { label: '開場鎖定', value: '本題提交後鎖定有效確認、信任、接待與到場。到場＝向下取整〔確認×(0.50＋0.25×信任/100＋0.25×接待/100)〕，是教學遊戲規則。' },
      { label: '候補', value: '超額確認轉候補，不超賣；本版候補不自動遞補。後三題不能回頭改變本次已到場人數。' },
    ], terms: ['responsibility', 'goals'], dimension: 'operations',
    options: [
      { id: 'q9-roles', title: '一人入口、一人導覽，管家備援', label: '責任與交接清楚', text: '寫明負責人、替班口頭確認與滿額處理，不新增座位。', cost: 0, score: 3, effects: { preparation: 16, trust: 5, awareness: 2, confirmed: 1 }, feedback: '你把任務、負責人和例外處理連在一起，減少兩邊同時空缺。新增準備與信任反映一次有效演練；開場資料現在鎖定，後續再好的回訪也不會讓已到場人數倒流增加。' },
      { id: 'q9-rehearse', title: '分段帶看，入口始終留人', label: '調整流程減少衝突', text: '入口固定一人，另一人分梯導覽，管家核准替班並公開等候方式。', cost: 0, score: 3, effects: { preparation: 18, trust: 6, awareness: 1 }, feedback: '你調整流程以配合有限人力，讓入口持續有人負責，並明定替班與等待溝通。這也是完整協作方案；沒有新增確認，但準備較充分，顯示團隊改善不只有花錢增員一條路。' },
      { id: 'q9-flexible', title: '大家看哪裡忙就去哪裡', label: '臨場互相補位', text: '不指定負責人，認為助手有經驗就能自然互補。', cost: 0, score: 1, effects: { awareness: 4, preparation: -18, trust: -10 }, feedback: '願意互相幫忙是起點，但同時到來的任務需要明確責任與交接。沒有入口負責人，名單與滿額處理容易中斷；問題在安排方式，不是助手不夠努力。' },
    ],
    explanation: '好的分工不只列任務，還要交代負責人、交接與例外。兩個完整方案都尊重容量與人力限制；第九題後的到場是已發生資料，第四幕不會重新計算。',
  },
  {
    id: 'salon-11', act: 4, place: 'salon', npc: 6, speaker: '維克多', role: '潛在贊助人',
    title: '贊助人突然要多說二十分鐘', question: '你如何回應臨時提出的長篇宣傳？',
    scenario: '贊助人站在作品旁，想臨時插入二十分鐘介紹。畫家正等著交流，來賓也依原定內容而來。管家提醒：「入口已有人等待下一段開始。」',
    evidence: [
      { label: '原承諾', value: '事前同意簡短致謝與合作揭露，沒有答應長篇商品宣傳；主活動仍是邀請函承諾的藝術交流。' },
      { label: '可談替代', value: '可保留簡短致謝，另約自願參加的交流；或先維持原流程，活動後再議合作。' },
      { label: '備援報價', value: '若尚有25點，可支援另場自願交流的引導與安排；此支出不是贊助收入，不得透支。零成本方案仍可完整協調。' },
      { label: '已發生資料', value: '今晚到場不變；現在的選擇影響活動結束的信任、準備與後續名聲。' },
    ], terms: ['stakeholders', 'responsibility'], dimension: 'operations',
    options: [
      { id: 'q11-negotiate', title: '守住主流程，談自願的替代交流', label: '共同確認調整', text: '說明來賓承諾，保留短致謝，活動後再約自願交流並由管家確認交接。', cost: 0, score: 3, effects: { awareness: 5, trust: 5, preparation: 3 }, feedback: '你承認贊助人的需求，同時守住來賓與畫家的原承諾，提出自願、可交接的替代安排。透明協調能改善信任；不是一味迎合，也不是把合作方當成必須趕走的人。' },
      { id: 'q11-boundary', title: '先照約完成，再談下一場合作', label: '明確且尊重的界線', text: '私下說明這次不插播，完成短致謝與合作揭露，活動後安排協商。', cost: 0, score: 3, effects: { awareness: 3, trust: 7, preparation: 3 }, feedback: '你用原有協議和來賓承諾說明界線，也保留後續對話，而非粗暴拒絕。這是另一種完整協調；當晚聲量提升較小，但守約與尊重可以累積更深的信任。' },
      { id: 'q11-supported', title: '另約自願交流並提供引導支援', label: '付費安排替代方案', text: '用25點支援另場引導，保留主流程與退出選擇，接受經費減少。', cost: 25, score: 3, effects: { awareness: 6, trust: 6, preparation: 10 }, feedback: '你把合作需求移到自願參與的安排，沒有侵占原定交流，也付出明確資源。這可達完整標準，但須先確認餘額；額外花費不是得滿分的條件，兩個零成本方案同樣合理。' },
      { id: 'q11-surrender', title: '出資者優先，直接延長宣傳', label: '忽略原定承諾', text: '讓贊助人講完二十分鐘，不先協調畫家、來賓與接待人員。', cost: 0, score: 0, effects: { awareness: 12, trust: -25, preparation: -12 }, feedback: '你滿足一方需求，卻直接推翻其他人的明示承諾，還留下現場等待與交接問題。名聲可能因宣傳變高，但信任與體驗下降；出資並不自動代表可以更改所有已約定內容。' },
    ],
    explanation: '協調要辨認各方受影響的承諾，提出可執行、透明的替代安排，並指派交接。前三案都可滿分，不是只有付費方案才完整；本次已到場人數維持開場紀錄。',
  },
  {
    id: 'salon-10', act: 4, place: 'cafe', npc: 5, speaker: '露易絲', role: '常客代表',
    title: '今晚之後，下一封信寄給誰？', question: '你如何安排活動後的回訪？',
    scenario: '露易絲把來賓意願分成幾疊。有人想繼續作品互評，有人願意收到入門主題；另有人只參加這一次，沒有同意後續聯繫。',
    evidence: [
      { label: '聯繫意願', value: '到場與未到場者都可能願意或不願意回訪；沒有回覆不代表同意。故事不要求輸入任何真實姓名或聯絡資料。' },
      { label: '可用內容', value: '依願意接收者的需求寄活動摘要或下一場主題；轉介紹由對方自行分享公開介紹。' },
      { label: '資料時點', value: '本次到場在開門前已鎖定。回訪影響後續關係、信任與名聲，不增加已發生的出席。' },
    ], terms: ['crm', 'disclosure'], dimension: 'relationships',
    options: [
      { id: 'q10-segment', title: '依意願與需求寄不同內容', label: '自願的分群回訪', text: '願意者收到相符摘要與停止聯繫方式；未同意者不寄，介紹連結由本人分享。', cost: 0, score: 3, effects: { awareness: 6, trust: 5 }, feedback: '你同時考慮聯繫意願與內容需求，也保留退出方式。轉介紹由來賓自願分享公開資訊，不索取朋友的個資；名聲與信任可改善，但今晚已到場人數保持不變。' },
      { id: 'q10-summary', title: '先履行答應寄送的活動摘要', label: '小而確實的後續', text: '只寄給明確索取摘要的人，另邀請自願選擇下一場主題。', cost: 0, score: 3, effects: { awareness: 4, trust: 7 }, feedback: '你先完成已答應的服務，再讓對方自行決定是否接受下一場邀請，沒有用到場推定行銷同意。這也是完整的關係經營；觸及較慢、信任較高，與大量推送形成不同節奏。' },
      { id: 'q10-all', title: '把所有名字加入連續邀請', label: '最大化聯繫數', text: '包含未回覆與婉拒者，要求每人提供三位朋友，未先確認意願。', cost: 0, score: 0, effects: { awareness: 10, trust: -12 }, feedback: '名單可接觸不等於已同意後續聯繫，也不代表可以要求朋友資料。這種作法可能短期擴大聲量，卻忽略需求與界線；應停止未授權聯繫，改用自願接收與公開分享。' },
    ],
    explanation: '關係經營重視意願、需求與承諾，而不只是名單長度。到場、未到場與願意回訪是不同維度；前兩案都可達完整標準，也都不能回頭改變本次出席。',
  },
  {
    id: 'salon-12', act: 4, place: 'study', npc: 2, speaker: '茱莉葉', role: '藝文寫作者',
    title: '把一晚經驗寫成下一步，而非神話', question: '你如何核准未來手帳產生的結案提案？',
    scenario: '手帳寫道：「本次成功完全來自海報，下次一定爆滿。」你手上有渠道選擇、測試、有效確認與開場鎖定的到場資料；一次故事不足以證明單一原因。',
    evidence: [
      { label: '可核對事實', value: '帳冊提供本次實際決策與花費，開場紀錄提供有效確認、候補、準備與到場；不得用最後信任重新計算到場。' },
      { label: '草稿問題', value: '沒有對照組能隔離海報的因果效果，也沒有證據保證下一次爆滿；不能替未執行的方案編造績效。' },
      { label: '現代遷移', value: '可把同樣做法用於校園或品牌活動：分開事實與推論，提出下一次小測試與可檢查指標。' },
      { label: '評量界線', value: '本作數值與教學分數均為課堂自訂，不是歷史實證、職涯診斷或真實行銷成效保證。' },
    ], terms: ['verification', 'experiment', 'goals'], dimension: 'ai',
    options: [
      { id: 'q12-evidence', title: '用真實帳冊改寫，再核准', label: '事實、限制、下一步', text: '核對已做決策，分開回函與到場，刪除單因果與保證，提出下一次小測試。', cost: 0, score: 3, effects: { awareness: 8, trust: 5 }, feedback: '你讓AI協助整理而非代替判斷，逐一對照本次資料，標示因果限制，再提出可檢查的下一步。可信的結案有助後續名聲與信任；它不會改寫已發生的到場或保證未來成果。' },
      { id: 'q12-audit', title: '先人工列證據表，再請工具潤稿', label: '換一條查證工作流', text: '人先整理事實、推論與待驗證問題，工具僅協助表達，最後逐句覆核。', cost: 0, score: 3, effects: { awareness: 6, trust: 7 }, feedback: '你用人工證據表設定工具的工作邊界，再逐句核准輸出，同樣完整處理查證與責任。比直接發布更花心力，但保留可追溯依據；本題分數不取決於使用AI的多寡。' },
      { id: 'q12-myth', title: '保留漂亮結論，直接對外宣告', label: '把相關寫成因果', text: '沿用「完全由海報造成、下次必定爆滿」，省略證據限制與人工覆核。', cost: 0, score: 0, effects: { awareness: 14, trust: -20 }, feedback: '你把同時發生當成單一因果，還替未來下保證。流暢結論可以擴大聲量，但無法補上證據；更正時應回到真實決策與鎖定資料，清楚區分已知、推論和需要續測的問題。' },
    ],
    explanation: '完整結案需要可核對事實、適用限制與下一步，不是讓工具寫得更像勝利故事。兩種查證工作流都可得三分；經營成果與教學參考分數各自呈現，不互相冒充。',
  },
];

export const salonGame: SalonGameDefinition = {
  id: 'paris-salon', version: 2, title: '沙龍夫人的經營筆記', subtitle: 'LE SALON DE CLAIRE',
  description: '走進約1900年的巴黎，扮演克萊兒夫人，在原創2D情境中運用現代行銷與企管方法，協調一場藝術之夜的人潮、名聲與信任。',
  category: '情境遊戲', minutes: 30, color: 'sage', icon: 'media', scenarioCount: 12, decisions,
};
