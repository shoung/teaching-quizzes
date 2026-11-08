import { salonDimensions, salonGame } from '../data/paris-salon';
import type { SalonEffect, SalonReplay, SalonResult, SalonSession, SalonStats } from '../types';

const decisions = salonGame.decisions;
const introPath = '#/quiz/paris-salon/1';
export const SALON_STORAGE_KEY = `learning-lab:quiz:${salonGame.id}:v${salonGame.version}`;
export const salonPlayPath = (index: number) => `#/quiz/paris-salon/play/${index + 1}`;

export function initialSalonSession(): SalonSession {
  return { version: salonGame.version, started: false, answers: decisions.map(() => null), completed: false, position: { place: 'salon', x: 44, y: 82 } };
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

function applyEffects(stats: SalonStats, cost: number, effect: SalonEffect, fitEffect: SalonEffect = {}): SalonStats {
  const change = (key: keyof SalonEffect) => (effect[key] ?? 0) + (fitEffect[key] ?? 0);
  const confirmed = Math.max(0, stats.confirmed + change('confirmed'));
  return {
    budget: stats.budget - cost,
    awareness: clamp(stats.awareness + change('awareness')),
    trust: clamp(stats.trust + change('trust')),
    preparation: clamp(stats.preparation + change('preparation')),
    confirmed: Math.min(36, confirmed),
    waiting: Math.max(0, stats.waiting + change('waiting') + Math.max(0, confirmed - 36)),
  };
}

/** Rebuild every resource and teaching score from a continuous choice history. */
export function replaySalon(answers: readonly (string | null)[]): SalonReplay | null {
  if (!Array.isArray(answers) || answers.length > decisions.length) return null;
  const replay: SalonReplay = {
    stats: { budget: 100, awareness: 10, trust: 50, preparation: 40, confirmed: 0, waiting: 0 },
    target: null, positioning: null, opening: null, choices: [],
  };
  let reachedEnd = false;
  for (let index = 0; index < answers.length; index++) {
    const answer = answers[index];
    if (answer === null) { reachedEnd = true; continue; }
    if (reachedEnd || typeof answer !== 'string') return null;
    const decision = decisions[index];
    const option = decision.options.find(item => item.id === answer);
    if (!option || option.cost > replay.stats.budget) return null;
    const before = replay.stats;
    if (option.target) replay.target = option.target;
    if (option.positioning) replay.positioning = option.positioning;
    const fit = option.fit && replay.target && option.fit.targets.includes(replay.target) ? option.fit : null;
    replay.stats = applyEffects(before, option.cost, option.effects, fit?.effects);
    replay.choices.push({ decision, option, score: fit?.score ?? option.score, before, after: replay.stats });
    if (index === 8) {
      const { confirmed, trust, preparation } = replay.stats;
      replay.opening = { stats: { ...replay.stats }, attendance: Math.floor(confirmed * (0.5 + 0.25 * trust / 100 + 0.25 * preparation / 100)) };
    }
  }
  return replay;
}

export function nextSalonDecision(session: SalonSession): number {
  const missing = decisions.findIndex((decision, index) => !decision.options.some(option => option.id === session.answers[index]));
  return missing < 0 ? decisions.length - 1 : missing;
}

/** Only persisted choices and a bounded map position are trusted; totals are replayed. */
export function restoreSalon(raw: unknown): SalonSession | null {
  if (typeof raw === 'string') {
    try { return restoreSalon(JSON.parse(raw)); } catch { return null; }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  if (value.version !== salonGame.version || typeof value.started !== 'boolean' || typeof value.completed !== 'boolean'
    || !Array.isArray(value.answers) || value.answers.length !== decisions.length) return null;
  const answers = value.answers as (string | null)[];
  const replay = replaySalon(answers);
  if (!replay || (!value.started && replay.choices.length > 0)
    || (value.completed && (!value.started || replay.choices.length !== decisions.length))) return null;
  if (!value.position || typeof value.position !== 'object' || Array.isArray(value.position)) return null;
  const position = value.position as Record<string, unknown>;
  if (!['salon', 'study', 'print', 'cafe'].includes(position.place as string)
    || typeof position.x !== 'number' || !Number.isFinite(position.x) || position.x < 10 || position.x > 90
    || typeof position.y !== 'number' || !Number.isFinite(position.y) || position.y < 65 || position.y > 90) return null;
  const session: SalonSession = {
    version: salonGame.version, started: value.started, completed: value.completed,
    answers: [...answers], position: { place: position.place as SalonSession['position']['place'], x: position.x, y: position.y },
  };
  if (session.started && value.draft && typeof value.draft === 'object' && !Array.isArray(value.draft)) {
    const draft = value.draft as Record<string, unknown>;
    if (typeof draft.index === 'number' && Number.isInteger(draft.index) && draft.index >= 0 && draft.index <= nextSalonDecision(session)) {
      const option = decisions[draft.index].options.find(item => item.id === draft.optionId);
      const before = replaySalon(answers.slice(0, draft.index))!;
      if (draft.optionId === null || (option && option.cost <= before.stats.budget)) {
        session.draft = { index: draft.index, optionId: draft.optionId as string | null };
      }
    }
  }
  return session;
}

export function startSalon(session: SalonSession): SalonSession {
  return !session.started && restoreSalon(session) ? { ...session, started: true } : session;
}

export function submitSalon(session: SalonSession, index: number, optionId: string): SalonSession {
  if (!session.started || !restoreSalon(session) || !Number.isInteger(index) || index < 0
    || index >= decisions.length || index > nextSalonDecision(session)) return session;
  if (session.answers[index] === optionId) {
    if (!('draft' in session)) return session;
    const committed = { ...session };
    delete committed.draft;
    return committed;
  }
  const answers = session.answers.map((answer, i) => i < index ? answer : i === index ? optionId : null);
  if (!replaySalon(answers)) return session;
  const committed = { ...session, answers, completed: false };
  delete committed.draft;
  return committed;
}

export function completeSalon(session: SalonSession): SalonSession {
  if (!session.started || session.completed || !restoreSalon(session) || session.answers.some(answer => answer === null)) return session;
  return { ...session, completed: true };
}

export function getSalonResult(session: SalonSession): SalonResult | null {
  if (!session.completed || !restoreSalon(session)) return null;
  const replay = replaySalon(session.answers)!;
  if (!replay.opening) return null;
  const points = replay.choices.reduce((sum, item) => sum + item.score, 0);
  const axes = salonDimensions.map(axis => {
    const points = replay.choices.filter(item => item.decision.dimension === axis.id).reduce((sum, item) => sum + item.score, 0);
    return { ...axis, points, maxPoints: 6, score: Math.round(points / 6 * 100) };
  });
  const popularity = replay.opening.attendance >= 28 && replay.stats.awareness >= 70;
  const guardrails = replay.stats.trust >= 60 && replay.opening.stats.preparation >= 60 && replay.stats.budget >= 0;
  const ending = popularity ? guardrails ? 0 : 1 : guardrails ? 2 : 3;
  return {
    ...replay, ending, points, maxPoints: 36, score: Math.round(points / 36 * 100),
    highestCount: replay.choices.filter(item => item.score === 3).length, axes,
    practice: axes.map((axis, order) => ({ ...axis, order })).sort((a, b) => a.score - b.score || a.order - b.order).slice(0, 2).map(axis => axis.practice),
  };
}

export interface SalonRoute { kind: 'intro' | 'play' | 'result'; index: number; canonical: string; notice?: string }

export function resolveSalonRoute(hash: string, session: SalonSession): SalonRoute {
  const intro: SalonRoute = { kind: 'intro', index: 0, canonical: introPath };
  if (hash === introPath) return intro;
  if (!session.started || !restoreSalon(session)) return { ...intro, notice: '請先從介紹頁開始經營沙龍。' };
  if (hash === '#/quiz/paris-salon/result') {
    if (getSalonResult(session)) return { kind: 'result', index: decisions.length - 1, canonical: hash };
    const index = nextSalonDecision(session);
    return { kind: 'play', index, canonical: salonPlayPath(index), notice: '請先完成目前的決策，再查看經營結果。' };
  }
  const match = /^#\/quiz\/paris-salon\/play\/([1-9]\d*)$/.exec(hash);
  const number = match ? Number(match[1]) : NaN;
  if (!Number.isSafeInteger(number) || number > decisions.length) return { ...intro, notice: '這個遊戲網址不完整，請從介紹頁繼續。' };
  const index = Math.min(number - 1, nextSalonDecision(session));
  return { kind: 'play', index, canonical: salonPlayPath(index), ...(index !== number - 1 ? { notice: '請先完成目前的決策，才能繼續下一頁。' } : {}) };
}
