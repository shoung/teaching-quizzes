import type { QuizPreview, SalonStoryBeat } from '../types';
import type { Audience, Scale, SeasonAction, SeasonMarket, Theme } from '../paris-salon/season-types';

/** V4 的資源數字是簡化的課堂模型點數，不代表巴黎歷史帳目或真實預測。 */
export const seasonGame: QuizPreview & { version: 4 } = {
  id: 'paris-salon',
  version: 4,
  title: '沙龍夫人的經營筆記',
  subtitle: 'LE SALON DE CLAIRE',
  description: '留在約1900年的巴黎，陪克萊爾夫人籌辦六場沙龍。她從一本神奇手帳讀到2026年的經營方法，逐場觀察現金、熟客、口碑、知名度與場地如何累積。自由搭配準備行動，沒有單一正解。',
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
    text: '接下來六場要一邊經營、一邊學習：每場有四個準備時段，現金、熟客、口碑、知名度與場地投資都會延續。座位和宣傳可能讓你有能力接待或觸及更多人，卻不保證需求或到場；按當時回饋調整就好。',
    npc: 5, place: 'cafe',
  },
];

export const seasonMarkets: SeasonMarket[] = [
  {
    title: '窗邊的未完成畫作',
    news: '幾位畫家打聽能否帶未完成作品交換意見；也有人想聽作品故事。先從需求出發，不必把所有來客當成一種人。',
    preferred: 'creators', demand: 16,
    mentor: '我聽到互評需求，但還不知道有多少人會赴約。把它當線索，別當保證。',
  },
  {
    title: '展覽散場後的談話',
    news: '附近畫廊新展吸引了不少作品愛好者，他們想知道畫作背後的選擇與故事。熱度可能帶來詢問，是否到場仍要看邀請和容量。',
    preferred: 'enthusiasts', demand: 20,
    mentor: '展覽帶來談話機會。邀請觸及、回覆、預約和實際出席是不同階段。',
  },
  {
    title: '街坊想看懂一幅畫',
    news: '街坊來信說，藝術聚會聽起來有趣，卻怕聽不懂行話。清楚的入門引導或許能降低第一次參加的門檻。',
    preferred: 'newcomers', demand: 18,
    mentor: '初次來賓需要清楚入口，但一次回信還不能代表整個街區。',
  },
  {
    title: '畫家願意帶來新作',
    news: '兩位創作者表示願意帶新作來交流；可安排實作或互評，也要估量接待人手與桌面空間。',
    preferred: 'creators', demand: 22,
    mentor: '意願值得跟進，承諾前先確認流程、席位和助手能否照料來客。',
  },
  {
    title: '收藏圈交換展訊',
    news: '幾位常客帶來新的展訊，願意邀朋友聽創作故事。熟客可能幫忙轉介，轉介不等於每位朋友都會預約。',
    preferred: 'enthusiasts', demand: 24,
    mentor: '口耳相傳可以擴大觸及；仍要分開邀請、詢問、預約與到場來看。',
  },
  {
    title: '夏日午後的初訪邀請',
    news: '附近住戶詢問是否能帶初次接觸藝術的朋友同行。可以做親切的入門場，也要按實際回覆安排規模。',
    preferred: 'newcomers', demand: 26,
    mentor: '這是第六次聚會，不是結論。回看六場時，記住人數和環境一直在變。',
  },
];

export const seasonAudiences: { id: Audience; title: string; need: string }[] = [
  { id: 'creators', title: '創作者', need: '想分享未完成作品、獲得具體回饋，並和同行交流。' },
  { id: 'enthusiasts', title: '作品愛好者', need: '想理解作品脈絡、創作選擇與展覽消息。' },
  { id: 'newcomers', title: '初次來賓', need: '想輕鬆接觸藝術，不必先懂專業詞彙。' },
];

export const seasonThemes: { id: Theme; title: string; audience: Audience; promise: string }[] = [
  { id: 'workshop', title: '作品交流工坊', audience: 'creators', promise: '帶一件作品來，參與有引導的交流與回饋。' },
  { id: 'exhibition', title: '作品故事小展', audience: 'enthusiasts', promise: '聽創作者談作品脈絡，再留時間提問。' },
  { id: 'discovery', title: '藝術初見午後', audience: 'newcomers', promise: '從生活觀察作品，沒有術語門檻。' },
];

/** 每場必選的 STP 基本配置；它不是額外的準備行動。 */
export const seasonPositioningLesson = '依需求區隔來客（Segmentation）、選定優先服務的受眾（Targeting），再以主題承諾清楚定位（Positioning）；三者是每場基本配置，不是準備行動。';

export const seasonScales: { id: Scale; title: string; cost: number; limit: number }[] = [
  { id: 'small', title: '小聚', cost: 0, limit: 12 },
  { id: 'standard', title: '常設沙龍', cost: 8, limit: 24 },
  { id: 'grand', title: '盛大之夜', cost: 18, limit: 48 },
];

export const seasonActions: SeasonAction[] = [
  {
    id: 'research', title: '詢問來客需求', category: 'insight', cost: 0, time: 1,
    concept: '顧客研究與需求探索', basis: '首次研究讓下一場起的到場預估由 ±3 人收斂為 ±1 人，幫助判斷是否要增加接待人手。',
    tradeoff: '占用一個時段，不直接增加人氣。本季首次研究縮窄預估；再次研究不會額外縮窄。',
    lesson: '研究累積為下一場提供方向，不會替你做決策，也不能把小樣本說成市場全貌。', permanent: true,
  },
  {
    id: 'participation', title: '安排參與式交流', category: 'experience', cost: 4, time: 1,
    concept: '參與式體驗設計', basis: '以互評、提問或共同觀察，讓來客實際參與而非只聽演說。',
    tradeoff: '需留出時間與空間；互動形式未必適合每種主題或每位來客。',
    lesson: '活動承諾要能在現場交付，參與感也需要流程與主持。', permanent: false,
  },
  {
    id: 'artist', title: '邀請畫家合作', category: 'experience', cost: 16, time: 2,
    concept: '合作價值與利害關係人協作', basis: '邀請畫家分享創作脈絡，或與來賓共同完成交流環節。',
    tradeoff: '酬謝與協調成本較高；必須確認時間、內容和作品使用同意。',
    lesson: '合作能帶來不同觀點，清楚約定責任與界線才有互惠。', permanent: false,
  },
  {
    id: 'training', title: '培訓固定助手', category: 'operations', cost: 18, time: 2,
    concept: '人力能力建置與長期投資', basis: '培訓累積一級；下一場起，基礎接待能力增加 3 人；實際接待仍受入場上限限制。',
    tradeoff: '本場需要較多投入，短期不一定立即看見效益；訓練也不替代現場分工。',
    lesson: '能力投資可能跨場受益，應看後續流程與服務是否改善。', permanent: true,
  },
  {
    id: 'helpers', title: '聘請臨時助手', category: 'operations', cost: 10, time: 1,
    concept: '短期產能與人力排班', basis: '本場接待能力增加 10 人，仍受入場上限限制；下場需重新聘請。',
    tradeoff: '每場都要重新支出與交代；臨時人手若無清楚責任，仍可能漏接工作。',
    lesson: '增加人數要配合明確角色、交接和預期來客。', permanent: false,
  },
  {
    id: 'seats', title: '添置座椅', category: 'operations', cost: 20, time: 2,
    concept: '容量管理與固定資產投資', basis: '本場起增加 8 席，永久保留，上限 48 席；仍受本場規模上限限制。',
    tradeoff: '先占用現金與準備時間；有座位不代表有人需求或能安全接待更多人。',
    lesson: '產能投資要和需求、人力及場地一起規劃，容量不是到場保證。', permanent: true,
  },
  {
    id: 'ambience', title: '改善沙龍環境', category: 'experience', cost: 14, time: 1,
    concept: '服務環境與體驗品質', basis: '整理照明與休憩角落，累積一級；下一場起改善看作品和交談的體驗。',
    tradeoff: '需要先投入費用；環境改善不能創造需求，也不能取代清楚接待。',
    lesson: '服務場景會影響體驗，但感受和人數是不同的觀察面向。', permanent: true,
  },
  {
    id: 'experiment', title: '測試兩種邀請說法', category: 'insight', cost: 6, time: 1,
    concept: '訊息實驗與證據限制', basis: '同渠道、同時段各寄出 10 封，只改變邀請措辭，記錄兩組回函。',
    tradeoff: '每組僅 10 封，不足以宣稱顯著或必然成效；本季再次測試不再增加模型效益。',
    lesson: '把小樣本測試當作下一步線索，報告樣本、條件與限制，不宣稱必然成效。', permanent: true,
  },
  {
    id: 'promotion', title: '刊登活動消息', category: 'growth', cost: 14, time: 1,
    concept: '渠道宣傳與轉換漏斗', basis: '在合適的報刊或社區張貼消息，增加可能看見邀請的人數。',
    tradeoff: '觸及不等於詢問、預約或到場；需配合主題與可接待容量。',
    lesson: '分別觀察觸及、詢問、預約和出席，宣傳不保證每一層轉換。', permanent: false,
  },
  {
    id: 'membership', title: '照顧熟客往來', category: 'growth', cost: 6, time: 1,
    concept: '關係經營、留存與同意', basis: '按來客意願寄送下一場消息或活動摘要，維持熟悉的往來。',
    tradeoff: '需要整理名冊和持續照料；未同意聯繫者不應被加入，熟客也可能缺席。',
    lesson: '既有熟客留存＝留住的既有熟客／本場開始前熟客；新增熟客另行計算，並尊重每位來客的聯繫意願。', permanent: false,
  },
  {
    id: 'sponsor', title: '洽談支持者贊助', category: 'growth', cost: 0, time: 2,
    concept: '贊助合作與價值交換', basis: '支持者已提出條件：主題承諾要符合主受眾；選擇洽談並符合條件，本場提供支持金。',
    tradeoff: '協商占用兩個準備時段；承諾與受眾不合則無贊助。本模型簡化為條件式支持，仍須揭露合作。',
    lesson: '贊助收入取決於行動選擇和合作契合條件；仍須揭露支持並守住對來客和藝術家的承諾。', permanent: false,
  },
];
