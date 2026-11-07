import type { Question, Quiz, Session } from './types';

export function restoreSession(raw: unknown, quiz: Quiz): Session | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const value = raw as Partial<Session>;
  if (value.version !== quiz.version || typeof value.completed !== 'boolean'
    || !Array.isArray(value.answers) || value.answers.length !== quiz.questions.length) return null;
  const valid = value.answers.every((answer, i) => {
    if (answer === null) return !value.completed;
    const question = quiz.questions[i];
    const inRange = (n: unknown): n is number => typeof n === 'number'
      && Number.isInteger(n) && n >= 0 && n < question.options.length;
    if (question.kind === 'multiple') {
      return Array.isArray(answer) && answer.length > 0
        && new Set(answer).size === answer.length && answer.every(inRange);
    }
    return inRange(answer);
  });
  return valid ? { version: quiz.version, answers: value.answers, completed: value.completed } : null;
}

export function matchesReference(question: Question, answer: number | number[] | null): boolean {
  if (question.reflection || answer === null) return false;
  const expected = question.referenceAnswers ?? [question.correctAnswer];
  const actual = Array.isArray(answer) ? answer : [answer];
  return actual.length === expected.length && expected.every((n) => n !== undefined && actual.includes(n));
}

export function getResult(quiz: Quiz, session: Session): { correct: number; total: number; score: number } | null {
  const valid = restoreSession(session, quiz);
  if (!valid?.completed) return null;
  const total = quiz.questions.filter((q) => !q.reflection).length;
  const correct = quiz.questions.reduce((n, q, i) => n + Number(matchesReference(q, valid.answers[i])), 0);
  return { correct, total, score: total ? Math.round(correct / total * 100) : 0 };
}

export function newSession(quiz: Quiz): Session {
  return { version: quiz.version, answers: quiz.questions.map(() => null), completed: false };
}

export function resumeQuestion(session: Session): number {
  const firstEmpty = session.answers.indexOf(null);
  return firstEmpty === -1 ? session.answers.length - 1 : firstEmpty;
}
