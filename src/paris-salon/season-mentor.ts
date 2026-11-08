import type { SeasonReplay, SeasonSession } from './season-types';

/** Contextual coaching, not an optimal-policy solver or a hidden answer key. */
export function getMentorAdvice(session: SeasonSession, replay: SeasonReplay): string {
  const { assets, events } = replay;
  const last = events.at(-1);
  if (session.plans.length === 5) return `這是本季最後一場。${assets.cash < 20 ? `錢袋只剩 ${assets.cash} 點，可選免費小聚。` : ''}新培訓與環境改善要下場才受益；比較當場接待和擴座的需要，別只因還有錢就投資。`;
  if (last && last.after.awareness < last.before.awareness) return `上一場知名度由 ${last.before.awareness} 降至 ${last.after.awareness}；${last.attendance} 位到場，舒適接待量是 ${last.safeCapacity}，另有 ${last.waiting} 位候補。宣傳沒有抵銷接待壓力或等待的失望；錢袋還有 ${assets.cash} 點，先調整人手與規模，再決定是否宣傳。`;
  if (last && last.after.awareness > last.before.awareness) return `上一場回饋帶動知名度由 ${last.before.awareness} 升至 ${last.after.awareness}。這是口耳推薦的訊號，不代表每位聽過消息的人都會預約；仍要按本場容量安排接待。`;
  if (assets.cash < 20) return `錢袋剩 ${assets.cash} 點。免費小聚能保留周轉並取得來客支持；先比較本場必要支出，再決定哪些投資可以等一等。`;
  if (last && last.attendance > last.safeCapacity) return `上一場來了 ${last.attendance} 人，舒適接待量只有 ${last.safeCapacity} 人。人手或規模需要重新搭配；座位再多也不能代替服務。`;
  if (last && last.waiting > 0) return `上一場有 ${last.waiting} 人候補。擴座可改善入場限制，但先比對人手與需求，免得把門外的等待換成場內的失望。`;
  if (last && last.attendance < last.seatCapacity / 2) return `上一場只用了 ${last.attendance}／${last.seatCapacity} 席。先看主題是否切合來客，再比較研究與宣傳；擴座目前未必解決問題。`;
  if (last && last.satisfaction < 65) return `上一場體驗回饋 ${last.satisfaction}／100。試著核對主題承諾、來客需求與接待負荷，找出值得調整的一環。`;
  if (!last) return '先選主題、受眾和規模，再看看助手人數，分配準備工作。你可以自由組合；研究、體驗、人手與宣傳都會占用不同資源。';
  return `上一場留下 ${last.retained}／${last.before.regulars} 位既有熟客，另有 ${last.newRegulars} 位新熟客。人數、體驗與結餘要一起看；這場想延續什麼，又想改變什麼？`;
}
