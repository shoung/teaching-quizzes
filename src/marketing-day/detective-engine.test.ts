import { describe, expect, it } from 'vitest';
import { chapterTwoCase } from '../data/marketing-detective';
import {
  askDetectiveQuestion,
  beginDetectiveSession,
  commitDetectiveRound,
  currentDetectiveRound,
  detectiveViewForRound,
  evaluateDetectiveSession,
  newDetectiveSession,
  resolveDetectiveView,
  setDetectiveChoice,
} from './detective-engine';
import type { DetectiveSession, PlanningPreviewView } from '../types';

function startedSession(): DetectiveSession {
  return beginDetectiveSession(newDetectiveSession());
}

function choose(session: DetectiveSession, roundIndex: number, ids: string[]): DetectiveSession {
  return ids.reduce((next, id) => setDetectiveChoice(next, roundIndex, id, true), session);
}

function finishWith(predicate: (correct: boolean) => boolean): DetectiveSession {
  let session = startedSession();
  chapterTwoCase.stages.forEach((stage, index) => {
    session = choose(session, index, stage.choices.filter((choice) => predicate(choice.correct)).map(({ id }) => id));
    session = commitDetectiveRound(session, index);
  });
  return session;
}

function viewSession(committedCount: number): DetectiveSession {
  let session = startedSession();
  for (let index = 0; index < committedCount; index += 1) {
    const correctId = chapterTwoCase.stages[index].choices.find((choice) => choice.correct)!.id;
    session = choose(session, index, [correctId]);
    session = commitDetectiveRound(session, index);
  }
  return session;
}

function finishWithProposal(proposalId: string | null): DetectiveSession {
  let session = startedSession();
  chapterTwoCase.stages.forEach((stage, index) => {
    const selectedIds = index === 3
      ? [...stage.choices.filter((choice) => choice.correct && choice.kind !== 'proposal').map(({ id }) => id), ...(proposalId ? [proposalId] : [])]
      : stage.choices.filter((choice) => choice.correct).map(({ id }) => id);
    session = choose(session, index, selectedIds);
    session = commitDetectiveRound(session, index);
  });
  return session;
}

const firstQuestion = chapterTwoCase.stages[0].questions[0].id;
const firstChoice = chapterTwoCase.stages[0].choices[0].id;

describe('偵探提案遊戲 session lifecycle', () => {
  it('starts at the brief, then begins on the first round without mutating the original session', () => {
    const fresh = newDetectiveSession();
    const started = beginDetectiveSession(fresh);

    expect(fresh.started).toBe(false);
    expect(fresh.completed).toBe(false);
    expect(fresh.rounds).toHaveLength(5);
    expect(fresh.rounds.every((round) => round.askedIds.length === 0 && round.selectedIds.length === 0 && round.submittedIds === null)).toBe(true);
    expect(started.started).toBe(true);
    expect(currentDetectiveRound(fresh)).toBe(0);
    expect(currentDetectiveRound(started)).toBe(0);
  });

  it('ignores attempts before starting and keeps each operation immutable', () => {
    const fresh = newDetectiveSession();
    expect(askDetectiveQuestion(fresh, 0, firstQuestion)).toBe(fresh);
    expect(setDetectiveChoice(fresh, 0, firstChoice, true)).toBe(fresh);
    expect(commitDetectiveRound(fresh, 0)).toBe(fresh);
  });

  it('safely ignores stale-version and structurally damaged sessions', () => {
    const started = startedSession();
    const stale = { ...started, caseVersion: started.caseVersion + 1 };
    const damaged = { ...started, rounds: [] } as unknown as DetectiveSession;
    expect(currentDetectiveRound(stale)).toBe(0);
    expect(askDetectiveQuestion(stale, 0, firstQuestion)).toBe(stale);
    expect(setDetectiveChoice(damaged, 0, firstChoice, true)).toBe(damaged);
    expect(commitDetectiveRound(damaged, 0)).toBe(damaged);
    expect(evaluateDetectiveSession({ ...started, completed: true })).toBeNull();
  });

  it('safely ignores invalid ids and duplicate ids in a damaged saved state', () => {
    const started = startedSession();
    const damaged = {
      ...started,
      rounds: started.rounds.map((round, index) => index === 0
        ? { ...round, selectedIds: ['unknown-choice'] }
        : round),
    };
    expect(askDetectiveQuestion(started, 0, 'unknown-question')).toBe(started);
    expect(setDetectiveChoice(started, 0, 'unknown-choice', true)).toBe(started);
    expect(setDetectiveChoice(damaged, 0, firstChoice, true)).toBe(damaged);
    expect(currentDetectiveRound(damaged)).toBe(0);
    expect(evaluateDetectiveSession(damaged)).toBeNull();
  });

  it('allows at most five distinct valid questions; repeated and invalid asks do not consume attempts', () => {
    let session = startedSession();
    const questions = chapterTwoCase.stages[0].questions;
    session = askDetectiveQuestion(session, 0, questions[0].id);
    const repeated = askDetectiveQuestion(session, 0, questions[0].id);
    expect(repeated).toBe(session);
    expect(askDetectiveQuestion(session, 0, 'not-a-question')).toBe(session);
    expect(session.rounds[0].askedIds).toEqual([questions[0].id]);

    for (const question of questions.slice(1, 5)) session = askDetectiveQuestion(session, 0, question.id);
    expect(session.rounds[0].askedIds).toHaveLength(5);
    expect(askDetectiveQuestion(session, 0, questions[5].id)).toBe(session);
  });

  it('blocks future round actions while allowing choices to be toggled idempotently', () => {
    let session = startedSession();
    const futureChoice = chapterTwoCase.stages[1].choices[0].id;
    const futureQuestion = chapterTwoCase.stages[1].questions[0].id;
    expect(setDetectiveChoice(session, 1, futureChoice, true)).toBe(session);
    expect(askDetectiveQuestion(session, 1, futureQuestion)).toBe(session);

    session = setDetectiveChoice(session, 0, firstChoice, true);
    const selected = session;
    expect(setDetectiveChoice(session, 0, firstChoice, true)).toBe(selected);
    session = setDetectiveChoice(session, 0, firstChoice, false);
    expect(session.rounds[0].selectedIds).toEqual([]);
  });

  it('requires a nonempty round before committing and advances only after submission', () => {
    let session = startedSession();
    expect(commitDetectiveRound(session, 0)).toBe(session);
    session = choose(session, 0, [firstChoice]);
    session = commitDetectiveRound(session, 0);
    expect(session.rounds[0].submittedIds).toEqual([firstChoice]);
    expect(currentDetectiveRound(session)).toBe(1);
    expect(session.rounds[1].submittedIds).toBeNull();
  });

  it('recommits a changed earlier round by clearing later selections and submissions but retaining questions', () => {
    let session = viewSession(2);
    session = askDetectiveQuestion(session, 0, chapterTwoCase.stages[0].questions[0].id);
    session = askDetectiveQuestion(session, 1, chapterTwoCase.stages[1].questions[0].id);
    const laterSelected = session.rounds[1].selectedIds;
    const laterAsked = session.rounds[1].askedIds;
    const replacement = chapterTwoCase.stages[0].choices.find(({ id }) => id !== session.rounds[0].submittedIds?.[0])!.id;
    session = setDetectiveChoice(session, 0, session.rounds[0].submittedIds![0], false);
    session = setDetectiveChoice(session, 0, replacement, true);
    session = commitDetectiveRound(session, 0);

    expect(session.rounds[0].askedIds).toEqual([chapterTwoCase.stages[0].questions[0].id]);
    expect(session.rounds[1].askedIds).toEqual(laterAsked);
    expect(session.rounds[1].selectedIds).toEqual([]);
    expect(session.rounds[1].submittedIds).toBeNull();
    expect(laterSelected.length).toBeGreaterThan(0);
    expect(currentDetectiveRound(session)).toBe(1);
  });

  it('does not clear later work when an earlier round is recommitted with the same selection', () => {
    let session = viewSession(2);
    const laterSelection = session.rounds[1].selectedIds;
    session = commitDetectiveRound(session, 0);
    expect(session.rounds[1].selectedIds).toEqual(laterSelection);
    expect(session.rounds[1].submittedIds).not.toBeNull();
  });

  it('makes a completed session read-only', () => {
    const completed = finishWith((correct) => correct);
    expect(completed.completed).toBe(true);
    expect(beginDetectiveSession(completed)).toBe(completed);
    expect(askDetectiveQuestion(completed, 0, chapterTwoCase.stages[0].questions[0].id)).toBe(completed);
    expect(setDetectiveChoice(completed, 0, firstChoice, false)).toBe(completed);
    expect(commitDetectiveRound(completed, 0)).toBe(completed);
  });
});

describe('偵探提案遊戲評分', () => {
  it('returns no result until all five rounds are submitted', () => {
    expect(evaluateDetectiveSession(newDetectiveSession())).toBeNull();
    expect(evaluateDetectiveSession(viewSession(4))).toBeNull();
  });

  it('scores perfect play at 100/S and exposes per-round answer evidence', () => {
    const session = finishWith((correct) => correct);
    const result = evaluateDetectiveSession(session);
    expect(result).not.toBeNull();
    expect(result!.score).toBe(100);
    expect(result!.grade).toBe('S');
    expect(result!.rounds).toHaveLength(5);
    expect(result!.rounds.every((round) => round.maxPoints === 20 && round.points === 20 && round.wrong.length === 0 && round.missed.length === 0)).toBe(true);
    expect(result!.totalHits).toBe(chapterTwoCase.stages.reduce((sum, stage) => sum + stage.choices.filter(({ correct }) => correct).length, 0));
    const proposalA = chapterTwoCase.stages[3].choices.find(({ correct, kind }) => correct && kind === 'proposal')!;
    expect(result!.bossComment).toContain(`你這次優先提了「${proposalA.label}」`);
    expect(result!.expertComment).toContain('五輪都達到滿分');
    expect(result!.satisfaction).toBeTruthy();
    expect(result!.bossComment).toBeTruthy();
    expect(result!.expertComment).toBeTruthy();
  });

  it('gives zero for selecting only wrong answers and penalizes a select-everything strategy', () => {
    const wrong = evaluateDetectiveSession(finishWith((correct) => !correct));
    expect(wrong!.score).toBe(0);
    expect(wrong!.totalWrong).toBeGreaterThan(0);
    expect(wrong!.totalMissed).toBeGreaterThan(0);

    const allSelected = evaluateDetectiveSession(finishWith(() => true));
    expect(allSelected!.score).toBe(0);
    expect(allSelected!.totalWrong).toBeGreaterThan(0);
    expect(allSelected!.totalMissed).toBe(0);
    const proposalA = chapterTwoCase.stages[3].choices.find(({ correct, kind }) => correct && kind === 'proposal')!;
    expect(allSelected!.bossComment).toContain(`你這次優先提了「${proposalA.label}」`);
  });

  it('has the fictional client respond to the selected main proposal instead of always naming proposal A', () => {
    const proposals = chapterTwoCase.stages[3].choices.filter((choice) => choice.kind === 'proposal');
    expect(proposals).toHaveLength(3);
    const proposalA = proposals.find(({ correct }) => correct)!;
    for (const proposal of proposals.filter(({ id }) => id !== proposalA.id)) {
      const result = evaluateDetectiveSession(finishWithProposal(proposal.id))!;
      expect(result.bossComment).toContain(`你這次優先提了「${proposal.label}」`);
      expect(result.bossComment).not.toContain(proposalA.label);
    }

    const withoutProposal = evaluateDetectiveSession(finishWithProposal(null))!;
    expect(withoutProposal.bossComment).toContain('尚未選定主方案');
  });

  it('counts correct, wrong and missed choices once and applies the specified per-round formula', () => {
    let session = startedSession();
    chapterTwoCase.stages.forEach((stage, index) => {
      const correct = stage.choices.filter(({ correct: isCorrect }) => isCorrect);
      const wrong = stage.choices.find(({ correct: isCorrect }) => !isCorrect)!;
      const selected = [...correct.slice(0, -1).map(({ id }) => id), wrong.id];
      session = choose(session, index, selected);
      session = setDetectiveChoice(session, index, selected[0], true);
      session = commitDetectiveRound(session, index);
    });
    const result = evaluateDetectiveSession(session)!;
    for (const [index, stage] of chapterTwoCase.stages.entries()) {
      const round = result.rounds[index];
      const totalCorrect = stage.choices.filter(({ correct }) => correct).length;
      expect(round.points).toBe(Math.max(0, Math.round((round.hits.length - round.wrong.length) / totalCorrect * 20)));
      expect(round.hits.length).toBe(totalCorrect - 1);
      expect(round.wrong).toHaveLength(1);
      expect(round.missed).toHaveLength(1);
      expect(round.selectedIds).toHaveLength(new Set(round.selectedIds).size);
      expect(round.askedIds).toEqual([]);
    }
    expect(result.totalHits).toBe(chapterTwoCase.stages.reduce((sum, stage) => sum + stage.choices.filter(({ correct }) => correct).length - 1, 0));
    expect(result.totalWrong).toBe(5);
    expect(result.totalMissed).toBe(5);
    const weakestRound = result.rounds.reduce((lowest, round) => round.points < lowest.points ? round : lowest);
    expect(weakestRound.points).toBeLessThan(weakestRound.maxPoints);
    expect(result.expertComment).toContain(`優先回看「${weakestRound.title}」`);
  });

});

describe('偵探提案遊戲 hash view 導正', () => {
  const views: PlanningPreviewView[] = ['research', 'persona', 'journey', 'ideas', 'blueprint'];
  it('maps each stage index to its view and sends invalid indexes to the brief', () => {
    expect(views.map((_, index) => detectiveViewForRound(index))).toEqual(views);
    expect(detectiveViewForRound(-1)).toBe('brief');
    expect(detectiveViewForRound(5)).toBe('brief');
  });

  it('keeps a fresh session on brief and prevents visiting future stages or review', () => {
    const fresh = newDetectiveSession();
    expect(resolveDetectiveView('journey', fresh)).toBe('brief');
    expect(resolveDetectiveView('review', fresh)).toBe('brief');
    expect(resolveDetectiveView('#/quiz/marketing-day/chapter-2/brief', fresh)).toBe('brief');

    const atFirst = viewSession(0);
    expect(resolveDetectiveView('research', atFirst)).toBe('research');
    expect(resolveDetectiveView('persona', atFirst)).toBe('research');
    expect(resolveDetectiveView('brief', atFirst)).toBe('brief');
  });

  it('allows revisiting previous rounds, only the current round, and review after completion', () => {
    const atThird = viewSession(2);
    expect(resolveDetectiveView('research', atThird)).toBe('research');
    expect(resolveDetectiveView('persona', atThird)).toBe('persona');
    expect(resolveDetectiveView('journey', atThird)).toBe('journey');
    expect(resolveDetectiveView('ideas', atThird)).toBe('journey');
    expect(resolveDetectiveView('review', atThird)).toBe('journey');
    expect(resolveDetectiveView('brief', atThird)).toBe('brief');

    const completed = finishWith((correct) => correct);
    expect(resolveDetectiveView('review', completed)).toBe('review');
    expect(resolveDetectiveView('brief', completed)).toBe('brief');
    expect(resolveDetectiveView('blueprint', completed)).toBe('blueprint');
  });
});
