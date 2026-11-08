import { describe, expect, it } from 'vitest';
import { marketingDayGame } from '../data/marketing-day';
import { completeMarketingDay, getMarketingResult, newMarketingSession, resolveMarketingRoute, startMarketingDay, submitMarketingDecision } from './game-engine';

function answerAll(scores: number[]) {
  let session = startMarketingDay(newMarketingSession());
  marketingDayGame.decisions.forEach((question, index) => {
    session = submitMarketingDecision(session, index, question.options.find(option => option.score === scores[index])!.id);
  });
  return session;
}

describe('行銷人的一天：當次進度與計分', () => {
  it('六個正式決策 ID 唯一，每題都有三種參考分與回饋，面向各兩題', () => {
    expect(marketingDayGame.decisions).toHaveLength(6);
    expect(new Set(marketingDayGame.decisions.map(q => q.id)).size).toBe(6);
    for (const q of marketingDayGame.decisions) {
      expect(q.options.map(o => o.score).sort()).toEqual([0, 1, 2]);
      expect(q.options.every(o => o.feedback.length > 15)).toBe(true);
      expect(new Set(q.options.map(o => o.id)).size).toBe(3);
    }
    for (const axis of ['strategy', 'data', 'collaboration']) expect(marketingDayGame.decisions.filter(q => q.dimension === axis)).toHaveLength(2);
  });

  it('未完結不讀成績；全對得 100，最高參考分六題，各面向各滿分 4', () => {
    const answers = answerAll([2, 2, 2, 2, 2, 2]);
    expect(getMarketingResult(answers)).toBeNull();
    const result = getMarketingResult(completeMarketingDay(answers))!;
    expect(result).toMatchObject({ score: 100, points: 12, maxPoints: 12, highestCount: 6 });
    expect(result.axes.map(a => [a.points, a.maxPoints, a.score])).toEqual([[4, 4, 100], [4, 4, 100], [4, 4, 100]]);
    expect(result.review).toHaveLength(6);
  });

  it('低分也能完成；部分分依真實答案正規化，不能顯示固定樣稿', () => {
    expect(getMarketingResult(completeMarketingDay(answerAll([0, 0, 0, 0, 0, 0])))!.score).toBe(0);
    const result = getMarketingResult(completeMarketingDay(answerAll([2, 0, 1, 1, 2, 0])))!;
    expect(result).toMatchObject({ points: 6, score: 50, highestCount: 2 });
    expect(result.axes.map(a => a.score)).toEqual([75, 50, 25]);
    expect(result.practice).toHaveLength(2);
  });

  it('未開始、跳題、非法選項與不完整完結都拒絕，且不突變原資料', () => {
    const blank = newMarketingSession();
    expect(submitMarketingDecision(blank, 0, 'not-an-option')).toEqual(blank);
    const started = startMarketingDay(blank);
    expect(submitMarketingDecision(started, 1, marketingDayGame.decisions[1].options[0].id)).toEqual(started);
    expect(submitMarketingDecision(started, 0, 'broken')).toEqual(started);
    expect(submitMarketingDecision(started, -1, 'broken')).toEqual(started);
    expect(completeMarketingDay(started).completed).toBe(false);
    expect(blank.started).toBe(false);
  });

  it('重送相同答案不加分、不清後題；更改早題才清除後續與完成狀態', () => {
    const complete = completeMarketingDay(answerAll([2, 2, 2, 2, 2, 2]));
    expect(submitMarketingDecision(complete, 0, complete.answers[0]!)).toEqual(complete);
    const changed = submitMarketingDecision(complete, 1, marketingDayGame.decisions[1].options.find(o => o.score === 0)!.id);
    expect(changed.answers.slice(2)).toEqual([null, null, null, null]);
    expect(changed.answers[0]).toBe(complete.answers[0]);
    expect(changed.completed).toBe(false);
    expect(getMarketingResult(changed)).toBeNull();
    expect(complete.answers.every(Boolean)).toBe(true);
  });

  it('新 session 永遠無答案，結果／跳題／無效與超大題號安全回入口或當前題', () => {
    const fresh = newMarketingSession();
    expect(fresh.answers).toEqual([null, null, null, null, null, null]);
    for (const hash of ['#/quiz/marketing-day/result', '#/quiz/marketing-day/play/6', '#/quiz/marketing-day/play/999999999999999999999999', '#/quiz/marketing-day/nope']) {
      expect(resolveMarketingRoute(hash, fresh).canonical).toBe('#/quiz/marketing-day/1');
    }
    const started = startMarketingDay(fresh);
    expect(resolveMarketingRoute('#/quiz/marketing-day/play/4', started).canonical).toBe('#/quiz/marketing-day/play/1');
    expect(resolveMarketingRoute('#/quiz/marketing-day/2', started).canonical).toBe('#/quiz/marketing-day/play/1');
    expect(resolveMarketingRoute('#/quiz/marketing-day/1', started).kind).toBe('intro');
  });
});
