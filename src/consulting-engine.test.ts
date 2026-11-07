import { describe, expect, it } from 'vitest';
import { getCareerTier, getConsultingReport } from './consulting-engine';
import type { Quiz } from './types';

const ids = ['structure', 'data', 'marketing', 'ai-workflow', 'ai-trust', 'proposal'];
const quiz: Quiz = {
  id: 'consulting-fixture', version: 1, title: '模擬', subtitle: '', description: '',
  category: '行銷企劃', minutes: 5, color: 'sage', icon: 'briefcase', mode: 'consulting',
  questions: ids.map((dimension) => ({ id: dimension, dimension, prompt: '題目',
    options: ['零', '一', '二', '三'], optionScores: [0, 1, 2, 3], correctAnswer: 3, explanation: '解析' })),
};

describe('AI 企劃情境的能力計分', () => {
  it('採分級選項積分，總分與每個面向各自正規化', () => {
    const report = getConsultingReport(quiz, { version: 1, answers: [0, 1, 2, 3, 1, 0], completed: true });
    expect(report).toMatchObject({ earned: 7, maximum: 18, score: 39 });
    expect(report?.axes.map((a) => a.score)).toEqual([0, 33, 67, 100, 33, 0]);
  });
  it('未完成與不合法答案不會產生結果', () => {
    expect(getConsultingReport(quiz, { version: 1, answers: [0, 1, 2, 3, 1, null], completed: false })).toBeNull();
    expect(getConsultingReport(quiz, { version: 1, answers: [0, 1, 2, 9, 1, 0], completed: true })).toBeNull();
  });
  it('即使其他面向強，AI 協作或查證不足也不能進入最高挑戰層', () => {
    expect(getCareerTier(95, ids.map((id) => ({ id, score: id === 'ai-workflow' ? 69 : 95 }))).id).toBe('enterprise');
    expect(getCareerTier(95, ids.map((id) => ({ id, score: id === 'ai-trust' ? 49 : 95 }))).id).toBe('growth');
    expect(getCareerTier(95, ids.map((id) => ({ id, score: id === 'data' ? 59 : 95 }))).id).toBe('enterprise');
  });
  it.each([[85, 'consulting'], [70, 'enterprise'], [55, 'growth'], [40, 'execution'], [39, 'foundation']])('總分 %s 對應課堂挑戰層 %s', (score, tier) => {
    expect(getCareerTier(Number(score), ids.map((id) => ({ id, score: 90 }))).id).toBe(tier);
  });
});
