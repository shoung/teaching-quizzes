import type { SeasonEvent, SeasonReplay } from '../paris-salon/season-types';
import type { ConversationContext, DialogueLine, EventVoices, HudMetricKey, MetricHelp, NpcConversation, RoundScene, SalonNpcId } from '../paris-salon/rpg-types';
import { seasonAudiences, seasonMarkets, seasonThemes } from './paris-salon-season';
import { guestTalk, claireReplies } from './paris-salon-npc-dialogue';
import { getMentorDialogue } from './paris-salon-mentor-dialogue';

/** Each scene keeps the familiar salon places and places guests at different depths. */
export const seasonScenes: RoundScene[] = [
  { number: 1, place: 'salon', npcs: [
    { id: 5, name: '露易斯夫人', role: '沙龍主人', x: 40, y: 78, size: 27, facing: 'right' },
    { id: 2, name: '茱莉葉', role: '藝文寫作者', x: 63, y: 89, size: 32, facing: 'left' },
    { id: 1, name: '艾米爾', role: '沙龍管家', x: 83, y: 81, size: 28, facing: 'left' },
  ] },
  { number: 2, place: 'study', npcs: [
    { id: 5, name: '露易斯夫人', role: '沙龍主人', x: 40, y: 78, size: 27, facing: 'left' },
    { id: 4, name: '安東', role: '新銳畫家', x: 63, y: 89, size: 32, facing: 'right' },
    { id: 6, name: '維克多', role: '潛在支持者', x: 83, y: 81, size: 28, facing: 'left' },
  ] },
  { number: 3, place: 'print', npcs: [
    { id: 5, name: '露易斯夫人', role: '沙龍主人', x: 40, y: 78, size: 27, facing: 'right' },
    { id: 3, name: '馬塞爾', role: '印刷店經營者', x: 63, y: 89, size: 32, facing: 'left' },
    { id: 2, name: '茱莉葉', role: '藝文寫作者', x: 83, y: 81, size: 28, facing: 'right' },
  ] },
  { number: 4, place: 'cafe', npcs: [
    { id: 5, name: '露易斯夫人', role: '沙龍主人', x: 40, y: 78, size: 27, facing: 'left' },
    { id: 4, name: '安東', role: '新銳畫家', x: 63, y: 89, size: 32, facing: 'right' },
    { id: 1, name: '艾米爾', role: '沙龍管家', x: 83, y: 81, size: 28, facing: 'left' },
  ] },
  { number: 5, place: 'salon', npcs: [
    { id: 5, name: '露易斯夫人', role: '沙龍主人', x: 40, y: 78, size: 27, facing: 'right' },
    { id: 2, name: '茱莉葉', role: '藝文寫作者', x: 63, y: 89, size: 32, facing: 'left' },
    { id: 6, name: '維克多', role: '潛在支持者', x: 83, y: 81, size: 28, facing: 'right' },
  ] },
  { number: 6, place: 'study', npcs: [
    { id: 5, name: '露易斯夫人', role: '沙龍主人', x: 40, y: 78, size: 27, facing: 'left' },
    { id: 3, name: '馬塞爾', role: '印刷店經營者', x: 63, y: 89, size: 32, facing: 'right' },
    { id: 1, name: '艾米爾', role: '沙龍管家', x: 83, y: 81, size: 28, facing: 'left' },
  ] },
];

const names: Record<SalonNpcId, string> = { 1: '艾米爾', 2: '茱莉葉', 3: '馬塞爾', 4: '安東', 5: '露易斯夫人', 6: '維克多' };
const guestClues: Record<string, string> = {
  '1-1': '兩位畫家想談未完成作品，日期仍待確認。', '1-2': '展廳有人好奇創作過程，回函尚未可知。',
  '2-4': '散場觀眾談起新展，來訪日期還沒消息。', '2-6': '觀眾想聽作品故事，邀請尚未送到手上。',
  '3-3': '街坊擔心陌生詞，簡單邀請或許更親切。', '3-2': '展廳有人想知道如何開始看畫。',
  '4-4': '兩位畫家願帶新作，日期和流程待確認。', '4-1': '畫家有意分享新作，仍得留心接待安排。',
  '5-2': '熟客願轉告展訊，朋友是否預約仍未知。', '5-6': '可以代為介紹畫家，聚會安排仍要合宜。',
  '6-3': '住戶詢問能否帶朋友，尚無確定人數。', '6-1': '鄰居對聚會好奇，還沒回覆是否同行。',
};

function line(speaker: string, text: string, portrait = 0): DialogueLine { return { speaker, portrait, text }; }
export function getNpcConversation(eventNumber: number, npcId: SalonNpcId, context: ConversationContext): NpcConversation {
  if (!Number.isInteger(eventNumber) || eventNumber < 1 || eventNumber > 6) throw new RangeError('eventNumber must be 1..6');
  if (!seasonScenes[eventNumber - 1].npcs.some((npc) => npc.id === npcId)) throw new Error(`NPC ${npcId} is not present in round ${eventNumber}`);
  if (npcId === 5) {
    return { npcId, clue: '把上場數字、可用資源與準備時段一起放進帳冊。', lines: getMentorDialogue(eventNumber, context) };
  }
  const texts = guestTalk[eventNumber]?.[npcId];
  if (!texts) throw new Error(`No conversation for round ${eventNumber}, NPC ${npcId}`);
  const replies = claireReplies[`${eventNumber}-${npcId}`] ?? [];
  const lines = texts.flatMap((text, index) => [
    line(names[npcId], text, npcId),
    ...replies.filter(reply => reply.after === index).map(reply => line('克萊爾夫人', reply.text)),
  ]);
  return { npcId, clue: guestClues[`${eventNumber}-${npcId}`], lines };
}

export function getOpeningDialogue(): DialogueLine[] {
  return [
    line('克萊爾夫人', '露易斯夫人，妳來啦！椅子這樣擺行嗎？'),
    line('露易斯夫人', '先坐一下，妳從早上忙到現在了吧？', 5),
    line('克萊爾夫人', '這季第一次開門，我想讓大家以後都願意來。'),
    line('克萊爾夫人', '可光是茶杯該放哪，我就拿不定主意。'),
    line('露易斯夫人', '我頭一回也忙得團團轉。來，一件一件弄。', 5),
    line('克萊爾夫人', '畫家們會喜歡這裡嗎？'),
    line('露易斯夫人', '去和他們聊聊呀，今天幾位朋友都到了。', 5),
    line('克萊爾夫人', '開門前就這點工夫，我得想想先張羅哪幾樣。'),
    line('露易斯夫人', '錢和來客的回應記在帳上，下回張羅就有底。', 5),
    line('克萊爾夫人', '好，那我先去打聲招呼。'),
    line('露易斯夫人', '去吧，我在這兒喝杯茶，等妳的消息。', 5),
  ];
}

export function getEndingDialogue(replay: SeasonReplay): DialogueLine[] {
  const { events, assets } = replay;
  const satisfied = events.filter(event => event.satisfaction >= 65).length;
  const crowded = events.some(event => event.attendance > event.safeCapacity);
  const waiting = events.some(event => event.waiting > 0);
  const firstRegulars = events[0]?.before.regulars ?? assets.regulars;
  if (events.length > 0 && satisfied === 0) return [
    line('露易斯夫人', '屋裡都收好了。妳先別急著算帳，坐下喝點熱茶。', 5),
    line('克萊爾夫人', '我原先想讓大家常常來，幾場下來，卻覺得越辦越沒把握。'),
    line('露易斯夫人', '客人沒盡興，妳心裡也放不下吧。是哪一晚讓妳最難受？', 5),
    line('克萊爾夫人', crowded ? '有一晚我忙得顧不上人。等想起來要招呼，大家都準備走了。' : '我老在想，下次再辦，他們還會願意來嗎？'),
    line('露易斯夫人', '先找幾位朋友聽聽吧。等妳想再辦，我陪妳一起準備。', 5),
    line('克萊爾夫人', assets.cash < 20 ? '錢也快用完了。下回我先留茶葉和工錢，想添的東西晚點買。' : '好，我想再試試。這回先問問他們，坐在這裡到底想聊什麼。'),
    line('露易斯夫人', '今晚辛苦了。把帳本放這兒，明天我們再慢慢看。', 5),
    line('克萊爾夫人', '妳下回還來嗎？我想把靠窗那張椅子留給妳。'),
    line('露易斯夫人', '會。我喜歡那個位子。', 5),
  ];
  const reflection = crowded
    ? '有一晚忙得連誰剛進門都記不清。下回我想找個人幫艾米爾迎客。'
    : waiting
      ? '門外那幾位我一直惦記著。下回得早點和艾米爾把座位喬好。'
      : satisfied <= events.length / 2
        ? '有些話題大家接不下去。我想再找幾位來客喝茶，問問他們的感覺。'
        : '大家聊得最投入的那段，我想留下來。換主題時也先問問老朋友。';
  const mentorReflection = satisfied === 0
    ? '有幾晚確實沒辦好，我知道妳也懊惱。我們把當時的安排攤開來看看。'
    : satisfied === 1
      ? '有一場大家挺自在，就從那場想起吧。妳當時做了什麼？'
      : '順利的那幾場，妳也記住了吧？下回張羅時，可以拿出來翻翻。';
  const relationship = assets.regulars > firstRegulars
    ? '熟客名冊比頭一場長了。有人願意回來找妳，這份交情慢慢顧著。'
    : assets.regulars < firstRegulars
      ? '有幾位後來沒再留下。我們找機會問候一下，也聽聽他們怎麼想。'
      : '老朋友的名字先留好。下次問候時，提一提他們上回聊到的事。';
  return [
    line('露易斯夫人', '先把茶壺放下，妳也坐一會兒吧。這季六場都忙完了。', 5),
    line('克萊爾夫人', '剛剛還在想下一壺茶，現在突然安靜下來，真有點不習慣。'),
    line('露易斯夫人', '還記得頭一場，妳站在門口問我，這些椅子該怎麼擺。', 5),
    line('克萊爾夫人', reflection),
    line('露易斯夫人', mentorReflection, 5),
    line('露易斯夫人', relationship, 5),
    line('克萊爾夫人', assets.cash < 20 ? '下回我先把茶葉和工錢留好，想添的東西晚點買也行。' : '我先把帳收好，再寫信問問朋友，下回想來聊些什麼。'),
    line('露易斯夫人', '好呀。等妳想好要怎麼辦，記得留張椅子給我。', 5),
  ];
}

export function getEventVoices(event: SeasonEvent): EventVoices {
  const over = event.attendance > event.safeCapacity;
  const theme = seasonThemes.find(item => item.id === event.plan.theme);
  const audience = seasonAudiences.find(item => item.id === event.plan.audience)?.title ?? '朋友';
  const preferred = seasonAudiences.find(item => item.id === seasonMarkets[event.number - 1]?.preferred)?.title ?? '來客';
  const mismatchedTheme = theme && theme.audience !== event.plan.audience;
  const mismatchedMarket = seasonMarkets[event.number - 1]?.preferred !== event.plan.audience;
  const actions = event.plan.actions;
  const needs = {
    creators: '想找人討論作品的畫家',
    enthusiasts: '想聽作品故事的朋友',
    newcomers: '頭一回接觸藝術的鄰居',
  };
  const activities = { workshop: '大家動手改畫', exhibition: '畫家輪著講作品', discovery: '從頭介紹怎麼看畫' };
  const guest = event.waiting > 0
    ? '我進門時，後面還有人站在外頭。下回能和他們一起坐就好了。'
    : over
      ? '等了好一陣才喝到茶，想問畫家的事也沒輪到我。下回能留點聊天的時間嗎？'
      : mismatchedTheme
        ? event.plan.audience === 'enthusiasts'
          ? '我本來想聽作品的故事，大家聊起畫法，我好多地方都接不上。'
          : event.plan.audience === 'creators'
            ? '我還帶了張小稿，想請人幫我看一眼，聊著聊著都沒拿出來。'
            : '我才剛開始看畫，好幾個詞都聽不懂。剛剛一直想找個空檔問問。'
        : event.satisfaction >= 75
          ? '剛剛那段我還沒聊完呢！下回能接著問畫家嗎？'
          : event.satisfaction >= 60
            ? '今天認識了幾位朋友，下次我想多聽聽他們怎麼看那幅畫。'
            : '今天聊著有點拘謹，我好多話都沒說出來。下回能從簡單的問題開始嗎？';

  let mentor = event.satisfaction >= 70
    ? '這回聊得挺順。妳還記得，是哪個安排讓大家開始接話的？'
    : '今天有些地方沒接起來。妳先說說，哪一段最讓妳拿不定主意？';
  let advice = '這回好用的安排先留著，下次挑一件想試的事。辦完再來比一比。';
  if (event.waiting > 0) {
    mentor = '門外那幾位得記在心上。妳和艾米爾先看看，卡住的是位子還是人手。';
    advice = event.plan.scale === 'small'
      ? '這回辦小聚，能坐的位子有限。下場換成常設沙龍前，先把接待人手排好。'
      : '下回先對一下座位和人手。椅子夠、人也照應得過來，再多接待些朋友。';
  } else if (over) {
    mentor = '人一多，迎客、添茶都擠在一起了。下回找個人幫艾米爾搭把手吧。';
    advice = actions.includes('promotion')
      ? '宣傳把人帶來了，接待卻忙不過來。下回先找助手，再決定消息要傳多遠。'
      : '這回接待有點吃力。下場先找助手幫忙，或把規模收小一些。';
  } else if (event.after.cash < 20) {
    const expense = actions.includes('training') ? '教助手的那筆錢' : actions.includes('seats') ? '新椅子那筆錢' : actions.includes('ambience') ? '整理房間那筆錢' : '這幾場的開銷';
    mentor = `先把帳攤開吧，${expense}都記好了嗎？茶葉和工錢得留一份。`;
    advice = '手頭有點緊，下場先辦小聚。茶葉錢留好，添置的事可以晚些做。';
  } else if (mismatchedTheme) {
    mentor = `妳請了${needs[event.plan.audience]}，這回卻是${activities[event.plan.theme]}。大家跟得上嗎？`;
    advice = '下回先問問這群朋友想怎麼聊，再挑主題。參與的方式也一起想想。';
  } else if (mismatchedMarket) {
    mentor = `這回妳主邀${audience}。聽到${preferred}那邊的消息時，妳有想過找他們聊聊嗎？`;
    advice = '下場先聽聽新消息，問清楚附近的人想聊什麼，再決定要請誰。';
  } else if (event.satisfaction < 65) {
    advice = '找幾位客人問問吧：哪裡聊得起來、哪裡接不上？下回先改那一段。';
  } else if (event.attendance < event.safeCapacity * 0.55) {
    advice = '屋裡還有空位。先聽聽朋友想來做什麼，椅子可以等有需要時再添。';
  } else if (actions.includes('participation')) {
    advice = '互評讓大家開了口，這個安排可以留著。下回再聽聽新來客想談什麼。';
  }
  const actualAwarenessChange = event.after.awareness - event.before.awareness;
  const cashNote = event.after.cash < 20
    ? '我算好帳了，錢袋快見底。下回先留茶水和工錢，其他花費緩一緩。'
    : event.profit < 0
      ? '我算了帳，這回花出去的比較多。添置的東西和今晚開銷，我分開記好了。'
      : event.profit === 0
        ? '帳算好了，這回收支剛好打平。茶水、來客和每筆花費，我都記下了。'
        : '帳算好了，這回還有些餘錢。我先收起來，下回要用時咱們再商量。';
  const awarenessNote = actualAwarenessChange > 0
    ? '街坊提起我們的次數又多了。'
    : actualAwarenessChange < 0
      ? '外頭有些抱怨，我也記下來了。'
      : '外頭的反應和上回差不多。';
  const serviceNote = event.waiting > 0
    ? '帳先收好，門口等著那幾位我也記下了。下回把位子和接待一起安排妥當。'
    : over
      ? '剛剛收杯子時，又有人找我拿外套，手都空不出來。下回找人幫我迎客好嗎？'
      : event.satisfaction < 60
        ? '剛剛幾位客人說聊不太開，我把他們的話記下了。下回想怎麼調，咱們一起想。'
        : null;
  return { guest, mentor, assistant: serviceNote ?? `${cashNote}${awarenessNote}`, next: event.number < 6 ? advice : '六場都辦完了。先收好帳本，坐下來和露易斯夫人聊聊吧。' };
}

export const metricHelp: Record<HudMetricKey, MetricHelp> = {
  cash: { label: '現金', incoming: '到場支持、熟客往來與符合條件的贊助會增加結餘。', outgoing: '場租規模與行動會扣款；現金決定哪些組合付得起。' },
  regulars: { label: '熟客', incoming: '滿意的新來客可成為熟客；留住舊客會增加下次回訪與支持。', outgoing: '未留住的舊客會流失；熟客數不等於本場到場數。' },
  reputation: { label: '口碑', incoming: '滿意體驗會累積口碑，並提高往後詢問活動的比例。', outgoing: '失望和等待會降低口碑；宣傳不能替差的體驗補分。' },
  awareness: { label: '知名度', incoming: '宣傳與良好表現可提升知名度，讓更多人可能看到邀請。', outgoing: '接待失誤、失望或未服務需求會拉低知名度與後續觸及。' },
  seats: { label: '座位', incoming: '添置座椅永久加八席，增加可入場上限，仍受活動規模限制。', outgoing: '座位不是需求或舒適量；人手不足仍會令體驗受壓。' },
  training: { label: '培訓', incoming: '每級從下場起增加三人舒適接待力，也略增預約與到場率。', outgoing: '培訓花現金和時段；本場人手與接待上限不變。' },
  ambience: { label: '環境', incoming: '改善環境從下場起提升基礎滿意度，幫助口碑與留存。', outgoing: '改善花費現金；不增加觸及、需求、座位或人手。' },
};
