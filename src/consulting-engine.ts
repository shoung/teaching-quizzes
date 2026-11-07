import type { Quiz, Session } from './types';
import { consultingDimensions } from './data/consulting';
import { restoreSession } from './quiz-engine';

export interface CompetencyScore {
  id: string; name: string; english: string; practice: string;
  score: number; earned: number; maximum: number; count: number;
}
export interface CareerTier {
  id: string; label: string; target: string; description: string; minScore: number;
}
export interface ConsultingReport {
  score: number; earned: number; maximum: number; axes: CompetencyScore[];
  tier: CareerTier; gaps: { label: string; current: number; target: number }[];
}
export const careerTiers: CareerTier[] = [
  { id: 'consulting', minScore: 85, label: '顧問案例挑戰組', target: '國際策略顧問／大型企業策略部門的案例練習', description: '本次展現較完整的分析與 AI 協作判斷。下一步可挑戰接近麥肯錫等策略顧問情境的口頭案例、開放式分析與專案實習，練習在追問下清楚論證。' },
  { id: 'enterprise', minScore: 70, label: '大型企業企劃培育組', target: '大型企業行銷企劃、商業分析或儲備幹部的專案練習', description: '本次已能處理多數企劃判斷，適合練習跨部門提案與較完整的商業分析。先補上較弱面向，再以可追溯的作品集準備大型企業相關實習。' },
  { id: 'growth', minScore: 55, label: '成長型企業實作組', target: '成長型企業／專業代理商的企劃助理與專案實習練習', description: '本次具備部分分析基礎，下一步是把單點想法串成可執行企劃。可從中型或成長型企業、專業代理商的實務任務練習，累積指標與作品。' },
  { id: 'execution', minScore: 40, label: '行銷執行起步組', target: '在地品牌、電商團隊的行銷執行與專案助理任務練習', description: '本次仍需要較明確的工作範圍與指導。適合先從素材整理、社群成效紀錄、顧客訪談與小活動執行開始，逐步練習獨立判斷。' },
  { id: 'foundation', minScore: 0, label: '校園基礎培力組', target: '校園社團／課堂品牌專案的基礎任務練習', description: '現在最值得投入的是基本功。先在有老師或同學協助的校園專案練習定義問題、手算指標與查證 AI 產出，再逐步挑戰企業實習任務。' },
];

export function getCareerTier(score: number, axes: { id: string; score: number }[]): CareerTier {
  const value = (id: string) => axes.find((axis) => axis.id === id)?.score ?? 0;
  const minimum = Math.min(...consultingDimensions.map((d) => value(d.id)));
  if (score >= 85 && value('ai-workflow') >= 70 && value('ai-trust') >= 75 && minimum >= 60) return careerTiers[0];
  if (score >= 70 && value('ai-workflow') >= 50 && value('ai-trust') >= 50 && minimum >= 40) return careerTiers[1];
  if (score >= 55 && value('ai-trust') >= 40) return careerTiers[2];
  if (score >= 40) return careerTiers[3];
  return careerTiers[4];
}

export function getConsultingReport(quiz: Quiz, session: Session): ConsultingReport | null {
  const valid = restoreSession(session, quiz);
  if (!valid?.completed) return null;
  const items = quiz.questions.map((question, index) => {
    const answer = valid.answers[index];
    const scores = question.optionScores ?? [];
    return { dimension: question.dimension, earned: typeof answer === 'number' ? scores[answer] ?? 0 : 0,
      maximum: scores.length ? Math.max(...scores) : 0 };
  });
  const earned = items.reduce((sum, item) => sum + item.earned, 0);
  const maximum = items.reduce((sum, item) => sum + item.maximum, 0);
  if (!maximum) return null;
  const score = Math.round(earned / maximum * 100);
  const axes = consultingDimensions.map((dimension) => {
    const matching = items.filter((item) => item.dimension === dimension.id);
    const earned = matching.reduce((sum, item) => sum + item.earned, 0);
    const maximum = matching.reduce((sum, item) => sum + item.maximum, 0);
    return { ...dimension, earned, maximum, count: matching.length, score: maximum ? Math.round(earned / maximum * 100) : 0 };
  });
  const targets = axes.map((axis) => ({ label: axis.name, current: axis.score,
    target: axis.id === 'ai-workflow' ? 70 : axis.id === 'ai-trust' ? 75 : 60 }));
  const gaps = [{ label: '總分', current: score, target: 85 }, ...targets].filter((gap) => gap.current < gap.target);
  return { earned, maximum, score, axes, tier: getCareerTier(score, axes), gaps };
}
