import { describe, expect, it } from 'vitest';
import { seasonActions, seasonMarkets, seasonThemes } from '../data/paris-salon-season';
import {
  acknowledgeSeason, defaultPlan, forecastSeason, holdSeason, initialSeason, replaySeason,
  resolveSeasonRoute, restoreSeason, setSeasonDraft, startSeason,
} from './season-engine';
import type { ActionId, Scale, SeasonPlan } from './season-types';

function runSeason(plans: SeasonPlan[]) {
  let session = startSeason(initialSeason());
  for (let i = 0; i < plans.length; i++) {
    session = setSeasonDraft(session, plans[i]);
    session = holdSeason(session, i + 1);
    session = acknowledgeSeason(session);
  }
  return session;
}

const quietPlan = (): SeasonPlan => ({ ...defaultPlan(), scale: 'small', actions: [] });

describe('沙龍六場：規劃與財務', () => {
  it('初始資產可支撐低成本恢復方案，預測列出實際限制且不改動存檔', () => {
    const fresh = initialSeason();
    const forecast = forecastSeason(fresh, quietPlan());
    expect(fresh).toMatchObject({ version: 3, started: false, plans: [], acknowledged: 0 });
    expect(forecast.cost).toBe(0);
    expect(forecast.time).toBe(0);
    expect(forecast.timeLimit).toBe(4);
    expect(forecast.seats).toBe(24);
    expect(forecast.safeCapacity).toBeLessThanOrEqual(12);
    expect(forecast.attendance[0]).toBeLessThanOrEqual(forecast.attendance[1]);
    expect(fresh.plans).toEqual([]);
  });

  it('拒絕超預算、超準備時間、重複行動與超資產上限的配置', () => {
    let session = startSeason(initialSeason());
    const highCost: SeasonPlan = { ...defaultPlan(), scale: 'grand', actions: seasonActions.map(a => a.id) };
    const tooMany = { ...defaultPlan(), actions: ['training', 'training', 'training', 'training'] as ActionId[] };
    const invalidScale = { ...defaultPlan(), scale: 'palace' } as unknown as SeasonPlan;
    expect(setSeasonDraft(session, highCost)).toBe(session);
    expect(setSeasonDraft(session, tooMany)).toBe(session);
    expect(setSeasonDraft(session, invalidScale)).toBe(session);
    expect(forecastSeason(session, highCost).issues.length).toBeGreaterThan(0);
    expect(forecastSeason(session, tooMany).issues.length).toBeGreaterThan(0);
  });

  it('每場財務分列且現金不為負；第二次舉辦同一場不會重複結算', () => {
    let session = startSeason(initialSeason());
    session = setSeasonDraft(session, quietPlan());
    const held = holdSeason(session, 1);
    expect(held.plans).toHaveLength(1);
    const replay = replaySeason(held.plans)!;
    expect(replay.events).toHaveLength(1);
    expect(replay.events[0].costs.total).toBe(replay.events[0].costs.base + replay.events[0].costs.actions);
    expect(replay.events[0].income.total).toBe(replay.events[0].income.support + replay.events[0].income.members + replay.events[0].income.sponsor);
    expect(replay.assets.cash).toBeGreaterThanOrEqual(0);
    expect(holdSeason(held, 1)).toBe(held);
    expect(holdSeason(held, 2)).toBe(held);
  });

  it('研究只縮窄後續預測並揭露偏好，不加知名度；實驗須被後續行動採用才產生效果', () => {
    const start = startSeason(initialSeason());
    const research = { ...quietPlan(), actions: ['research'] as ActionId[] };
    const first = holdSeason(setSeasonDraft(start, research), 1);
    const researched = replaySeason(first.plans)!;
    expect(researched.assets.insight).toBeGreaterThan(0);
    const quiet = replaySeason([quietPlan()])!;
    expect(researched.events[0].after.awareness).toBe(quiet.events[0].after.awareness);
    const nextForecast = forecastSeason({ ...first, acknowledged: 1 }, quietPlan());
    expect(nextForecast.insights.length).toBeGreaterThan(0);
    const withoutResearch = runSeason([quietPlan()]);
    const broadForecast = forecastSeason(withoutResearch, quietPlan());
    expect(nextForecast.attendance[1] - nextForecast.attendance[0]).toBeLessThan(broadForecast.attendance[1] - broadForecast.attendance[0]);

    const experimentOnly = runSeason([{ ...quietPlan(), actions: ['experiment'] }]);
    const experiment = replaySeason(experimentOnly.plans)!;
    expect(experiment.assets.tested).toBe(true);
    expect(experiment.events[0].reach).toBe(quiet.events[0].reach);
    const promoPlan: SeasonPlan = { ...quietPlan(), scale: 'standard', actions: ['promotion'] };
    const withTest = replaySeason([{ ...quietPlan(), actions: ['experiment'] }, promoPlan])!;
    const withoutTest = replaySeason([quietPlan(), promoPlan])!;
    expect(withTest.events[1].reach).toBe(withoutTest.events[1].reach + 5);
  });

  it('到場人數永遠在預測範圍，實體座位及安全接待量限制有效', () => {
    const plans: SeasonPlan[] = [{ ...defaultPlan(), scale: 'grand' as Scale, actions: ['seats', 'promotion', 'helpers'] as ActionId[] }, ...Array.from({ length: 5 }, quietPlan)];
    const replay = replaySeason(plans)!;
    replay.events.forEach((event, i) => {
      const forecast = forecastSeason(runSeason(plans.slice(0, i)), plans[i]);
      expect(event.attendance).toBeGreaterThanOrEqual(forecast.attendance[0]);
      expect(event.attendance).toBeLessThanOrEqual(forecast.attendance[1]);
      expect(event.attendance + event.waiting).toBeGreaterThanOrEqual(forecast.demand[0]);
      expect(event.attendance + event.waiting).toBeLessThanOrEqual(forecast.demand[1]);
      expect(event.waiting).toBeGreaterThanOrEqual(forecast.waiting[0]);
      expect(event.waiting).toBeLessThanOrEqual(forecast.waiting[1]);
      expect(forecast.capacity).toBe(event.seatCapacity);
      expect(event.attendance).toBeLessThanOrEqual(event.seatCapacity);
    });
    expect(replay.events[0].seatCapacity).toBe(32);
    expect(replay.events[0].safeCapacity).toBeLessThanOrEqual(replay.events[0].seatCapacity);
  });

  it('預測分開估算需求、可入場與候補，並揭露研究後的小型場地候補風險', () => {
    const researchPlan: SeasonPlan = { ...quietPlan(), actions: ['research', 'sponsor'] };
    const secondPlan: SeasonPlan = {
      audience: 'enthusiasts', theme: 'exhibition', scale: 'small', actions: ['participation', 'membership'],
    };
    const sessionAfterFirst = runSeason([researchPlan]);
    const forecast = forecastSeason(sessionAfterFirst, secondPlan);
    const actual = replaySeason([researchPlan, secondPlan])!.events[1];

    expect(forecast.capacity).toBe(12);
    expect(forecast.demand).toEqual([13, 15]);
    expect(forecast.attendance).toEqual([12, 12]);
    expect(forecast.waiting).toEqual([1, 3]);
    expect(actual.attendance).toBeGreaterThanOrEqual(forecast.attendance[0]);
    expect(actual.attendance).toBeLessThanOrEqual(forecast.attendance[1]);
    expect(actual.waiting).toBeGreaterThanOrEqual(forecast.waiting[0]);
    expect(actual.waiting).toBeLessThanOrEqual(forecast.waiting[1]);
    expect(forecast.insights.join(' ')).toContain('候補風險');
  });
});

describe('沙龍六場：熟客、階段與存檔', () => {
  it('熟客留存分母是前場熟客，新增熟客不混入本場留存率', () => {
    const plans = Array.from({ length: 6 }, () => ({ ...defaultPlan(), actions: ['membership'] as ActionId[] }));
    const replay = replaySeason(plans)!;
    for (let i = 1; i < replay.events.length; i++) {
      const previousRegulars = replay.events[i].before.regulars;
      expect(replay.events[i].retained).toBeLessThanOrEqual(previousRegulars);
      expect(replay.events[i].newRegulars).toBeGreaterThanOrEqual(0);
    }
    expect(replay.events[0].retained).toBeGreaterThan(0);
  });

  it('只允許明確開始、逐場確認後舉辦六場，且季末阻擋第七場', () => {
    const fresh = initialSeason();
    expect(holdSeason(fresh, 1)).toBe(fresh);
    let session = startSeason(fresh);
    session = setSeasonDraft(session, quietPlan());
    let held = holdSeason(session, 1);
    expect(held.plans).toHaveLength(1);
    expect(holdSeason(held, 1)).toBe(held);
    expect(holdSeason(held, 2)).toBe(held);
    session = acknowledgeSeason(held);
    for (let n = 2; n <= 6; n++) {
      session = setSeasonDraft(session, quietPlan());
      held = holdSeason(session, n);
      expect(held.plans).toHaveLength(n);
      expect(holdSeason(held, n)).toBe(held);
      session = acknowledgeSeason(held);
    }
    expect(holdSeason(session, 7)).toBe(session);
    expect(resolveSeasonRoute('#/quiz/paris-salon/result', session).kind).toBe('result');
    expect(resolveSeasonRoute('#/quiz/paris-salon/play/1', session).kind).toBe('result');
  });

  it('重播六種市場變化的全零行動恢復路線，不透支且每場配置可行', () => {
    const replay = replaySeason(Array.from({ length: 6 }, quietPlan));
    expect(replay).not.toBeNull();
    expect(replay!.events).toHaveLength(6);
    expect(replay!.assets.cash).toBeGreaterThanOrEqual(0);
    expect(seasonMarkets).toHaveLength(6);
  });

  it('配合市場、渠道與接待投入的成長路線可行，且宣傳過量會造成服務超載', () => {
    const growthPlans: SeasonPlan[] = seasonMarkets.map((market, index) => {
      const theme = seasonThemes.find(item => item.audience === market.preferred)!;
      const actions: ActionId[] = index === 0
        ? ['seats', 'promotion', 'helpers']
        : index === 1
          ? ['promotion', 'helpers', 'training']
          : index <= 3
            ? ['promotion', 'helpers', 'training']
            : ['promotion', 'helpers'];
      return { audience: market.preferred, theme: theme.id, scale: index === 1 ? 'standard' : 'grand', actions };
    });
    const growth = replaySeason(growthPlans);
    const quiet = replaySeason(Array.from({ length: 6 }, quietPlan));
    const overload = replaySeason([{ ...defaultPlan(), scale: 'grand', actions: ['promotion'] }]);
    expect(growth).not.toBeNull();
    expect(growth!.assets.cash).toBeGreaterThanOrEqual(0);
    expect(growth!.assets.awareness).toBeGreaterThan(quiet!.assets.awareness);
    expect(growth!.assets.seats).toBeGreaterThan(24);
    expect(growth!.events.some(event => event.attendance > 24 && event.seatCapacity > 24)).toBe(true);
    expect(overload!.events[0].attendance).toBeGreaterThan(overload!.events[0].safeCapacity);
    expect(overload!.events[0].waiting).toBeGreaterThanOrEqual(0);
    expect(overload!.events[0].notes.join(' ')).toContain('舒適接待量');
    expect(forecastSeason(startSeason(initialSeason()), growthPlans[0]).seats).toBe(32);
  });

  it('還原只接受連續有效計畫、核准階段與安全草稿；不信任偽造資產總值', () => {
    const first = runSeason([quietPlan()]);
    expect(restoreSeason(first)).toEqual(first);
    expect(restoreSeason(JSON.stringify({ ...first, assets: { cash: 999999 }, draft: { actions: ['unknown'] } }))).toMatchObject({ plans: first.plans });
    expect(restoreSeason({ ...first, plans: [quietPlan(), quietPlan()], acknowledged: 0 })).toBeNull();
    expect(restoreSeason({ ...first, plans: [{ ...quietPlan(), audience: 'pirates' }] })).toBeNull();
    expect(restoreSeason({ ...first, version: 2 })).toBeNull();
    expect(restoreSeason('{broken')).toBeNull();
  });

  it('主題受眾有效且偏好選擇影響口碑，沒有答案分數或正解欄位', () => {
    const valid = seasonThemes.every(theme => ['creators', 'enthusiasts', 'newcomers'].includes(theme.audience));
    expect(valid).toBe(true);
    const fit = replaySeason([{ ...quietPlan(), audience: seasonMarkets[0].preferred }])!;
    const miss = replaySeason([{ ...quietPlan(), audience: 'newcomers' }])!;
    expect(fit.events[0]).not.toHaveProperty('score');
    expect(fit.events[0].satisfaction).toBeGreaterThanOrEqual(miss.events[0].satisfaction);
  });
});
