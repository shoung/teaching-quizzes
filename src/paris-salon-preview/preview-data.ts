export const views = [
  ['scene', '場景探索'], ['characters', '人物設計'], ['intro', '故事開場'], ['dialogue', '人物對話'],
  ['evidence', '閱讀資料'], ['decision', '決策卡牌'], ['feedback', '選擇回饋'],
  ['ledger', '經營帳冊'], ['handbook', '未來手帳'], ['interlude', '幕間轉場'],
  ['result', '結局與解析'], ['share', '分享樣稿'], ['exceptions', '中斷與異常'],
] as const;
export type View = typeof views[number][0];
export const places = [
  { id: 'salon', name: '克萊兒的沙龍', short: '自家沙龍', position: '0% 0%', subtitle: '讓一場相遇，成為下一次再來的理由。', person: '艾米爾', role: '沙龍管家' },
  { id: 'study', name: '午後的書房', short: '書房', position: '100% 0%', subtitle: '每一封回函，都是一個值得理解的人。', person: '露易絲', role: '常客代表' },
  { id: 'print', name: '聖日耳曼印刷店', short: '印刷店', position: '0% 100%', subtitle: '在油墨乾透之前，先想好要對誰說話。', person: '馬塞爾', role: '印刷店經營者' },
  { id: 'cafe', name: '左岸藝文咖啡館', short: '藝文咖啡館', position: '100% 100%', subtitle: '巴黎的故事，從一張小桌子開始。', person: '茱莉葉', role: '藝文寫作者' },
] as const;
export type Place = typeof places[number];
export const artUrl = `${import.meta.env.BASE_URL}images/paris-salon/environment-cartoon-v2.png`;
export const characterUrl = `${import.meta.env.BASE_URL}images/paris-salon/characters-v2.png`;
export const cast = [
  ['克萊兒', '沙龍夫人', '把不同的人，聚成一場有意思的對話。'],
  ['艾米爾', '沙龍管家', '一場好聚會，從每個細節開始。'],
  ['茱莉葉', '藝文寫作者', '好故事，要說給願意聽的人。'],
  ['馬塞爾', '印刷店經營者', '紙張有限，想法可不能含糊。'],
  ['安東', '新銳畫家', '比起掌聲，我更想聽見真心的回應。'],
  ['露易絲', '常客代表', '讓人再來的理由，比第一次邀請更重要。'],
  ['維克多', '潛在贊助人', '一次合作，也是一份需要說清楚的期待。'],
] as const;
export const cards = [
  { title: '從熟客的引薦開始', label: '關係經營', text: '邀請三位熟客，向喜歡藝術交流的朋友介紹這次聚會。', cost: '0 點', effect: '接觸較少，但彼此已有信任。' },
  { title: '與藝文寫作者合作', label: '受眾契合', text: '請茱莉葉走訪沙龍，向她的讀者介紹新銳藝術家的創作。', cost: '15 點', effect: '讀者較少，卻可能更在意你的主題。' },
  { title: '登上全城報刊', label: '廣泛觸及', text: '在大型報刊刊登廣告，讓更多巴黎人看見藝術之夜。', cost: '40 點', effect: '觸及廣泛，需評估剩餘的接待預算。' },
];
export const dimensions = [
  ['顧客洞察與定位', 83], ['目標與資源配置', 67], ['傳播與關係經營', 83],
  ['數據判讀與實驗', 67], ['AI 工作流與查證', 100], ['組織協作與危機處理', 67],
] as const;
export const endings = [
  { name: '人潮與名聲兼得', line: '今晚，巴黎記住了你的沙龍。', text: '燈火漸暗，交談卻仍未停下。賓客帶走的，不只是一張邀請函，還有下一次相聚的期待。', attendance: 30, awareness: 78, trust: 82, preparation: 80 },
  { name: '熱鬧之後的考驗', line: '人潮來了，信任仍需要照顧。', text: '你的邀請讓全城開始討論，但現場的等待與過度承諾留下遺憾。下一場，讓體驗追上名聲。', attendance: 29, awareness: 83, trust: 48, preparation: 55 },
  { name: '值得再來的小沙龍', line: '一個小圈子，一份真切的期待。', text: '來的人不多，卻聊得很深。你已建立可靠的體驗，下一步是讓更多合適的人知道。', attendance: 21, awareness: 52, trust: 86, preparation: 80 },
  { name: '下一場的起點', line: '這場相聚，留下了新的問題。', text: '邀請與接待還沒有連成一條清楚的路。從賓客真正需要的事開始，為下一場重新安排資源。', attendance: 17, awareness: 43, trust: 51, preparation: 45 },
];
export const exceptions = [
  ['可以接著經營', '你上次停在第二幕，第 4／12 個決策。正式版將提供繼續或重新開始；這裡只展示介面。'],
  ['目前無法儲存', '你仍可在這個分頁完成遊戲。重新整理或關閉後，這次進度將不會保留。'],
  ['這份進度需要重新開始', '紀錄已損壞或版本不相容。正式版只會重設這份遊戲，不影響其他測驗。'],
  ['請從第一個決策開始', '這個網址指向尚未完成的事件。正式版會帶你回到可繼續的位置。'],
  ['場景插畫暫時無法顯示', '你仍可使用任務清單閱讀資料、與角色交談及作答，不必等待圖片。'],
  ['無法自動複製', '正式版將在這裡提供可選取的完整連結，方便你手動複製。'],
] as const;
