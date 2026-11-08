import { describe, expect, it } from 'vitest';
import { chapterTwoCase } from '../data/marketing-detective';
import type { DetectiveCase } from '../types';
import { createDetectiveEngine, evaluateDetectiveSession as evaluateDefaultDetectiveSession } from './detective-engine';

function coffeeFixture(): DetectiveCase {
  return {
    ...structuredClone(chapterTwoCase),
    id: 'marketing-day-chapter-3',
    title: '咖啡店尖峰預訂',
    clientName: '陳店長',
    clientRole: '日常咖啡店長',
    brand: '日常咖啡',
    stages: chapterTwoCase.stages.map((stage) => ({
      ...stage,
      id: stage.id,
      questions: stage.questions.map((question) => ({ ...question, id: `coffee-${question.id}`, label: `咖啡店問題：${question.label}` })),
      choices: stage.choices.map((choice) => ({
        ...choice,
        id: `coffee-${choice.id}`,
        label: `咖啡店選項 ${stage.choices.indexOf(choice) + 1}`,
        explanation: `咖啡案例卡片「${choice.id}」${choice.correct ? '有開場與追問線索支持' : '超出開場與追問可確認的範圍'}，請回看這張卡引用的情境依據。`,
      })),
    })),
  };
}

function completed(engine: ReturnType<typeof createDetectiveEngine>, choose: (correct: boolean, id: string) => boolean = (correct) => correct) {
  let session = engine.beginDetectiveSession(engine.newDetectiveSession());
  engine.currentDetectiveRound(session);
  engine.evaluateDetectiveSession(session);
  engine.detectiveViewForRound(0);
  for (const [index, stage] of engineCase.stages.entries()) {
    for (const choice of stage.choices) {
      if (choose(choice.correct, choice.id)) session = engine.setDetectiveChoice(session, index, choice.id, true);
    }
    session = engine.commitDetectiveRound(session, index);
  }
  return session;
}

function finishWithChoices(engine: ReturnType<typeof createDetectiveEngine>, overrides: Record<number, string[]>) {
  let session = engine.beginDetectiveSession(engine.newDetectiveSession());
  engineCase.stages.forEach((stage, index) => {
    const selected = overrides[index] ?? stage.choices.filter(({ correct }) => correct).map(({ id }) => id);
    selected.forEach((id) => { session = engine.setDetectiveChoice(session, index, id, true); });
    session = engine.commitDetectiveRound(session, index);
  });
  return session;
}

let engineCase = coffeeFixture();

describe('案例化偵探引擎', () => {
  it('rejects a same-version session from another case and validates case-specific question and choice IDs', () => {
    const engine = createDetectiveEngine(engineCase);
    const other = createDetectiveEngine({ ...engineCase, id: 'another-coffee-case' });
    const foreign = engine.newDetectiveSession();
    expect(foreign.caseId).toBe(engineCase.id);
    expect(other.currentDetectiveRound(foreign)).toBe(0);
    expect(other.beginDetectiveSession(foreign)).toBe(foreign);
    const session = engine.beginDetectiveSession(engine.newDetectiveSession());
    expect(engine.askDetectiveQuestion(session, 0, chapterTwoCase.stages[0].questions[0].id)).toBe(session);
    expect(engine.setDetectiveChoice(session, 0, chapterTwoCase.stages[0].choices[0].id, true)).toBe(session);
  });

  it('keeps the second chapter result and existing gym-specific copy unchanged', () => {
    const engine = createDetectiveEngine(chapterTwoCase);
    const session = (() => {
      let value = engine.beginDetectiveSession(engine.newDetectiveSession());
      chapterTwoCase.stages.forEach((stage, index) => {
        stage.choices.filter((choice) => choice.correct).forEach(({ id }) => { value = engine.setDetectiveChoice(value, index, id, true); });
        value = engine.commitDetectiveRound(value, index);
      });
      return value;
    })();
    expect(engine.evaluateDetectiveSession(session)).toEqual(evaluateDefaultDetectiveSession(session));
  });

  it('scores arbitrary coffee-prefixed correct IDs at 100 and bases satisfaction on the selected correct proposal', () => {
    engineCase = coffeeFixture();
    const engine = createDetectiveEngine(engineCase);
    const session = completed(engine);
    const result = engine.evaluateDetectiveSession(session)!;
    expect(session.completed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.satisfaction).toMatch(/高度滿意/);
    expect(result.bossComment + result.expertComment).not.toMatch(/林老闆|健身房|教練|介紹頁/);
    expect(result.bossComment).not.toMatch(/我是陳店長|整體得分/);

    const ideaStage = engineCase.stages[3];
    const proposal = ideaStage.choices.find((choice) => choice.kind === 'proposal' && choice.correct)!;
    const adjusted = { ...engineCase, stages: engineCase.stages.map((stage, index) => index === 3
      ? { ...stage, choices: stage.choices.map((choice) => choice.kind === 'proposal' ? { ...choice, correct: choice.id === proposal.id } : choice) }
      : stage) };
    const adjustedEngine = createDetectiveEngine(adjusted);
    let adjustedSession = adjustedEngine.beginDetectiveSession(adjustedEngine.newDetectiveSession());
    adjusted.stages.forEach((stage, index) => {
      stage.choices.filter(({ correct }) => correct).forEach(({ id }) => { adjustedSession = adjustedEngine.setDetectiveChoice(adjustedSession, index, id, true); });
      adjustedSession = adjustedEngine.commitDetectiveRound(adjustedSession, index);
    });
    expect(adjustedEngine.evaluateDetectiveSession(adjustedSession)?.satisfaction).toMatch(/高度滿意/);
  });

  it('deducts for wrong and missed selections and includes the case explanation in expert feedback', () => {
    engineCase = coffeeFixture();
    const engine = createDetectiveEngine(engineCase);
    const session = completed(engine, (correct) => !correct);
    const result = engine.evaluateDetectiveSession(session)!;
    expect(result.score).toBe(0);
    expect(result.totalWrong).toBeGreaterThan(0);
    expect(result.totalMissed).toBeGreaterThan(0);
    expect(result.expertComment).toContain('咖啡案例卡片');
    expect(result.bossComment + result.expertComment).not.toMatch(/林老闆|健身房|教練|介紹頁/);

    const all = completed(engine, () => true);
    const allResult = engine.evaluateDetectiveSession(all)!;
    expect(allResult.score).toBe(0);
    expect(allResult.totalWrong).toBeGreaterThan(0);
    expect(allResult.totalMissed).toBe(0);
  });

  it('does not recommend trying a uniquely selected incorrect proposal', () => {
    engineCase = coffeeFixture();
    const engine = createDetectiveEngine(engineCase);
    const wrongProposal = engineCase.stages[3].choices.find(({ kind, correct }) => kind === 'proposal' && !correct)!;
    const session = finishWithChoices(engine, { 3: [wrongProposal.id] });
    const result = engine.evaluateDetectiveSession(session)!;
    expect(result.satisfaction).toContain('暫不採用');
    expect(result.bossComment).toMatch(/暫不採用|先不試|重新選|重新比較/);
    expect(result.expertComment).toMatch(/暫不採用|先不試|重新選|重新比較/);
    expect(result.bossComment + result.expertComment).not.toMatch(/我會先試|小規模試做/);
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it('keeps a correct proposal as a direction when other rounds leave the score below 60', () => {
    engineCase = coffeeFixture();
    const engine = createDetectiveEngine(engineCase);
    const overrides: Record<number, string[]> = {};
    [0, 1, 2, 4].forEach((index) => {
      overrides[index] = [engineCase.stages[index].choices.find(({ correct }) => !correct)!.id];
    });
    const result = engine.evaluateDetectiveSession(finishWithChoices(engine, overrides))!;
    expect(result.score).toBeLessThan(60);
    expect(result.bossComment).toMatch(/方向可以保留/);
    expect(result.expertComment).toMatch(/方向可以保留/);
    expect(result.bossComment + result.expertComment).not.toMatch(/我會先試|小規模試做/);
  });

  it('gives perfect-play feedback without describing 20/20 rounds as needing improvement', () => {
    engineCase = coffeeFixture();
    const engine = createDetectiveEngine(engineCase);
    const result = engine.evaluateDetectiveSession(completed(engine))!;
    expect(result.score).toBe(100);
    expect(result.bossComment + result.expertComment).not.toMatch(/最需要補強|20\/20/);
    expect(result.expertComment).toMatch(/完整|到位/);
    expect(result.expertComment).toMatch(/下一步|驗證|觀察|追蹤/);
  });

  it('quotes the exact selected wrong or missed card explanation instead of a generic round template', () => {
    engineCase = coffeeFixture();
    const engine = createDetectiveEngine(engineCase);
    const wrong = engineCase.stages[0].choices.find(({ correct }) => !correct)!;
    const result = engine.evaluateDetectiveSession(finishWithChoices(engine, { 0: [wrong.id] }))!;
    expect(result.bossComment).toContain(wrong.explanation);
    expect(result.expertComment).toContain(wrong.explanation);
    const otherWrong = engineCase.stages[0].choices.find(({ id, correct }) => !correct && id !== wrong.id)!;
    expect(result.expertComment).not.toContain(otherWrong.explanation);
  });

  it('does not resolve multiple or missing proposal choices as satisfaction', () => {
    engineCase = coffeeFixture();
    const proposals = engineCase.stages[3].choices.filter(({ kind }) => kind === 'proposal');
    for (const ids of [[], proposals.map(({ id }) => id)]) {
      const engine = createDetectiveEngine(engineCase);
      let session = engine.beginDetectiveSession(engine.newDetectiveSession());
      engineCase.stages.forEach((stage, index) => {
        const selected = index === 3 ? ids : stage.choices.filter(({ correct, kind }) => correct && kind !== 'proposal').map(({ id }) => id);
        selected.forEach((id) => { session = engine.setDetectiveChoice(session, index, id, true); });
        if (selected.length === 0) {
          const fallback = stage.choices.find(({ kind }) => kind !== 'proposal');
          if (fallback) session = engine.setDetectiveChoice(session, index, fallback.id, true);
        }
        session = engine.commitDetectiveRound(session, index);
      });
      expect(engine.evaluateDetectiveSession(session)?.satisfaction).toContain('尚待定案');
    }
  });

  it('preserves the five-question limit, repeated asks, earlier-round edits, and case-local resets', () => {
    engineCase = coffeeFixture();
    const engine = createDetectiveEngine(engineCase);
    let session = engine.beginDetectiveSession(engine.newDetectiveSession());
    const questions = engineCase.stages[0].questions;
    session = engine.askDetectiveQuestion(session, 0, questions[0].id);
    expect(engine.askDetectiveQuestion(session, 0, questions[0].id)).toBe(session);
    for (const question of questions.slice(1, 5)) session = engine.askDetectiveQuestion(session, 0, question.id);
    expect(session.rounds[0].askedIds).toHaveLength(5);
    expect(engine.askDetectiveQuestion(session, 0, questions[5].id)).toBe(session);

    for (let index = 0; index < 2; index += 1) {
      session = engine.setDetectiveChoice(session, index, engineCase.stages[index].choices.find(({ correct }) => correct)!.id, true);
      session = engine.commitDetectiveRound(session, index);
    }
    const replacement = engineCase.stages[0].choices.find(({ id }) => id !== session.rounds[0].submittedIds![0])!.id;
    session = engine.setDetectiveChoice(session, 0, session.rounds[0].submittedIds![0], false);
    session = engine.setDetectiveChoice(session, 0, replacement, true);
    session = engine.commitDetectiveRound(session, 0);
    expect(session.rounds[1].submittedIds).toBeNull();
    expect(session.rounds[1].selectedIds).toEqual([]);
    expect(session.rounds[1].askedIds).toEqual([]);

    const other = createDetectiveEngine({ ...engineCase, id: 'coffee-reset-isolated' });
    expect(other.newDetectiveSession().rounds.every((round) => round.selectedIds.length === 0)).toBe(true);
  });

  it('resolves only valid chapter-three hashes and blocks future or cross-case views', () => {
    engineCase = coffeeFixture();
    const engine = createDetectiveEngine(engineCase);
    const fresh = engine.newDetectiveSession();
    expect(engine.resolveDetectiveView('#/quiz/marketing-day/chapter-3/brief', fresh)).toBe('brief');
    expect(engine.resolveDetectiveView('#/quiz/marketing-day/chapter-3/journey', fresh)).toBe('brief');
    const started = engine.beginDetectiveSession(fresh);
    expect(engine.resolveDetectiveView('research', started)).toBe('research');
    expect(engine.resolveDetectiveView('#/quiz/marketing-day/chapter-2/review', started)).toBe('brief');
    expect(engine.resolveDetectiveView('#/quiz/marketing-day/chapter-3/nope', started)).toBe('brief');
    expect(engine.resolveDetectiveView('#/quiz/marketing-day/chapter-3/research', started)).toBe('research');
  });
});
