import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction, MouseEvent } from 'react';
import type { DetectiveSession } from '../types';
import { chapterTwoCase } from '../data/marketing-detective';
import { askDetectiveQuestion, beginDetectiveSession, commitDetectiveRound, currentDetectiveRound, detectiveViewForRound, evaluateDetectiveSession, newDetectiveSession, resolveDetectiveView, setDetectiveChoice } from './detective-engine';
import type { useGameSound } from './use-game-sound';
import type { OfficeControls } from './OfficeScene';
import { musicCredit } from './music-credit';
import { PreviewBoundary } from './PreviewBoundary';
import { PreviewDialog } from './PreviewDialog';
import { Glyph, Portrait } from './GameUi';
import { DetectiveBoard } from './DetectiveBoard';
import { DetectiveResult } from './DetectiveResult';
import './detective.css';

const OfficeScene = lazy(() => import('./OfficeScene'));
type AudioControls = ReturnType<typeof useGameSound>;
type Props = { audio: AudioControls; session: DetectiveSession; onSessionChange: Dispatch<SetStateAction<DetectiveSession>>; view: string; onNavigate: (view: string) => void; onChooseChapters: () => void; onMovingChange: (moving: boolean) => void; onPausedChange: (paused: boolean) => void };
type Panel = 'intro'|'questions'|'board'|'notes'|'glossary'|'settings'|'help'|'result'|'confirm-reset'|null;

export default function DetectiveChapter({audio,session,onSessionChange,view,onNavigate,onChooseChapters,onMovingChange,onPausedChange}:Props) {
  const root=useRef<HTMLDivElement>(null);
  const hud=useRef<HTMLElement>(null);
  const reply=useRef<HTMLQuoteElement>(null);
  const [panel,setPanel]=useState<Panel>(null);
  const [introLine,setIntroLine]=useState(0);
  const [activeTerm,setActiveTerm]=useState<string|null>(null);
  const [utilityReturn,setUtilityReturn]=useState<Panel>(null);
  const introSeen=useRef(new Set<number>());
  const introProgress=useRef<Record<number,number>>({});
  const suppressNextOpenCue=useRef(false);
  const lastRangeCue=useRef(0);
  const rangePointerActive=useRef(false);
  const scene=useRef<OfficeControls>(null);
  const [sceneRun,setSceneRun]=useState(0);
  const currentRound=currentDetectiveRound(session);
  const roundFromView:Record<string,number>={research:0,persona:1,journey:2,ideas:3,blueprint:4};
  const requestedRound=roundFromView[view];
  const round=Math.min(Number.isInteger(requestedRound)?requestedRound:currentRound,Math.max(0,Math.min(currentRound,chapterTwoCase.stages.length-1)));
  const stage=chapterTwoCase.stages[round] ?? chapterTwoCase.stages.at(-1)!;
  const result=useMemo(()=>evaluateDetectiveSession(session),[session]);
  const roundState=session.rounds[round] ?? {askedIds:[],selectedIds:[],submittedIds:null};
  const hasEngaged=Boolean(roundState?.askedIds.length||roundState?.selectedIds.length||roundState?.submittedIds);
  useLayoutEffect(()=>{
    const header=hud.current;if(!header)return;
    const measure=()=>root.current?.style.setProperty('--md-hud-height',`${header.getBoundingClientRect().height}px`);
    measure();
    const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);
    observer?.observe(header);window.addEventListener('resize',measure);
    return()=>{observer?.disconnect();window.removeEventListener('resize',measure);};
  },[]);
  useEffect(()=>{onPausedChange(panel!==null);return()=>onPausedChange(false);},[panel,onPausedChange]);
  useEffect(()=>{const safe=resolveDetectiveView(view,session);if(safe!==view)onNavigate(safe);},[view,session,onNavigate]);
  useEffect(()=>{if(session.completed&&result)setPanel('result');},[session.completed,result]);
  useEffect(()=>{document.title=`行銷人的一天｜${session.completed?'第二章結算':`林老闆 · 第 ${round+1} 輪`}`;},[session.completed,round]);
  useEffect(()=>{
    if(!reply.current)return;
    reply.current.focus({preventScroll:true});
    reply.current.scrollIntoView?.({block:'start',behavior:'auto'});
  },[round,roundState.askedIds.length]);

  function openConversation() {
    if(!suppressNextOpenCue.current&&!session.completed){audio.unlock();audio.play('open');}
    suppressNextOpenCue.current=false;
    if(session.completed){setPanel('result');return;}
    if(!session.started)onSessionChange(previous=>beginDetectiveSession(previous));
    setPanel(roundState.selectedIds.length||roundState.submittedIds?'board':roundState.askedIds.length||introSeen.current.has(round)?'questions':'intro');
    if(!hasEngaged&&!introSeen.current.has(round))setIntroLine(introProgress.current[round]??0);
  }
  function nextIntroLine(){setIntroLine(value=>{const next=Math.min(stage.intro.length-1,value+1);introProgress.current[round]=next;return next;});}
  function previousIntroLine(){setIntroLine(value=>{const next=Math.max(0,value-1);introProgress.current[round]=next;return next;});}
  function replayIntro(){introProgress.current[round]=0;setIntroLine(0);setPanel('intro');}
  function startQuestions() {introProgress.current[round]=stage.intro.length-1;introSeen.current.add(round);setPanel('questions');}
  function ask(questionId:string) {
    onSessionChange(previous=>askDetectiveQuestion(previous,round,questionId));
  }
  function startBoard(){setPanel('board');}
  function close(){audio.unlock();audio.play('close');setPanel(panel==='glossary'||panel==='settings'||panel==='help'?utilityReturn:null);}
  function openUtility(next:'glossary'|'settings'|'help'){if(panel!=='glossary'&&panel!=='settings'&&panel!=='help')setUtilityReturn(panel);setPanel(next);}
  function submitRound(){
    if(session.rounds.slice(round+1).some(item=>item.submittedIds!==null)){setPanel('confirm-reset');return;}
    commitRound();
  }
  function commitRound(){
    onSessionChange(previous=>commitDetectiveRound(previous,round));
    const nextDone=round===chapterTwoCase.stages.length-1;
    setPanel(nextDone?'result':null);
    if(!nextDone)onNavigate(detectiveViewForRound(round+1));
  }
  function toggleChoice(id:string,selected:boolean){onSessionChange(previous=>setDetectiveChoice(previous,round,id,selected));}
  function playUiCue(event:MouseEvent<HTMLDivElement>){
    const target=event.target;if(!(target instanceof Element))return;
    const control=target.closest<HTMLElement>('button,input,select,textarea,summary,a[href]');
    if(!control||control.closest('[aria-disabled="true"]')||('disabled'in control&&Boolean((control as HTMLButtonElement).disabled)))return;
    if(control.closest('[data-world-interact]')||control.textContent?.includes('繼續目前任務'))return;
    if(control.getAttribute('aria-label')==='收合視窗')return;
    if(control instanceof HTMLInputElement&&control.type==='range'){if(Date.now()-lastRangeCue.current>=250){audio.unlock();audio.play('select');lastRangeCue.current=Date.now();}return;}
    if(control instanceof HTMLInputElement){audio.unlock();audio.play('select');return;}
    if(target.closest('label')?.querySelector('input'))return;
    audio.unlock();
    const label=(control.getAttribute('aria-label')||control.textContent||'').trim();
    audio.play(/提交並查看|查看結算|完成提案/.test(label)?'complete':/收合視窗/.test(label)?'close':/上一|返回|移回/.test(label)?'back':/提交|開始|繼續|加入|重新挑戰/.test(label)?'confirm':control.tagName==='SUMMARY'?'open':'click');
  }
  function rangeKey(event:React.KeyboardEvent<HTMLDivElement>){if(event.target instanceof HTMLInputElement&&event.target.type==='range'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)){audio.unlock();audio.play('select');lastRangeCue.current=Date.now();}}
  function rangeChange(event:React.ChangeEvent<HTMLDivElement>){const target=event.target;if(!(target instanceof HTMLInputElement)||target.type!=='range'||rangePointerActive.current)return;if(Date.now()-lastRangeCue.current<250)return;lastRangeCue.current=Date.now();audio.unlock();audio.play('select');}
  function rangePointerDown(event:React.PointerEvent<HTMLDivElement>){if(!(event.target instanceof HTMLInputElement)||event.target.type!=='range')return;rangePointerActive.current=true;audio.unlock();if(Date.now()-lastRangeCue.current>=250){lastRangeCue.current=Date.now();audio.play('select');}}
  function rangePointerUp(){rangePointerActive.current=false;}
  const questionReply=roundState?.askedIds.length?stage.questions.find(q=>q.id===roundState.askedIds.at(-1))?.reply:null;

  return <div ref={root} className="md-game dd-game" onClickCapture={playUiCue} onChangeCapture={rangeChange} onKeyDownCapture={rangeKey} onPointerDownCapture={rangePointerDown} onPointerUpCapture={rangePointerUp} onDropCapture={()=>{audio.unlock();audio.play('select');}}>
    <PreviewBoundary scene onTalk={openConversation}><Suspense fallback={<div className="md-scene-status" role="status">辦公室準備中…</div>}><OfficeScene key={sceneRun} ref={scene} paused={panel!==null} targetName={`${chapterTwoCase.clientName}｜${chapterTwoCase.brand}`} npcId="lead" onInteract={openConversation} onTalk={openConversation} onMovingChange={onMovingChange} onMovementInput={audio.unlock} onKeyboardOpen={()=>{suppressNextOpenCue.current=true;audio.unlock();audio.play('open');}} onArrival={()=>audio.play('arrival')} onWorldClick={valid=>{audio.unlock();audio.play(valid?'click':'error');}}/></Suspense></PreviewBoundary>
    <div className="md-scene-shade" aria-hidden="true"/>
    <header ref={hud} className="md-hud dd-hud"><div className="md-clock"><span className="md-clock-light"/>客戶到訪<span className="md-day-label">{session.completed?'已結案':`第 ${round+1} 輪／5 輪`}</span></div><h1>行銷人的一天</h1><div className="md-tools"><button className="md-tool" aria-label="選擇章節" onClick={onChooseChapters}><Glyph name="chapters"/><span>章節</span></button><button className="md-icon-button" aria-label={audio.muted?'音效：關':'音效：開'} aria-pressed={audio.muted} onClick={()=>{audio.unlock();audio.toggle();}}><Glyph name={audio.muted?'mute':'volume'}/></button><button className="md-tool" onClick={()=>openUtility('glossary')}><Glyph name="book"/><span>名詞</span></button></div></header>
    <main className="md-main dd-main" aria-label="客戶到訪任務">
      <div className="md-next dd-next"><span className="md-next-tag">第 {round+1} 輪</span><p>{session.completed?'提案已交給林老闆。打開結算查看回饋。':stage.task}</p>{round>0&&<button type="button" className="dd-world-secondary" onClick={()=>onNavigate(detectiveViewForRound(round-1))}>回看上一輪</button>}{round<currentRound-1&&<button type="button" className="dd-world-secondary" onClick={()=>onNavigate(detectiveViewForRound(currentRound===chapterTwoCase.stages.length?currentRound-1:currentRound))}>回到目前進度</button>}</div>
      <div className="md-bottom-hud dd-bottom-hud"><div className="md-movement" aria-label="移動角色"><span/><button type="button" aria-label="往上走" onClick={()=>scene.current?.step('up')}>↑</button><span/>{(['left','down','right'] as const).map(direction=><button type="button" key={direction} aria-label={direction==='left'?'往左走':direction==='down'?'往下走':'往右走'} onClick={()=>scene.current?.step(direction)}>{direction==='left'?'←':direction==='down'?'↓':'→'}</button>)}</div><button type="button" className="md-primary md-interact dd-interact" data-world-interact onClick={openConversation}>{session.completed?'查看結算':hasEngaged?'繼續與林老闆對話':'與林老闆對話'} <kbd>E</kbd></button><span className="md-scene-hint">WASD／方向鍵移動 · G 帶路 · E 直接對話 · 點擊地板移動</span></div>
    </main>
    {panel&&<PreviewDialog key={`${panel}-${round}`} titleId={panel==='result'?'dd-result-title':'dd-title'} onClose={close} className="dd-dialog">
      <div className="dd-dialog-tools"><button type="button" className="md-secondary" onClick={()=>openUtility('help')}>操作說明</button><button type="button" className="md-secondary" onClick={()=>openUtility('settings')}>音訊設定</button><button type="button" className="md-secondary" onClick={onChooseChapters}><Glyph name="chapters"/>選擇章節</button><button type="button" className="md-icon-button" aria-label={audio.muted?'音效：關':'音效：開'} aria-pressed={audio.muted} onClick={()=>{audio.unlock();audio.toggle();}}><Glyph name={audio.muted?'mute':'volume'}/></button><button type="button" className="md-icon-button" aria-label="收合視窗" onClick={close}><Glyph name="close"/></button></div>
      {panel==='intro'&&<section className="dd-conversation"><span className="md-section-label">客戶說明 · {introLine+1}／{stage.intro.length}</span><h2 id="dd-title" tabIndex={-1} data-initial-focus>{stage.title}</h2><div className="dd-speaker"><Portrait/><p>{chapterTwoCase.clientName}｜{chapterTwoCase.brand}</p></div><blockquote className="dd-verbatim">{stage.intro[introLine]}</blockquote><div className="dd-dialog-actions">{introLine>0&&<button className="md-secondary" onClick={previousIntroLine}>上一段</button>}<button className="md-primary" onClick={()=>introLine<stage.intro.length-1?nextIntroLine():startQuestions()}>{introLine<stage.intro.length-1?'繼續聽':'開始追問'}</button></div></section>}
      {panel==='questions'&&<section className="dd-conversation"><span className="md-section-label">追問額度 · {roundState.askedIds.length}／{chapterTwoCase.questionLimit}</span><h2 id="dd-title" tabIndex={-1} data-initial-focus>{stage.title}</h2><p className="dd-note">你想先問林老闆什麼？聽完回答後，再整理這一輪的選擇。</p>{questionReply&&<blockquote ref={reply} tabIndex={0} className="dd-reply dd-verbatim">{questionReply}</blockquote>}<ul className="dd-question-list">{stage.questions.map((question,index)=>{const asked=roundState.askedIds.includes(question.id);const disabled=asked||roundState.askedIds.length>=chapterTwoCase.questionLimit;return <li key={question.id}><button type="button" disabled={disabled} aria-pressed={asked} onClick={()=>ask(question.id)}><span>{index+1}</span><span>{question.label}</span><small>{asked?'已問過':disabled?'本輪額度已用完':'詢問'}</small></button></li>;})}</ul><p className="dd-note">已問過的問題可在筆記重讀，不會再次扣除額度或新增線索。</p><div className="dd-dialog-actions"><button className="md-secondary" onClick={replayIntro}>重聽客戶說明</button><button className="md-secondary" onClick={()=>setPanel('notes')}>查看筆記</button><button className="md-primary" onClick={startBoard}>開始整理判斷</button></div></section>}
      {panel==='board'&&<><div className="dd-board-context"><h2 id="dd-title" tabIndex={-1} data-initial-focus>{stage.title}</h2><p>{stage.prompt}</p><p className="dd-note">追問剩餘 {Math.max(0,chapterTwoCase.questionLimit-roundState.askedIds.length)} 次；你可以先回去問客戶，也可先提交判斷。</p></div><DetectiveBoard choices={stage.choices} selectedIds={roundState.selectedIds} onToggle={toggleChoice} onSubmit={submitRound} onAsk={()=>setPanel('notes')} canAsk onBack={()=>setPanel('questions')} round={round} total={chapterTwoCase.stages.length}/></>}
      {panel==='notes'&&<section className="dd-conversation"><span className="md-section-label">林老闆的筆記</span><h2 id="dd-title" tabIndex={-1} data-initial-focus>已確認的客戶線索</h2><ol className="dd-notes">{stage.intro.map((text,index)=><li key={`intro-${index}`}>客戶敘述：{text}</li>)}{roundState.askedIds.map(id=>{const q=stage.questions.find(item=>item.id===id)!;return <li key={id}><b>問：{q.label}</b><p className="dd-verbatim">答：{q.reply}</p></li>;})}</ol>{stage.aiIdeas&&stage.aiIdeas.length>0&&<section className="dd-ai-examples" aria-labelledby="dd-ai-title"><h3 id="dd-ai-title">客戶帶來的三個 AI 草案</h3><p>這些是案例內的合成提案，用來比較取捨；沒有連接即時 AI。</p>{stage.aiIdeas.map(idea=><article key={idea.title}><h4>{idea.title}</h4><p>{idea.text}</p></article>)}</section>}<div className="dd-dialog-actions"><button className="md-secondary" onClick={()=>setPanel('questions')}>回到追問</button><button className="md-primary" onClick={()=>setPanel('board')}>回到判斷</button></div></section>}
      {panel==='glossary'&&<section className="dd-conversation"><span className="md-section-label">隨時可查，不扣追問</span><h2 id="dd-title" tabIndex={-1} data-initial-focus>行銷名詞圖鑑</h2><div className="dd-glossary-list">{chapterTwoCase.glossary.map(term=><button key={term.name} type="button" aria-pressed={activeTerm===term.name} onClick={()=>setActiveTerm(term.name)}>{term.name}</button>)}</div>{activeTerm&&(()=>{const term=chapterTwoCase.glossary.find(item=>item.name===activeTerm)!;return <article className="dd-term-definition"><h3>{term.name}</h3><p>{term.definition}</p><p>{term.example}</p></article>;})()}<div className="dd-dialog-actions"><button className="md-primary" onClick={()=>setPanel(utilityReturn??(hasEngaged?'board':'intro'))}>回到委託</button></div></section>}
      {panel==='settings'&&<section className="dd-conversation"><span className="md-section-label">可隨時調整播放方式</span><h2 id="dd-title" tabIndex={-1} data-initial-focus>音效與音樂設定</h2><button className="md-secondary" aria-pressed={audio.muted} onClick={()=>audio.toggle()}>{audio.muted?'開啟音效':'關閉音效'}</button><label className="md-audio-toggle"><input type="checkbox" checked={audio.musicEnabled} onChange={()=>{audio.unlock();audio.toggleMusic();}}/>播放背景音樂</label><label className="md-audio-volume">音樂音量 <span>{Math.round(audio.musicVolume*100)}%</span><input aria-label="音樂音量" type="range" min="0" max="1" step="0.01" value={audio.musicVolume} onChange={event=>audio.setMusicVolume(Number(event.currentTarget.value))} onPointerDown={audio.unlock}/></label><label className="md-audio-volume">音效音量 <span>{Math.round(audio.effectsVolume*100)}%</span><input aria-label="音效音量" type="range" min="0" max="1" step="0.01" value={audio.effectsVolume} onChange={event=>audio.setEffectsVolume(Number(event.currentTarget.value))} onPointerDown={audio.unlock}/></label><p className="md-audio-credit">背景音樂：{musicCredit.title}，{musicCredit.artist}。<a href={musicCredit.sourceUrl} target="_blank" rel="noreferrer">音樂來源</a> · <a href={musicCredit.licenseUrl} target="_blank" rel="noreferrer">{musicCredit.license}</a></p><p className="md-note">音訊狀態：{audio.status==='locked'?'第一次操作後啟用':audio.status==='ready'?'已就緒':'此瀏覽器無法播放音訊'}</p></section>}
      {panel==='help'&&<section className="dd-conversation"><span className="md-section-label">沒有倒數，照自己的節奏</span><h2 id="dd-title" tabIndex={-1} data-initial-focus>下一步，就在眼前。</h2><p>WASD、方向鍵或點擊地板移動；手機可用畫面左下方向鍵。</p><p><b>G</b>：帶你走到林老闆旁並開啟對話。<b> E</b>：不必走近，直接對話。紅色客戶按鈕也能直接互動。</p><p><b>Esc</b>：收合中央視窗；重新對話會回到這輪進度。每輪最多問五個不同問題，已問問題可在筆記重讀。沒有登入、倒數或存檔。</p><div className="dd-dialog-actions"><button className="md-primary" onClick={()=>setPanel(utilityReturn)}>回到委託</button></div></section>}
      {panel==='confirm-reset'&&<section className="dd-conversation"><span className="md-section-label">修改已提交的前輪判斷</span><h2 id="dd-title" tabIndex={-1} data-initial-focus>重新推演後面的輪次？</h2><p className="dd-large-copy">確認後會清除後續輪次已選與已提交的判斷；各輪已用追問額度會保留。</p><div className="dd-dialog-actions"><button className="md-secondary" onClick={()=>setPanel('board')}>取消，保留原進度</button><button className="md-primary" onClick={commitRound}>確認修改並重算</button></div></section>}
      {panel==='result'&&result&&<DetectiveResult result={result} detectiveCase={chapterTwoCase} onRestart={()=>{onSessionChange(newDetectiveSession());introSeen.current.clear();introProgress.current={};setSceneRun(value=>value+1);setPanel(null);onNavigate('brief');}} onChapters={onChooseChapters}/>}
    </PreviewDialog>}
  </div>;
}
