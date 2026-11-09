import { seasonActions, seasonAudiences, seasonMarkets, seasonScales, seasonThemes } from '../data/paris-salon-season';
import { seasonScenes } from '../data/paris-salon-rpg';
import type { ActionId, Audience, Scale, SeasonAction, SeasonAssets, SeasonEvent, SeasonForecast, SeasonPlan, SeasonReplay, SeasonRoute, SeasonSession, SeasonVersion, Theme } from './season-types';
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
  return { cash: 100, regulars: 4, reputation: 40, awareness: 50, seats: 24, assistants: 2, training: 0, ambience: 0, insight: 0, tested: false };
}

export function initialSeason(): SeasonSession {
  return { version: SEASON_VERSION, started: false, plans: [], acknowledged: 0, draft: defaultPlan(), heard: {}, endingSeen: false };
}

function clonePlan(plan: SeasonPlan): SeasonPlan {
  return { audience: plan.audience, theme: plan.theme, scale: plan.scale, actions: [...plan.actions] };
}

function validatePlan(plan: unknown, assets: SeasonAssets, version: SeasonVersion): { plan?: SeasonPlan; issues: string[]; cost: number; staffRequired: number; staffAvailable: number } {
  const issues: string[] = [];
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) return { issues: ['請選擇本場受眾、主題與規模。'], cost: 0, staffRequired: 0, staffAvailable: assets.assistants };
  const value = plan as Record<string, unknown>;
  if (!audiences.has(value.audience as Audience)) issues.push('受眾設定無效，請重新選擇。');
  if (!themes.has(value.theme as Theme)) issues.push('主題設定無效，請重新選擇。');
  if (!scales.has(value.scale as Scale)) issues.push('活動規模無效，請重新選擇。');
  if (!Array.isArray(value.actions) || value.actions.some(id => typeof id !== 'string' || !actionById.has(id as ActionId))) {
    issues.push('準備行動包含無效項目。');
  }
  const actions = Array.isArray(value.actions) ? value.actions as string[] : [];
  if (new Set(actions).size !== actions.length) issues.push('每項準備行動每場只能安排一次。');
  if (version === SEASON_VERSION && assets.insight > 0 && actions.includes('research')) {
    issues.push('本季已完成來客研究，預估會沿用到季末。請把助手分配給其他工作。');
  }
  const selected = actions.map(id => actionById.get(id as ActionId)).filter((item): item is SeasonAction => Boolean(item));
  if (assets.assistants >= 6 && actions.includes('recruit')) issues.push('固定助手已有 6 人，這場先安排其他工作。');
  if (assets.training >= 3 && actions.includes('training')) issues.push('助手培訓最多累積三階，這次先改用其他準備。');
  if (assets.ambience >= 3 && actions.includes('ambience')) issues.push('環境改善已達三階上限，請替本場安排別的行動。');
  if (assets.seats >= 48 && actions.includes('seats')) issues.push('座位已達四十八席上限，這次不必再擴座。');
  const scale = scaleById.get(value.scale as Scale);
  const cost = (scale?.cost ?? 0) + selected.reduce((sum, action) => sum + action.cost, 0);
  const staffRequired = selected.reduce((sum, action) => sum + action.staff, 0);
  const staffAvailable = Math.min(6, assets.assistants + (actions.includes('recruit') ? 1 : 0)) + (actions.includes('helpers') ? 2 : 0);
  if (staffRequired > staffAvailable) issues.push(`助手不足：這些準備工作需要 ${staffRequired} 人，目前可安排 ${staffAvailable} 人。先收回部分卡牌，或增聘助手。`);
  if (cost > assets.cash) issues.push(`經費不足：這場需 ${cost} 點，手頭只有 ${assets.cash} 點。先收回幾張牌，或把規模改為基本支出 0 點的小聚。`);
  if (issues.length) return { issues, cost, staffRequired, staffAvailable };
  return { plan: { audience: value.audience as Audience, theme: value.theme as Theme, scale: value.scale as Scale, actions: selected.map(action => action.id) }, issues, cost, staffRequired, staffAvailable };
}

function marketFor(eventNumber: number) { return seasonMarkets[eventNumber - 1]; }
function hasAction(plan: SeasonPlan, id: ActionId) { return plan.actions.includes(id); }
function themeFit(plan: SeasonPlan) { return themeById.get(plan.theme)?.audience === plan.audience; }

export function awarenessResponse(satisfaction: number, promoted: boolean, version: SeasonVersion = SEASON_VERSION): number {
  if (satisfaction < 60) return -2;
  if (version === 5) {
    return satisfaction >= 70 ? 3 + (promoted ? 2 : 0) : 1;
  }

  // Increase the combined reward gradually across the old 70-point threshold.
  const progress = (clamp(satisfaction, 65, 75) - 65) / 10;
  return Math.round(1 + progress * (promoted ? 4 : 2));
}

function estimate(before: SeasonAssets, plan: SeasonPlan, eventNumber: number, version: SeasonVersion) {
  const market = marketFor(eventNumber);
  const matched = market.preferred === plan.audience;
  const fit = themeFit(plan);
  const promo = hasAction(plan, 'promotion');
  const artist = hasAction(plan, 'artist');
  const helper = hasAction(plan, 'helpers');
  const assistants = Math.min(6, before.assistants + (hasAction(plan, 'recruit') ? 1 : 0));
  const experimentalFit = before.tested && promo && (matched || fit);
  const reach = Math.max(6, Math.round(market.demand + 12 + (before.awareness - 50) * 0.65 + (promo ? 18 : 0) + (artist && fit ? 8 : 0) + (experimentalFit ? 5 : 0)));
  const inquiryRate = 0.5 + (matched ? 0.1 : 0) + (before.reputation - 40) / 250;
  const inquiries = Math.max(0, Math.round(reach * inquiryRate));
  const reservations = Math.max(0, Math.round(inquiries * (0.6 + (fit ? 0.08 : 0) + before.training * 0.015)));
  const scale = scaleById.get(plan.scale)!;
  const projectedSeats = Math.min(48, before.seats + (hasAction(plan, 'seats') ? 8 : 0));
  const seatCapacity = Math.min(projectedSeats, scale.limit);
  const safeCapacity = Math.min(seatCapacity, 12 + (assistants - 2) * 4 + before.training * 3 + (helper ? 10 : 0));
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
  const waiting = Math.max(0, arrived + returning - attendance);
  const awarenessDrivers = {
    response: awarenessResponse(satisfaction, promo, version),
    overload: -Math.ceil(serviceOverload / 3) * 2,
    waiting: -Math.ceil(waiting / 4),
  };
  const awarenessChange = awarenessDrivers.response + awarenessDrivers.overload + awarenessDrivers.waiting;
  const retainedRate = clamp(0.48 + (satisfaction - 60) / 100 + (hasAction(plan, 'membership') ? 0.12 : 0), 0.2, 0.9);
  const retained = Math.min(before.regulars, Math.floor(before.regulars * retainedRate));
  const newRegulars = Math.min(newGuests, Math.floor(newGuests * clamp(0.12 + (satisfaction - 55) / 120, 0.05, 0.5)));
  return { reach, inquiries, reservations, attendance, waiting, returning: returningPresent, newGuests, retained, newRegulars, satisfaction, awarenessChange, awarenessDrivers, safeCapacity, seatCapacity, matched, fit, experimentalFit };
}

function applyPlan(before: SeasonAssets, plan: SeasonPlan, eventNumber: number, version: SeasonVersion): SeasonEvent {
  const measure = estimate(before, plan, eventNumber, version);
  const scale = scaleById.get(plan.scale)!;
  const selected = plan.actions.map(id => actionById.get(id)!);
  const actionCost = selected.reduce((sum, action) => sum + action.cost, 0);
  const baseCost = scale.cost;
  const support = measure.attendance * (measure.matched ? 2 : 1);
  const members = measure.returning * (hasAction(plan, 'membership') ? 3 : 1);
  const sponsorPerGuest = version === 5 ? 1 : 0.5;
  const sponsor = hasAction(plan, 'sponsor') && measure.fit
    ? Math.max(4, Math.round(measure.attendance * sponsorPerGuest))
    : 0;
  const totalIncome = support + members + sponsor;
  const totalCost = baseCost + actionCost;
  let after: SeasonAssets = {
    cash: Math.max(0, before.cash - totalCost + totalIncome),
    regulars: clamp(measure.retained + measure.newRegulars, 0, 100),
    reputation: clamp(before.reputation + Math.round((measure.satisfaction - 60) / 8) + (hasAction(plan, 'artist') ? 2 : 0) - Math.ceil(measure.waiting / 4)),
    awareness: clamp(before.awareness + measure.awarenessChange),
    seats: before.seats, assistants: Math.min(6, before.assistants + (hasAction(plan, 'recruit') ? 1 : 0)), training: before.training, ambience: before.ambience,
    insight: before.insight + (hasAction(plan, 'research') ? 1 : 0), tested: before.tested || hasAction(plan, 'experiment'),
  };
  if (hasAction(plan, 'training')) after.training = Math.min(3, after.training + 1);
  if (hasAction(plan, 'ambience')) after.ambience = Math.min(3, after.ambience + 1);
  if (hasAction(plan, 'seats')) after.seats = Math.min(48, after.seats + 8);
  const notes: string[] = [];
  if (!measure.fit) notes.push('主題與主要來客的期待不合，少了 7 分滿意度加成。');
  if (!measure.matched) notes.push("這場主邀的來客和附近較有興趣的人不同，詢問後預約的人較少。");
  if (measure.waiting > 0) notes.push(`有 ${measure.waiting} 位客人想來，卻因本場席位不足沒能入場。`);
  if (measure.attendance > measure.safeCapacity) notes.push(`到場人數超過舒適接待量 ${measure.safeCapacity} 人，助手忙不過來，滿意度扣了 ${(measure.attendance - measure.safeCapacity) * 2} 分。`);
  else if (measure.attendance < measure.safeCapacity * 0.55) notes.push("人手還照顧得過來。下場先看看有多少人想參加，再決定要不要添椅子。");
  if (hasAction(plan, 'sponsor')) notes.push(measure.fit ? "洽談成功，這場主題符合主要來客，支持者提供了贊助。" : "這場主題和主要來客不合，沒有取得贊助。");
  if (hasAction(plan, 'research')) {
    const nextMarket = marketFor(eventNumber + 1);
    const audienceTitle = nextMarket ? seasonAudiences.find(item => item.id === nextMarket.preferred)?.title ?? '來客' : '下一季';
    notes.push(`已記下來客想法；下一場較有興趣的是「${audienceTitle}」。這份記錄可以用來預估人數。`);
  }
  if (hasAction(plan, 'experiment')) {
    const replyA = 4;
    const replyB = 3;
    notes.push(`兩組各寄 10 封邀請，對象、管道和時段相同，只改說法。A 寫明活動內容，回信 ${replyA}/10；B 只寫藝術聚會，回信 ${replyB}/10。先記下這次回覆，之後可把較受歡迎的說法用在合適的來客與宣傳上。`);
  }
  if (measure.experimentalFit) notes.push("你把測試過的說法用在合適的來客和宣傳上，這次看到消息的人略有增加。");
  if (after.cash === 0 && totalIncome < totalCost) notes.push("現金已用完。下場先辦基本支出 0 點的小聚，收回要花錢的卡牌。");
  const lessons = selected.map(action => ({ action: action.id, concept: action.concept, text: `${action.lesson} 本場結果：${lessonResult(action, measure, after, before, sponsor)}。` }));
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

function lessonResult(action: SeasonAction, event: ReturnType<typeof estimate>, after: SeasonAssets, before: SeasonAssets, sponsor: number): string {
  switch (action.id) {
    case 'research': return `取得 ${after.insight - before.insight} 點研究線索`;
    case 'participation': return `體驗評價 ${event.satisfaction} 分`;
    case 'artist': return `口碑由 ${before.reputation} 變為 ${after.reputation}`;
    case 'recruit': return `固定助手 ${before.assistants} → ${after.assistants} 人，報酬已付至季末`;
    case 'training': return `培訓階數 ${after.training}`;
    case 'helpers': return `安全接待上限 ${event.safeCapacity} 人`;
    case 'seats': return `座位增至 ${after.seats}`;
    case 'ambience': return `環境改善階數 ${after.ambience}`;
    case 'experiment': return "記下兩種說法各收到多少回信";
    case 'promotion': return `看到消息 ${event.reach} 人，實際到場 ${event.attendance} 人`;
    case 'membership': return `前場熟客中 ${event.retained} 人留下，另有 ${event.newRegulars} 位新熟客`;
    case 'sponsor': return `本場獲得贊助支持金 ${sponsor} 點`;
  }
}

export function replaySeason(plans: readonly SeasonPlan[], version: SeasonVersion = SEASON_VERSION): SeasonReplay | null {
  if (!Array.isArray(plans) || plans.length > SEASON_LENGTH) return null;
  let assets = freshAssets();
  const events: SeasonEvent[] = [];
  for (let index = 0; index < plans.length; index++) {
    const checked = validatePlan(plans[index], assets, version);
    if (!checked.plan) return null;
    const event = applyPlan(assets, checked.plan, index + 1, version);
    assets = { ...event.after };
    events.push(event);
  }
  return { assets, events };
}

export function forecastSeason(session: SeasonSession, plan?: SeasonPlan): SeasonForecast {
  const restored = restoreSeason(session);
  const source = plan ?? restored?.draft ?? defaultPlan();
  const replay = restored ? replaySeason(restored.plans, restored.version) : null;
  const assets = replay?.assets ?? freshAssets();
  const eventNumber = (restored?.plans.length ?? 0) + 1;
  const version = restored?.version ?? SEASON_VERSION;
  const checked = validatePlan(source, assets, version);
  const measured = checked.plan && eventNumber <= SEASON_LENGTH ? estimate(assets, checked.plan, eventNumber, version) : null;
  const baseCost = scaleById.get((source as SeasonPlan)?.scale)?.cost ?? 0;
  const insights: string[] = [];
  if (assets.insight > 0 && eventNumber <= SEASON_LENGTH) {
    const audienceTitle = seasonAudiences.find(item => item.id === marketFor(eventNumber).preferred)?.title ?? '來客';
    insights.push(`研究筆記：這場對聚會較有興趣的是「${audienceTitle}」。`);
  }
  if (assets.tested && hasAction(source as SeasonPlan, 'promotion')) insights.push("先前測過的說法，用在對的人和主題上，這場宣傳才會有幫助。");
  const uncertainty = assets.insight > 0 ? 1 : 3;
  const demandCenter = measured ? measured.attendance + measured.waiting : 0;
  const demand: [number, number] = measured ? [Math.max(0, demandCenter - uncertainty), demandCenter + uncertainty] : [0, 0];
  const capacity = measured?.seatCapacity ?? Math.min(assets.seats + (checked.plan && hasAction(checked.plan, 'seats') ? 8 : 0), scaleById.get((source as SeasonPlan)?.scale)?.limit ?? 0);
  const attendance: [number, number] = [Math.min(capacity, demand[0]), Math.min(capacity, demand[1])];
  const waiting: [number, number] = [Math.max(0, demand[0] - capacity), Math.max(0, demand[1] - capacity)];
  if (waiting[1] > 0) insights.push(`候補風險：可能有 ${waiting[0]}–${waiting[1]} 人因座位不足無法入場。`);
  const safeCapacity = measured?.safeCapacity ?? Math.min(capacity, 12 + (assets.assistants - 2) * 4 + assets.training * 3);
  const servicePressure: [number, number] = [Math.max(0, attendance[0] - safeCapacity), Math.max(0, attendance[1] - safeCapacity)];
  if (servicePressure[1] > 0) insights.push(`接待壓力：可能有 ${servicePressure[0]}–${servicePressure[1]} 位入場者超過舒適接待量 ${safeCapacity} 人。`);
  return {
    cost: checked.cost || (checked.issues.length ? baseCost + (Array.isArray((source as SeasonPlan)?.actions) ? ((source as SeasonPlan).actions).reduce((sum, id) => sum + (actionById.get(id)?.cost ?? 0), 0) : 0) : 0),
    staffRequired: checked.staffRequired,
    staffAvailable: checked.staffAvailable,
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
  const assets = replaySeason(restored.plans, restored.version)!.assets;
  if (restored.acknowledged !== restored.plans.length || !validatePlan(plan, assets, restored.version).plan) return session;
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
  const assets = replaySeason(restored.plans, restored.version)!.assets;
  const checked = validatePlan(restored.draft, assets, restored.version);
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
  if ((value.version !== 5 && value.version !== SEASON_VERSION) || typeof value.started !== 'boolean' || !Array.isArray(value.plans)
    || !Number.isInteger(value.acknowledged) || (value.acknowledged as number) < 0 || (value.acknowledged as number) > value.plans.length
    || value.plans.length > SEASON_LENGTH || value.plans.length - (value.acknowledged as number) > 1
    || !value.heard || typeof value.heard !== 'object' || Array.isArray(value.heard) || typeof value.endingSeen !== 'boolean') return null;
  const plans = value.plans as SeasonPlan[];
  const version = value.version;
  const replay = replaySeason(plans, version);
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
    const checked = validatePlan(draftRaw, replay.assets, version);
    if (checked.plan) draft = checked.plan;
  }
  return { version, started: value.started, plans: plans.map(clonePlan), acknowledged, draft, heard, endingSeen: value.endingSeen };
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
