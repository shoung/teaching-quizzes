import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import MarketingDayGame from './MarketingDayGame';

const audio = vi.hoisted(() => ({
  options: vi.fn(), play: vi.fn(), unlock: vi.fn(), toggle: vi.fn(), toggleMusic: vi.fn(),
  setMusicVolume: vi.fn(), setEffectsVolume: vi.fn(),
  goToTarget: vi.fn(), stopWalking: vi.fn(),
}));

vi.mock('./use-game-sound', () => ({
  useGameSound: (options: {moving?:boolean;paused?:boolean}) => {
    audio.options(options);
    return {muted:false,toggle:audio.toggle,play:audio.play,unlock:audio.unlock,musicEnabled:true,toggleMusic:audio.toggleMusic,
      musicVolume:.14,setMusicVolume:audio.setMusicVolume,effectsVolume:.35,setEffectsVolume:audio.setEffectsVolume,status:'ready'};
  },
}));

vi.mock('./OfficeScene', async () => {
  const React = await import('react');
  return { default: React.forwardRef(function Scene(props: {onInteract:()=>void;onMovingChange:(moving:boolean)=>void;onArrival:()=>void;onWorldClick:(valid:boolean)=>void}, ref) {
    React.useImperativeHandle(ref, () => ({goToTarget:audio.goToTarget,interact:props.onInteract,stopWalking:audio.stopWalking,step:()=>{}}));
    return <div role="img" aria-label="測試用辦公室場景"><button aria-label="測試角色移動" onClick={()=>props.onMovingChange(true)}>移動</button><button aria-label="測試角色抵達" onClick={props.onArrival}>抵達</button><span aria-label="可走地板" onPointerUp={()=>props.onWorldClick(true)}/><span aria-label="不可走桌面" onPointerUp={()=>props.onWorldClick(false)}/></div>;
  }) };
});

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
});
beforeEach(() => {
  audio.options.mockClear();audio.play.mockClear();audio.unlock.mockClear();audio.toggle.mockClear();audio.toggleMusic.mockClear();audio.goToTarget.mockClear();audio.stopWalking.mockClear();
  audio.setMusicVolume.mockClear();audio.setEffectsVolume.mockClear();
  window.history.replaceState(null,'','#/quiz/marketing-day/1');
});

describe('行銷遊戲音訊整合',()=>{
  it('首個操作解鎖，單選標籤只播一次，鍵盤操作也有音效，disabled 確認不響',async()=>{
    const user=userEvent.setup();render(<MarketingDayGame/>);
    await user.click(screen.getByRole('button',{name:'開始上班'}));
    expect(audio.unlock).toHaveBeenCalled();
    await user.click(screen.getByRole('button',{name:/與.+對話/}));
    await user.click(screen.getByRole('button',{name:'我會怎麼做？'}));
    const confirm=screen.getByRole('button',{name:'確認選擇'});
    expect(confirm).toBeDisabled();
    audio.play.mockClear();
    await user.click(confirm);
    expect(audio.play).not.toHaveBeenCalled();
    const radio=screen.getAllByRole('radio')[0];
    await user.click(radio.closest('label')!);
    expect(audio.play.mock.calls.filter(([cue])=>cue==='select')).toHaveLength(1);
    audio.play.mockClear();
    await user.click(radio);
    expect(audio.play).toHaveBeenCalledExactlyOnceWith('select');
    audio.play.mockClear();
    await user.keyboard('{ArrowDown}');
    expect(audio.play).toHaveBeenCalledWith('select');
    audio.play.mockClear();
    confirm.focus();await user.keyboard('{Enter}');
    expect(audio.play).toHaveBeenCalledExactlyOnceWith('confirm');
  });

  it('summary、連結與一般按鈕有 cue，Escape 收合也有 close cue',async()=>{
    const user=userEvent.setup();render(<MarketingDayGame/>);
    await user.click(screen.getByRole('button',{name:'分享與 QR code'}));
    audio.play.mockClear();
    await user.click(screen.getByLabelText('本機試玩網址'));
    expect(audio.play).toHaveBeenCalledWith('click');
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button',{name:'操作說明'}));
    audio.play.mockClear();
    await user.click(screen.getByRole('slider',{name:'音樂音量'}));
    expect(audio.play).toHaveBeenCalledWith('select');
    audio.play.mockClear();
    const musicSlider=screen.getByRole('slider',{name:'音樂音量'});
    musicSlider.focus();await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(audio.play.mock.calls.filter(([cue])=>cue==='select')).toHaveLength(2);
    await user.keyboard('{Escape}');
    audio.play.mockClear();
    await user.click(screen.getByRole('button',{name:'操作說明'}));
    expect(audio.play).toHaveBeenCalledWith('open');
    audio.play.mockClear();
    const source=screen.getByRole('link',{name:'音樂來源'});
    await user.click(source);
    expect(audio.play).toHaveBeenCalledWith('click');
    audio.play.mockClear();
    await user.keyboard('{Escape}');
    expect(audio.play).toHaveBeenCalledWith('close');
    await user.click(screen.getByRole('button',{name:'開始上班'}));
    await user.click(screen.getByRole('button',{name:/與.+對話/}));
    await user.click(screen.getByRole('button',{name:'我會怎麼做？'}));
    audio.play.mockClear();
    await user.click(screen.getByText('查看任務資料'));
    expect(audio.play).toHaveBeenCalledWith('open');
    audio.play.mockClear();
    await user.click(screen.getByText('查看任務資料'));
    expect(audio.play).toHaveBeenCalledWith('close');
  });

  it('移動狀態送進 hook，打開中央面板時標記暫停',async()=>{
    const user=userEvent.setup();render(<MarketingDayGame/>);
    await user.click(screen.getByRole('button',{name:'開始上班'}));
    const scene=screen.getByRole('img',{name:'測試用辦公室場景'});
    await user.click(within(scene).getByRole('button',{name:'測試角色移動'}));
    expect(audio.options.mock.calls.at(-1)?.[0]).toMatchObject({moving:true,paused:false});
    await user.click(screen.getByRole('button',{name:/與.+對話/}));
    expect(audio.options.mock.calls.at(-1)?.[0]).toMatchObject({moving:true,paused:true});
  });

  it('場景地板點擊依路徑是否有效播放 click 或 error',async()=>{
    const user=userEvent.setup();render(<MarketingDayGame/>);
    await user.click(screen.getByRole('button',{name:'開始上班'}));
    const scene=screen.getByRole('img',{name:'測試用辦公室場景'});
    audio.play.mockClear();
    await user.pointer({keys:'[MouseLeft]',target:within(scene).getByLabelText('可走地板')});
    expect(audio.play).toHaveBeenCalledExactlyOnceWith('click');
    audio.play.mockClear();
    await user.pointer({keys:'[MouseLeft]',target:within(scene).getByLabelText('不可走桌面')});
    expect(audio.play).toHaveBeenCalledExactlyOnceWith('error');
  });

  it('G 保留自動帶路，紅色主互動按鈕停止行走並直接開對話',async()=>{
    const user=userEvent.setup();render(<MarketingDayGame/>);
    await user.click(screen.getByRole('button',{name:'開始上班'}));
    await user.click(screen.getByRole('button',{name:/帶我去/}));
    expect(audio.goToTarget).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button',{name:/與.+對話/}));
    expect(audio.stopWalking).toHaveBeenCalledOnce();
    expect(audio.goToTarget).toHaveBeenCalledOnce();
    expect(screen.getByRole('button',{name:'我會怎麼做？'})).toBeInTheDocument();
  });
});
