import { chapterTwoCase } from '../data/marketing-detective';
import type {
  DetectiveResult,
  DetectiveSession,
  DetectiveStageId,
  PlanningPreviewView,
} from '../types';

const stages = chapterTwoCase.stages;
const roundViews: PlanningPreviewView[] = ['research', 'persona', 'journey', 'ideas', 'blueprint'];
const safeViews: PlanningPreviewView[] = ['brief', ...roundViews, 'review'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function validIdList(value: unknown, validIds: Set<string>): value is string[] {
  return Array.isArray(value)
    && value.every((id): id is string => typeof id === 'string' && validIds.has(id))
    && new Set(value).size === value.length;
}

function isValidSession(value: unknown): value is DetectiveSession {
  if (!isRecord(value) || value.caseVersion !== chapterTwoCase.version
    || typeof value.started !== 'boolean' || typeof value.completed !== 'boolean'
    || !Array.isArray(value.rounds) || value.rounds.length !== stages.length) return false;

  const rounds = Array.from(value.rounds);
  const roundsValid = rounds.every((round, index) => {
    if (!isRecord(round)) return false;
    const stage = stages[index];
    const questionIds = new Set(stage.questions.map(({ id }) => id));
    const choiceIds = new Set(stage.choices.map(({ id }) => id));
    const validSubmission = round.submittedIds === null
      || (validIdList(round.submittedIds, choiceIds) && round.submittedIds.length > 0);
    return validIdList(round.askedIds, questionIds)
      && round.askedIds.length <= chapterTwoCase.questionLimit
      && validIdList(round.selectedIds, choiceIds)
      && validSubmission;
  });
  if (!roundsValid) return false;
  if (value.started && !value.completed && rounds.every((round) => isRecord(round) && round.submittedIds !== null)) return false;
  if (!value.started && (value.completed || rounds.some((round) => {
    if (!isRecord(round) || !Array.isArray(round.askedIds) || !Array.isArray(round.selectedIds)) return true;
    return round.askedIds.length > 0 || round.selectedIds.length > 0 || round.submittedIds !== null;
  }))) return false;
  if (value.completed && (!value.started || rounds.some((round) => !isRecord(round) || round.submittedIds === null
    || !Array.isArray(round.selectedIds) || !sameIds(round.submittedIds as string[], round.selectedIds)))) return false;
  return true;
}

function emptyRound() {
  return { askedIds: [] as string[], selectedIds: [] as string[], submittedIds: null as string[] | null };
}

function cloneSession(session: DetectiveSession): DetectiveSession {
  return { ...session, rounds: session.rounds.map((round) => ({
    askedIds: [...round.askedIds],
    selectedIds: [...round.selectedIds],
    submittedIds: round.submittedIds === null ? null : [...round.submittedIds],
  })) };
}

function validRoundIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < stages.length;
}

function firstOpenRound(session: DetectiveSession): number {
  return session.rounds.findIndex(({ submittedIds }) => submittedIds === null);
}

export function newDetectiveSession(): DetectiveSession {
  return {
    caseVersion: chapterTwoCase.version,
    started: false,
    rounds: stages.map(() => emptyRound()),
    completed: false,
  };
}

export function beginDetectiveSession(session: DetectiveSession): DetectiveSession {
  if (!isValidSession(session) || session.started || session.completed) return session;
  return { ...cloneSession(session), started: true };
}

export function currentDetectiveRound(session: DetectiveSession): number {
  if (!isValidSession(session) || !session.started) return 0;
  const open = firstOpenRound(session);
  return open < 0 ? stages.length : open;
}

export function askDetectiveQuestion(session: DetectiveSession, index: number, questionId: string): DetectiveSession {
  if (!isValidSession(session) || !session.started || session.completed || !validRoundIndex(index)) return session;
  const current = currentDetectiveRound(session);
  if (index > current) return session;
  const round = session.rounds[index];
  const stage = stages[index];
  if (!stage.questions.some(({ id }) => id === questionId) || round.askedIds.includes(questionId)
    || round.askedIds.length >= chapterTwoCase.questionLimit) return session;
  const next = cloneSession(session);
  next.rounds[index].askedIds.push(questionId);
  return next;
}

export function setDetectiveChoice(session: DetectiveSession, index: number, choiceId: string, selected: boolean): DetectiveSession {
  if (!isValidSession(session) || !session.started || session.completed || !validRoundIndex(index)
    || typeof selected !== 'boolean') return session;
  if (index > currentDetectiveRound(session)) return session;
  const round = session.rounds[index];
  if (!stages[index].choices.some(({ id }) => id === choiceId)) return session;
  const alreadySelected = round.selectedIds.includes(choiceId);
  if (alreadySelected === selected) return session;
  const next = cloneSession(session);
  next.rounds[index].selectedIds = selected
    ? [...round.selectedIds, choiceId]
    : round.selectedIds.filter((id) => id !== choiceId);
  return next;
}

export function commitDetectiveRound(session: DetectiveSession, index: number): DetectiveSession {
  if (!isValidSession(session) || !session.started || session.completed || !validRoundIndex(index)
    || index > currentDetectiveRound(session)) return session;
  const round = session.rounds[index];
  if (round.selectedIds.length === 0) return session;
  if (round.submittedIds !== null && sameIds(round.submittedIds, round.selectedIds)) return session;

  const next = cloneSession(session);
  const changedPriorSubmission = round.submittedIds !== null;
  next.rounds[index].submittedIds = [...round.selectedIds];
  if (changedPriorSubmission) {
    for (let later = index + 1; later < next.rounds.length; later += 1) {
      next.rounds[later].selectedIds = [];
      next.rounds[later].submittedIds = null;
    }
  }
  next.completed = next.rounds.every(({ submittedIds }) => submittedIds !== null);
  return next;
}

function sameIds(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((id) => right.includes(id));
}

function gradeForScore(score: number): DetectiveResult['grade'] {
  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

function scoreRound(stageIndex: number, selectedIds: string[], askedIds: string[]) {
  const stage = stages[stageIndex];
  const selected = new Set(selectedIds);
  const correct = stage.choices.filter(({ correct: isCorrect }) => isCorrect);
  const hits = correct.filter(({ id }) => selected.has(id));
  const wrong = stage.choices.filter(({ correct: isCorrect, id }) => !isCorrect && selected.has(id));
  const missed = correct.filter(({ id }) => !selected.has(id));
  const points = Math.max(0, Math.round(((hits.length - wrong.length) / correct.length) * 20));
  return {
    stageId: stage.id as DetectiveStageId,
    title: stage.title,
    points,
    maxPoints: 20,
    selectedIds: [...selectedIds],
    askedIds: [...askedIds],
    hits,
    wrong,
    missed,
  };
}

function bossComment(score: number, rounds: ReturnType<typeof scoreRound>[]): string {
  const hit = rounds.flatMap(({ hits }) => hits)[0];
  const error = rounds.flatMap(({ wrong, missed }) => [...wrong, ...missed])[0];
  const ideaRound = rounds[3];
  const proposal = ideaRound?.selectedIds
    .map((id) => [...ideaRound.hits, ...ideaRound.wrong].find((choice) => choice.id === id))
    .find((choice) => choice?.kind === 'proposal');
  const proposalLine = proposal
    ? `你這次優先提了「${proposal.label}」。`
    : '你這次尚未選定主方案。';
  const evidenceLine = hit
    ? `你有抓到「${hit.label}」這項線索。`
    : error ? `「${error.label}」這項線索還需要再核對。` : '這次沒有可核對的選擇。';
  const response = score >= 90 ? '這份提案很貼近我提出的情境需求。'
    : score >= 75 ? '提案方向大致合用，我願意再一起確認細節。'
      : score >= 60 ? '有些觀察切中問題，幾個地方還需要補證據。'
        : '目前還沒抓穩問題，我希望先回到資料重新討論。';
  return `【虛構客戶角色的模擬反應】${proposalLine}${evidenceLine}${response}`;
}

function expertComment(rounds: ReturnType<typeof scoreRound>[], score: number): string {
  const hit = rounds.flatMap(({ hits }) => hits)[0];
  const error = rounds.flatMap(({ wrong, missed }) => [...wrong, ...missed])[0];
  const strength = hit ? `你的具體命中是「${hit.label}」：${hit.explanation}` : '目前還沒有選中可支持提案的正確線索。';
  const nextStep = error ? `下一步請檢查「${error.label}」：${error.explanation}`
    : '下一步可把已選證據連成可驗證的服務假設，再設計小規模試行指標。';
  const weakest = rounds.reduce((lowest, round) => round.points < lowest.points ? round : lowest, rounds[0]);
  const improvement = weakest.points < weakest.maxPoints
    ? `優先回看「${weakest.title}」（${weakest.points}/${weakest.maxPoints}）；${weakest.wrong[0] ?? weakest.missed[0]
      ? `先核對「${(weakest.wrong[0] ?? weakest.missed[0])!.label}」的證據。`
      : '再補足本輪需要的支持線索。'}`
    : '五輪都達到滿分，可把這份證據鏈帶進下一次情境練習。';
  const summary = score >= 75 ? '你有不錯的證據判讀基礎。' : '把證據、推論與待驗證假設再分清楚，會讓提案更穩。';
  return `【教學專家角色講評（虛構情境）】${summary}${strength} ${nextStep} ${improvement}`;
}

export function evaluateDetectiveSession(session: DetectiveSession): DetectiveResult | null {
  if (!isValidSession(session) || !session.started || !session.completed
    || session.rounds.some(({ submittedIds }) => submittedIds === null)) return null;
  const rounds = stages.map((_, index) => scoreRound(index, session.rounds[index].submittedIds!, session.rounds[index].askedIds));
  const score = rounds.reduce((sum, round) => sum + round.points, 0);
  const satisfaction = score >= 90 ? '高度滿意（虛構客戶角色的模擬評價）'
    : score >= 75 ? '滿意（虛構客戶角色的模擬評價）'
      : score >= 60 ? '部分滿意（虛構客戶角色的模擬評價）'
        : score >= 40 ? '尚待補強（虛構客戶角色的模擬評價）'
          : '不滿意（虛構客戶角色的模擬評價）';
  const totalHits = rounds.reduce((sum, round) => sum + round.hits.length, 0);
  const totalWrong = rounds.reduce((sum, round) => sum + round.wrong.length, 0);
  const totalMissed = rounds.reduce((sum, round) => sum + round.missed.length, 0);
  return {
    score,
    grade: gradeForScore(score),
    satisfaction,
    bossComment: bossComment(score, rounds),
    expertComment: expertComment(rounds, score),
    rounds,
    totalHits,
    totalWrong,
    totalMissed,
  };
}

export function detectiveViewForRound(index: number): PlanningPreviewView {
  return Number.isInteger(index) && index >= 0 && index < roundViews.length ? roundViews[index] : 'brief';
}

function normalizeView(view: string): PlanningPreviewView {
  let candidate = view;
  const match = /^#\/quiz\/marketing-day\/chapter-2\/([^/?#]+)$/.exec(view);
  if (match) candidate = match[1];
  if (candidate === 'result') return 'review';
  return safeViews.includes(candidate as PlanningPreviewView) ? candidate as PlanningPreviewView : 'brief';
}

export function resolveDetectiveView(view: string, session: DetectiveSession): PlanningPreviewView {
  if (!isValidSession(session) || !session.started) return 'brief';
  const requested = normalizeView(view);
  if (session.completed) return requested;
  if (requested === 'brief') return 'brief';
  if (requested === 'review') return detectiveViewForRound(currentDetectiveRound(session));
  const requestedIndex = roundViews.indexOf(requested);
  return requestedIndex > currentDetectiveRound(session) ? detectiveViewForRound(currentDetectiveRound(session)) : requested;
}
