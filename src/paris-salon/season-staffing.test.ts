import { describe, expect, it } from 'vitest';
import { seasonActions } from '../data/paris-salon-season';
import { defaultPlan, forecastSeason, initialSeason, replaySeason, restoreSeason, SEASON_STORAGE_KEY } from './season-engine';
import type { SeasonPlan } from './season-types';

const plan = (actions: SeasonPlan['actions']): SeasonPlan => ({ ...defaultPlan(), actions });

describe('助手分工取代四時段', () => {
  it('以實際助手人數限制卡牌，沒有固定時段參數', () => {
    const estimate = forecastSeason(initialSeason(), plan(['research', 'participation', 'experiment']));
    expect(estimate.staffRequired).toBe(3);
    expect(estimate.staffAvailable).toBe(2);
    expect(estimate.issues.join(' ')).toContain('助手不足');
    expect(estimate).not.toHaveProperty('timeLimit');
    expect(estimate).not.toHaveProperty('time');
  });

  it('臨時助手立即增加兩位，能安排超過原本四時段的卡牌，但下場不留人', () => {
    const busy = plan(['helpers', 'artist', 'participation', 'experiment']);
    const estimate = forecastSeason(initialSeason(), busy);
    expect(estimate.issues).toEqual([]);
    expect(estimate.staffRequired).toBe(4);
    expect(estimate.staffAvailable).toBe(4);
    const replay = replaySeason([busy])!;
    expect(replay.events[0].after.assistants).toBe(2);
    expect(forecastSeason({ ...initialSeason(), started: true, plans: [busy], acknowledged: 1 }).staffAvailable).toBe(2);
  });

  it('增聘固定助手立即協助準備並跨場保留，報酬確實從現金扣除', () => {
    const recruit = plan(['recruit', 'artist', 'research']);
    const estimate = forecastSeason(initialSeason(), recruit);
    expect(estimate.issues).toEqual([]);
    expect(estimate.staffAvailable).toBe(3);
    const replay = replaySeason([recruit])!;
    expect(replay.assets.assistants).toBe(3);
    expect(replay.events[0].costs.actions).toBe(38);
    expect(replay.assets.cash).toBe(100 - replay.events[0].costs.total + replay.events[0].income.total);
    expect(replaySeason([recruit, plan(['research', 'participation', 'promotion'])])).not.toBeNull();
  });

  it('助手最多六人，培訓提升技能而不增加人數', () => {
    const trained = replaySeason([plan(['training'])])!;
    expect(trained.assets.assistants).toBe(2);
    expect(trained.assets.training).toBe(1);
    const hires = Array.from({ length: 4 }, () => plan(['recruit']));
    expect(replaySeason(hires)?.assets.assistants).toBe(6);
    expect(replaySeason([...hires, plan(['recruit'])])).toBeNull();
  });

  it('每張卡起步時都能單獨安排，卡牌沒有永遠達不到的人力門檻', () => {
    for (const action of seasonActions) {
      expect(forecastSeason(initialSeason(), plan([action.id])).issues, action.title).toEqual([]);
    }
  });

  it('新版獨立保存，不用新規則重算 v4 存檔', () => {
    expect(SEASON_STORAGE_KEY).toBe('learning-lab:quiz:paris-salon:v5');
    expect(restoreSeason({ ...initialSeason(), version: 4 })).toBeNull();
    expect(restoreSeason(JSON.stringify(initialSeason()))).toEqual(initialSeason());
  });
});
