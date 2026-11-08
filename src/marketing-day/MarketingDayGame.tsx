import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react';
import { marketingDayGame } from '../data/marketing-day';
import { completeMarketingDay, getMarketingResult, marketingPlayPath, newMarketingSession, nextMarketingDecision, resolveMarketingRoute, startMarketingDay, submitMarketingDecision } from './game-engine';
import { PreviewBoundary } from './PreviewBoundary';
import { PreviewDialog } from './PreviewDialog';
import { DecisionPanel, DialoguePanel, FeedbackPanel } from './GamePanels';
import { GameGlossary, Glyph } from './GameUi';
import GameResult from './GameResult';
import GameShare from './GameShare';
import ChapterLobby from './ChapterLobby';
import { useGameSound } from './use-game-sound';
import { musicCredit } from './music-credit';
import { chapterTwoCase } from '../data/marketing-detective';
import { chapterThreeCase } from '../data/marketing-coffee';
import { createDetectiveEngine, beginDetectiveSession, newDetectiveSession } from './detective-engine';
import type { OfficeControls } from './OfficeScene';
import type { WalkDirection } from './navigation';
import './marketing-day.css';

const OfficeScene = lazy(() => import('./OfficeScene'));
const DetectiveChapter = lazy(() => import('./DetectiveChapter'));
type Panel = 'dialogue'|'decision'|'feedback'|'result'|'glossary'|'share'|'help'|'change'|'restart'|'chapters'|null;
const introPath = '#/quiz/marketing-day/1';
const chapterTwoPath = '#/quiz/marketing-day/chapter-2/brief';
const chapterThreePath = '#/quiz/marketing-day/chapter-3/brief';
const planningViews = ['brief','research','persona','journey','ideas','blueprint','review'];
const chapterThreeEngine = createDetectiveEngine(chapterThreeCase);

export default function MarketingDayGame() {
  const [session,setSession] = useState(newMarketingSession);
  const [hash,setHash] = useState(window.location.hash);
  const [panel,setPanel] = useState<Panel>(null);
  const [returnPanel,setReturnPanel] = useState<Panel>(null);
  const [resumePanel,setResumePanel] = useState<'dialogue'|'decision'>('dialogue');
  const [drafts,setDrafts] = useState<Record<number,string>>({});
  const [pendingFeedback,setPendingFeedback] = useState<number|null>(null);
  const [activeTerm,setActiveTerm] = useState<string|null>(null);
  const [notice,setNotice] = useState('');
  const [moving,setMoving] = useState(false);
  const [chapterTwoSession,setChapterTwoSession] = useState(newDetectiveSession);
  const [chapterTwoMoving,setChapterTwoMoving] = useState(false);
  const [chapterTwoPaused,setChapterTwoPaused] = useState(false);
  const [chapterThreeSession,setChapterThreeSession] = useState(()=>chapterThreeEngine.newDetectiveSession());
  const [chapterThreeMoving,setChapterThreeMoving] = useState(false);
  const [chapterThreePaused,setChapterThreePaused] = useState(false);
  const [run,setRun] = useState(0);
  const hud = useRef<HTMLElement>(null);
  const scene = useRef<OfficeControls>(null);
  const lastInputCue = useRef<{target:HTMLInputElement}|null>(null);
  const secondChapter = /^#\/quiz\/marketing-day\/chapter-2(?:\/|$)/.test(hash);
  const thirdChapter = /^#\/quiz\/marketing-day\/chapter-3(?:\/|$)/.test(hash);
  const requestedView = hash.split('/')[4] ?? 'brief';
  const planningView = planningViews.includes(requestedView) ? requestedView : 'brief';
  const route = resolveMarketingRoute(secondChapter||thirdChapter?introPath:hash,session);
  const sound = useGameSound({moving:secondChapter?chapterTwoMoving:thirdChapter?chapterThreeMoving:moving,paused:secondChapter?chapterTwoPaused:thirdChapter?chapterThreePaused:(panel!==null||route.kind!=='play')});
  const question = marketingDayGame.decisions[route.index];
  const selected = drafts[route.index] ?? session.answers[route.index];
  const confirmed = question.options.find(o => o.id===session.answers[route.index]);
  const result = getMarketingResult(session);
  const worldVisible = route.kind!=='intro' && panel===null;
  const titleId = 'md-panel-title';

  useEffect(() => {
    const sync = () => {
      setHash(window.location.hash);setPanel(null);setReturnPanel(null);setResumePanel('dialogue');
      setPendingFeedback(null);setActiveTerm(null);setNotice('');setMoving(false);setChapterTwoMoving(false);setChapterThreeMoving(false);
    };
    window.addEventListener('hashchange',sync);
    return () => window.removeEventListener('hashchange',sync);
  }, []);

  useEffect(()=>{setChapterTwoSession(current=>current.caseId===chapterTwoCase.id&&current.caseVersion===chapterTwoCase.version?current:newDetectiveSession());},[chapterTwoCase.id,chapterTwoCase.version]);
  useEffect(()=>{setChapterThreeSession(current=>current.caseId===chapterThreeCase.id&&current.caseVersion===chapterThreeCase.version?current:chapterThreeEngine.newDetectiveSession());},[chapterThreeCase.id,chapterThreeCase.version,chapterThreeEngine]);

  function navigate(path: string, replace=false) {
    if(window.location.hash===path)return;
    window.history[replace?'replaceState':'pushState'](null,'',path);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }

  useEffect(() => {
    if(secondChapter||thirdChapter){
      const chapterPath=thirdChapter?'chapter-3':'chapter-2';
      const canonical=`#/quiz/marketing-day/${chapterPath}/${planningView}`;
      if(hash!==canonical)navigate(canonical,true);
      return;
    }
    if(route.canonical!==hash){navigate(route.canonical,true);if(route.notice)setNotice(route.notice);}
  }, [route.canonical,hash,route.notice,secondChapter,thirdChapter,planningView]);
  useEffect(() => { if(route.kind==='result')setPanel('result'); }, [route.kind]);
  useEffect(() => {
    if(secondChapter||thirdChapter)return;
    document.title=`行銷人的一天｜${route.kind==='intro'?'章節選擇':route.kind==='result'?'當日回顧':`決策 ${route.index+1} / 6`}`;
  }, [route.kind,route.index,secondChapter,thirdChapter]);
  useEffect(() => {
    const header=hud.current;
    if(!header)return;
    const observer=new ResizeObserver(() => header.parentElement?.style.setProperty('--md-hud-height',`${header.offsetHeight}px`));
    observer.observe(header);return () => observer.disconnect();
  }, [secondChapter,thirdChapter]);

  function openInteraction() {
    if(route.kind==='result'){setPanel('result');return;}
    if(route.kind!=='play')return;
    if(pendingFeedback===route.index){setPanel('feedback');return;}
    const hasChoice = drafts[route.index]!==undefined || session.answers[route.index]!==null;
    setPanel(hasChoice||resumePanel==='decision'?'decision':'dialogue');
  }
  function interact() {
    sound.unlock();sound.play('open');
    scene.current?.stopWalking?.();
    openInteraction();
  }
  function openUtility(next: 'help'|'glossary'|'share'|'restart'|'chapters') {setReturnPanel(panel);setPanel(next);setActiveTerm(null);}
  function cancelChange() {
    const answer=session.answers[route.index];
    setDrafts(previous=>{const next={...previous};if(answer)next[route.index]=answer;else delete next[route.index];return next;});
    setPanel('decision');
  }
  function closePanel() {
    if(panel==='change'){cancelChange();return;}
    if(['help','glossary','share','restart','chapters'].includes(panel??'')){setPanel(returnPanel);setReturnPanel(null);return;}
    if(panel==='dialogue'||panel==='decision')setResumePanel(panel);
    setActiveTerm(null);setPanel(null);
  }
  function start() {
    setNotice('');
    if(session.completed){navigate('#/quiz/marketing-day/result');setPanel('result');return;}
    setSession(startMarketingDay(session));navigate(marketingPlayPath(nextMarketingDecision(session)));setPanel(null);
  }
  function startSecond() {
    setChapterTwoSession(current=>beginDetectiveSession(current));
    navigate(chapterTwoSession.completed?'#/quiz/marketing-day/chapter-2/review':chapterTwoPath);
  }
  function startThird() {
    setChapterThreeSession(current=>chapterThreeEngine.beginDetectiveSession(current));
    navigate(chapterThreeSession.completed?'#/quiz/marketing-day/chapter-3/review':chapterThreePath);
  }
  function commit() {
    if(selected===null)return;
    const next=submitMarketingDecision(session,route.index,selected);
    setSession(next);
    setDrafts(previous=>Object.fromEntries(Object.entries(previous).filter(([key])=>Number(key)<route.index)));
    setPendingFeedback(route.index);setActiveTerm(null);setPanel('feedback');
  }
  function submit() {
    if(selected===null)return;
    const earlierChanged=session.answers[route.index]!==null && session.answers[route.index]!==selected;
    if(earlierChanged&&session.answers.slice(route.index+1).some(answer=>answer!==null)){setPanel('change');return;}
    commit();
  }
  function next() {
    setPendingFeedback(null);setActiveTerm(null);
    if(route.index===5){
      const completed=completeMarketingDay(session);setSession(completed);
      if(completed.completed){navigate('#/quiz/marketing-day/result');setPanel('result');}
    }else{navigate(marketingPlayPath(route.index+1));setResumePanel('dialogue');setPanel(null);}
  }
  function previous() {
    if(route.index===0)return;
    navigate(marketingPlayPath(route.index-1));setResumePanel('decision');setPanel('decision');
  }
  function restart() {
    setSession(newMarketingSession());setDrafts({});setPendingFeedback(null);setActiveTerm(null);setReturnPanel(null);
    setRun(value=>value+1);setMoving(false);navigate(introPath);setPanel(null);setNotice('新的一天，從第一個決策開始。');
  }
  const terms = {activeTerm,onTerm:(name:string)=>setActiveTerm(value=>value===name?null:name),closeTerm:()=>{document.querySelector<HTMLButtonElement>('.md-term-button[aria-expanded="true"]')?.focus();setActiveTerm(null);}};
  const interactLabel = route.kind==='result'?'查看當日回顧':pendingFeedback===route.index?'繼續目前回饋'
    :resumePanel==='decision'||drafts[route.index]!==undefined?'繼續目前決策':`與${question.speaker}對話`;

  function playUiCue(event: MouseEvent<HTMLDivElement>) {
    const target=event.target;
    if(!(target instanceof Element))return;
    const control=target.closest<HTMLElement>('button,input,summary,a[href]');
    if(!control||control.closest('[aria-disabled="true"]')||('disabled' in control&&Boolean((control as HTMLButtonElement).disabled)))return;
    // Label activation dispatches a second click on its input; the change event below owns that cue.
    if(control instanceof HTMLInputElement) {
      sound.unlock();sound.play(['checkbox','radio','range'].includes(control.type)?'select':'click');
      const cue={target:control};
      lastInputCue.current=cue;
      window.setTimeout(()=>{if(lastInputCue.current===cue)lastInputCue.current=null;},0);
      return;
    }
    if(control.matches('[data-world-interact]'))return;
    const label=target.closest('label');
    if(label?.querySelector('input'))return;
    sound.unlock();
    const text=(control.getAttribute('aria-label')||control.textContent||'').trim();
    let cue:'click'|'select'|'open'|'close'|'back'|'step'|'arrival'|'confirm'|'complete'|'error'='click';
    if(control.tagName==='SUMMARY')cue=(control.parentElement as HTMLDetailsElement|null)?.open?'close':'open';
    else if(/圖鑑|操作說明|分享與 QR code/.test(text))cue='open';
    else if(/收合|關閉|取消|先保留/.test(text))cue='close';
    else if(/上一頁|回看|返回/.test(text))cue='back';
    else if(/確認修改|確認選擇/.test(text))cue='confirm';
    else if(/查看結果|查看當日回顧/.test(text))cue='complete';
    else if(/帶我去/.test(text))cue='click';
    sound.play(cue);
  }
  function playInputCue(event: FormEvent<HTMLDivElement>) {
    if(!(event.target instanceof HTMLInputElement))return;
    const previous=lastInputCue.current;
    if(previous?.target===event.target){lastInputCue.current=null;return;}
    sound.unlock();sound.play('select');
  }
  function playRangeKeyCue(event: KeyboardEvent<HTMLDivElement>) {
    const target=event.target;
    if(!(target instanceof HTMLInputElement)||target.type!=='range'||!['ArrowLeft','ArrowDown','ArrowRight','ArrowUp'].includes(event.key))return;
    const amount=target.step==='any'?1:Number(target.step||1);
    const direction=event.key==='ArrowLeft'||event.key==='ArrowDown'?-1:1;
    const next=Number(target.value)+amount*direction;
    if(next<Number(target.min||0)||next>Number(target.max||100))return;
    sound.unlock();sound.play('select');
    const cue={target};lastInputCue.current=cue;
    window.setTimeout(()=>{if(lastInputCue.current===cue)lastInputCue.current=null;},0);
  }

  if(secondChapter||thirdChapter){
    const caseId=thirdChapter?chapterThreeCase.id:chapterTwoCase.id;
    const caseVersion=thirdChapter?chapterThreeCase.version:chapterTwoCase.version;
    const activeSession=thirdChapter?chapterThreeSession:chapterTwoSession;
    const setActiveSession=thirdChapter?setChapterThreeSession:setChapterTwoSession;
    return <Suspense fallback={<div className="md-game"><p className="md-scene-status" role="status">提案會議室準備中…</p></div>}><DetectiveChapter key={`${caseId}-v${caseVersion}`} audio={sound} session={activeSession} onSessionChange={setActiveSession} view={planningView} detectiveCase={thirdChapter?chapterThreeCase:chapterTwoCase} chapterLabel={thirdChapter?'第三章':'第二章'} onNavigate={view=>navigate(`#/quiz/marketing-day/${thirdChapter?'chapter-3':'chapter-2'}/${planningViews.includes(view)?view:'brief'}`)} onChooseChapters={()=>navigate(introPath)} onMovingChange={thirdChapter?setChapterThreeMoving:setChapterTwoMoving} onPausedChange={thirdChapter?setChapterThreePaused:setChapterTwoPaused}/></Suspense>;
  }

  return <div className="md-game" onClickCapture={playUiCue} onChangeCapture={playInputCue} onKeyDownCapture={playRangeKeyCue}>
    <a href="#md-main" className="md-skip" onClick={event=>{event.preventDefault();document.getElementById('md-main')?.focus();}}>跳至遊戲操作</a>
    <PreviewBoundary scene onTalk={openInteraction}><Suspense fallback={<div className="md-scene-status" role="status">辦公室準備中</div>}><OfficeScene key={run} ref={scene} npcId={question.npcId} paused={route.kind!=='play'||panel!==null} onInteract={openInteraction} onMovingChange={setMoving} onMovementInput={sound.unlock} onKeyboardOpen={()=>{sound.unlock();sound.play('open');}} onArrival={()=>sound.play('arrival')} onWorldClick={valid=>{sound.unlock();sound.play(valid?'click':'error');}}/></Suspense></PreviewBoundary>
    <div className="md-scene-shade" aria-hidden="true"/>
    <header className="md-hud" ref={hud}>
      <div className="md-clock"><span className="md-clock-light"/>{route.kind==='result'?'18:00':route.kind==='intro'?'09:00':question.time}<span className="md-day-label">{route.kind==='intro'?'自由選章':route.kind==='result'?'已結案':`決策 ${route.index+1} / 6`}</span></div>
      <h1>行銷人的一天</h1><div className="md-tools"><button className="md-tool" aria-label="選擇章節" onClick={()=>openUtility('chapters')}><Glyph name="chapters"/><span>章節</span></button><button className="md-icon-button md-sound" aria-label={sound.muted?'音效：關':'音效：開'} aria-pressed={sound.muted} onClick={()=>{sound.unlock();sound.toggle();}}><Glyph name={sound.muted?'mute':'volume'}/></button><button className="md-tool" aria-label="行銷圖鑑" onClick={()=>openUtility('glossary')}><Glyph name="book"/><span>圖鑑</span></button><button className="md-icon-button" aria-label="操作說明" onClick={()=>openUtility('help')}><Glyph name="help"/></button></div>
    </header>
    <main id="md-main" tabIndex={-1} className="md-main">
      {route.kind==='intro'&&<ChapterLobby firstStarted={session.started} firstCompleted={session.completed} onStartFirst={start} secondStarted={chapterTwoSession.started} secondCompleted={chapterTwoSession.completed} onStartSecond={startSecond} thirdStarted={chapterThreeSession.started} thirdCompleted={chapterThreeSession.completed} onStartThird={startThird} onShare={()=>openUtility('share')} onRestartFirst={()=>openUtility('restart')}/>}
      {worldVisible&&<><div className="md-next"><span className="md-next-tag">{route.kind==='result'?'已完成':'下一步'}</span><p>{route.kind==='result'?'今天辛苦了，看看這一天的選擇。':question.task}</p>{route.kind==='play'&&<button onClick={()=>scene.current?scene.current.goToTarget():openInteraction()} disabled={moving}> {moving?'走過去中':'帶我去'} <kbd>G</kbd></button>}</div>
        <div className="md-bottom-hud">{route.kind==='play'&&<div className="md-movement" aria-label="移動角色"><span/><button aria-label="往上走" onClick={()=>scene.current?.step('up')}>↑</button><span/>{(['left','down','right'] as WalkDirection[]).map(direction=><button key={direction} aria-label={direction==='left'?'往左走':direction==='down'?'往下走':'往右走'} onClick={()=>scene.current?.step(direction)}>{direction==='left'?'←':direction==='down'?'↓':'→'}</button>)}</div>}<button className="md-primary md-interact" data-world-interact onClick={interact}>{interactLabel} <kbd>E</kbd></button><span className="md-scene-hint">{route.kind==='play'?'WASD／方向鍵移動 · G 帶我去 · E 直接對話':'六個決策已完成 · 結果只保留在這次開啟的頁面'}</span></div>
      </>}
    </main>
    <div className={notice?'md-game-notice':'sr-only'} role="status" aria-live="polite">{notice}</div>
    {panel&&<PreviewDialog key={`${panel}-${route.index}`} titleId={titleId} onClose={()=>{sound.unlock();sound.play('close');closePanel();}} className={panel==='result'?'md-result':panel==='decision'?'md-decision':''}>
      <button className="md-icon-button md-close" aria-label="收合視窗" onClick={closePanel}><Glyph name="close"/></button>
      {panel==='dialogue'&&<DialoguePanel question={question} index={route.index} titleId={titleId} onContinue={()=>{setPanel('decision');setResumePanel('decision');setActiveTerm(null);}} {...terms}/>}
      {panel==='decision'&&<DecisionPanel question={question} index={route.index} titleId={titleId} selected={selected} onSelect={id=>setDrafts(value=>({...value,[route.index]:id}))} onConfirm={submit} onPrevious={previous} {...terms}/>}
      {panel==='feedback'&&confirmed&&<FeedbackPanel question={question} option={confirmed} index={route.index} titleId={titleId} onNext={next} onReview={()=>{setPanel('decision');setResumePanel('decision');}}/>}
      {panel==='result'&&result&&<GameResult result={result} titleId={titleId} onRestart={()=>openUtility('restart')} onShare={()=>openUtility('share')}/>}
      {panel==='glossary'&&<GameGlossary titleId={titleId}/>}
      {panel==='share'&&<GameShare titleId={titleId}/>}
      {panel==='chapters'&&<><span className="md-section-label">自由選章 · 不需解鎖</span><h2 id={titleId} tabIndex={-1} data-initial-focus>今天，想從哪裡開始？</h2><p className="md-note">三章都能直接開始。第一章答案保留在本次開啟的頁面，重新整理後會清除。</p><div className="md-panel-actions"><button className="md-secondary" onClick={()=>{closePanel();if(route.kind==='intro')start();}}>回到第一章</button><button className="md-primary" onClick={startSecond}>前往第二章</button><button className="md-primary" onClick={startThird}>前往第三章</button></div><p className="md-note">第一章：新品上線日 · 第二章：客戶來訪日 · 第三章：咖啡店提案日</p></>}
      {panel==='change'&&<><span className="md-section-label">變更已確認的選擇</span><h2 id={titleId} tabIndex={-1} data-initial-focus>重新推演後面的決策？</h2><p className="md-large-copy">修改這一題，會清除後面已做過的選擇與結案。</p><p className="md-note">這一題以前的答案保留；從這裡開始重新走一次，讓回顧與新的取捨一致。</p><div className="md-panel-actions"><button className="md-secondary" onClick={cancelChange}>取消，保留原選擇</button><button className="md-primary" onClick={commit}>確認修改，重新推演</button></div></>}
      {panel==='restart'&&<><span className="md-section-label">開始新的一天</span><h2 id={titleId} tabIndex={-1} data-initial-focus>重新上班？</h2><p className="md-large-copy">本次六個決策與回顧會清空。</p><p className="md-note">不會改動其他測驗的進度。這個遊戲不存檔，無法還原這次結果。</p><div className="md-panel-actions"><button className="md-secondary" onClick={closePanel}>先保留這一天</button><button className="md-primary" onClick={restart}>確認重新開始</button></div></>}
      {panel==='help'&&<><span className="md-section-label">沒有倒數，照自己的節奏</span><h2 id={titleId} tabIndex={-1} data-initial-focus>下一步，就在眼前。</h2><div className="md-help-row"><kbd>G</kbd><p>帶我去<br/><span>自動走到當前同事旁，並打開對話。</span></p></div><div className="md-help-row"><kbd>E</kbd><p>直接互動<br/><span>隨時打開與目前同事的對話，不用先走近。</span></p></div><div className="md-help-row"><kbd>Esc</kbd><p>收合中央視窗<br/><span>草稿保留，再按「繼續目前決策」打開。</span></p></div><p className="md-note">WASD、方向鍵或點地板移動。也可以直接點目前同事的 3D 角色，自動走近後對話。G 會帶路並在抵達後開啟對話；E 或紅色按鈕可直接互動。彈窗開啟時場景暫停。上一頁保留答案；修改較早決策前會先詢問。沒有登入與存檔，重新整理後需重新開始。</p><section className="md-audio-settings" aria-labelledby="md-audio-title"><h3 id="md-audio-title">音效與音樂設定</h3><label className="md-audio-toggle"><input type="checkbox" checked={sound.musicEnabled} onChange={()=>{sound.unlock();sound.toggleMusic();}}/>播放背景音樂</label><label className="md-audio-volume">音樂音量 <span>{Math.round(sound.musicVolume*100)}%</span><input aria-label="音樂音量" type="range" min="0" max="1" step="0.01" value={sound.musicVolume} onChange={event=>sound.setMusicVolume(Number(event.currentTarget.value))} onPointerDown={sound.unlock}/></label><label className="md-audio-volume">音效音量 <span>{Math.round(sound.effectsVolume*100)}%</span><input aria-label="音效音量" type="range" min="0" max="1" step="0.01" value={sound.effectsVolume} onChange={event=>sound.setEffectsVolume(Number(event.currentTarget.value))} onPointerDown={sound.unlock}/></label><p className="md-audio-credit">背景音樂：{musicCredit.title}，{musicCredit.artist}。<a href={musicCredit.sourceUrl} target="_blank" rel="noreferrer">音樂來源</a> · <a href={musicCredit.licenseUrl} target="_blank" rel="noreferrer">{musicCredit.license}</a></p><p className="md-note">音訊狀態：{sound.status==='locked'?'第一次操作後啟用':sound.status==='ready'?'已就緒':'此瀏覽器無法播放音訊'}</p></section></>}
    </PreviewDialog>}
  </div>;
}
