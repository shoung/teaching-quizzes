import { describe, expect, it } from 'vitest';
import { getResult, restoreSession } from './quiz-engine';
import type { Quiz, Session } from './types';
import { chromaticQuiz } from './data/chromatic';

const quiz: Quiz = {
  id: 'fixture', version: 2, title: '測試', subtitle: 'Test', description: '測試',
  category: '測試', minutes: 1, color: 'sage', icon: 'web',
  questions: [0, 1, 2].map((answer) => ({
    id: `q${answer}`, prompt: '題目', options: ['A', 'B', 'C'],
    correctAnswer: answer, explanation: '解析',
  })),
};

describe('計分及進度資料邊界', () => {
  it('完成後按實際答案計分並將百分比四捨五入', () => {
    expect(getResult(quiz, { version: 2, answers: [0, 1, 0], completed: true }))
      .toEqual({ correct: 2, total: 3, score: 67 });
    expect(getResult(quiz, { version: 2, answers: [2, 2, 0], completed: true }))
      .toEqual({ correct: 0, total: 3, score: 0 });
  });
  it('未完成時不顯示成績', () => {
    expect(getResult(quiz, { version: 2, answers: [0, 1, 2], completed: false })).toBeNull();
  });
  it('接受合法的進行中答案，包含選項零', () => {
    const session: Session = { version: 2, answers: [0, null, 2], completed: false };
    expect(restoreSession(session, quiz)).toEqual(session);
  });
  it('複選題必須完全符合參考答案，全部勾選不會得到滿分', () => {
    const multiQuiz: Quiz = { ...quiz, questions: [{ ...quiz.questions[0], kind: 'multiple', referenceAnswers: [0, 2] }] };
    expect(getResult(multiQuiz, { version: 2, answers: [[2, 0]], completed: true }))
      .toEqual({ correct: 1, total: 1, score: 100 });
    expect(getResult(multiQuiz, { version: 2, answers: [[0, 1, 2]], completed: true }))
      .toEqual({ correct: 0, total: 1, score: 0 });
    expect(restoreSession({ version: 2, answers: [[0, 0]], completed: true }, multiQuiz)).toBeNull();
    expect(restoreSession({ version: 2, answers: [[]], completed: true }, multiQuiz)).toBeNull();
  });
  it('個人偏好題保留答案但不納入對錯分數', () => {
    const reflectiveQuiz: Quiz = { ...quiz, questions: [quiz.questions[0], { ...quiz.questions[1], reflection: true }] };
    expect(getResult(reflectiveQuiz, { version: 2, answers: [0, 0], completed: true }))
      .toEqual({ correct: 1, total: 1, score: 100 });
  });
  it('客廳配色與照片取捨等審美偏好，不會降低色彩觀察的參考分數', () => {
    const answers = [1, 3, 0, 1, 0, 0, [0, 1, 2, 4], 3, 0, 0, 2, 0, 0, 2, 2, 0, 0, 0, 0, 0, [0, 2], 0, 1, 0, 0, 0, 0, 0];
    expect(getResult(chromaticQuiz, { version: 2, completed: true, answers }))
      .toEqual({ correct: 11, total: 11, score: 100 });
  });
  it.each([
    null, 'broken', [],
    { version: 1, answers: [0, 1, 2], completed: true },
    { version: 2, answers: [0], completed: false },
    { version: 2, answers: [0, 1, 3], completed: true },
    { version: 2, answers: [-1, 1, 2], completed: true },
    { version: 2, answers: [0.5, 1, 2], completed: true },
    { version: 2, answers: [false, 1, 2], completed: true },
    { version: 2, answers: [0, null, 2], completed: true },
    { version: 2, answers: [0, 1, 2], completed: 'yes' },
  ])('拒絕過期、破損或未完整完成的進度：%j', (raw) => {
    expect(restoreSession(raw, quiz)).toBeNull();
  });
});
