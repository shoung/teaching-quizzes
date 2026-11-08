import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import SalonGame from './SalonGame';
import { SEASON_PLAY, SEASON_STORAGE_KEY, initialSeason, startSeason } from './season-engine';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '#/quiz/paris-salon/1');
});

describe('六場沙龍序章與場景互動', () => {
  it('介紹說明六場經營；序章介紹克萊爾、路易斯、未來手帳與六場觀察', async () => {
    const user = userEvent.setup();
    localStorage.setItem('learning-lab:quiz:paris-salon:v1', '舊版紀錄保留');
    render(<SalonGame />);
    expect(screen.getByRole('img', { name: '沙龍夫人的經營筆記' })).toBeInTheDocument();
    expect(screen.getAllByText(/六場沙龍/)).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: '翻開故事' }));
    const opening = screen.getByRole('region', { name: '故事開場' });
    expect(opening).toHaveTextContent('克萊爾');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    await user.click(within(opening).getByRole('button', { name: '繼續故事' }));
    expect(opening).toHaveTextContent('路易斯');
    await user.click(within(opening).getByRole('button', { name: '繼續故事' }));
    expect(opening).toHaveTextContent('2026');
    await user.click(within(opening).getByRole('button', { name: '繼續故事' }));
    expect(opening).toHaveTextContent('不保證需求或到場');
    await user.click(within(opening).getByRole('button', { name: '開始經營' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('路易斯');
    expect(screen.getByRole('dialog')).toHaveTextContent('本場消息');
    expect(localStorage.getItem('learning-lab:quiz:paris-salon:v1')).toBe('舊版紀錄保留');
    await waitFor(() => expect(JSON.parse(localStorage.getItem(SEASON_STORAGE_KEY)!).version).toBe(3));
  });

  it('場景不顯示移動操作或十二題問答提示', () => {
    localStorage.setItem(SEASON_STORAGE_KEY, JSON.stringify(startSeason(initialSeason())));
    window.history.replaceState(null, '', SEASON_PLAY);
    render(<SalonGame />);
    expect(screen.queryByText(/WASD|方向鍵|E 互動|點地板/)).not.toBeInTheDocument();
    expect(screen.queryByText(/第 1／12|決策 1／12|下一題/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '分享沙龍' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '經營帳冊' })).toBeInTheDocument();
  });
});
