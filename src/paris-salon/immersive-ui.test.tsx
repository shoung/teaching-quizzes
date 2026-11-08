import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SalonGame from './SalonGame';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '#/quiz/paris-salon/1');
});

describe('沙龍六場經營主界面', () => {
  it('保留主標 Logo 與分享入口，不顯示目錄連結或常駐隱私文案', () => {
    render(<SalonGame />);
    expect(screen.getByRole('img', { name: '沙龍夫人的經營筆記' })).toHaveAttribute('src', expect.stringContaining('logo.png'));
    expect(screen.getByRole('img', { name: /分享 QR code/ })).toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(document.querySelector('a[href="#/"]')).toBeNull();
    expect(screen.queryByText(/進度僅保存在此瀏覽器|不蒐集個人資料/)).not.toBeInTheDocument();
  });

  it('分享維持指向沙龍介紹頁；設定面板支援 Escape、焦點回復及音樂署名', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<SalonGame />);
    await user.click(screen.getByRole('button', { name: /複製.*連結/ }));
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/#\/quiz\/paris-salon\/1$/));
    expect(String(writeText.mock.calls[0][0])).not.toContain('result');
    const trigger = screen.getByRole('button', { name: '設定與操作' });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toHaveTextContent('Erik Satie');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
