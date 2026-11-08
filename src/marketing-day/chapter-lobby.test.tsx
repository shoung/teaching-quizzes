import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import ChapterLobby from './ChapterLobby';

function props(overrides:Partial<ComponentProps<typeof ChapterLobby>>={}) {
  return {
    firstStarted:false,
    firstCompleted:false,
    onStartFirst:vi.fn(),
    onStartSecond:vi.fn(),
    onStartThird:vi.fn(),
    onShare:vi.fn(),
    onRestartFirst:vi.fn(),
    ...overrides,
  };
}

describe('行銷人的一天章節入口',()=>{
  it('第一章未完成時第二章仍可選擇並直接開始',async()=>{
    const user=userEvent.setup();
    const callbacks=props();
    render(<ChapterLobby {...callbacks}/>);
    await user.click(screen.getByRole('button',{name:/第二章/}));
    const startSecond=screen.getByRole('button',{name:'開始第二章'});
    expect(startSecond).toBeEnabled();
    expect(screen.getByText('不需先完成第一章，可直接開始。')).toBeInTheDocument();
    expect(screen.getByText('預計 10–15 分鐘')).toBeInTheDocument();
    await user.click(startSecond);
    expect(callbacks.onStartSecond).toHaveBeenCalledOnce();
    expect(callbacks.onStartFirst).not.toHaveBeenCalled();
  });

  it('第一章入口依進度保留三種既有按鈕名稱並呼叫開始 callback',async()=>{
    const user=userEvent.setup();
    const callbacks=props();
    const {rerender}=render(<ChapterLobby {...callbacks}/>);
    expect(screen.getByRole('button',{name:'開始上班'})).toBeEnabled();
    await user.click(screen.getByRole('button',{name:'開始上班'}));
    expect(callbacks.onStartFirst).toHaveBeenCalledOnce();
    rerender(<ChapterLobby {...props({firstStarted:true})}/>);
    expect(screen.getByRole('button',{name:'繼續今天'})).toBeEnabled();
    rerender(<ChapterLobby {...props({firstStarted:true,firstCompleted:true})}/>);
    expect(screen.getByRole('button',{name:'查看當日回顧'})).toBeEnabled();
  });

  it('分享與第一章重玩按鈕會呼叫對應 callback',async()=>{
    const user=userEvent.setup();
    const callbacks=props({firstStarted:true});
    render(<ChapterLobby {...callbacks}/>);
    await user.click(screen.getByRole('button',{name:'分享與 QR code'}));
    await user.click(screen.getByRole('button',{name:'重新上班'}));
    expect(callbacks.onShare).toHaveBeenCalledOnce();
    expect(callbacks.onRestartFirst).toHaveBeenCalledOnce();
  });
});
