import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import App from './App';
import { quizzes } from './data/quizzes';

beforeEach(() => { localStorage.clear(); window.history.replaceState(null, '', '#/quiz/ai-consulting/1'); });
function go(hash: string) { act(() => { window.history.replaceState(null, '', hash); window.dispatchEvent(new HashChangeEvent('hashchange')); }); }
it('分享第一頁是介紹，按開始才出現第一題與答題進度', async () => {
  const user = userEvent.setup(); render(<App />);
  expect(screen.getByRole('heading', { name: '你的顧問入場券，準備好了嗎？' })).toBeInTheDocument();
  expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'is.gd/SpjRZt' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '開始測驗' }));
  expect(window.location.hash).toBe('#/quiz/ai-consulting/play/1');
  expect(screen.getAllByRole('radio')).toHaveLength(4);
  expect(screen.queryByRole('link', { name: 'is.gd/SpjRZt' })).not.toBeInTheDocument();
});
it('介紹頁可繼續進度，重測只清除該測驗；已完成仍能開啟介紹頁', async () => {
  const user = userEvent.setup(); const quiz=quizzes[1]; const other=quizzes[0];
  const otherKey=`learning-lab:quiz:${other.id}:v${other.version}`;
  localStorage.setItem(otherKey, 'untouched');
  localStorage.setItem(`learning-lab:quiz:${quiz.id}:v${quiz.version}`, JSON.stringify({version:quiz.version, answers:quiz.questions.map((q)=>q.correctAnswer), completed:true}));
  render(<App />);
  expect(screen.getByRole('button', {name:'查看上次結果'})).toBeInTheDocument();
  await user.click(screen.getByRole('button', {name:'開始測驗'}));
  expect(screen.getAllByRole('radio').every((r)=>!(r as HTMLInputElement).checked)).toBe(true);
  expect(localStorage.getItem(otherKey)).toBe('untouched');
  await user.click(screen.getAllByRole('radio')[2]);
  await user.click(screen.getByRole('button', {name:/下一頁/}));
  go('#/quiz/ai-consulting/1');
  await user.click(screen.getByRole('button', {name:'繼續測驗'}));
  expect(window.location.hash).toBe('#/quiz/ai-consulting/play/2');
});
