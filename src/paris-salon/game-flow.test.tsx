import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SalonGame from './SalonGame';
import { SEASON_PLAY, SEASON_STORAGE_KEY, acknowledgeSeason, holdSeason, initialSeason, setSeasonDraft, startSeason } from './season-engine';
import { seasonMarkets } from '../data/paris-salon-season';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '#/quiz/paris-salon/1');
});
afterEach(() => vi.restoreAllMocks());

async function beginNewSeason(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '翻開故事' }));
  const prologue = screen.getByRole('region', { name: '故事開場' });
  for (let index = 0; index < 3; index += 1) await user.click(within(prologue).getByRole('button', { name: '繼續故事' }));
  await user.click(within(prologue).getByRole('button', { name: '開始經營' }));
}

async function openPlan(user: ReturnType<typeof userEvent.setup>) {
  if (screen.queryByRole('button', { name: '與路易斯交談' })) await user.click(screen.getByRole('button', { name: '與路易斯交談' }));
  if (screen.queryByRole('button', { name: '查看本場計畫' })) await user.click(screen.getByRole('button', { name: '查看本場計畫' }));
}

describe('巴黎沙龍六場經營流程', () => {
  it('先介紹和說明市場，再展示配置、預估與自由行動；零行動的小聚可舉辦', async () => {
    const user = userEvent.setup();
    render(<SalonGame />);
    await beginNewSeason(user);
    expect(screen.getByRole('dialog')).toHaveTextContent('路易斯');
    await user.click(screen.getByRole('button', { name: '查看本場計畫' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('主受眾')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('聚會主題')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('規模')).toBeInTheDocument();
    expect(within(dialog).getByRole('region', { name: '本場預估' })).toHaveTextContent('預估需求／可入場');
    expect(within(dialog).getByRole('button', { name: '舉辦本場' })).toBeEnabled();
    expect(within(dialog).queryByRole('radio')).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '舉辦本場' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('經營回顧');
    expect(screen.getByRole('heading', { name: seasonMarkets[0].title })).toBeInTheDocument();
    expect(screen.getByText(/既有熟客留存/)).toBeInTheDocument();
    expect(screen.getByText(/位上場熟客/)).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const reopen = screen.getByRole('button', { name: '查看本場回顧' });
    await user.click(reopen);
    await user.click(screen.getByRole('button', { name: '確認回顧，前往下一場' }));
    expect(window.location.hash).toBe(SEASON_PLAY);
    expect(screen.getByRole('dialog')).toHaveTextContent('路易斯');
    await waitFor(() => expect(JSON.parse(localStorage.getItem(SEASON_STORAGE_KEY)!).plans).toHaveLength(1));
  });

  it('六次舉辦只能逐場確認；報告呈現趨勢、每場決策和熟客留存分母', async () => {
    const user = userEvent.setup();
    const started = startSeason(initialSeason());
    localStorage.setItem(SEASON_STORAGE_KEY, JSON.stringify(started));
    window.history.replaceState(null, '', SEASON_PLAY);
    render(<SalonGame />);
    for (let event = 1; event <= 6; event += 1) {
      await openPlan(user);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent(`第 ${event}／6 場`);
      await user.click(within(dialog).getByRole('button', { name: '舉辦本場' }));
      expect(screen.getByRole('dialog')).toHaveTextContent('經營回顧');
      await user.click(screen.getByRole('button', { name: event === 6 ? '完成六場回顧' : '確認回顧，前往下一場' }));
    }
    expect(window.location.hash).toBe('#/quiz/paris-salon/result');
    expect(screen.getByRole('table', { name: '六場趨勢與資源變化' })).toBeInTheDocument();
    expect(screen.getAllByText(/熟客留存/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/上場熟客/).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: '逐場決策回顧' })).toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(localStorage.getItem(SEASON_STORAGE_KEY)!).acknowledged).toBe(6));
  });

  it('還原未提交草稿並保留其他測驗的進度', async () => {
    const user = userEvent.setup();
    const started = startSeason(initialSeason());
    started.draft.audience = 'newcomers';
    localStorage.setItem(SEASON_STORAGE_KEY, JSON.stringify(started));
    localStorage.setItem('learning-lab:quiz:other:v1', '保留');
    window.history.replaceState(null, '', SEASON_PLAY);
    const { unmount } = render(<SalonGame />);
    await openPlan(user);
    expect(screen.getByLabelText('主受眾')).toHaveValue('newcomers');
    unmount();
    render(<SalonGame />);
    await openPlan(user);
    expect(screen.getByLabelText('主受眾')).toHaveValue('newcomers');
    expect(localStorage.getItem('learning-lab:quiz:other:v1')).toBe('保留');
  });

  it('行動搭配超過準備時間時保留既有草稿、說清限制，預估提前展示現金與時間', async () => {
    const user = userEvent.setup();
    const started = startSeason(initialSeason());
    localStorage.setItem(SEASON_STORAGE_KEY, JSON.stringify(started));
    window.history.replaceState(null, '', SEASON_PLAY);
    render(<SalonGame />);
    await openPlan(user);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('region', { name: '本場預估' })).toHaveTextContent('支出後現金（未計收入）');
    await user.click(within(dialog).getByRole('checkbox', { name: /培訓固定助手/ }));
    await user.click(within(dialog).getByRole('checkbox', { name: /添置座椅/ }));
    await user.click(within(dialog).getByRole('checkbox', { name: /邀請畫家合作/ }));
    expect(within(dialog).getByRole('checkbox', { name: /邀請畫家合作/ })).not.toBeChecked();
    expect(within(dialog).getByText(/超過本場 4 小時/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '舉辦本場' })).toBeEnabled();
    await user.click(within(dialog).getByRole('button', { name: '稍後再決定' }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(SEASON_STORAGE_KEY)!).draft.actions).toEqual(['training', 'seats']));
  });

  it('儲存不可用仍可操作；損壞的 JSON 只重設本季 v3 進度', async () => {
    const user = userEvent.setup();
    localStorage.setItem(SEASON_STORAGE_KEY, '{broken');
    localStorage.setItem('learning-lab:quiz:other:v1', '保留');
    window.history.replaceState(null, '', '#/quiz/paris-salon/1');
    const { unmount } = render(<SalonGame />);
    await waitFor(() => expect(JSON.parse(localStorage.getItem(SEASON_STORAGE_KEY) ?? 'null').plans).toEqual([]));
    expect(localStorage.getItem('learning-lab:quiz:other:v1')).toBe('保留');
    unmount();

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('storage blocked'); });
    render(<SalonGame />);
    await beginNewSeason(user);
    await openPlan(user);
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '舉辦本場' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('經營回顧');
    expect(screen.getByText(/目前無法儲存；仍可在這個分頁完成遊戲/, { selector: '.season-visible-notice' })).toBeInTheDocument();
  });
  it('舉辦前區分預估需求、當場容量與候補風險，避免小聚容量掩蓋需求', async () => {
    const user = userEvent.setup();
    let session = startSeason(initialSeason());
    session = holdSeason(setSeasonDraft(session, { audience: 'creators', theme: 'workshop', scale: 'small', actions: ['research', 'sponsor'] }), 1);
    session = acknowledgeSeason(session);
    session = setSeasonDraft(session, { audience: 'enthusiasts', theme: 'exhibition', scale: 'small', actions: ['participation', 'membership'] });
    localStorage.setItem(SEASON_STORAGE_KEY, JSON.stringify(session));
    window.history.replaceState(null, '', SEASON_PLAY);
    render(<SalonGame />);
    await openPlan(user);
    const forecast = screen.getByRole('region', { name: '本場預估' });
    expect(forecast).toHaveTextContent('預估需求／可入場');
    expect(forecast).toHaveTextContent('13–15');
    expect(forecast).toHaveTextContent(/候補.*1–3/);
    expect(screen.getByRole('option', { name: '小聚（12 人）' })).toBeInTheDocument();
  });

});
