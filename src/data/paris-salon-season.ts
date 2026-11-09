import type { QuizPreview, SalonStoryBeat } from '../types';
import type { Audience, Scale, SeasonAction, SeasonMarket, Theme } from '../paris-salon/season-types';

/** V6 的資源數字是簡化的課堂模型點數，不代表巴黎歷史帳目或真實預測。 */
export const seasonGame: QuizPreview & { version: 6 } = {
  id: 'paris-salon',
  version: 6,
  title: '沙龍夫人的經營筆記',
  subtitle: 'LE SALON DE CLAIRE',
  description: "在約 1900 年的巴黎，扮演克萊爾夫人籌辦六場沙龍。和來客聊天，選主題、分配助手與經費，再看回饋調整下一場。熟客、口碑和設施會留下來，經營方式由你決定。",
  category: '情境遊戲',
  minutes: 35,
  color: 'sage',
  icon: 'media',
  scenarioCount: 6,
};

export const seasonPrologue: SalonStoryBeat[] = [
  {
    id: 'season-opening-1', title: '一間剛起步的沙龍', speaker: '克萊爾夫人',
    text: '約1900年的巴黎，我接下這間小沙龍，盼望它成為畫家、作品愛好者與初次來賓都自在的相聚之處。接下來六場，每一次邀請與接待都會留下痕跡。',
    npc: 0, place: 'salon',
  },
  {
    id: 'season-opening-2', title: '露易斯夫人的經營筆記', speaker: '露易斯夫人',
    text: '我經營沙龍多年，知道好點子也得配合人手、席位與錢袋。每場先看當時消息和上場回饋，再選主題、優先服務的來客與規模；其他準備可以自由組合。',
    npc: 5, place: 'cafe',
  },
  {
    id: 'season-opening-3', title: '一頁來自未來的手帳', speaker: '克萊爾夫人',
    text: '書架後方有本寫著「2026」的手帳，像被魔法送來一樣。它記下需求訪談、小規模測試、活動漏斗與熟客經營；我把方法記在紙上，仍用信件、印刷品與面談辦事。',
    npc: 0, place: 'study',
  },
  {
    id: 'season-opening-4', title: '六場都是新的觀察', speaker: '露易斯夫人',
    text: '接下來六場要一邊經營、一邊學習：先依助手人數分工，忙不過來可以增聘幫手，現金、熟客、口碑、知名度與場地投資都會延續。座位和宣傳可能讓你有能力接待或觸及更多人，卻不保證需求或到場；按當時回饋調整就好。',
    npc: 5, place: 'cafe',
  },
];

export const seasonMarkets: SeasonMarket[] = [
  {
    title: '窗邊的未完成畫作',
    news: "幾位畫家想帶未完成的畫來交換意見，也有人想聽畫作背後的故事。這場要先招呼哪一群朋友？",
    preferred: 'creators', demand: 16,
    mentor: "畫家們想來聊畫，還沒確定有幾位。先問問他們，再安排座位和助手。",
  },
  {
    title: '展覽散場後的談話',
    news: "附近畫廊開了新展，有些觀眾想聽畫家聊創作。先看看誰有興趣，再確認預約和座位。",
    preferred: 'enthusiasts', demand: 20,
    mentor: "展覽散場時可以認識新朋友。之後記下誰問了詳情、誰預約、誰真的到場，看看大家在哪一步打了退堂鼓。",
  },
  {
    title: '街坊想看懂一幅畫',
    news: "街坊對藝術聚會有興趣，卻怕聽不懂。從一幅畫怎麼看起，或許大家會更敢開口。",
    preferred: 'newcomers', demand: 18,
    mentor: "先聽聽幾位街坊的想法。來信的人少，其他鄰居可能另有期待。",
  },
  {
    title: '畫家願意帶來新作',
    news: "兩位畫家願意帶新作來。可以安排互評或一起動手畫，也得留好桌面，找人幫忙照應。",
    preferred: 'creators', demand: 22,
    mentor: "先和畫家談好要做什麼，再看看座位、桌面和助手夠不夠。",
  },
  {
    title: '收藏圈交換展訊',
    news: "幾位熟客願意帶朋友來聽作品故事。先請他們轉告消息，再看看朋友有沒有回覆。",
    preferred: 'enthusiasts', demand: 24,
    mentor: "老朋友幫忙介紹後，記下有多少人詢問、預約和出席。下回就知道哪一步還需要多招呼。",
  },
  {
    title: '夏日午後的初訪邀請',
    news: "附近住戶想帶第一次看畫的朋友來。準備些容易聊的題目，等回覆後再決定辦多大。",
    preferred: 'newcomers', demand: 26,
    mentor: "六場都辦完後，把每場的安排和回饋攤開來看，挑出下次想留下、想調整的做法。",
  },
];

export const seasonAudiences: { id: Audience; title: string; need: string }[] = [
  { id: 'creators', title: '創作者', need: "想帶未完成的畫來，聽同行給些具體建議。" },
  { id: 'enthusiasts', title: '作品愛好者', need: "想聽畫家聊作品，也想交換展覽消息。" },
  { id: 'newcomers', title: '初次來賓', need: "剛開始接觸藝術，希望有人用容易懂的話帶著看。" },
];

export const seasonThemes: { id: Theme; title: string; audience: Audience; promise: string }[] = [
  { id: 'workshop', title: '作品交流工坊', audience: 'creators', promise: "帶作品來互評，一起看看還能怎麼畫。" },
  { id: 'exhibition', title: '作品故事小展', audience: 'enthusiasts', promise: "請畫家聊作品的由來，留時間讓大家提問。" },
  { id: 'discovery', title: '藝術初見午後', audience: 'newcomers', promise: "從日常生活裡看畫，第一次來也能加入話題。" },
];

/** 每場必選的 STP 基本配置；它不是額外的準備行動。 */
export const seasonPositioningLesson = "STP 就是先分清大家想要什麼（Segmentation），選定這場主要招呼誰（Targeting），再說清楚能參加什麼活動（Positioning）。先選好來客、主題和規模，再用卡牌分配助手。";

export const seasonScales: { id: Scale; title: string; cost: number; limit: number }[] = [
  { id: 'small', title: '小聚', cost: 0, limit: 12 },
  { id: 'standard', title: '常設沙龍', cost: 8, limit: 24 },
  { id: 'grand', title: '盛大之夜', cost: 18, limit: 48 },
];

export const seasonActions: SeasonAction[] = [
  {
    id: 'research', title: '詢問來客需求', category: 'insight', cost: 0, staff: 1,
    concept: '顧客研究與需求探索', basis: "先問幾位來客想聊什麼。首次安排後，下一場起的到場預估誤差由 ±3 人縮為 ±1 人。",
    tradeoff: "需 1 位助手。本季只有首次安排會縮小預估誤差，這張牌不增加知名度。",
    lesson: "顧客研究先幫你弄清楚需求，再決定活動怎麼辦。訪談人數少，記下的想法還需要後續確認。", permanent: true,
  },
  {
    id: 'participation', title: '安排參與式交流', category: 'experience', cost: 4, staff: 1,
    concept: '參與式體驗設計', basis: "安排看畫、提問或互評，讓客人也能加入話題。",
    tradeoff: "要留桌面和主持人手，也要想想這群客人願不願意參加。",
    lesson: "活動說好要一起做什麼，就得安排人帶著做。來賓才知道何時提問、怎麼參與。", permanent: false,
  },
  {
    id: 'artist', title: '邀請畫家合作', category: 'experience', cost: 16, staff: 2,
    concept: '合作價值與利害關係人協作', basis: "請畫家帶作品來，聊創作經過，和客人交換想法。",
    tradeoff: "酬謝較高，也需要 2 位助手協調。先談好分享內容、分工和作品使用同意。",
    lesson: "合作前說清楚酬勞、分工和作品使用範圍，雙方才知道要準備什麼。", permanent: false,
  },
  {
    id: 'training', title: '培訓固定助手', category: 'operations', cost: 18, staff: 2,
    concept: '人力能力建置與長期投資', basis: "培訓提升 1 級；下一場起，每場舒適接待量增加 3 人，仍受座位與規模上限限制。",
    tradeoff: "這場要付費並安排 2 位助手培訓，效果從下一場開始。固定助手的人數維持不變。",
    lesson: "培訓的好處會留到後面的場次。觀察客人還會在哪裡等候，再決定要繼續訓練或多找人幫忙。", permanent: true,
  },
  {
    id: 'helpers', title: '聘請臨時助手', category: 'operations', cost: 10, staff: 0,
    concept: '短期產能與人力排班', basis: "克萊爾請來 2 位臨時助手，立即協助本場準備，舒適接待量增加 10 人；入場仍受座位與規模限制。",
    tradeoff: "10 點只付本場報酬，下場要再請人。先說清楚誰負責哪件事。",
    lesson: "人多時可以臨時加派助手。若每場都忙不過來，就比較一下長期聘用要花多少錢。", permanent: false,
  },
  {
    id: 'recruit', title: '增聘固定助手', category: 'operations', cost: 22, staff: 0,
    concept: '人力規劃與長期用人成本', basis: '克萊爾親自辦理聘用，立即增加 1 位固定助手，最多 6 人。新助手可協助本場準備，並留到季末；舒適接待量也增加 4 人。',
    tradeoff: '22 點含這位助手本季的報酬，一次付清。越晚聘請，能幫忙的場次越少。',
    lesson: '先估算接下來幾場的工作量，再比較固定聘用與臨時幫忙的支出。', permanent: true,
  },
  {
    id: 'seats', title: '添置座椅', category: 'operations', cost: 20, staff: 2,
    concept: '容量管理與固定資產投資', basis: "本場起增加 8 席，留到季末，最多 48 席；實際入場仍受本場規模上限限制。",
    tradeoff: "要先付錢並安排 2 位助手搬放。添椅子前，看看有多少人想來、誰能幫忙接待。",
    lesson: "想擴大聚會，先把預計來客、座位和人手一起算好，避免買了椅子卻顧不上客人。", permanent: true,
  },
  {
    id: 'ambience', title: '改善沙龍環境', category: 'experience', cost: 14, staff: 1,
    concept: '服務環境與體驗品質', basis: "整理燈光和休憩角落，環境提升 1 級。下一場起，客人看畫和聊天會更自在。",
    tradeoff: "先付費並安排 1 位助手整理，下一場才見效。座位和助手人數維持不變。",
    lesson: "觀察客人坐得舒不舒服、聊不聊得起來，再決定空間要怎麼改。", permanent: true,
  },
  {
    id: 'experiment', title: '測試兩種邀請說法', category: 'insight', cost: 6, staff: 1,
    concept: "A/B 測試與小樣本判讀", basis: "同一群來客分兩組，用相同管道、相同時段各寄 10 封邀請，只改措辭，再比較回信。",
    tradeoff: "每組只有 10 封，回信差異先留作參考。本季重做這張牌不再增加效果。",
    lesson: "比較回信時，記下每組人數和寄送方式。這次寄得少，換一批客人可能結果不同。", permanent: true,
  },
  {
    id: 'promotion', title: '刊登活動消息', category: 'growth', cost: 14, staff: 1,
    concept: "宣傳管道與轉換漏斗", basis: "在適合的報刊或街坊布告欄刊登消息，讓更多人知道這場聚會。",
    tradeoff: "先看看想邀的人會在哪裡讀到消息，也要留好接待人手。",
    lesson: "轉換漏斗可以這樣看：多少人看到消息、問了詳情、預約，最後到場。分開記錄，才能找到流失較多的地方。", permanent: false,
  },
  {
    id: 'membership', title: '照顧熟客往來', category: 'growth', cost: 6, staff: 1,
    concept: '關係經營、留存與同意', basis: "先問老朋友願不願意收到消息，再寄下場通知或這次的活動摘要。",
    tradeoff: "需 1 位助手整理名冊、維持聯繫。收到通知的熟客也可能因有事而缺席。",
    lesson: "熟客留存率＝留下的舊熟客／開場前的熟客。新加入的另外記；聯繫前先取得本人同意。", permanent: false,
  },
  {
    id: 'sponsor', title: '洽談支持者贊助', category: 'growth', cost: 0, staff: 2,
    concept: '贊助合作與價值交換', basis: "支持者願意出資給主題符合主要來客的活動。選這張牌洽談，符合條件就能拿到本場贊助。",
    tradeoff: "需 2 位助手洽談。主題和主要來客不合，就拿不到贊助；接受支持後要向客人說明。",
    lesson: "先談清楚支持者想幫助誰，再檢查活動是否合適，也讓來賓知道這次由誰支持。", permanent: false,
  },
];
