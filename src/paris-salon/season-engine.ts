import { seasonActions, seasonAudiences, seasonMarkets, seasonScales, seasonThemes } from '../data/paris-salon-season';
import { seasonScenes } from '../data/paris-salon-rpg';
import type { ActionId, Audience, Scale, SeasonAction, SeasonAssets, SeasonEvent, SeasonForecast, SeasonPlan, SeasonReplay, SeasonRoute, SeasonSession, Theme } from './season-types';
import { SEASON_ENDING, SEASON_INTRO, SEASON_LENGTH, SEASON_PLAY, SEASON_RESULT, SEASON_VERSION } from './season-types';
export { SEASON_ENDING, SEASON_INTRO, SEASON_LENGTH, SEASON_PLAY, SEASON_RESULT, SEASON_STORAGE_KEY, SEASON_VERSION } from './season-types';
export type { SeasonPlan, SeasonSession } from './season-types';

const actionById = new Map(seasonActions.map(action => [action.id, action]));
const themeById = new Map(seasonThemes.map(theme => [theme.id, theme]));
const scaleById = new Map(seasonScales.map(scale => [scale.id, scale]));
const audiences = new Set<Audience>(['creators', 'enthusiasts', 'newcomers']);
const themes = new Set<Theme>(seasonThemes.map(theme => theme.id));
const scales = new Set<Scale>(seasonScales.map(scale => scale.id));
const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function defaultPlan(): SeasonPlan {
  return { audience: 'creators', theme: 'workshop', scale: 'small', actions: [] };
}

function freshAssets(): SeasonAssets {
  return { cash: 100, regulars: 4, reputation: 40, awareness: 50, seats: 24, training: 0, ambience: 0, insight: 0, tested: false };
}

export function initialSeason(): SeasonSession {
  return { version: SEASON_VERSION, started: false, plans: [], acknowledged: 0, draft: defaultPlan(), heard: {}, endingSeen: false };
}

function clonePlan(plan: SeasonPlan): SeasonPlan {
  return { audience: plan.audience, theme: plan.theme, scale: plan.scale, actions: [...plan.actions] };
}

function validatePlan(plan: unknown, assets: SeasonAssets): { plan?: SeasonPlan; issues: string[]; cost: number; time: number } {
  const issues: string[] = [];
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) return { issues: ['請選擇本場受眾、主題與規模。'], cost: 0, time: 0 };
  const value = plan as Record<string, unknown>;
  if (!audiences.has(value.audience as Audience)) issues.push('受眾設定無效，請重新選擇。');
  if (!themes.has(value.theme as Theme)) issues.push('主題設定無效，請重新選擇。');
  if (!scales.has(value.scale as Scale)) issues.push('活動規模無效，請重新選擇。');
  if (!Array.isArray(value.actions) || value.actions.some(id => typeof id !== 'string' || !actionById.has(id as ActionId))) {
    issues.push('準備行動包含無效項目。');
  }
  const actions = Array.isArray(value.actions) ? value.actions as string[] : [];
  if (new Set(actions).size !== actions.length) issues.push('每項準備行動每場只能安排一次。');
  const selected = actions.map(id => actionById.get(id as ActionId)).filter((item): item is SeasonAction => Boolean(item));
  if (assets.training >= 3 && actions.includes('training')) issues.push('助手培訓最多累積三階，這次先改用其他準備。');
  if (assets.ambience >= 3 && actions.includes('ambience')) issues.push('環境改善已達三階上限，請替本場安排別的行動。');
  if (assets.seats >= 48 && actions.includes('seats')) issues.push('座位已達四十八席上限，這次不必再擴座。');
  const scale = scaleById.get(value.scale as Scale);
  const cost = (scale?.cost ?? 0) + selected.reduce((sum, action) => sum + action.cost, 0);
  const time = selected.reduce((sum, action) => sum + action.time, 0);
  const timeLimit = 4;
  if (time > timeLimit) issues.push(`準備需要 ${time} 小時，超過本場 ${timeLimit} 小時可用時間。`);
  if (cost > assets.cash) issues.push(`預算不足：本場需 ${cost}，手上只有 ${assets.cash}。可改辦免費小聚恢復資金。`);
  if (issues.length) return { issues, cost, time };
  return { plan: { audience: value.audience as Audience, theme: value.theme as Theme, scale: value.scale as Scale, actions: selected.map(action => action.id) }, issues, cost, time };
}

function marketFor(eventNumber: number) { return seasonMarkets[eventNumber - 1]; }
function hasAction(plan: SeasonPlan, id: ActionId) { return plan.actions.includes(id); }
function themeFit(plan: SeasonPlan) { return themeById.get(plan.theme)?.audience === plan.audience; }

function estimate(before: SeasonAssets, plan: SeasonPlan, eventNumber: number) {
  const market = marketFor(eventNumber);
  const matched = market.preferred === plan.audience;
  const fit = themeFit(plan);
  const promo = hasAction(plan, 'promotion');
  const artist = hasAction(plan, 'artist');
  const helper = hasAction(plan, 'helpers');
  const experimentalFit = before.tested && promo && (matched || fit);
  const reach = Math.max(6, Math.round(market.demand + 12 + (before.awareness - 50) * 0.65 + (promo ? 18 : 0) + (artist && fit ? 8 : 0) + (experimentalFit ? 5 : 0)));
  const inquiryRate = 0.5 + (matched ? 0.1 : 0) + (before.reputation - 40) / 250;
  const inquiries = Math.max(0, Math.round(reach * inquiryRate));
  const reservations = Math.max(0, Math.round(inquiries * (0.6 + (fit ? 0.08 : 0) + before.training * 0.015)));
  const scale = scaleById.get(plan.scale)!;
  const projectedSeats = Math.min(48, before.seats + (hasAction(plan, 'seats') ? 8 : 0));
  const seatCapacity = Math.min(projectedSeats, scale.limit);
  const safeCapacity = Math.min(seatCapacity, 12 + before.training * 3 + (helper ? 10 : 0));
  const regularReturnRate = hasAction(plan, 'membership') ? 0.68 : 0.5;
  const returning = Math.min(before.regulars, Math.floor(before.regulars * regularReturnRate));
  const showRate = 0.8 + (fit ? 0.05 : 0) + before.training * 0.01;
  const arrived = Math.max(0, Math.round(reservations * showRate));
  const attendance = Math.min(arrived + returning, seatCapacity);
  const returningPresent = Math.min(returning, attendance);
  const newGuests = Math.min(arrived, Math.max(0, attendance - returningPresent));
  const serviceOverload = Math.max(0, attendance - safeCapacity);
  const baseSatisfaction = 58 + (matched ? 9 : -3) + (fit ? 7 : 0) + before.ambience * 4 + before.training * 2;
  const participation = hasAction(plan, 'participation');
  const satisfaction = clamp(baseSatisfaction + (participation ? 9 : 0) + (artist ? 3 : 0) - serviceOverload * 2);
  const recommendation = satisfaction >= 70 ? 3 : satisfaction >= 60 ? 1 : -2;
  const awarenessChange = recommendation + (promo && satisfaction >= 70 ? 2 : 0)
    - Math.ceil(serviceOverload / 3) * 2 - Math.ceil(Math.max(0, arrived + returning - seatCapacity) / 4);
  const retainedRate = clamp(0.48 + (satisfaction - 60) / 100 + (hasAction(plan, 'membership') ? 0.12 : 0), 0.2, 0.9);
  const retained = Math.min(before.regulars, Math.floor(before.regulars * retainedRate));
  const newRegulars = Math.min(newGuests, Math.floor(newGuests * clamp(0.12 + (satisfaction - 55) / 120, 0.05, 0.5)));
  return { reach, inquiries, reservations, attendance, waiting: Math.max(0, arrived + returning - attendance), returning: returningPresent, newGuests, retained, newRegulars, satisfaction, awarenessChange, safeCapacity, seatCapacity, matched, fit, experimentalFit };
}

function applyPlan(before: SeasonAssets, plan: SeasonPlan, eventNumber: number): SeasonEvent {
  const measure = estimate(before, plan, eventNumber);
  const scale = scaleById.get(plan.scale)!;
  const selected = plan.actions.map(id => actionById.get(id)!);
  const actionCost = selected.reduce((sum, action) => sum + action.cost, 0);
  const baseCost = scale.cost;
  const support = measure.attendance * (measure.matched ? 2 : 1);
  const members = measure.returning * (hasAction(plan, 'membership') ? 3 : 1);
  const sponsor = hasAction(plan, 'sponsor') && measure.fit ? Math.max(4, measure.attendance) : 0;
  const totalIncome = support + members + sponsor;
  const totalCost = baseCost + actionCost;
  let after: SeasonAssets = {
    cash: Math.max(0, before.cash - totalCost + totalIncome),
    regulars: clamp(measure.retained + measure.newRegulars, 0, 100),
    reputation: clamp(before.reputation + Math.round((measure.satisfaction - 60) / 8) + (hasAction(plan, 'artist') ? 2 : 0) - Math.ceil(measure.waiting / 4)),
    awareness: clamp(before.awareness + measure.awarenessChange),
    seats: before.seats, training: before.training, ambience: before.ambience,
    insight: before.insight + (hasAction(plan, 'research') ? 1 : 0), tested: before.tested || hasAction(plan, 'experiment'),
  };
  if (hasAction(plan, 'training')) after.training = Math.min(3, after.training + 1);
  if (hasAction(plan, 'ambience')) after.ambience = Math.min(3, after.ambience + 1);
  if (hasAction(plan, 'seats')) after.seats = Math.min(48, after.seats + 8);
  const notes: string[] = [];
  if (!measure.matched) notes.push('市場偏好與邀請受眾不同，宣傳帶來詢問但轉成預約較少。');
  if (measure.waiting > 0) notes.push(`有 ${measure.waiting} 位賓客未能入場，實體座位成為瓶頸。`);
  if (measure.attendance > measure.safeCapacity) notes.push(`實際到場超過舒適接待量 ${measure.safeCapacity} 人，服務品質受到壓力。`);
  else if (measure.attendance < measure.safeCapacity * 0.55) notes.push('接待量有餘裕；下場可先確認需求，再決定是否擴座。');
  if (hasAction(plan, 'sponsor')) notes.push(measure.fit ? '贊助與主題相合，帶來額外收入。' : '本場主題與贊助品牌不合，未取得贊助收入。');
  if (hasAction(plan, 'research')) {
    const nextMarket = marketFor(eventNumber + 1);
    const audienceTitle = nextMarket ? seasonAudiences.find(item => item.id === nextMarket.preferred)?.title ?? '來客' : '下一季';
    notes.push(`研究紀錄留給後續預估參考（下一場偏好線索：${audienceTitle}），不會直接增加知名度。`);
  }
  if (hasAction(plan, 'experiment')) {
    const replyA = 4;
    const replyB = 3;
    notes.push(`模擬的小樣本比較：同一受眾分兩組，各寄出 10 封，同渠道同時段；A 寫明主題承諾、B 僅說藝術聚會。A 回覆 ${replyA}/10，B 回覆 ${replyB}/10。樣本很小，差異不是因果證明；後續模型只在契合受眾並選擇宣傳時，假設可多觸及少量人。`);
  }
  if (measure.experimentalFit) notes.push('你把先前測試的訊息用在契合受眾與渠道，詢問轉換略有改善。');
  if (after.cash === 0 && totalIncome < totalCost) notes.push('現金已用盡，下場可用免費小型聚會慢慢恢復。');
  const lessons = selected.map(action => ({ action: action.id, concept: action.concept, text: `${action.lesson} 本場結果：${lessonResult(action, measure, after, before)}。` }));
  const event: SeasonEvent = {
    number: eventNumber, plan: clonePlan(plan), before: { ...before }, after, ...measure,
    income: { support, members, sponsor, total: totalIncome },
    costs: { base: baseCost, actions: actionCost, total: totalCost }, profit: totalIncome - totalCost,
    notes, lessons,
  };
  // Keep the detached before/after snapshots safe from caller mutation.
  event.before = { ...before };
  return event;
}

function lessonResult(action: SeasonAction, event: ReturnType<typeof estimate>, after: SeasonAssets, before: SeasonAssets): string {
  switch (action.id) {
    case 'research': return `取得 ${after.insight - before.insight} 點研究線索`;
    case 'participation': return `體驗評價 ${event.satisfaction} 分`;
    case 'artist': return `口碑由 ${before.reputation} 變為 ${after.reputation}`;
    case 'training': return `培訓階數 ${after.training}`;
    case 'helpers': return `安全接待上限 ${event.safeCapacity} 人`;
    case 'seats': return `座位增至 ${after.seats}`;
    case 'ambience': return `環境改善階數 ${after.ambience}`;
    case 'experiment': return '留下可供後續驗證的訊息線索';
    case 'promotion': return `觸及 ${event.reach} 人，實際到場 ${event.attendance} 人`;
    case 'membership': return `前場熟客中 ${event.retained} 人留下，另有 ${event.newRegulars} 位新熟客`;
    case 'sponsor': return `本場條件式贊助收入 ${event.fit ? Math.max(4, event.attendance) : 0} 點`;
  }
}

export function replaySeason(plans: readonly SeasonPlan[]): SeasonReplay | null {
  if (!Array.isArray(plans) || plans.length > SEASON_LENGTH) return null;
  let assets = freshAssets();
  const events: SeasonEvent[] = [];
  for (let index = 0; index < plans.length; index++) {
    const checked = validatePlan(plans[index], assets);
    if (!checked.plan) return null;
    const event = applyPlan(assets, checked.plan, index + 1);
    assets = { ...event.after };
    events.push(event);
  }
  return { assets, events };
}

export function forecastSeason(session: SeasonSession, plan?: SeasonPlan): SeasonForecast {
  const restored = restoreSeason(session);
  const source = plan ?? restored?.draft ?? defaultPlan();
  const replay = restored ? replaySeason(restored.plans) : null;
  const assets = replay?.assets ?? freshAssets();
  const eventNumber = (restored?.plans.length ?? 0) + 1;
  const checked = validatePlan(source, assets);
  const measured = checked.plan && eventNumber <= SEASON_LENGTH ? estimate(assets, checked.plan, eventNumber) : null;
  const baseCost = scaleById.get((source as SeasonPlan)?.scale)?.cost ?? 0;
  const timeLimit = 4;
  const insights: string[] = [];
  if (assets.insight > 0 && eventNumber <= SEASON_LENGTH) {
    const audienceTitle = seasonAudiences.find(item => item.id === marketFor(eventNumber).preferred)?.title ?? '來客';
    insights.push(`研究紀錄指出本場市場偏好「${audienceTitle}」。`);
  }
  if (assets.tested && hasAction(source as SeasonPlan, 'promotion')) insights.push('訊息測試仍需配合受眾或主題契合才會改善轉換。');
  const uncertainty = assets.insight > 0 ? 1 : 3;
  const demandCenter = measured ? measured.attendance + measured.waiting : 0;
  const demand: [number, number] = measured ? [Math.max(0, demandCenter - uncertainty), demandCenter + uncertainty] : [0, 0];
  const capacity = measured?.seatCapacity ?? Math.min(assets.seats + (checked.plan && hasAction(checked.plan, 'seats') ? 8 : 0), scaleById.get((source as SeasonPlan)?.scale)?.limit ?? 0);
  const attendance: [number, number] = [Math.min(capacity, demand[0]), Math.min(capacity, demand[1])];
  const waiting: [number, number] = [Math.max(0, demand[0] - capacity), Math.max(0, demand[1] - capacity)];
  if (waiting[1] > 0) insights.push(`候補風險：可能有 ${waiting[0]}–${waiting[1]} 人因座位不足無法入場。`);
  const safeCapacity = measured?.safeCapacity ?? Math.min(capacity, 12 + assets.training * 3);
  const servicePressure: [number, number] = [Math.max(0, attendance[0] - safeCapacity), Math.max(0, attendance[1] - safeCapacity)];
  if (servicePressure[1] > 0) insights.push(`接待壓力：可能有 ${servicePressure[0]}–${servicePressure[1]} 位入場者超過舒適接待量 ${safeCapacity} 人。`);
  return {
    cost: checked.cost || (checked.issues.length ? baseCost + (Array.isArray((source as SeasonPlan)?.actions) ? ((source as SeasonPlan).actions).reduce((sum, id) => sum + (actionById.get(id)?.cost ?? 0), 0) : 0) : 0),
    time: checked.time,
    timeLimit,
    seats: Math.min(48, assets.seats + (checked.plan && hasAction(checked.plan, 'seats') ? 8 : 0)),
    capacity,
    safeCapacity,
    attendance,
    demand,
    waiting,
    issues: [...checked.issues, ...(eventNumber > SEASON_LENGTH ? ['六場經營已結束，不能再舉辦新活動。'] : [])],
    insights,
  };
}

export function setSeasonDraft(session: SeasonSession, plan: SeasonPlan): SeasonSession {
  const restored = restoreSeason(session);
  if (!restored || !restored.started || restored.plans.length >= SEASON_LENGTH || !canPlanSeason(restored)) return session;
  const assets = replaySeason(restored.plans)!.assets;
  if (restored.acknowledged !== restored.plans.length || !validatePlan(plan, assets).plan) return session;
  return { ...restored, draft: clonePlan(plan) };
}

export function startSeason(session: SeasonSession): SeasonSession {
  const restored = restoreSeason(session);
  return restored && !restored.started ? { ...restored, started: true } : session;
}

export function holdSeason(session: SeasonSession, expectedEvent: number): SeasonSession {
  const restored = restoreSeason(session);
  if (!restored || !restored.started || !Number.isInteger(expectedEvent) || expectedEvent < 1 || expectedEvent > SEASON_LENGTH
    || expectedEvent !== restored.plans.length + 1 || restored.acknowledged !== restored.plans.length || !canPlanSeason(restored)) return session;
  const assets = replaySeason(restored.plans)!.assets;
  const checked = validatePlan(restored.draft, assets);
  if (!checked.plan) return session;
  return { ...restored, plans: [...restored.plans.map(clonePlan), clonePlan(checked.plan)], draft: defaultPlan() };
}

export function acknowledgeSeason(session: SeasonSession): SeasonSession {
  const restored = restoreSeason(session);
  if (!restored || restored.acknowledged >= restored.plans.length) return session;
  return { ...restored, acknowledged: restored.acknowledged + 1 };
}

function availableNpcIds(eventNumber: number): number[] {
  return seasonScenes.find(scene => scene.number === eventNumber)?.npcs.map(npc => npc.id) ?? [];
}

function hasRequiredRoundConversation(heard: Record<string, number[]>, eventNumber: number): boolean {
  const availableNonMentors = availableNpcIds(eventNumber).filter(id => id !== 5);
  return (heard[String(eventNumber)] ?? []).some(id => id !== 5 && availableNonMentors.includes(id));
}

export function canPlanSeason(session: SeasonSession): boolean {
  const restored = restoreSeason(session);
  if (!restored || !restored.started || restored.plans.length >= SEASON_LENGTH || restored.acknowledged !== restored.plans.length) return false;
  return hasRequiredRoundConversation(restored.heard, restored.plans.length + 1);
}

export function heardSeasonNpc(session: SeasonSession, npcId: number): SeasonSession {
  const restored = restoreSeason(session);
  if (!restored || !restored.started || restored.plans.length >= SEASON_LENGTH || restored.acknowledged !== restored.plans.length) return session;
  const eventNumber = restored.plans.length + 1;
  if (!availableNpcIds(eventNumber).includes(npcId) || (restored.heard[String(eventNumber)] ?? []).includes(npcId)) return session;
  const heard = { ...restored.heard, [String(eventNumber)]: [...(restored.heard[String(eventNumber)] ?? []), npcId] };
  return { ...restored, heard };
}

export function completeSeasonEnding(session: SeasonSession): SeasonSession {
  const restored = restoreSeason(session);
  if (!restored || restored.plans.length !== SEASON_LENGTH || restored.acknowledged !== SEASON_LENGTH || restored.endingSeen) return session;
  return { ...restored, endingSeen: true };
}

function restoreValue(raw: unknown): SeasonSession | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  if (value.version !== SEASON_VERSION || typeof value.started !== 'boolean' || !Array.isArray(value.plans)
    || !Number.isInteger(value.acknowledged) || (value.acknowledged as number) < 0 || (value.acknowledged as number) > value.plans.length
    || value.plans.length > SEASON_LENGTH || value.plans.length - (value.acknowledged as number) > 1
    || !value.heard || typeof value.heard !== 'object' || Array.isArray(value.heard) || typeof value.endingSeen !== 'boolean') return null;
  const plans = value.plans as SeasonPlan[];
  const replay = replaySeason(plans);
  if (!replay || (!value.started && (plans.length > 0 || Object.keys(value.heard as object).length > 0))
    || (value.endingSeen && (plans.length !== SEASON_LENGTH || value.acknowledged !== SEASON_LENGTH))) return null;
  const acknowledged = value.acknowledged as number;
  const heardRaw = value.heard as Record<string, unknown>;
  const heard: Record<string, number[]> = {};
  for (const [roundKey, roster] of Object.entries(heardRaw)) {
    const round = Number(roundKey);
    if (!/^\d+$/.test(roundKey) || !Number.isInteger(round) || String(round) !== roundKey || round < 1 || round > Math.min(SEASON_LENGTH, plans.length + 1)
      || (round === plans.length + 1 && (!value.started || plans.length >= SEASON_LENGTH)) || !Array.isArray(roster)) return null;
    const available = availableNpcIds(round);
    if (roster.some(id => !Number.isInteger(id) || !available.includes(id)) || new Set(roster).size !== roster.length) return null;
    heard[roundKey] = [...roster] as number[];
  }
  for (let round = 1; round <= plans.length; round++) if (!hasRequiredRoundConversation(heard, round)) return null;
  const draftRaw = value.draft;
  let draft = defaultPlan();
  if (draftRaw && typeof draftRaw === 'object' && !Array.isArray(draftRaw) && plans.length < SEASON_LENGTH) {
    const checked = validatePlan(draftRaw, replay.assets);
    if (checked.plan) draft = checked.plan;
  }
  return { version: SEASON_VERSION, started: value.started, plans: plans.map(clonePlan), acknowledged, draft, heard, endingSeen: value.endingSeen };
}

export function restoreSeason(raw: unknown): SeasonSession | null {
  if (typeof raw === 'string') {
    try { return restoreValue(JSON.parse(raw)); } catch { return null; }
  }
  return restoreValue(raw);
}

export function resolveSeasonRoute(hash: string, session: SeasonSession): SeasonRoute {
  const restored = restoreSeason(session);
  if (hash === SEASON_INTRO) return { kind: 'intro', canonical: SEASON_INTRO };
  if (!restored?.started) return { kind: 'intro', canonical: SEASON_INTRO };
  const complete = restored.plans.length === SEASON_LENGTH && restored.acknowledged === SEASON_LENGTH;
  if (hash === SEASON_ENDING) return complete && !restored.endingSeen
    ? { kind: 'ending', canonical: SEASON_ENDING }
    : complete ? { kind: 'result', canonical: SEASON_RESULT } : { kind: 'play', canonical: SEASON_PLAY };
  if (hash === SEASON_RESULT) return complete
    ? restored.endingSeen ? { kind: 'result', canonical: SEASON_RESULT } : { kind: 'ending', canonical: SEASON_ENDING }
    : { kind: 'play', canonical: SEASON_PLAY };
  if (hash === SEASON_PLAY || /^#\/quiz\/paris-salon\/play\/\d+$/.test(hash)) {
    if (complete) return restored.endingSeen
      ? { kind: 'result', canonical: SEASON_RESULT }
      : { kind: 'ending', canonical: SEASON_ENDING };
    return { kind: 'play', canonical: SEASON_PLAY };
  }
  return { kind: 'intro', canonical: SEASON_INTRO };
}
