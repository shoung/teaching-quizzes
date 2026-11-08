import { describe, expect, it } from 'vitest';
import { salonActs, salonDimensions, salonGame, salonTerms } from './paris-salon';

// Content contract: protects learning coverage and prevents a resource dead end.
describe('沙龍夫人正式題庫', () => {
  it('有穩定入口、四幕十二題與六個各兩題的教學面向', () => {
    expect(salonGame).toMatchObject({ id: 'paris-salon', version: 2, scenarioCount: 12, minutes: 30 });
    expect(salonGame.decisions).toHaveLength(12);
    expect(salonActs).toHaveLength(4);
    expect(salonDimensions).toHaveLength(6);
    expect(salonGame.decisions.map(({ dimension }) => dimension)).toEqual([
      'insight', 'insight', 'resources', 'relationships', 'data', 'resources',
      'ai', 'data', 'operations', 'operations', 'relationships', 'ai',
    ]);
    expect(new Set(salonGame.decisions.map(({ id }) => id)).size).toBe(12);
    for (const { id } of salonDimensions) {
      expect(salonGame.decisions.filter(({ dimension }) => dimension === id)).toHaveLength(2);
    }
    for (let act = 1; act <= 4; act++) {
      expect(salonGame.decisions.filter((decision) => decision.act === act)).toHaveLength(3);
    }
    expect(new Set(salonGame.decisions.map(({ place }) => place)).size).toBe(4);
  });

  it('藝術之夜先處理當晚變更，再隔天回訪與結案，不倒敘打斷初學者', () => {
    expect(salonGame.decisions.slice(9).map(decision => decision.id)).toEqual(['salon-11', 'salon-10', 'salon-12']);
  });

  it('每題提供可讀證據、逐項回饋、兩個零成本方案且無預算增益', () => {
    const allIds: string[] = [];
    for (const decision of salonGame.decisions) {
      expect(decision.options.length).toBeGreaterThanOrEqual(3);
      expect(decision.options.length).toBeLessThanOrEqual(4);
      expect(decision.options.filter(({ cost }) => cost === 0).length).toBeGreaterThanOrEqual(2);
      expect(decision.evidence.length).toBeGreaterThan(1);
      expect(decision.explanation.length).toBeGreaterThan(50);
      expect(decision.npc).toBeGreaterThanOrEqual(1);
      expect(decision.npc).toBeLessThanOrEqual(6);
      for (const term of decision.terms) expect(salonTerms[term]).toBeDefined();
      for (const option of decision.options) {
        allIds.push(option.id);
        expect(Number.isInteger(option.cost) && option.cost >= 0).toBe(true);
        expect(option.score).toBeGreaterThanOrEqual(0);
        expect(option.score).toBeLessThanOrEqual(3);
        expect(option.feedback.length).toBeGreaterThan(40);
        expect(option.effects).not.toHaveProperty('budget');
        expect(option.fit?.effects ?? {}).not.toHaveProperty('budget');
        for (const value of Object.values(option.effects)) expect(Number.isInteger(value)).toBe(true);
      }
    }
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('把受眾／定位、條件契合與現場人數口徑寫入正式資料', () => {
    expect(salonGame.decisions[0].options.map(({ target }) => target)).toEqual(['artists', 'collectors', 'curious']);
    expect(salonGame.decisions[1].options.every(({ positioning, fit }) => positioning && fit)).toBe(true);
    expect(salonGame.decisions[3].options.some(({ fit }) => fit)).toBe(true);
    const sampleText = salonGame.decisions[7].evidence.map(({ value }) => value).join('');
    expect(sampleText).toContain('獨立抽查');
    expect(sampleText).toContain('不是目前全部');
    for (const decision of salonGame.decisions.slice(9)) {
      for (const option of decision.options) {
        expect(option.effects.confirmed ?? 0).toBe(0);
        expect(option.fit?.effects?.confirmed ?? 0).toBe(0);
      }
    }
  });

  it('手帳每個名詞都有白話、當時做法、現代遷移與常見誤區', () => {
    expect(Object.keys(salonTerms).length).toBeGreaterThanOrEqual(12);
    for (const term of Object.values(salonTerms)) {
      for (const text of Object.values(term)) expect(text.length).toBeGreaterThan(3);
    }
  });
});
