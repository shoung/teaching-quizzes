import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { marketingDayGame } from '../data/marketing-day';
import { chapterTwoCase } from '../data/marketing-detective';
import MarketingDayGame from './MarketingDayGame';

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

describe('行銷遊戲自由選章',()=>{
  it('新玩家可從第二章直接網址進入，不會被第一章進度重導且不寫入儲存',async()=>{
    window.history.replaceState(null,'','#/quiz/marketing-day/chapter-2/brief');
    const storage=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('儲存不可用');});
    render(<MarketingDayGame/>);
    expect(await screen.findByRole('button',{name:/與林老闆對話/})).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.location.hash).toBe('#/quiz/marketing-day/chapter-2/brief');
    expect(storage).not.toHaveBeenCalled();
    storage.mockRestore();
  });

  it('介紹頁未完成第一章，也可開始第二章',async()=>{
    const user=userEvent.setup();render(<MarketingDayGame/>);
    await user.click(await screen.findByRole('button',{name:/第二章/}));
    await user.click(await screen.findByRole('button',{name:'開始第二章'}));
    expect(await screen.findByRole('button',{name:/與林老闆對話/})).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.location.hash).toBe('#/quiz/marketing-day/chapter-2/brief');
  });

  it('不完整的第二章階段網址安全回到第二章委託，不重導第一章',async()=>{
    window.history.replaceState(null,'','#/quiz/marketing-day/chapter-2/unknown-stage');
    render(<MarketingDayGame/>);
    expect(await screen.findByRole('button',{name:/與林老闆對話/})).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.location.hash).toBe('#/quiz/marketing-day/chapter-2/brief');
  });

  it('第二章五問用完後切換章節不退還額度，筆記與已選判斷仍可讀取',async()=>{
    window.history.replaceState(null,'','#/quiz/marketing-day/chapter-2/brief');
    const user=userEvent.setup();render(<MarketingDayGame/>);
    await user.click(await screen.findByRole('button',{name:/與林老闆對話/}));
    for(let line=1;line<chapterTwoCase.stages[0].intro.length;line++)await user.click(screen.getByRole('button',{name:'繼續聽'}));
    await user.click(screen.getByRole('button',{name:'開始追問'}));
    for(const question of chapterTwoCase.stages[0].questions.slice(0,5)) {
      await user.click(screen.getByRole('button',{name:new RegExp(question.label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))}));
    }
    expect(screen.getByText('追問額度 · 5／5')).toBeInTheDocument();
    expect(screen.getByRole('button',{name:new RegExp(chapterTwoCase.stages[0].questions[5].label)})).toBeDisabled();
    await user.click(screen.getByRole('button',{name:'開始整理判斷'}));
    const chosen=chapterTwoCase.stages[0].choices[0];
    await user.click(screen.getByRole('button',{name:`加入判斷：${chosen.label}`}));
    await user.click(screen.getByRole('button',{name:'查看客戶筆記'}));
    expect(screen.getByRole('heading',{name:'已確認的客戶線索'})).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'選擇章節'}));
    await user.click(screen.getByRole('button',{name:/第二章/}));
    await user.click(screen.getByRole('button',{name:'繼續第二章'}));
    await user.click(await screen.findByRole('button',{name:/繼續與林老闆對話/}));
    expect(screen.getByRole('button',{name:`移回線索池：${chosen.label}`})).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'回去追問'}));
    expect(screen.getByText('追問額度 · 5／5')).toBeInTheDocument();
    expect(screen.getByRole('button',{name:new RegExp(chapterTwoCase.stages[0].questions[5].label)})).toBeDisabled();
  });

  it('切換章節再回來，第一章已提交答案仍留在這次頁面記憶體',async()=>{
    const user=userEvent.setup();render(<MarketingDayGame/>);
    await user.click(screen.getByRole('button',{name:'開始上班'}));
    await user.click(await screen.findByRole('button',{name:/與.+對話/}));
    await user.click(screen.getByRole('button',{name:'我會怎麼做？'}));
    const chosen=marketingDayGame.decisions[0].options[1].label;
    await user.click(screen.getByRole('radio',{name:chosen}));
    await user.click(screen.getByRole('button',{name:'確認選擇'}));
    await user.click(screen.getByRole('button',{name:'下一頁'}));
    await user.click(screen.getByRole('button',{name:'選擇章節'}));
    await user.click(screen.getByRole('button',{name:'前往第二章'}));
    expect(await screen.findByRole('button',{name:/與林老闆對話/})).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'選擇章節'}));
    expect(await screen.findByRole('heading',{name:'行銷人的一天',level:2})).toHaveFocus();
    await user.click(await screen.findByRole('button',{name:'繼續今天'}));
    await act(async()=>{
      window.history.pushState(null,'','#/quiz/marketing-day/play/1');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    await user.click(await screen.findByRole('button',{name:/與.+對話/}));
    expect(await screen.findByRole('radio',{name:chosen})).toBeChecked();
  });
});
