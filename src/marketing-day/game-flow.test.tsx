import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { marketingDayGame } from '../data/marketing-day';
import MarketingDayGame from './MarketingDayGame';

const soundMock = vi.hoisted(() => ({
  unlock: vi.fn(), toggle: vi.fn(), play: vi.fn(), toggleMusic: vi.fn(),
  setMusicVolume: vi.fn(), setEffectsVolume: vi.fn(),
}));
vi.mock('./use-game-sound', () => ({ useGameSound: () => ({
  muted: false, toggle: soundMock.toggle, play: soundMock.play, unlock: soundMock.unlock,
  musicEnabled: true, toggleMusic: soundMock.toggleMusic, musicVolume: 0.25,
  setMusicVolume: soundMock.setMusicVolume, effectsVolume: 0.35,
  setEffectsVolume: soundMock.setEffectsVolume, status: 'ready',
}) }));

vi.mock('./OfficeScene', async () => {
  const { forwardRef, useImperativeHandle } = await import('react');
  return { default: forwardRef(function Scene(props: {onInteract: () => void}, ref) {
    useImperativeHandle(ref, () => ({goToTarget: props.onInteract, interact: props.onInteract, step: () => {}}));
    return <div role="img" aria-label="測試用辦公室場景"/>;
  }) };
});

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
beforeEach(() => { window.history.replaceState(null, '', '#/quiz/marketing-day/1'); });

async function openDecision(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /與.+對話/ }));
  await user.click(screen.getByRole('button', { name: '我會怎麼做？' }));
}
async function decide(user: ReturnType<typeof userEvent.setup>, index: number, score: number) {
  await openDecision(user);
  const q = marketingDayGame.decisions[index];
  await user.click(screen.getByRole('radio', { name: q.options.find(o => o.score === score)!.label }));
  await user.click(screen.getByRole('button', { name: '確認選擇' }));
  expect(screen.getByText(q.options.find(o => o.score === score)!.feedback)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: index === 5 ? '查看結果' : '下一頁' }));
}

describe('完整單章遊玩流程', () => {
  it('六題可產生真實成績、六題回顧與三面向，重玩歸零且不寫入儲存', async () => {
    const user = userEvent.setup();
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    render(<MarketingDayGame/>);
    await user.click(screen.getByRole('button', { name: '開始上班' }));
    for (let i=0;i<6;i++) await decide(user,i,[2,0,1,1,2,0][i]);
    expect(await screen.findByLabelText('教學參考分數')).toHaveTextContent('50');
    expect(screen.getByRole('table', { name: '三面向能力分數' })).toHaveTextContent('75 / 100');
    expect(screen.getByRole('table', { name: '三面向能力分數' })).toHaveTextContent('25 / 100');
    await user.click(screen.getByText('逐題回顧'));
    expect(screen.getAllByRole('button', { name: /回顧第/ })).toHaveLength(6);
    await user.click(screen.getByRole('button', { name: '回顧第 2 題' }));
    expect(screen.getByText(marketingDayGame.decisions[1].explanation)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重新上班' }));
    await user.click(screen.getByRole('button', { name: '確認重新開始' }));
    expect(await screen.findByRole('button', { name: '開始上班' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '開始上班' }));
    await openDecision(user);
    expect(screen.getByRole('button', { name: '確認選擇' })).toBeDisabled();
    expect(screen.getAllByRole('radio').every(r => !(r as HTMLInputElement).checked)).toBe(true);
    expect(storage).not.toHaveBeenCalled(); storage.mockRestore();
  });

  it('未選不能確認，術語與收合不會丟掉草稿', async () => {
    const user = userEvent.setup(); render(<MarketingDayGame/>);
    await user.click(screen.getByRole('button', { name: '開始上班' })); await openDecision(user);
    expect(screen.getByRole('button', { name: '確認選擇' })).toBeDisabled();
    const label=marketingDayGame.decisions[0].options[0].label;
    await user.click(screen.getByRole('radio', { name: label }));
    await user.click(screen.getByRole('button', { name: 'KPI' }));
    expect(screen.getByRole('complementary', { name: 'KPI 名詞解釋' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '關閉名詞解釋' }));
    expect(screen.getByRole('radio', { name: label })).toBeChecked();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /繼續目前決策/ }));
    expect(screen.getByRole('radio', { name: label })).toBeChecked();
  });

  it('上一題保留答案，取消改選保留後題，確認改選才清掉後續', async () => {
    const user=userEvent.setup();render(<MarketingDayGame/>);
    await user.click(screen.getByRole('button', {name:'開始上班'}));
    await decide(user,0,2);await decide(user,1,2);await openDecision(user);
    await user.click(screen.getByRole('button',{name:'上一頁'}));
    await user.click(screen.getByRole('button',{name:'上一頁'}));
    const q=marketingDayGame.decisions[0];
    expect(screen.getByRole('radio',{name:q.options[1].label})).toBeChecked();
    await user.click(screen.getByRole('radio',{name:q.options[2].label}));
    await user.click(screen.getByRole('button',{name:'確認選擇'}));
    expect(screen.getByRole('heading',{name:'重新推演後面的決策？'})).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'取消，保留原選擇'}));
    expect(screen.getByRole('radio',{name:q.options[1].label})).toBeChecked();
    await user.click(screen.getByRole('radio',{name:q.options[2].label}));
    await user.click(screen.getByRole('button',{name:'確認選擇'}));
    await user.click(screen.getByRole('button',{name:'確認修改，重新推演'}));
    await user.click(screen.getByRole('button',{name:'下一頁'}));
    await openDecision(user);
    expect(screen.getAllByRole('radio').every(r=>!(r as HTMLInputElement).checked)).toBe(true);
  });

  it('原樣重送上一題後，保留下一題尚未提交的草稿', async () => {
    const user = userEvent.setup();
    render(<MarketingDayGame />);
    await user.click(screen.getByRole('button', { name: '開始上班' }));
    await decide(user, 0, 2);
    await openDecision(user);
    const draft = marketingDayGame.decisions[1].options[2].label;
    await user.click(screen.getByRole('radio', { name: draft }));
    await user.click(screen.getByRole('button', { name: '上一頁' }));
    await user.click(screen.getByRole('button', { name: '確認選擇' }));
    await user.click(screen.getByRole('button', { name: '下一頁' }));
    await user.click(await screen.findByRole('button', { name: /繼續目前決策|與.+對話/ }));
    const continueToChoices = screen.queryByRole('button', { name: '我會怎麼做？' });
    if (continueToChoices) await user.click(continueToChoices);
    expect(screen.getByRole('radio', { name: draft })).toBeChecked();
  });

  it('新載入與直接結果網址不會還原進度，也不能跳題', async () => {
    const user=userEvent.setup();const first=render(<MarketingDayGame/>);
    await user.click(screen.getByRole('button',{name:'開始上班'}));await decide(user,0,2);
    first.unmount();render(<MarketingDayGame/>);
    expect(await screen.findByRole('button',{name:'開始上班'})).toBeInTheDocument();
    act(()=>{window.history.replaceState(null,'','#/quiz/marketing-day/result');window.dispatchEvent(new HashChangeEvent('hashchange'));});
    expect(await screen.findByRole('button',{name:'開始上班'})).toBeInTheDocument();
    expect(screen.queryByLabelText('教學參考分數')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'開始上班'}));
    act(()=>{window.history.replaceState(null,'','#/quiz/marketing-day/play/6');window.dispatchEvent(new HashChangeEvent('hashchange'));});
    expect(window.location.hash).toBe('#/quiz/marketing-day/play/1');
    expect(within(screen.getByRole('banner')).getByText('決策 1 / 6')).toBeInTheDocument();
  });
});
