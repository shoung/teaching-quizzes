import { describe, expect, it } from 'vitest';
import { consultingQuiz } from './consulting';
import { getConsultingReport } from '../consulting-engine';

describe('原創 AI 行銷企劃題庫', () => {
  it('28 道題涵蓋六面向且均可有效評分', () => {
    expect(consultingQuiz.questions).toHaveLength(28);
    expect(new Set(consultingQuiz.questions.map((q) => q.id)).size).toBe(28);
    for (const q of consultingQuiz.questions) {
      expect(q.options).toHaveLength(4);
      expect(q.optionScores?.slice().sort()).toEqual([0, 1, 2, 3]);
      expect(q.scenario?.length).toBeGreaterThan(20);
      expect(q.explanation.length).toBeGreaterThan(30);
    }
  });
  it('一組獨立核對的完整答案得到 84 分與六面向滿分', () => {
    const answers = [2, 0, 3, 1, 2, 0, 1, 3, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 0, 3, 1, 2, 0, 3, 2, 0, 3, 1];
    const report = getConsultingReport(consultingQuiz, { version: 2, answers, completed: true });
    expect(report).toMatchObject({ earned: 84, maximum: 84, score: 100, tier: { id: 'consulting' }, gaps: [] });
    expect(report?.axes.map((axis) => axis.count)).toEqual([4, 5, 5, 6, 4, 4]);
    expect(report?.axes.map((axis) => axis.score)).toEqual([100, 100, 100, 100, 100, 100]);
  });
  it('只根據選項長短猜題，無法繞過能力判斷得到高階分級', () => {
    for (const rank of [0, 1, 2, 3]) {
      const answers = consultingQuiz.questions.map((q) => {
        return q.options.map((option, index) => ({ length: option.length, index }))
          .sort((a, b) => b.length - a.length || a.index - b.index)[rank].index;
      });
      const report = getConsultingReport(consultingQuiz, { version: 2, answers, completed: true });
      expect(report!.score).toBeLessThan(70);
      expect(report!.tier.id).not.toBe('consulting');
    }
  });
});
