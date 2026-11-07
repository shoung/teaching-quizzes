import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

function navigate(hash: string) {
  act(() => {
    window.history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '#/');
});

describe('教學測驗的真實使用流程', () => {
  it('目錄可以搜尋主題，無結果時提供清除條件', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox', { name: '搜尋測驗' }), 'AI');
    expect(screen.getByRole('heading', { name: '你離麥肯錫入職還差多遠？' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '色彩天賦測驗' })).not.toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), '完全不存在');
    expect(screen.getByText('找不到符合的測驗')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '清除篩選' }));
    expect(screen.getByRole('heading', { name: '色彩天賦測驗' })).toBeInTheDocument();
  });

  it('一頁一題，未答不能前進，返回上一頁會保留選擇', async () => {
    const user = userEvent.setup();
    navigate('#/quiz/chromatic-intuition/play/1');
    render(<App />);
    expect(screen.getByRole('button', { name: /下一頁/ })).toBeDisabled();
    expect(screen.getAllByRole('group')).toHaveLength(1);
    await user.click(screen.getByRole('radio', { name: '選項 B' }));
    await user.click(screen.getByRole('button', { name: /下一頁/ }));
    await screen.findByRole('heading', { name: '下列四個綠色色塊中，哪一個最接近黃綠色？' });
    await user.click(screen.getByRole('button', { name: /上一頁/ }));
    expect(await screen.findByRole('radio', { name: '選項 B' })).toBeChecked();
  });

  it('完成 AI 企劃的 28 題後產生六軸雷達、分級與解析，重測會清空答案', async () => {
    const user = userEvent.setup();
    navigate('#/quiz/ai-consulting/play/1');
    render(<App />);
    for (const answer of [2, 0, 3, 1, 2, 0, 1, 3, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 0, 3, 1, 2, 0, 3, 2, 0, 3, 1]) {
      await user.click(screen.getAllByRole('radio')[answer]);
      await user.click(screen.getByRole('button', { name: /下一頁|查看結果/ }));
    }
    expect(await screen.findByRole('heading', { name: '顧問入場券，解鎖！' })).toBeInTheDocument();
    expect(screen.getByLabelText('測驗分數')).toHaveTextContent('100');
    expect(screen.getByText('84 / 84 闖關積分')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '顧問闖關能力雷達圖' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: '六面向能力分數' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '答案揭曉時間' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /重新測驗/ }));
    await user.click(await screen.findByRole('button', { name: '開始測驗' }));
    expect(screen.getByRole('button', { name: /下一頁/ })).toBeDisabled();
    expect(screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);
  });

  it('重新掛載後可以繼續作答，不會遺失已選答案', async () => {
    const user = userEvent.setup();
    navigate('#/quiz/chromatic-intuition/play/1');
    const first = render(<App />);
    await user.click(screen.getByRole('radio', { name: '選項 B' }));
    first.unmount();
    render(<App />);
    expect(screen.getByRole('radio', { name: '選項 B' })).toBeChecked();
  });

  it('直接連結後續題目會回到第一道未答題，不能直接看結果', async () => {
    navigate('#/quiz/chromatic-intuition/4');
    render(<App />);
    expect(await screen.findByRole('radio', { name: '選項 B' })).toBeInTheDocument();
    navigate('#/quiz/chromatic-intuition/result');
    expect(await screen.findByRole('radio', { name: '選項 B' })).toBeInTheDocument();
    expect(screen.queryByLabelText('測驗分數')).not.toBeInTheDocument();
  });

  it('網址錯誤提供重新載入提示，破損進度仍可開始答題', async () => {
    localStorage.setItem('learning-lab:quiz:chromatic-intuition:v2', '{broken');
    navigate('#/quiz/no-such-quiz/1');
    render(<App />);
    expect(screen.getByRole('heading', { name: '這份測驗還沒準備好' })).toBeInTheDocument();
    navigate('#/quiz/chromatic-intuition/play/1');
    expect(await screen.findByRole('radio', { name: '選項 B' })).toBeInTheDocument();
  });

  it('瀏覽器禁止儲存時仍可完成當頁作答', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Unavailable'); });
    navigate('#/quiz/chromatic-intuition/play/1');
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: '選項 B' }));
    fireEvent.click(screen.getByRole('button', { name: /下一頁/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: '下列四個綠色色塊中，哪一個最接近黃綠色？' })).toBeInTheDocument());
    spy.mockRestore();
  });
  it('色彩測驗答題頁不蒐集個資，不蒐集姓名及 Email，並與其他測驗隔離', async () => {
    const user = userEvent.setup();
    navigate('#/quiz/chromatic-intuition/play/1');
    render(<App />);
    expect(screen.getByRole('heading', { name: /色塊中，哪一個最接近標準正紅色/ })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(screen.getAllByRole('img', { name: /^選項/ })).toHaveLength(4);
    await user.click(screen.getByRole('radio', { name: '選項 B' }));
    navigate('#/quiz/ai-consulting/play/1');
    expect(screen.getByRole('button', { name: /下一頁/ })).toBeDisabled();
    navigate('#/quiz/chromatic-intuition/play/1');
    expect(screen.getByRole('radio', { name: '選項 B' })).toBeChecked();
  });
  it('完成 28 道原題與兩道複選後，產生四面向報告及不計對錯的偏好紀錄', async () => {
    const user = userEvent.setup();
    navigate('#/quiz/chromatic-intuition/play/1');
    render(<App />);
    const answers = [1, 3, 0, 1, 0, 0, [0, 1, 2, 4], 3, 0, 0, 2, 0, 0, 2, 2, 0, 0, 0, 0, 0, [0, 2], 0, 0, 3, 1, 3, 0, 0];
    for (const answer of answers) {
      if (Array.isArray(answer)) {
        const choices = screen.getAllByRole('checkbox');
        for (const index of answer) await user.click(choices[index]);
      } else await user.click(screen.getAllByRole('radio')[answer]);
      await user.click(screen.getByRole('button', { name: /下一頁|查看結果/ }));
    }
    expect(await screen.findByRole('heading', { name: '你的色彩，自有光芒。' })).toBeInTheDocument();
    expect(screen.getByLabelText('測驗分數')).toHaveTextContent('100');
    expect(screen.getByText('參考吻合 11 / 11 題 · 17 題為個人感受，不計對錯')).toBeInTheDocument();
    expect(screen.getByText('已記錄 7 題感受')).toBeInTheDocument();
    expect(screen.getAllByText('個人感受')).toHaveLength(17);
    expect(screen.getByRole('heading', { name: '關於這份教學回饋' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '色彩觀察雷達圖' })).toBeInTheDocument();
  });
  it('每份測驗第一頁都有各自的短網址和本機 QR code，複製不夾帶答案', async () => {
    const user = userEvent.setup();
    navigate('#/quiz/chromatic-intuition/1');
    render(<App />);
    expect(screen.getByRole('link', { name: 'is.gd/HI9zQA' })).toHaveAttribute('href', 'https://is.gd/HI9zQA');
    expect(screen.getByRole('img', { name: '色彩天賦測驗分享 QR code' })).toHaveAttribute('src', '/qr/chromatic-intuition.png');
    await user.click(screen.getByRole('button', { name: '複製短網址' }));
    expect(await navigator.clipboard.readText()).toBe('https://is.gd/HI9zQA');
    navigate('#/quiz/ai-consulting/1');
    expect(screen.getByRole('link', { name: 'is.gd/SpjRZt' })).toHaveAttribute('href', 'https://is.gd/SpjRZt');
    expect(screen.getByRole('img', { name: '你離麥肯錫入職還差多遠？分享 QR code' })).toBeInTheDocument();
  });
});
