import { act, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { quizzes } from './data/quizzes';
import userEvent from '@testing-library/user-event';

beforeEach(() => { localStorage.clear(); window.history.replaceState(null, '', '#/'); });
function go(hash: string) {
  act(() => { window.history.replaceState(null, '', hash); window.dispatchEvent(new HashChangeEvent('hashchange')); });
}

describe('獨立測驗版型與可存取標籤', () => {
  for (const quiz of quizzes) {
    it(`${quiz.id} 的題目及結果只呈現自己的標題與操作`, () => {
      go(`#/quiz/${quiz.id}/1`);
      const first = render(<App />);
      const header = screen.getByRole('banner');
      expect(within(header).getByText(quiz.title)).toBeInTheDocument();
      expect(within(header).queryByRole('link')).not.toBeInTheDocument();
      expect(screen.queryByText(/目錄/)).not.toBeInTheDocument();
      expect(document.querySelector('a[href="#/"]')).toBeNull();
      first.unmount();
      const answers = quiz.questions.map((q) => q.kind === 'multiple' ? q.referenceAnswers! : q.correctAnswer ?? q.referenceAnswers![0]);
      localStorage.setItem(`learning-lab:quiz:${quiz.id}:v${quiz.version}`, JSON.stringify({ version: quiz.version, answers, completed: true }));
      go(`#/quiz/${quiz.id}/result`);
      render(<App />);
      expect(within(screen.getByRole('banner')).getByText(quiz.title)).toBeInTheDocument();
      expect(screen.queryByText(/目錄/)).not.toBeInTheDocument();
      expect(document.querySelector('a[href="#/"]')).toBeNull();
      expect(screen.getByRole('button', { name: /重新測驗/ })).toBeInTheDocument();
    });
  }
  it('圖片選項的朗讀名稱包含畫面上顯示的文字', () => {
    go('#/quiz/chromatic-intuition/play/1'); render(<App />);
    expect(screen.getByRole('radio', { name: '選項 B' })).toBeInTheDocument();
  });
  it('初次進入不搶焦點，鍵盤可以先使用略過區塊連結', async () => {
    const user = userEvent.setup();
    go('#/quiz/chromatic-intuition/1'); render(<App />);
    expect(document.activeElement).toBe(document.body);
    await user.tab();
    expect(screen.getByRole('link', { name: '跳至主要內容' })).toHaveFocus();
  });
  it('首頁仍可由目錄開啟獨立測驗', () => {
    render(<App />);
    expect(screen.getByRole('navigation', { name: '主導覽' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '查看測驗介紹' })).toHaveLength(2);
  });
  it('雷達資料有可重排的文字等價內容，不依賴縮小圖中文字', () => {
    const quiz = quizzes[1];
    localStorage.setItem(`learning-lab:quiz:${quiz.id}:v${quiz.version}`, JSON.stringify({ version: quiz.version, answers: quiz.questions.map((q) => q.correctAnswer), completed: true }));
    go(`#/quiz/${quiz.id}/result`); render(<App />);
    expect(screen.getByRole('img', { name: '顧問闖關能力雷達圖' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: '雷達圖數值' })).toBeInTheDocument();
  });
});
