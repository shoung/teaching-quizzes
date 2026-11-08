import { describe, expect, it } from 'vitest';
import { seasonActions, seasonMarkets, seasonThemes } from '../data/paris-salon-season';
import { seasonScenes } from '../data/paris-salon-rpg';
import {
  acknowledgeSeason, canPlanSeason, completeSeasonEnding, defaultPlan, forecastSeason, heardSeasonNpc, holdSeason, initialSeason, replaySeason,
  resolveSeasonRoute, restoreSeason, SEASON_STORAGE_KEY, setSeasonDraft, startSeason,
} from './season-engine';
import type { ActionId, Scale, SeasonPlan } from './season-types';

function runSeason(plans: SeasonPlan[]) {
  let session = startSeason(initialSeason());
  for (let i = 0; i < plans.length; i++) {
    session = hearRoundNonMentor(session, i + 1);
    session = setSeasonDraft(session, plans[i]);
    session = holdSeason(session, i + 1);
    session = acknowledgeSeason(session);
  }
  return session;
}

function hearRoundNonMentor(session: ReturnType<typeof initialSeason>, round = session.plans.length + 1) {
  const guest = seasonScenes.find(scene => scene.number === round)?.npcs.find(npc => npc.id !== 5);
  if (!guest) throw new Error(`Round ${round} has no non-mentor NPC in test fixture`);
  return heardSeasonNpc(session, guest.id);
}

const quietPlan = (): SeasonPlan => ({ ...defaultPlan(), scale: 'small', actions: [] });

describe('沙龍六場：規劃與財務', () => {
  it('新季使用 v5 儲存欄位，知名度以 50 起步', () => {
    expect(initialSeason()).toEqual({
      version: 5,
      started: false,
      plans: [],
      acknowledged: 0,
      draft: defaultPlan(),
      heard: {},
      endingSeen: false,
    });
    expect(replaySeason([])?.assets.awareness).toBe(50);
    expect(SEASON_STORAGE_KEY).toBe('learning-lab:quiz:paris-salon:v5');
  });

  it('初始知名度不會造成首場必然候補，良好體驗累積推薦而宣傳不能抵銷失望', () => {
    const quiet = replaySeason([quietPlan()])!;
    const badService = replaySeason([{ ...quietPlan(), scale: 'grand', actions: ['promotion'] }])!;
    expect(quiet.events[0].reach).toBe(28);
    expect(quiet.events[0].waiting).toBe(0);
    expect(quiet.events[0].after.awareness).toBeGreaterThan(50);
    expect(badService.events[0].satisfaction).toBeLessThan(65);
    expect(badService.events[0].after.awareness).toBeLessThan(50);
  });

  it('初始資產可支撐低成本恢復方案，預測列出實際限制且不改動存檔', () => {
    const fresh = initialSeason();
    const forecast = forecastSeason(fresh, quietPlan());
    expect(fresh).toMatchObject({ version: 5, started: false, plans: [], acknowledged: 0 });
    expect(forecast.cost).toBe(0);
    expect(forecast.staffRequired).toBe(0);
    expect(forecast.staffAvailable).toBe(2);
    expect(forecast.seats).toBe(24);
    expect(forecast.safeCapacity).toBeLessThanOrEqual(12);
    expect(forecast.attendance[0]).toBeLessThanOrEqual(forecast.attendance[1]);
    expect(fresh.plans).toEqual([]);
  });

  it('拒絕超預算、人手不足、重複行動與超資產上限的配置', () => {
    let session = hearRoundNonMentor(startSeason(initialSeason()));
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
    let session = hearRoundNonMentor(startSeason(initialSeason()));
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
    const heardStart = hearRoundNonMentor(start);
    const research = { ...quietPlan(), actions: ['research'] as ActionId[] };
    const first = holdSeason(setSeasonDraft(heardStart, research), 1);
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
    const researchPlan: SeasonPlan = { ...quietPlan(), actions: ['research', 'sponsor', 'helpers'] };
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
  it('每場要先聽到當日在場非導師，導師對話可聽但不解鎖規劃', () => {
    let session = startSeason(initialSeason());
    expect(canPlanSeason(session)).toBe(false);
    expect(setSeasonDraft(session, quietPlan())).toBe(session);
    expect(holdSeason(session, 1)).toBe(session);
    const firstRoster = seasonScenes.find(scene => scene.number === 1)!.npcs;
    const mentor = firstRoster.find(npc => npc.id === 5)!;
    const guest = firstRoster.find(npc => npc.id !== 5)!;
    session = heardSeasonNpc(session, mentor.id);
    expect(canPlanSeason(session)).toBe(false);
    expect(heardSeasonNpc(session, 99)).toBe(session);
    const futureGuest = seasonScenes.find(scene => scene.number === 2)!.npcs.find(npc => !firstRoster.some(current => current.id === npc.id))!;
    expect(heardSeasonNpc(session, futureGuest.id)).toBe(session);
    const unavailableId = [1, 2, 3, 4, 5, 6].find(id => !firstRoster.some(npc => npc.id === id)) ?? 99;
    expect(heardSeasonNpc(session, unavailableId)).toBe(session);
    const afterGuest = heardSeasonNpc(session, guest.id);
    expect(canPlanSeason(afterGuest)).toBe(true);
    expect(heardSeasonNpc(afterGuest, guest.id)).toBe(afterGuest);
    expect(setSeasonDraft(afterGuest, quietPlan()).draft).toEqual(quietPlan());
  });

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
    expect(completeSeasonEnding(fresh)).toBe(fresh);
    expect(holdSeason(fresh, 1)).toBe(fresh);
    let session = startSeason(fresh);
    session = hearRoundNonMentor(session);
    session = setSeasonDraft(session, quietPlan());
    let held = holdSeason(session, 1);
    expect(held.plans).toHaveLength(1);
    expect(holdSeason(held, 1)).toBe(held);
    expect(holdSeason(held, 2)).toBe(held);
    session = acknowledgeSeason(held);
    for (let n = 2; n <= 6; n++) {
      session = hearRoundNonMentor(session, n);
      session = setSeasonDraft(session, quietPlan());
      held = holdSeason(session, n);
      expect(held.plans).toHaveLength(n);
      expect(holdSeason(held, n)).toBe(held);
      session = acknowledgeSeason(held);
    }
    expect(holdSeason(session, 7)).toBe(session);
    expect(resolveSeasonRoute('#/quiz/paris-salon/result', session).kind).toBe('ending');
    expect(resolveSeasonRoute('#/quiz/paris-salon/play/1', session).kind).toBe('ending');
    expect(resolveSeasonRoute('#/quiz/paris-salon/ending', session).kind).toBe('ending');
    const ended = completeSeasonEnding(session);
    expect(ended.endingSeen).toBe(true);
    expect(completeSeasonEnding(ended)).toBe(ended);
    expect(restoreSeason(ended)).toEqual(ended);
    expect(resolveSeasonRoute('#/quiz/paris-salon/ending', ended).kind).toBe('result');
    expect(resolveSeasonRoute('#/quiz/paris-salon/result', ended).kind).toBe('result');
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
    expect(restoreSeason({ ...first, heard: {} })).toBeNull();
    expect(restoreSeason({ ...first, version: 3 })).toBeNull();
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
