import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { chapterTwoCase } from '../data/marketing-detective';
import { beginDetectiveSession, commitDetectiveRound, evaluateDetectiveSession, newDetectiveSession, setDetectiveChoice } from './detective-engine';
import DetectiveChapter from './DetectiveChapter';
import { DetectiveBoard } from './DetectiveBoard';
import { DetectiveResult } from './DetectiveResult';

vi.mock('./OfficeScene', () => ({ default: (props: {onInteract:()=>void}) => <button type="button" onClick={props.onInteract}>mock scene interaction</button> }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open',''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});

const choices=chapterTwoCase.stages[0].choices;

describe('偵探章節互動',()=>{
  it('主方案只能選一張，按鈕與拖放換方案都保留理由；缺主方案或理由不得提交',async()=>{
    const options=[
      {id:'a',label:'主方案 A',kind:'proposal' as const,correct:true,explanation:'',evidenceIds:[]},
      {id:'b',label:'主方案 B',kind:'proposal' as const,correct:false,explanation:'',evidenceIds:[]},
      {id:'r',label:'符合本週人力的理由',correct:true,explanation:'',evidenceIds:[]},
    ];
    function Harness(){const [selected,setSelected]=useState<string[]>([]);return <DetectiveBoard choices={options} selectedIds={selected} onToggle={(id,value)=>setSelected(previous=>value?[...previous.filter(item=>item!==id),id]:previous.filter(item=>item!==id))} onSubmit={()=>{}} onAsk={()=>{}} canAsk round={3} total={5}/>;}
    const user=userEvent.setup();render(<Harness/>);
    const submit=screen.getByRole('button',{name:'提交本輪，進入下一輪'});
    await user.click(screen.getByRole('button',{name:'加入判斷：主方案 A'}));
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole('button',{name:'加入判斷：符合本週人力的理由'}));
    expect(submit).toBeEnabled();
    await user.click(screen.getByRole('button',{name:'加入判斷：主方案 B'}));
    expect(screen.getByRole('button',{name:'加入判斷：主方案 A'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'移回線索池：主方案 B'})).toBeInTheDocument();
    fireEvent.drop(screen.getByRole('region',{name:/我的判斷/}),{dataTransfer:{getData:()=> 'a'}});
    expect(screen.getByRole('button',{name:'加入判斷：主方案 B'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'移回線索池：主方案 A'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'移回線索池：符合本週人力的理由'})).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'移回線索池：主方案 A'}));
    expect(submit).toBeDisabled();
  });
  it('雙池按鈕與拖放都呼叫同一選取操作，空白提交不可用',async()=>{
    const user=userEvent.setup();const onToggle=vi.fn();const onSubmit=vi.fn();
    const {rerender}=render(<DetectiveBoard choices={choices} selectedIds={[]} onToggle={onToggle} onSubmit={onSubmit} onAsk={()=>{}} canAsk onBack={()=>{}} round={0} total={5}/>);
    expect(screen.getByRole('button',{name:'提交本輪，進入下一輪'})).toBeDisabled();
    await user.click(screen.getByRole('button',{name:new RegExp(`加入判斷：${choices[0].label}`)}));
    expect(onToggle).toHaveBeenLastCalledWith(choices[0].id,true);
    rerender(<DetectiveBoard choices={choices} selectedIds={[choices[0].id]} onToggle={onToggle} onSubmit={onSubmit} onAsk={()=>{}} canAsk onBack={()=>{}} round={0} total={5}/>);
    const selectedPool=screen.getByRole('region',{name:/我的判斷/});
    const transferButton=within(selectedPool).getByRole('button',{name:new RegExp(`移回線索池：${choices[0].label}`)});
    await waitFor(()=>expect(transferButton).toHaveFocus());
    await user.click(transferButton);
    expect(onToggle).toHaveBeenLastCalledWith(choices[0].id,false);
    const cluePool=screen.getByRole('region',{name:'線索池'});
    fireEvent.drop(cluePool,{dataTransfer:{getData:()=>choices[0].id}});
    expect(onToggle).toHaveBeenLastCalledWith(choices[0].id,false);
    await user.click(screen.getByRole('button',{name:'提交本輪，進入下一輪'}));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('回看已提交輪次修改前先確認；取消停留在判斷，確認才繼續重算',async()=>{
    const user=userEvent.setup();let starting=beginDetectiveSession(newDetectiveSession());
    for(let index=0;index<2;index++){
      chapterTwoCase.stages[index].choices.filter(choice=>choice.correct).forEach(choice=>{starting=setDetectiveChoice(starting,index,choice.id,true);});
      starting=commitDetectiveRound(starting,index);
    }
    const audio={muted:false,unlock:vi.fn(),play:vi.fn(),toggle:vi.fn()};
    function Harness(){const [session,setSession]=useState(starting);const [view,setView]=useState('research');return <DetectiveChapter audio={audio as never} session={session} onSessionChange={setSession} view={view} onNavigate={setView} onChooseChapters={()=>{}} onMovingChange={()=>{}} onPausedChange={()=>{}}/>;}
    render(<Harness/>);
    await user.click(screen.getByRole('button',{name:'繼續與林老闆對話 E'}));
    const remove=screen.getByRole('button',{name:new RegExp(`移回線索池：${chapterTwoCase.stages[0].choices.find(choice=>choice.correct)!.label}`)});
    await user.click(remove);
    await user.click(screen.getByRole('button',{name:'提交本輪，進入下一輪'}));
    expect(await screen.findByRole('heading',{name:'重新推演後面的輪次？'})).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'取消，保留原進度'}));
    expect(screen.getByRole('heading',{name:chapterTwoCase.stages[0].title})).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'提交本輪，進入下一輪'}));
    await user.click(screen.getByRole('button',{name:'確認修改並重算'}));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('完整真實評量顯示各輪分數表、具體角色講評與證據來源',async()=>{
    let session=beginDetectiveSession(newDetectiveSession());
    chapterTwoCase.stages.forEach((stage,index)=>{
      stage.choices.filter(choice=>choice.correct).forEach(choice=>{session=setDetectiveChoice(session,index,choice.id,true);});
      session=commitDetectiveRound(session,index);
    });
    const result=evaluateDetectiveSession(session)!;
    const user=userEvent.setup();render(<DetectiveResult result={result} detectiveCase={chapterTwoCase} onRestart={()=>{}} onChapters={()=>{}}/>);
    expect(screen.getByRole('heading',{name:/100 分/})).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'逐輪解析'}));
    expect(screen.getByRole('table',{name:'各輪教學分數（每輪 20 分，共 100 分）'})).toBeInTheDocument();
    await user.click(screen.getByText(/第 1 輪解析/));
    expect(screen.getAllByText(/線索來源：/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/needs-q\d/)).not.toBeInTheDocument();
  });

  it('新世界先顯示客戶互動、按鈕開對話並暫停；收合重開回到追問且保留線索',async()=>{
    const user=userEvent.setup();const pause=vi.fn();const audio={muted:false,unlock:vi.fn(),play:vi.fn(),toggle:vi.fn()};
    function Harness(){const [session,setSession]=useState(newDetectiveSession());return <DetectiveChapter audio={audio as never} session={session} onSessionChange={setSession} view="brief" onNavigate={()=>{}} onChooseChapters={()=>{}} onMovingChange={()=>{}} onPausedChange={pause}/>;}
    render(<Harness/>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const worldButton=screen.getByRole('button',{name:'與林老闆對話 E'});
    await user.click(worldButton);
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(audio.play).toHaveBeenLastCalledWith('open');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading',{name:chapterTwoCase.stages[0].title})).toBeInTheDocument();
    expect(pause).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('dialog')).toHaveTextContent(chapterTwoCase.stages[0].intro[0]);
    await user.click(screen.getByRole('button',{name:'收合視窗'}));
    expect(audio.play).toHaveBeenLastCalledWith('close');
    await user.click(screen.getByRole('button',{name:'與林老闆對話 E'}));
    expect(screen.getByRole('dialog')).toHaveTextContent(chapterTwoCase.stages[0].intro[0]);
    await user.click(screen.getByRole('button',{name:'繼續聽'}));
    await user.click(screen.getByRole('button',{name:'收合視窗'}));
    await user.click(screen.getByRole('button',{name:'與林老闆對話 E'}));
    expect(screen.getByRole('dialog')).toHaveTextContent(chapterTwoCase.stages[0].intro[1]);
    for(let line=2;line<chapterTwoCase.stages[0].intro.length;line++)await user.click(screen.getByRole('button',{name:'繼續聽'}));
    await user.click(screen.getByRole('button',{name:'開始追問'}));
    await user.click(screen.getByRole('button',{name:new RegExp(chapterTwoCase.stages[0].questions[0].label)}));
    expect(screen.getByRole('dialog')).toHaveTextContent(chapterTwoCase.stages[0].questions[0].reply.replace(/\s+/g,' '));
    await waitFor(()=>expect(document.querySelector('.dd-reply')).toHaveFocus());
    await user.click(screen.getByRole('button',{name:'重聽客戶說明'}));
    expect(screen.getByRole('dialog')).toHaveTextContent(chapterTwoCase.stages[0].intro[0]);
    for(let line=1;line<chapterTwoCase.stages[0].intro.length;line++)await user.click(screen.getByRole('button',{name:'繼續聽'}));
    await user.click(screen.getByRole('button',{name:'開始追問'}));
    expect(screen.getByText(/追問額度 · 1／5/)).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'收合視窗'}));
    expect(audio.play).toHaveBeenLastCalledWith('close');
    await user.click(screen.getByRole('button',{name:'繼續與林老闆對話 E'}));
    expect(await screen.findByRole('heading',{name:chapterTwoCase.stages[0].title})).toBeInTheDocument();
    expect(screen.getByText(/追問額度 · 1／5/)).toBeInTheDocument();
  });

  it('重玩先顯示中央確認，可取消並保留分數結果',async()=>{
    let session=beginDetectiveSession(newDetectiveSession());
    chapterTwoCase.stages.forEach((stage,index)=>{
      stage.choices.filter(choice=>choice.correct).forEach(choice=>{session=setDetectiveChoice(session,index,choice.id,true);});
      session=commitDetectiveRound(session,index);
    });
    const result=evaluateDetectiveSession(session)!;const onRestart=vi.fn();const user=userEvent.setup();
    render(<DetectiveResult result={result} detectiveCase={chapterTwoCase} onRestart={onRestart} onChapters={()=>{}}/>);
    await user.click(screen.getByRole('button',{name:'重新挑戰第二章'}));
    expect(screen.getByRole('heading',{name:'重新接案？'})).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'保留本次結果'}));
    expect(screen.getByRole('heading',{name:new RegExp(`${result.score} 分`)})).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'重新挑戰第二章'}));
    await user.click(screen.getByRole('button',{name:'確認重新接案'}));
    expect(onRestart).toHaveBeenCalledOnce();
  });

  it('中央設定保留音樂開關與雙音量，range的點擊／變更及鍵盤各只播一次',async()=>{
    const audio={muted:false,unlock:vi.fn(),play:vi.fn(),toggle:vi.fn(),musicEnabled:true,toggleMusic:vi.fn(),musicVolume:.25,setMusicVolume:vi.fn(),effectsVolume:.35,setEffectsVolume:vi.fn(),status:'ready'};
    const user=userEvent.setup();
    function Harness(){const [session,setSession]=useState(newDetectiveSession());return <DetectiveChapter audio={audio as never} session={session} onSessionChange={setSession} view="brief" onNavigate={()=>{}} onChooseChapters={()=>{}} onMovingChange={()=>{}} onPausedChange={()=>{}}/>;}
    render(<Harness/>);
    await user.click(screen.getByRole('button',{name:'與林老闆對話 E'}));
    await user.click(screen.getByRole('button',{name:'音訊設定'}));
    expect(screen.getByRole('checkbox',{name:'播放背景音樂'})).toBeChecked();
    expect(screen.getByRole('slider',{name:'音樂音量'})).toBeInTheDocument();
    expect(screen.getByRole('slider',{name:'音效音量'})).toBeInTheDocument();
    audio.play.mockClear();
    const music=screen.getByRole('slider',{name:'音樂音量'});
    fireEvent.pointerDown(music);fireEvent.click(music);fireEvent.change(music,{target:{value:'0.4'}});
    expect(audio.play.mock.calls.filter(([cue])=>cue==='select')).toHaveLength(1);
    expect(audio.setMusicVolume).toHaveBeenCalledWith(.4);
    fireEvent.pointerUp(music);audio.play.mockClear();
    fireEvent.keyDown(music,{key:'ArrowRight'});fireEvent.change(music,{target:{value:'0.41'}});
    expect(audio.play.mock.calls.filter(([cue])=>cue==='select')).toHaveLength(1);
    await user.click(screen.getByRole('button',{name:'音訊設定'}));
    await user.click(screen.getByRole('button',{name:'操作說明'}));
    await user.keyboard('{Escape}');
    expect(screen.getByRole('heading',{name:chapterTwoCase.stages[0].title})).toBeInTheDocument();
  });

  it('完成結算的原生dialog以實際結算標題關聯',async()=>{
    let session=beginDetectiveSession(newDetectiveSession());
    chapterTwoCase.stages.forEach((stage,index)=>{
      stage.choices.filter(choice=>choice.correct).forEach(choice=>{session=setDetectiveChoice(session,index,choice.id,true);});
      session=commitDetectiveRound(session,index);
    });
    const audio={muted:false,unlock:vi.fn(),play:vi.fn(),toggle:vi.fn()};
    function Harness(){const [current,setCurrent]=useState(session);return <DetectiveChapter audio={audio as never} session={current} onSessionChange={setCurrent} view="review" onNavigate={()=>{}} onChooseChapters={()=>{}} onMovingChange={()=>{}} onPausedChange={()=>{}}/>;}
    render(<Harness/>);
    const dialog=await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby','dd-result-title');
    expect(document.getElementById('dd-result-title')).toHaveTextContent('100 分');
  });
});
