import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SalonGame from './SalonGame';
import { SEASON_PLAY, SEASON_STORAGE_KEY, initialSeason, startSeason, heardSeasonNpc, holdSeason } from './season-engine';
import { seasonScenes } from '../data/paris-salon-rpg';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', SEASON_PLAY);
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  localStorage.setItem(SEASON_STORAGE_KEY, JSON.stringify(startSeason(initialSeason())));
});
async function finishDialogue(user: ReturnType<typeof userEvent.setup>) {
  let safety = 0;
  while (screen.queryByRole('button', { name: '繼續對話' }) && safety++ < 60) await user.click(screen.getByRole('button', { name: '繼續對話' }));
  expect(safety).toBeLessThan(60);
}
async function hearGuest(user: ReturnType<typeof userEvent.setup>, round = 1) {
  const guest = seasonScenes[round - 1].npcs.find(n => n.id !== 5)!;
  await user.click(screen.getByRole('button', { name: `與${guest.name}交談` }));
  await finishDialogue(user);
}
describe('六場 RPG 經營循環', () => {
  it('聽完在場朋友才可規劃；牌可移入移出並保留草稿', async () => {
    const user = userEvent.setup(); render(<SalonGame />);
    expect(screen.getByRole('button', { name: '沙龍計劃' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: '與馬塞爾交談' })).not.toBeInTheDocument();
    await hearGuest(user);
    await user.click(screen.getByRole('button', { name: '沙龍計劃' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('主要來客')).toBeInTheDocument();
    expect(within(dialog).queryByText('本場消息：')).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '選擇：培訓固定助手' }));
    expect(within(dialog).getByRole('button', { name: '移回手牌：培訓固定助手' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '移回手牌：培訓固定助手' }));
    expect(within(dialog).getByRole('button', { name: '選擇：培訓固定助手' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '舉辦沙龍' })).toBeEnabled();
  });
  it('六場逐次聽消息、舉辦、結算，結語後才有報告', async () => {
    const user = userEvent.setup(); render(<SalonGame />);
    for (let round=1; round<=6; round++) {
      await hearGuest(user, round);
      await user.click(screen.getByRole('button', { name: '沙龍計劃' }));
      await user.click(screen.getByRole('button', { name: '舉辦沙龍' }));
      expect(screen.getByLabelText(`第 ${round} 場沙龍演出`)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: '略過演出' }));
      expect(screen.getByRole('dialog')).toHaveTextContent('知名度');
      await user.click(screen.getByRole('button', { name: round===6?'聽聽露易斯夫人怎麼說':'前往下一場' }));
    }
    expect(window.location.hash).toBe('#/quiz/paris-salon/ending');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'沙龍計劃'})).not.toBeInTheDocument();
    await finishDialogue(user);
    expect(window.location.hash).toBe('#/quiz/paris-salon/result');
    expect(screen.getByRole('table', { name: '六場趨勢與資源變化' })).toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(localStorage.getItem(SEASON_STORAGE_KEY)!).endingSeen).toBe(true));
  }, 20000);
  it('重新整理已舉辦的場次只開回顧；返回標題需確認且保留進度', async () => {
    const user=userEvent.setup();
    const held=holdSeason(heardSeasonNpc(startSeason(initialSeason()),2),1);
    localStorage.setItem(SEASON_STORAGE_KEY,JSON.stringify(held));
    const { unmount }=render(<SalonGame />);
    expect(await screen.findByRole('dialog')).toHaveTextContent('知名度');
    expect(screen.queryByLabelText('第 1 場沙龍演出')).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button',{name:'返回標題'}));
    expect(window.location.hash).toBe(SEASON_PLAY);
    await user.click(screen.getByRole('button',{name:'返回標題頁'}));
    expect(window.location.hash).toBe('#/quiz/paris-salon/1');
    unmount();
    expect(JSON.parse(localStorage.getItem(SEASON_STORAGE_KEY)!).plans).toHaveLength(1);
  });
});

describe('RPG 進度與限制',()=>{
  it('未聽完的談話不解鎖，導師也不會代替市場消息',async()=>{
    const user=userEvent.setup();render(<SalonGame/>);
    await user.click(screen.getByRole('button',{name:'與茱莉葉交談'}));
    await user.click(screen.getByRole('button',{name:'繼續對話'}));
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button',{name:'沙龍計劃'})).toBeDisabled();
    await user.click(screen.getByRole('button',{name:'與露易斯夫人交談'}));
    await finishDialogue(user);
    expect(screen.getByRole('button',{name:'沙龍計劃'})).toBeDisabled();
  });
  it('準備時段不足時拒絕加牌，選好的牌仍能收回',async()=>{
    const user=userEvent.setup();const ready=heardSeasonNpc(startSeason(initialSeason()),2);
    localStorage.setItem(SEASON_STORAGE_KEY,JSON.stringify(ready));render(<SalonGame/>);
    await user.click(screen.getByRole('button',{name:'沙龍計劃'}));
    await user.click(screen.getByRole('button',{name:'選擇：培訓固定助手'}));
    await user.click(screen.getByRole('button',{name:'選擇：添置座椅'}));
    const blocked=screen.getByRole('button',{name:'選擇：邀請畫家合作'});
    expect(blocked).toHaveAttribute('aria-disabled','true');
    await user.click(blocked);
    expect(screen.queryByRole('button',{name:'移回手牌：邀請畫家合作'})).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:'舉辦沙龍'})).toBeEnabled();
    await user.click(screen.getByRole('button',{name:'移回手牌：添置座椅'}));
    expect(screen.getByRole('button',{name:'選擇：邀請畫家合作'})).not.toHaveAttribute('aria-disabled');
  });
  it('儲存失效仍可完成一場，損壞進度不會影響其他測驗',async()=>{
    const user=userEvent.setup();localStorage.setItem('learning-lab:quiz:other:v1','保留');
    localStorage.setItem(SEASON_STORAGE_KEY,'{broken');window.history.replaceState(null,'','#/quiz/paris-salon/1');
    const {unmount}=render(<SalonGame/>);expect(localStorage.getItem('learning-lab:quiz:other:v1')).toBe('保留');unmount();
    const get=vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw Error('blocked');});
    const set=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('blocked');});
    render(<SalonGame/>);await user.click(screen.getByRole('button',{name:'翻開故事'}));await finishDialogue(user);await hearGuest(user);
    await user.click(screen.getByRole('button',{name:'沙龍計劃'}));await user.click(screen.getByRole('button',{name:'舉辦沙龍'}));await user.click(screen.getByRole('button',{name:'略過演出'}));
    expect(screen.getByRole('dialog')).toHaveTextContent('經營資產變化');get.mockRestore();set.mockRestore();
  });
});
