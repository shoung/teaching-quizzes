import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { chapterThreeCase } from '../data/marketing-coffee';
import MarketingDayGame from './MarketingDayGame';
import ChapterLobby from './ChapterLobby';

vi.mock('./use-game-sound', () => ({ useGameSound: () => ({
  muted:false, musicEnabled:true, musicVolume:.25, effectsVolume:.35, status:'ready',
  toggle:vi.fn(), toggleMusic:vi.fn(), play:vi.fn(), unlock:vi.fn(),
  setMusicVolume:vi.fn(), setEffectsVolume:vi.fn(),
}) }));
vi.mock('./OfficeScene', async () => {
  const { forwardRef, useImperativeHandle } = await import('react');
  return { default: forwardRef(function Scene(props: { onInteract?:()=>void }, ref) {
    useImperativeHandle(ref,()=>({goToTarget:props.onInteract,interact:props.onInteract,stopWalking:()=>{},step:()=>{}}));
    return <div role="img" aria-label="測試用辦公室場景"/>;
  }) };
});
beforeAll(()=>{
  vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
});
beforeEach(()=>{window.history.replaceState(null,'','#/quiz/marketing-day/1');});

function lobbyProps(overrides: Partial<ComponentProps<typeof ChapterLobby>> = {}) {
  return {
    firstStarted: false,
    firstCompleted: false,
    onStartFirst: vi.fn(),
    onStartSecond: vi.fn(),
    onStartThird: vi.fn(),
    onShare: vi.fn(),
    onRestartFirst: vi.fn(),
    ...overrides,
  };
}

describe('第三章入口', () => {
  it('可從章節選擇直接開始咖啡店提案，並顯示預計時間', async () => {
    const user = userEvent.setup();
    const callbacks = lobbyProps();
    render(<ChapterLobby {...callbacks} />);

    await user.click(screen.getByRole('button', { name: /第三章/ }));
    expect(screen.getByRole('heading', { name: /社區咖啡店/ })).toBeInTheDocument();
    expect(screen.getByText(/10–15 分鐘/)).toBeInTheDocument();
    expect(screen.getByText(/不需先完成前兩章/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '開始第三章' }));
    expect(callbacks.onStartThird).toHaveBeenCalledOnce();
    expect(callbacks.onStartFirst).not.toHaveBeenCalled();
    expect(callbacks.onStartSecond).not.toHaveBeenCalled();
  });

  it('章節選擇彈窗文案列出三章，並提供咖啡店直達入口', () => {
    render(<ChapterLobby {...lobbyProps()} />);
    expect(screen.getAllByRole('button', { name: /第三章/ }).length).toBeGreaterThan(0);
  });

  it('第三章可由獨立網址直接開始，不依賴第一章且不寫入瀏覽器儲存', async () => {
    window.history.replaceState(null, '', '#/quiz/marketing-day/chapter-3/brief');
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    render(<MarketingDayGame />);
    expect(await screen.findByRole('button', { name: /與陳店長對話/ })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/quiz/marketing-day/chapter-3/brief');
    expect(storage).not.toHaveBeenCalled();
    storage.mockRestore();
  });

  it('不完整或非法的第三章網址回到當章委託，不被導向第一章', async () => {
    window.history.replaceState(null, '', '#/quiz/marketing-day/chapter-3/not-a-view');
    render(<MarketingDayGame />);
    expect(await screen.findByRole('button', { name: /與陳店長對話/ })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/quiz/marketing-day/chapter-3/brief');
  });

  it('第一章中的章節彈窗也能直接前往第三章', async () => {
    const user = userEvent.setup();
    render(<MarketingDayGame />);
    await user.click(await screen.findByRole('button', { name: '選擇章節' }));
    await user.click(screen.getByRole('button', { name: '前往第三章' }));
    expect(await screen.findByRole('button', { name: /與陳店長對話/ })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/quiz/marketing-day/chapter-3/brief');
  });

  it('可走完咖啡店五輪、在本案結算並只重設第三章', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '#/quiz/marketing-day/chapter-2/brief');
    render(<MarketingDayGame />);
    const secondStage = (await import('../data/marketing-detective')).chapterTwoCase.stages[0];
    await user.click(await screen.findByRole('button', { name: /與林老闆對話/ }));
    for (let line = 1; line < secondStage.intro.length; line++) await user.click(screen.getByRole('button', { name: '繼續聽' }));
    await user.click(screen.getByRole('button', { name: '開始追問' }));
    await user.click(screen.getByRole('button', { name: '開始整理判斷' }));
    const secondChoice = secondStage.choices.find(choice => choice.correct)!;
    const clueOrder = () => within(screen.getByRole('region', { name: '線索池' })).getAllByRole('button').map(button => button.getAttribute('aria-label'));
    await user.click(screen.getByRole('button', { name: `加入判斷：${secondChoice.label}` }));
    const firstOrder = clueOrder();
    await user.click(screen.getByRole('button', { name: '提交本輪，進入下一輪' }));
    await user.click(screen.getByRole('button', { name: '回看上一輪' }));
    await user.click(screen.getByRole('button', { name: /與林老闆對話/ }));
    expect(clueOrder()).toEqual(firstOrder);
    await user.click(screen.getByRole('button', { name: '收合視窗' }));
    await user.click(screen.getByRole('button', { name: '回到目前進度' }));
    expect(window.location.hash).toBe('#/quiz/marketing-day/chapter-2/persona');
    await act(async () => {
      window.history.pushState(null, '', '#/quiz/marketing-day/chapter-3/brief');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    for (const [roundIndex, stage] of chapterThreeCase.stages.entries()) {
      await user.click(await screen.findByRole('button', { name: roundIndex === 0 ? /與陳店長對話/ : /與陳店長對話/ }));
      for (let line = 1; line < stage.intro.length; line++) await user.click(await screen.findByRole('button', { name: '繼續聽' }));
      await user.click(screen.getByRole('button', { name: '開始追問' }));
      await user.click(screen.getByRole('button', { name: '開始整理判斷' }));
      const choices = stage.choices;
      const proposal = choices.find(choice => choice.kind === 'proposal' && choice.correct);
      const support = choices.find(choice => choice.correct && choice.kind !== 'proposal');
      const wrongProposal = choices.find(choice => choice.kind === 'proposal' && !choice.correct);
      const first = wrongProposal ?? support!;
      await user.click(screen.getByRole('button', { name: `加入判斷：${first.label}` }));
      if (proposal && support) await user.click(screen.getByRole('button', { name: `加入判斷：${support.label}` }));
      await user.click(screen.getByRole('button', { name: roundIndex === 4 ? '提交並查看結算' : '提交本輪，進入下一輪' }));
      if (wrongProposal && proposal) {
        await user.click(screen.getByRole('button', { name: /與陳店長對話/ }));
        expect(screen.getByText(/這週.*App|App.*這週/)).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: '回去比較主方案' }));
        expect(screen.getByRole('button', { name: `移回線索池：${wrongProposal.label}` })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: `加入判斷：${proposal.label}` }));
        await user.click(screen.getByRole('button', { name: '提交本輪，進入下一輪' }));
      }
    }
    expect(await screen.findByRole('heading', { name: /這次提案得到/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '陳店長｜日常咖啡' })).toBeInTheDocument();
    expect(screen.queryByText(/林老闆|健身房|教練/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重新挑戰第三章' }));
    expect(screen.getByText('確認後只會重設第三章的本次進度；你可以取消並保留眼前結果。')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '確認重新接案' }));
    expect(window.location.hash).toBe('#/quiz/marketing-day/chapter-3/brief');
    await user.click(await screen.findByRole('button', { name: /與陳店長對話/ }));
    expect(screen.getByRole('heading', { name: chapterThreeCase.stages[0].title })).toBeInTheDocument();
    await act(async () => {
      window.history.pushState(null, '', '#/quiz/marketing-day/chapter-2/research');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    await user.click(await screen.findByRole('button', { name: /與林老闆對話/ }));
    expect(await screen.findByRole('button', { name: `移回線索池：${secondChoice.label}` })).toBeInTheDocument();
  });

  it('切換章節保留兩份互不相干的本次記憶體進度', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '#/quiz/marketing-day/chapter-3/brief');
    render(<MarketingDayGame />);
    await user.click(await screen.findByRole('button', { name: /與陳店長對話/ }));
    const stage = chapterThreeCase.stages[0];
    for (let line = 1; line < stage.intro.length; line++) await user.click(screen.getByRole('button', { name: '繼續聽' }));
    await user.click(screen.getByRole('button', { name: '開始追問' }));
    for (const question of stage.questions.slice(0, chapterThreeCase.questionLimit)) await user.click(screen.getByRole('button', { name: new RegExp(question.label) }));
    expect(screen.getByText('追問額度 · 5／5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(stage.questions[5].label) })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '開始整理判斷' }));
    const choice = stage.choices.find(item => item.correct)!;
    await user.click(screen.getByRole('button', { name: `加入判斷：${choice.label}` }));
    await user.click(screen.getByRole('button', { name: '提交本輪，進入下一輪' }));
    expect(window.location.hash).toBe('#/quiz/marketing-day/chapter-3/persona');
    await act(async () => {
      window.history.pushState(null, '', '#/quiz/marketing-day/chapter-2/brief');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(await screen.findByRole('button', { name: /與林老闆對話/ })).toBeInTheDocument();
    await act(async () => {
      window.history.pushState(null, '', '#/quiz/marketing-day/chapter-3/research');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(await screen.findByText('第 1 輪／5 輪')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/quiz/marketing-day/chapter-3/research');
    await user.click(await screen.findByRole('button', { name: /繼續與陳店長對話/ }));
    await user.click(screen.getByRole('button', { name: '回去追問' }));
    expect(screen.getByText('追問額度 · 5／5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(stage.questions[5].label) })).toBeDisabled();
  });
});
