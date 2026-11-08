import { marketingDayGame } from '../data/marketing-day';
import type { MarketingDimension, MarketingResult, MarketingSession } from '../types';

const questions = marketingDayGame.decisions;
const introPath = '#/quiz/marketing-day/1';
export const marketingPlayPath = (index: number) => `#/quiz/marketing-day/play/${index + 1}`;

export function newMarketingSession(): MarketingSession {
  return { version: marketingDayGame.version, started: false, answers: questions.map(() => null), completed: false };
}

export function startMarketingDay(session: MarketingSession): MarketingSession {
  return { ...session, started: true };
}

function validAnswer(index: number, value: unknown): value is string {
  return typeof value === 'string' && questions[index]?.options.some(option => option.id === value);
}

export function nextMarketingDecision(session: MarketingSession) {
  const missing = questions.findIndex((_, index) => !validAnswer(index, session.answers[index]));
  return missing < 0 ? questions.length - 1 : missing;
}

export function submitMarketingDecision(session: MarketingSession, index: number, optionId: string): MarketingSession {
  if (!session.started || session.version !== marketingDayGame.version || !Number.isInteger(index)
    || !validAnswer(index, optionId) || index > nextMarketingDecision(session)) return session;
  if (session.answers[index] === optionId) return session;
  const answers = session.answers.map((answer, i) => i < index ? answer : i === index ? optionId : null);
  return { ...session, answers, completed: false };
}

export function completeMarketingDay(session: MarketingSession): MarketingSession {
  if (!session.started || session.version !== marketingDayGame.version
    || session.answers.length !== questions.length || !questions.every((_, i) => validAnswer(i, session.answers[i]))) return session;
  return { ...session, completed: true };
}

const dimensions: { id: MarketingDimension; label: string; practice: string }[] = [
  { id: 'strategy', label: '策略與實驗', practice: '下次先寫一句「對誰、希望他做什麼、用什麼指標觀察」，再設計一次只改一個主要變因的比較。' },
  { id: 'data', label: '數據判讀', practice: '拿一組數據練習寫出分母、觀察期間與限制；把營收、訂單數與利潤分開看，再決定是否調整預算。' },
  { id: 'collaboration', label: '查證與協作', practice: '替一段 AI 文案逐句找依據，再用「已知、未知、下一步、負責人、指標」五點交付建議。' },
];

export function getMarketingResult(session: MarketingSession): MarketingResult | null {
  if (!session.completed || !session.started || session.version !== marketingDayGame.version
    || session.answers.length !== questions.length || !questions.every((_, i) => validAnswer(i, session.answers[i]))) return null;
  const review = questions.map((decision, i) => ({
    decision,
    selected: decision.options.find(option => option.id === session.answers[i])!,
    reference: decision.options.find(option => option.score === 2)!,
  }));
  const points = review.reduce((sum, item) => sum + item.selected.score, 0);
  const maxPoints = questions.length * 2;
  const score = Math.round(points / maxPoints * 100);
  const axes = dimensions.map(axis => {
    const items = review.filter(item => item.decision.dimension === axis.id);
    const axisPoints = items.reduce((sum, item) => sum + item.selected.score, 0);
    return { id: axis.id, label: axis.label, points: axisPoints, maxPoints: items.length * 2, score: Math.round(axisPoints / (items.length * 2) * 100) };
  });
  const weakest = [...axes].sort((a, b) => a.score - b.score);
  return {
    points, maxPoints, score, highestCount: review.filter(item => item.selected.score === 2).length, axes, review,
    title: score >= 85 ? '今天，做得有方向。' : score >= 60 ? '抓到方向，也留下下一步。' : '今天的經驗，明天用得上。',
    summary: score >= 85 ? '你在這次情境中把目標、證據與查證連起來。下一次，可以練習把同樣的思考用在更不完整的資料上。'
      : `今天最值得再練習的是「${weakest[0].label}」。這份回顧記下你的取捨，幫助你找到下一次更好的起點。`,
    practice: weakest.slice(0, 2).map(axis => dimensions.find(d => d.id === axis.id)!.practice),
  };
}

export interface MarketingRoute { kind: 'intro' | 'play' | 'result'; index: number; canonical: string; notice?: string }

export function resolveMarketingRoute(hash: string, session: MarketingSession): MarketingRoute {
  if (hash === introPath) return { kind: 'intro', index: 0, canonical: introPath };
  const match = /^#\/quiz\/marketing-day\/(?:play\/)?([1-9]\d*)$/.exec(hash);
  const number = match ? Number(match[1]) : NaN;
  if (!session.started) return { kind: 'intro', index: 0, canonical: introPath, notice: '本遊戲不存檔，請從「開始上班」重新開始。' };
  if (hash === '#/quiz/marketing-day/result') {
    if (getMarketingResult(session)) return { kind: 'result', index: 5, canonical: hash };
    const index = nextMarketingDecision(session);
    return { kind: 'play', index, canonical: marketingPlayPath(index), notice: '先完成目前的決策，再查看當日回顧。' };
  }
  if (!Number.isSafeInteger(number) || number < 1 || number > questions.length) return { kind: 'intro', index: 0, canonical: introPath, notice: '這個遊戲網址不完整，請從介紹頁重新開始。' };
  const index = Math.min(number - 1, nextMarketingDecision(session));
  return { kind: 'play', index, canonical: marketingPlayPath(index), ...(index !== number - 1 ? { notice: '先完成目前的決策，才能往下一頁。' } : {}) };
}
