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
  { id: 'consulting', minScore: 85, label: '顧問入場券，解鎖！', target: '下一站：策略顧問／大型企業策略部門的案例挑戰', description: '你這次不只會找答案，也會問問題、抓數字和接住 AI 的球。已跨過本次顧問挑戰線！接下來試試口頭案例：讓同學一直追問「為什麼」，看看你的理由能站多穩。' },
  { id: 'enterprise', minScore: 70, label: '已到面試門口，還差一點火候', target: '可練習：大型企業行銷企劃、商業分析與儲備幹部專案', description: '大部分關卡你都接得住，顧問大門已經在眼前。下一步是補上較弱的一角，把好直覺變成別人也聽得懂的理由；大型企業的企劃實習題會是很好的練習場。' },
  { id: 'growth', minScore: 55, label: '企劃潛力股，正在發光', target: '可練習：成長型企業／行銷代理商的企劃與分析任務', description: '你有幾招已經很有感，只是還沒連成完整招式。可以先挑成長型企業、代理商常見的小專案練手，從看懂顧客、算對數字到說清楚建議，做出一份拿得出手的作品。' },
  { id: 'execution', minScore: 40, label: '實戰新手，先累積戰績', target: '可練習：在地品牌／電商團隊的行銷執行與專案助理任務', description: '幾道陷阱讓你跌了一跤，但這正是練習的用途。先從範圍清楚的小任務開始：幫品牌整理回饋、記錄成效、試一場小活動，讓每次判斷都有實際結果可以對照。' },
  { id: 'foundation', minScore: 0, label: '潛力新手，先練這兩招', target: '可練習：校園社團／課堂品牌專案，和隊友一起打底', description: '入場券還在集點中，別急著替自己貼標籤。先練下方兩項技能，在社團或課堂專案找一個小問題試做。能把一件小事想清楚、做出來，就是下一次闖關的裝備。' },
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
