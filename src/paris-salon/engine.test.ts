import { describe, expect, it } from 'vitest';
import { salonGame } from '../data/paris-salon';
import {
  completeSalon, getSalonResult, initialSalonSession, nextSalonDecision, replaySalon,
  resolveSalonRoute, restoreSalon, SALON_STORAGE_KEY, salonPlayPath, startSalon, submitSalon,
} from './engine';

function finishWith(optionAt: (index: number) => string) {
  let session = startSalon(initialSalonSession());
  salonGame.decisions.forEach((_, index) => { session = submitSalon(session, index, optionAt(index)); });
  return completeSalon(session);
}

const freeOption = (index: number) => salonGame.decisions[index].options.find(option => option.cost === 0)!.id;

const strategyA = ['q1-artists', 'q2-feedback', 'q3-guardrails', 'q4-writer', 'q5-pilot', 'q6-hospitality', 'q7-verify', 'q8-clean', 'q9-roles', 'q11-negotiate', 'q10-segment', 'q12-evidence'];
const strategyB = ['q1-curious', 'q2-open', 'q3-guardrails', 'q4-referrals', 'q5-cautious', 'q6-hospitality', 'q7-verify', 'q8-contact', 'q9-roles', 'q11-negotiate', 'q10-segment', 'q12-evidence'];
const quietStrategy = ['q1-artists', 'q2-feedback', 'q3-guardrails', 'q4-letters', 'q5-cautious', 'q6-reserve', 'q7-hold', 'q8-clean', 'q9-roles', 'q11-negotiate', 'q10-segment', 'q12-evidence'];
const hypeStrategy = ['q1-artists', 'q2-feedback', 'q3-buzz', 'q4-newspaper', 'q5-guarantee', 'q6-posters', 'q7-hype', 'q8-count', 'q9-flexible', 'q11-surrender', 'q10-all', 'q12-myth'];

describe('沙龍經營：進度與安全入口', () => {
  it('受眾契合覆寫教學分數並加上效果，所有資源由前綴重演', () => {
    const match = replaySalon(['q1-artists', 'q2-feedback', 'q3-guardrails', 'q4-writer'])!;
    expect(match).toMatchObject({ target: 'artists', positioning: 'feedback', stats: { budget: 82, awareness: 39, trust: 67, preparation: 48, confirmed: 24, waiting: 0 } });
    expect(match.choices.map(choice => choice.score)).toEqual([3, 3, 3, 3]);
    expect(match.choices[1].before).toEqual({ budget: 100, awareness: 14, trust: 54, preparation: 40, confirmed: 4, waiting: 0 });
    expect(match.choices[1].after).toEqual({ budget: 100, awareness: 20, trust: 62, preparation: 40, confirmed: 11, waiting: 0 });
    expect(replaySalon(['q1-artists', 'q2-stories'])).toMatchObject({ target: 'artists', positioning: 'stories', stats: { budget: 100, awareness: 21, trust: 59, preparation: 40, confirmed: 9, waiting: 0 }, choices: [{ score: 3 }, { score: 2 }] });
    expect(replaySalon(['q1-artists', 'q2-feedback', 'q3-guardrails', 'q4-writer'])).toEqual(match);
  });

  it('每次新局有獨立空答案與合法位置，空歷史由初始資源重算', () => {
    const fresh = initialSalonSession();
    expect(fresh).toEqual({ version: 2, started: false, answers: Array(12).fill(null), completed: false, position: { place: 'salon', x: 44, y: 82 } });
    expect(SALON_STORAGE_KEY).toBe('learning-lab:quiz:paris-salon:v2');
    expect(replaySalon([])).toEqual({ stats: { budget: 100, awareness: 10, trust: 50, preparation: 40, confirmed: 0, waiting: 0 }, target: null, positioning: null, opening: null, choices: [] });
    fresh.answers[0] = 'changed';
    expect(initialSalonSession().answers[0]).toBeNull();
  });

  it('未開始不能提交或完結；無效網址與結果網址都回介紹頁', () => {
    const fresh = initialSalonSession();
    expect(submitSalon(fresh, 0, 'unknown')).toBe(fresh);
    expect(completeSalon(fresh)).toBe(fresh);
    expect(getSalonResult(fresh)).toBeNull();
    for (const hash of ['#/quiz/paris-salon/play/12', '#/quiz/paris-salon/result', '#/quiz/paris-salon/play/NaN']) {
      expect(resolveSalonRoute(hash, fresh)).toMatchObject({ kind: 'intro', index: 0, canonical: '#/quiz/paris-salon/1' });
    }
    expect(nextSalonDecision(fresh)).toBe(0);
    const started = startSalon(fresh);
    expect(started.started).toBe(true);
    expect(fresh.started).toBe(false);
    expect(resolveSalonRoute('#/quiz/paris-salon/play/12', started).canonical).toBe(salonPlayPath(0));
    expect(resolveSalonRoute('#/quiz/paris-salon/result', started).canonical).toBe(salonPlayPath(0));
    expect(resolveSalonRoute('#/quiz/paris-salon/1', started).kind).toBe('intro');
  });

  it('拒絕破損、過期、不連續或不合法座標的儲存', () => {
    const fresh = initialSalonSession();
    expect(restoreSalon(fresh)).toEqual(fresh);
    for (const raw of [null, [], {}, '{broken', { ...fresh, version: 1 }, { ...fresh, version: salonGame.version + 1 }, { ...fresh, started: 'true' }, { ...fresh, completed: 1 }, { ...fresh, answers: [] }, { ...fresh, answers: Array(12).fill('unknown') }, { ...fresh, completed: true }, { ...fresh, position: { place: 'unknown', x: 44, y: 82 } }, { ...fresh, position: { place: 'salon', x: NaN, y: 82 } }, { ...fresh, position: { place: 'salon', x: 9, y: 82 } }, { ...fresh, position: { place: 'salon', x: 91, y: 82 } }, { ...fresh, position: { place: 'salon', x: 44, y: 64 } }, { ...fresh, position: { place: 'salon', x: 44, y: 91 } }]) {
      expect(restoreSalon(raw)).toBeNull();
    }
  });

  it('非法選項、負題號、小數與跳題不改寫；合法答案保留，改選才清除後續', () => {
    let session = startSalon(initialSalonSession());
    for (const index of [-1, 0.5, 1, 12, Infinity]) expect(submitSalon(session, index, freeOption(0))).toBe(session);
    expect(submitSalon(session, 0, 'unknown')).toBe(session);
    session = submitSalon(session, 0, freeOption(0));
    expect(session.answers[0]).toBe(freeOption(0));
    expect(nextSalonDecision(session)).toBe(1);
    expect(completeSalon(session)).toBe(session);
    const complete = finishWith(freeOption);
    expect(complete.completed).toBe(true);
    expect(nextSalonDecision(complete)).toBe(11);
    expect(submitSalon(complete, 0, complete.answers[0]!)).toBe(complete);
    const alternative = salonGame.decisions[1].options.find(option => option.cost === 0 && option.id !== complete.answers[1])!;
    const changed = submitSalon(complete, 1, alternative.id);
    expect(changed.answers.slice(0, 2)).toEqual([complete.answers[0], alternative.id]);
    expect(changed.answers.slice(2)).toEqual(Array(10).fill(null));
    expect(changed.completed).toBe(false);
    expect(complete.answers.every(Boolean)).toBe(true);
    expect(getSalonResult(changed)).toBeNull();
  });

  it('歷史只能是至多十二題的連續合法前綴，還原不信任衍生數值', () => {
    const first = freeOption(0);
    expect(replaySalon([first])).toEqual(replaySalon([first, ...Array(11).fill(null)]));
    for (const answers of [[null, freeOption(1)], [first, undefined], ['unknown'], Array(13).fill(null)]) expect(replaySalon(answers as (string | null)[])).toBeNull();
    const partial = submitSalon(startSalon(initialSalonSession()), 0, first);
    expect(restoreSalon({ ...partial, started: false })).toBeNull();
    expect(restoreSalon({ ...partial, answers: [first, null, freeOption(2), ...Array(9).fill(null)] })).toBeNull();
    const restored = restoreSalon(JSON.stringify({ ...partial, stats: { budget: 999999 } }));
    expect(restored).toEqual(partial);
    expect(restored).not.toHaveProperty('stats');
    expect(replaySalon(restored!.answers)!.stats.budget).toBe(100);
    for (const [x, y] of [[10, 65], [90, 90]]) expect(restoreSalon({ ...partial, position: { place: 'study', x, y } })).not.toBeNull();
  });

  it('已開始只可回看舊題或目前題；完成後仍可回看，無效格式安全回介紹', () => {
    const first = submitSalon(startSalon(initialSalonSession()), 0, freeOption(0));
    expect(resolveSalonRoute(salonPlayPath(0), first)).toMatchObject({ kind: 'play', index: 0, canonical: salonPlayPath(0) });
    expect(resolveSalonRoute(salonPlayPath(9), first)).toMatchObject({ kind: 'play', index: 1, canonical: salonPlayPath(1) });
    const finished = finishWith(freeOption);
    expect(resolveSalonRoute('#/quiz/paris-salon/result', finished)).toMatchObject({ kind: 'result', index: 11 });
    expect(resolveSalonRoute(salonPlayPath(2), finished)).toMatchObject({ kind: 'play', index: 2 });
    for (const hash of ['#/quiz/paris-salon/play/0', '#/quiz/paris-salon/play/-1', '#/quiz/paris-salon/play/01', '#/quiz/paris-salon/play/1.5', '#/quiz/paris-salon/play/13', '#/quiz/paris-salon/play/999999999999999999999', '#/quiz/paris-salon/nope', '#/quiz/paris-salon/2']) {
      expect(resolveSalonRoute(hash, first)).toMatchObject({ kind: 'intro', canonical: '#/quiz/paris-salon/1' });
    }
  });

  it('有效未提交選擇可續玩，破損草稿只丟棄草稿，提交清除草稿', () => {
    const started = startSalon(initialSalonSession());
    const raw = { ...started, draft: { index: 0, optionId: freeOption(0) } };
    expect(restoreSalon(raw)).toEqual(raw);
    expect(restoreSalon({ ...raw, draft: { index: 0, optionId: null } })).toHaveProperty('draft', { index: 0, optionId: null });
    for (const draft of [null, {}, { index: -1, optionId: freeOption(0) }, { index: 0.5, optionId: freeOption(0) }, { index: 1, optionId: freeOption(1) }, { index: 0, optionId: 'unknown' }]) {
      expect(restoreSalon({ ...started, draft })).toEqual(started);
    }
    expect(submitSalon(raw, 0, freeOption(0))).not.toHaveProperty('draft');
    const complete = finishWith(freeOption);
    expect(submitSalon({ ...complete, draft: { index: 0, optionId: complete.answers[0] } }, 0, complete.answers[0]!)).not.toHaveProperty('draft');
  });

  it('超額確認只進候補，第九題向下取整鎖到場，後三題不追算', () => {
    const beforeOpening = replaySalon(strategyA.slice(0, 8))!;
    expect(beforeOpening).toMatchObject({ opening: null, stats: { confirmed: 36, waiting: 2 } });
    const opening = replaySalon(strategyA.slice(0, 9))!;
    expect(opening.opening).toEqual({ attendance: 35, stats: { budget: 48, awareness: 58, trust: 97, preparation: 94, confirmed: 36, waiting: 3 } });
    const unhappyAfterOpening = replaySalon([...strategyA.slice(0, 9), 'q11-surrender', 'q10-all', 'q12-myth'])!;
    expect(unhappyAfterOpening.opening).toEqual(opening.opening);
    expect(unhappyAfterOpening.stats).toMatchObject({ awareness: 94, trust: 40, preparation: 82 });
    expect(opening.choices[8].after).toMatchObject({ trust: 97, preparation: 94 });
  });

  it('依實際餘額拒絕無法負擔的提交、儲存與草稿，剛好用完仍可完成', () => {
    const costly = ['q1-artists', 'q2-feedback', 'q3-guardrails', 'q4-newspaper', 'q5-pilot', 'q6-posters', 'q7-verify', 'q8-contact', 'q9-roles'];
    const session = { ...startSalon(initialSalonSession()), answers: [...costly, null, null, null] };
    expect(replaySalon(session.answers)!.stats.budget).toBe(15);
    expect(submitSalon(session, 9, 'q11-supported')).toBe(session);
    expect(replaySalon([...costly, 'q11-supported'])).toBeNull();
    expect(restoreSalon({ ...session, answers: [...costly, 'q11-supported', null, null] })).toBeNull();
    expect(restoreSalon({ ...session, draft: { index: 9, optionId: 'q11-supported' } })).toEqual(session);
    const exact = [...costly];
    exact[7] = 'q8-clean';
    const zeroBudget = finishWith(index => [...exact, 'q11-supported', 'q10-segment', 'q12-evidence'][index]);
    expect(zeroBudget.completed).toBe(true);
    expect(getSalonResult(zeroBudget)!.stats.budget).toBe(0);
    // Revisiting an earlier paid question uses its original prefix budget.
    expect(restoreSalon({ ...zeroBudget, draft: { index: 3, optionId: 'q4-newspaper' } })).toHaveProperty('draft');
  });

  it('知名度、信任與接待限定0到100，成果不允許聲量抵銷護欄', () => {
    const low = getSalonResult(finishWith(index => hypeStrategy[index]))!;
    expect(low).toMatchObject({ ending: 3, stats: { awareness: 100, trust: 0, preparation: 0 }, opening: { attendance: 11, stats: { awareness: 100, trust: 0, preparation: 0, confirmed: 23 } } });
    const high = [...strategyA];
    high[9] = 'q11-supported';
    expect(getSalonResult(finishWith(index => high[index]))!.stats).toMatchObject({ trust: 100, preparation: 100 });
  });

  it('至少兩條不同、未超支的策略可完整成功，教學分數六軸各自正規化', () => {
    const a = getSalonResult(finishWith(index => strategyA[index]))!;
    const b = getSalonResult(finishWith(index => strategyB[index]))!;
    expect(a).toMatchObject({ ending: 0, points: 36, maxPoints: 36, score: 100, highestCount: 12, stats: { budget: 48, awareness: 77, trust: 100, preparation: 97, confirmed: 36, waiting: 3 } });
    expect(b).toMatchObject({ ending: 0, score: 100, opening: { attendance: 35, stats: { budget: 68, awareness: 55, trust: 100, preparation: 94, confirmed: 36, waiting: 2 } }, stats: { budget: 68, awareness: 74, trust: 100, preparation: 97 } });
    expect(a.axes.map(axis => [axis.id, axis.points, axis.maxPoints, axis.score])).toEqual([
      ['insight', 6, 6, 100], ['resources', 6, 6, 100], ['relationships', 6, 6, 100],
      ['data', 6, 6, 100], ['ai', 6, 6, 100], ['operations', 6, 6, 100],
    ]);
    expect(a.practice).toEqual([a.axes[0].practice, a.axes[1].practice]);
    const partial = [...strategyA];
    partial[1] = 'q2-stories';
    const result = getSalonResult(finishWith(index => partial[index]))!;
    expect(result).toMatchObject({ points: 35, score: 97, highestCount: 11 });
    expect(result.axes[0]).toMatchObject({ points: 5, maxPoints: 6, score: 83 });
  });

  it('四類結局有互斥判準，低面向練習同分依既定順序挑兩項', () => {
    const crowded = [...strategyA.slice(0, 9), 'q11-surrender', 'q10-all', 'q12-myth'];
    const challenged = getSalonResult(finishWith(index => crowded[index]))!;
    expect(challenged).toMatchObject({ ending: 1, points: 27, score: 75, highestCount: 9, opening: { attendance: 35 } });
    expect(challenged.axes.map(axis => axis.score)).toEqual([100, 100, 50, 100, 50, 50]);
    expect(challenged.practice).toEqual([challenged.axes[2].practice, challenged.axes[4].practice]);
    expect(getSalonResult(finishWith(index => quietStrategy[index]))).toMatchObject({ ending: 2, opening: { attendance: 26, stats: { awareness: 38, trust: 98, preparation: 84, confirmed: 28 } }, stats: { awareness: 57, trust: 100, preparation: 87 } });
    expect(getSalonResult(finishWith(index => strategyA[index]))!.ending).toBe(0);
    expect(getSalonResult(finishWith(index => hypeStrategy[index]))!.ending).toBe(3);
  });
});
