import { describe, expect, it } from 'vitest';
import { SEASON_LENGTH } from '../paris-salon/season-types';
import {
  seasonActions, seasonAudiences, seasonGame, seasonMarkets, seasonPrologue,
  seasonPositioningLesson, seasonScales, seasonThemes,
} from './paris-salon-season';

const actionIds = [
  'research', 'participation', 'artist', 'training', 'helpers', 'seats',
  'ambience', 'experiment', 'promotion', 'membership', 'sponsor',
] as const;

describe('V4 沙龍六場內容', () => {
  it('保留分享識別並以六場作為遊戲規模', () => {
    expect(seasonGame).toMatchObject({
      id: 'paris-salon', version: 4, title: '沙龍夫人的經營筆記', scenarioCount: SEASON_LENGTH,
    });
    expect(seasonGame.description).toContain('六場');
    expect(seasonGame.description).toContain('沒有單一正解');
  });

  it('提供完整且唯一的 11 種可組合準備行動，每項都有教學脈絡', () => {
    expect(seasonActions.map(({ id }) => id)).toEqual(actionIds);
    expect(new Set(seasonActions.map(({ id }) => id)).size).toBe(actionIds.length);
    for (const action of seasonActions) {
      expect(action.title.length).toBeGreaterThan(0);
      expect(action.concept.length).toBeGreaterThan(0);
      expect(action.basis.length).toBeGreaterThan(0);
      expect(action.tradeoff.length).toBeGreaterThan(0);
      expect(action.lesson.length).toBeGreaterThan(0);
      expect(action.cost).toBeGreaterThanOrEqual(0);
      expect(action.time).toBeGreaterThan(0);
    }
  });

  it('具備固定的行動成本時間、永久投資與可恢復的基礎規模', () => {
    expect(seasonActions.map(({ id, cost, time }) => [id, cost, time])).toEqual([
      ['research', 0, 1], ['participation', 4, 1], ['artist', 16, 2],
      ['training', 18, 2], ['helpers', 10, 1], ['seats', 20, 2],
      ['ambience', 14, 1], ['experiment', 6, 1], ['promotion', 14, 1],
      ['membership', 6, 1], ['sponsor', 0, 2],
    ]);
    expect(seasonActions.filter(({ permanent }) => permanent).map(({ id }) => id).sort())
      .toEqual(['ambience', 'experiment', 'research', 'seats', 'training']);
    expect(seasonActions.find(({ id }) => id === 'research')?.basis).toMatch(/下一場/);
    expect(seasonActions.find(({ id }) => id === 'research')?.lesson).toMatch(/下一場/);
    expect(seasonScales).toEqual([
      { id: 'small', title: '小聚', cost: 0, limit: 12 },
      { id: 'standard', title: '常設沙龍', cost: 8, limit: 24 },
      { id: 'grand', title: '盛大之夜', cost: 18, limit: 48 },
    ]);
    expect(seasonScales[0].cost).toBe(0);
  });

  it('讓三種主受眾、主題承諾和規模各有唯一且有效的識別', () => {
    expect(seasonAudiences.map(({ id }) => id)).toEqual(['creators', 'enthusiasts', 'newcomers']);
    expect(seasonThemes.map(({ id }) => id)).toEqual(['workshop', 'exhibition', 'discovery']);
    expect(new Set(seasonAudiences.map(({ id }) => id)).size).toBe(3);
    expect(new Set(seasonThemes.map(({ id }) => id)).size).toBe(3);
    expect(new Set(seasonScales.map(({ id }) => id)).size).toBe(3);
    expect(seasonThemes.map(({ audience }) => audience).sort())
      .toEqual(seasonAudiences.map(({ id }) => id).sort());
    expect(seasonPositioningLesson).toMatch(/Segmentation.*Targeting.*Positioning/);
    expect(seasonPositioningLesson).toContain('不是準備行動');
    for (const audience of seasonAudiences) expect(audience.need.length).toBeGreaterThan(0);
    for (const theme of seasonThemes) expect(theme.promise.length).toBeGreaterThan(0);
  });

  it('包含六則可對應主受眾的市場消息，並交代漏斗和小樣本的限制', () => {
    expect(seasonMarkets).toHaveLength(SEASON_LENGTH);
    expect(seasonMarkets.map(({ preferred }) => preferred))
      .toEqual(['creators', 'enthusiasts', 'newcomers', 'creators', 'enthusiasts', 'newcomers']);
    for (const market of seasonMarkets) {
      expect(market.title.length).toBeGreaterThan(0);
      expect(market.news.length).toBeGreaterThan(0);
      expect(market.mentor.length).toBeGreaterThan(0);
      expect(market.demand).toBeGreaterThan(0);
    }
    expect(seasonActions.find(({ id }) => id === 'promotion')?.lesson).toMatch(/觸及.*詢問.*預約.*出席/);
    expect(seasonActions.find(({ id }) => id === 'experiment')?.lesson).toMatch(/小樣本/);
    expect(seasonActions.find(({ id }) => id === 'membership')?.lesson)
      .toMatch(/既有熟客留存.*本場開始前熟客.*新增熟客另行計算/);
    expect(seasonActions.find(({ id }) => id === 'sponsor')?.tradeoff)
      .toMatch(/承諾與受眾不合則無贊助.*模型簡化為條件式支持/);
  });

  it('序章建立1900巴黎、2026手帳及露易斯夫人導師關係而不出現媒體穿越', () => {
    expect(seasonPrologue).toHaveLength(4);
    expect(new Set(seasonPrologue.map(({ id }) => id)).size).toBe(4);
    expect(seasonPrologue.map(({ speaker }) => speaker)).toContain('克萊爾夫人');
    expect(seasonPrologue.filter(({ speaker, npc }) => speaker === '露易斯夫人' && npc === 5)).toHaveLength(2);
    expect(seasonPrologue.map(({ text }) => text).join('')).toMatch(/1900/);
    expect(seasonPrologue.map(({ text }) => text).join('')).toMatch(/2026/);
    expect(seasonPrologue.map(({ text }) => text).join('')).toMatch(/信件、印刷品與面談辦事/);
    expect(seasonPrologue[3].text).toMatch(/六場.*四個準備時段/);
    expect(seasonPrologue[3].text).toMatch(/現金、熟客、口碑、知名度與場地投資都會延續/);
  });
});
