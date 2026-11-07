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
    await user.type(screen.getByRole('searchbox', { name: '搜尋測驗' }), '網頁');
    expect(screen.getByRole('heading', { name: '網頁基礎入門' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'AI 素養小教室' })).not.toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), '完全不存在');
    expect(screen.getByText('找不到符合的測驗')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '清除篩選' }));
    expect(screen.getByRole('heading', { name: 'AI 素養小教室' })).toBeInTheDocument();
  });

  it('一頁一題，未答不能前進，返回上一頁會保留選擇', async () => {
    const user = userEvent.setup();
    navigate('#/quiz/web-basics/1');
    render(<App />);
    expect(screen.getByRole('button', { name: /下一頁/ })).toBeDisabled();
    expect(screen.getAllByRole('group')).toHaveLength(1);
    await user.click(screen.getByLabelText('HTML'));
    await user.click(screen.getByRole('button', { name: /下一頁/ }));
    await screen.findByRole('heading', { name: '想要調整文字顏色與頁面排版，應該使用什麼？' });
    await user.click(screen.getByRole('button', { name: /上一頁/ }));
    expect(await screen.findByLabelText('HTML')).toBeChecked();
  });

  it('完成後立即顯示分數與解析，重新測驗會清空答案', async () => {
    const user = userEvent.setup();
    navigate('#/quiz/web-basics/1');
    render(<App />);
    for (const label of ['HTML', 'CSS', '讓頁面回應使用者的操作', '讓不同尺寸的裝置都有合適的版面']) {
      await user.click(await screen.findByLabelText(label));
      await user.click(screen.getByRole('button', { name: /下一頁|查看結果/ }));
    }
    expect(await screen.findByRole('heading', { name: '每一步，都算進步。' })).toBeInTheDocument();
    expect(screen.getByLabelText('測驗分數')).toHaveTextContent('100');
    expect(screen.getByText('答對 4 / 4 題')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '把理解再加深一點' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /重新測驗/ }));
    expect(await screen.findByRole('button', { name: /下一頁/ })).toBeDisabled();
    expect(screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);
  });

  it('重新掛載後可以繼續作答，不會遺失已選答案', async () => {
    const user = userEvent.setup();
    navigate('#/quiz/web-basics/1');
    const first = render(<App />);
    await user.click(screen.getByLabelText('HTML'));
    first.unmount();
    render(<App />);
    expect(screen.getByLabelText('HTML')).toBeChecked();
  });

  it('直接連結後續題目會回到第一道未答題，不能直接看結果', async () => {
    navigate('#/quiz/web-basics/4');
    render(<App />);
    expect(await screen.findByLabelText('HTML')).toBeInTheDocument();
    navigate('#/quiz/web-basics/result');
    expect(await screen.findByLabelText('HTML')).toBeInTheDocument();
    expect(screen.queryByLabelText('測驗分數')).not.toBeInTheDocument();
  });

  it('網址錯誤及破損的儲存資料仍有可用的返回目錄操作', async () => {
    localStorage.setItem('learning-lab:quiz:web-basics:v1', '{broken');
    navigate('#/quiz/no-such-quiz/1');
    render(<App />);
    expect(screen.getByRole('heading', { name: '這份測驗還沒準備好' })).toBeInTheDocument();
    navigate('#/quiz/web-basics/1');
    expect(await screen.findByLabelText('HTML')).toBeInTheDocument();
  });

  it('瀏覽器禁止儲存時仍可完成當頁作答', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Unavailable'); });
    navigate('#/quiz/web-basics/1');
    render(<App />);
    fireEvent.click(screen.getByLabelText('HTML'));
    fireEvent.click(screen.getByRole('button', { name: /下一頁/ }));
    await waitFor(() => expect(screen.getByLabelText('CSS')).toBeInTheDocument());
    spy.mockRestore();
  });
  it('色彩測驗直接顯示第一題，不蒐集姓名及 Email，並與其他測驗隔離', async () => {
    const user = userEvent.setup();
    navigate('#/quiz/chromatic-intuition/1');
    render(<App />);
    expect(screen.getByRole('heading', { name: /色塊中，哪一個最接近標準正紅色/ })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(screen.getAllByRole('img')).toHaveLength(4);
    await user.click(screen.getByLabelText('B'));
    navigate('#/quiz/web-basics/1');
    expect(screen.getByRole('button', { name: /下一頁/ })).toBeDisabled();
    navigate('#/quiz/chromatic-intuition/1');
    expect(screen.getByLabelText('B')).toBeChecked();
  });
  it('完成 28 道原題與兩道複選後，產生四面向報告及不計對錯的偏好紀錄', async () => {
    const user = userEvent.setup();
    navigate('#/quiz/chromatic-intuition/1');
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
    expect(screen.getByText('參考吻合 15 / 15 題 · 13 題為個人感受，不計對錯')).toBeInTheDocument();
    expect(screen.getByText('已記錄 7 題感受')).toBeInTheDocument();
    expect(screen.getAllByText('個人感受')).toHaveLength(13);
    expect(screen.getByRole('heading', { name: '關於這份教學回饋' })).toBeInTheDocument();
  });
});
