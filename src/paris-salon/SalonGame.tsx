import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { seasonActions, seasonGame } from '../data/paris-salon-season';
import { getEndingDialogue, getNpcConversation, getOpeningDialogue, metricHelp, seasonScenes } from '../data/paris-salon-rpg';
import { Glyph, Sprite } from '../paris-salon-preview/PreviewPrimitives';
import { GameShare } from './GamePanels';
import { RpgDialogue } from './RpgDialogue';
import { HostingSequence } from './HostingSequence';
import { useSalonAudio } from './use-salon-audio';
import { resolveSeasonRoute, initialSeason, restoreSeason, replaySeason, forecastSeason, startSeason, setSeasonDraft, holdSeason, acknowledgeSeason, heardSeasonNpc, canPlanSeason, completeSeasonEnding } from './season-engine';
import { SEASON_INTRO, SEASON_LENGTH, SEASON_PLAY, SEASON_RESULT, SEASON_ENDING, SEASON_STORAGE_KEY, type SeasonSession } from './season-types';
import type { DialogueLine, HudMetricKey, SalonNpcId } from './rpg-types';
import { SeasonPanels, type SeasonPanelKind } from './SeasonPanels';
import './game.css';
import './season.css';
import './rpg-rounds.css';

// Legacy panels use only this type; the current season uses SeasonPanelKind.
export type SalonPanel = 'dialogue' | 'evidence' | 'decision' | 'feedback' | 'ledger' | 'handbook' | 'share' | 'help' | 'change' | 'restart' | 'interlude' | null;
interface Conversation { kind:'opening'|'npc'|'ending'; lines:DialogueLine[]; npcId?:SalonNpcId; round:number }
function loadSeason() {
  try {
    const raw=localStorage.getItem(SEASON_STORAGE_KEY);
    const restored=raw ? restoreSeason(raw) : null;
    return { session:restored ?? initialSeason(), failed:false, notice:raw&&!restored?'進度無法讀取，已準備新的一季。':'' };
  } catch { return { session:initialSeason(), failed:true, notice:'' }; }
}
export default function SalonGame() {
  const [initial]=useState(loadSeason);
  const [session,setSession]=useState<SeasonSession>(initial.session);
  const [hash,setHash]=useState(window.location.hash||SEASON_INTRO);
  const [panel,setPanel]=useState<SeasonPanelKind>(null);
  const [conversation,setConversation]=useState<Conversation|null>(null);
  const [hosting,setHosting]=useState<number|null>(null);
  const [outcomeDismissed,setOutcomeDismissed]=useState(false);
  const [storageFailed,setStorageFailed]=useState(initial.failed);
  const [reducedMotion,setReducedMotion]=useState(()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [artFailed,setArtFailed]=useState(false);
  const [dismissedMetric,setDismissedMetric]=useState<HudMetricKey|null>(null);
  const layer=useRef<HTMLDivElement>(null);
  const returnFocus=useRef<HTMLElement|null>(null);
  const latest=useRef(session); latest.current=session;
  const inspectTime=useRef(0);
  const sound=useSalonAudio(false);
  const route=resolveSeasonRoute(hash,session);
  const replay=replaySeason(session.plans)!;
  const pending=replay.events.length>session.acknowledged;
  const round=Math.min(SEASON_LENGTH,session.plans.length+(pending?0:1));
  const scene=seasonScenes[Math.max(0,round-1)];
  const forecast=forecastSeason(session);
  const sceneUrl=`${import.meta.env.BASE_URL}images/paris-salon/scenes-v3/${route.kind==='intro'||route.kind==='ending'||route.kind==='result'?'salon':scene.place}.png`;
  const blocked=Boolean(panel||conversation||hosting);
  const heard=session.heard[String(round)]??[];
  function navigate(path:string,replace=false) {
    if(window.location.hash===path)return;
    window.history[replace?'replaceState':'pushState'](null,'',path);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
  useEffect(()=>{
    const sync=()=>{setHash(window.location.hash);setPanel(null);setConversation(null);setHosting(null);};
    window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);
  },[]);
  useEffect(()=>{if(route.canonical!==hash)navigate(route.canonical,true);},[route.canonical,hash]);
  useEffect(()=>{document.title=`${seasonGame.title}｜${route.kind==='intro'?'巴黎 1900':route.kind==='result'?'六場經營報告':route.kind==='ending'?'季末對話':`第 ${round}／6 場`}`;},[route.kind,round]);
  useEffect(()=>{
    const save=()=>{try{localStorage.setItem(SEASON_STORAGE_KEY,JSON.stringify(latest.current));}catch{setStorageFailed(true);}};
    save();window.addEventListener('beforeunload',save);
    return()=>window.removeEventListener('beforeunload',save);
  },[session]);
  useEffect(()=>()=>{try{localStorage.setItem(SEASON_STORAGE_KEY,JSON.stringify(latest.current));}catch{/* Memory-only play. */}},[]);
  useEffect(()=>{const img=new Image();img.onload=()=>setArtFailed(false);img.onerror=()=>setArtFailed(true);img.src=sceneUrl;return()=>{img.onload=null;img.onerror=null;};},[sceneUrl]);
  useEffect(()=>{
    if(route.kind==='ending'&&!conversation) setConversation({kind:'ending',lines:getEndingDialogue(replay),round:6});
  },[route.kind,conversation]);
  useEffect(()=>{
    if(route.kind==='play'&&pending&&!panel&&!hosting&&!conversation&&!outcomeDismissed)setPanel('outcome');
  },[route.kind,pending,panel,hosting,conversation,outcomeDismissed]);
  useEffect(()=>{
    if(!panel)return;
    const current=layer.current;current?.querySelector<HTMLElement>('h2')?.focus({preventScroll:true});
    const keys=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();closePanel();return;}
      if(event.key!=='Tab'||!current)return;
      const nodes=[...current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select,summary,a[href],[tabindex="0"]')].filter(n=>n.getClientRects().length);
      const first=nodes[0],last=nodes.at(-1);
      if(event.shiftKey&&(document.activeElement===first||document.activeElement?.tagName==='H2')){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||document.activeElement?.tagName==='H2')){event.preventDefault();first?.focus();}
    };
    document.addEventListener('keydown',keys);return()=>document.removeEventListener('keydown',keys);
  },[panel]);
  useEffect(()=>{
    if(blocked)return;
    const trigger=returnFocus.current?.isConnected?returnFocus.current:null;
    (trigger??document.getElementById(route.kind==='intro'?'salon-intro-title':'salon-world-title'))?.focus({preventScroll:true});
    returnFocus.current=null;
  },[blocked,route.kind,round]);
  function rememberFocus(){if(document.activeElement instanceof HTMLElement)returnFocus.current=document.activeElement;}
  function open(next:SeasonPanelKind){rememberFocus();if(next==='outcome')setOutcomeDismissed(false);setPanel(next);sound.play('page');}
  function closePanel(){if(panel==='outcome')setOutcomeDismissed(true);setPanel(null);}
  function start(){
    if(session.started){setOutcomeDismissed(false);navigate(SEASON_PLAY);return;}
    rememberFocus();setConversation({kind:'opening',lines:getOpeningDialogue(),round:1});
  }
  function talk(npcId:SalonNpcId){
    if(pending){open('outcome');return;}
    rememberFocus();setConversation({kind:'npc',npcId,round,lines:getNpcConversation(round,npcId,{assets:replay.assets,previous:replay.events.at(-1)}).lines});
  }
  function finishDialogue(){
    const current=conversation;if(!current)return;
    setConversation(null);
    if(current.kind==='opening'){setSession(value=>startSeason(value));navigate(SEASON_PLAY);}
    else if(current.kind==='npc'&&current.round===round&&current.npcId)setSession(value=>heardSeasonNpc(value,current.npcId!));
    else if(current.kind==='ending'){setSession(value=>completeSeasonEnding(value));navigate(SEASON_RESULT);sound.play('success');}
  }
  function hold(){
    const current=latest.current;
    const next=holdSeason(current,current.plans.length+1);
    if(next===current)return;
    latest.current=next;setSession(next);setPanel(null);setHosting(next.plans.length);setOutcomeDismissed(false);sound.play('confirm');
  }
  function acknowledge(){
    const next=acknowledgeSeason(latest.current);if(next===latest.current)return;
    latest.current=next;setSession(next);setPanel(null);setOutcomeDismissed(false);
    if(next.acknowledged===SEASON_LENGTH)navigate(SEASON_ENDING);
  }
  function restart(){const next=initialSeason();latest.current=next;setSession(next);setConversation(null);setPanel(null);setHosting(null);setOutcomeDismissed(false);navigate(SEASON_INTRO);}
  function returnTitle(){setConversation(null);setPanel(null);setHosting(null);navigate(SEASON_INTRO);}
  function inspect(){if(Date.now()-inspectTime.current<180)return;inspectTime.current=Date.now();if(sound.unlocked)sound.play('move');}
  const panels={session,replay,forecast,actions:seasonActions,reducedMotion,muted:sound.muted,volume:sound.volume,musicStatus:sound.musicError||(sound.musicReady?'背景音樂已就緒':sound.unlocked?'背景音樂載入中':'開始遊戲後啟用音訊'),onToggleMute:sound.toggleMute,onVolume:sound.setVolume,onMotion:setReducedMotion,onDraft:(plan:SeasonSession['draft'])=>setSession(value=>setSeasonDraft(value,plan)),onHold:hold,onAcknowledge:acknowledge,onOpen:open,onClose:closePanel,onRestart:restart,onTitle:returnTitle,onInspect:inspect};
  return <div className={`salon-game-theme season-game-theme rpg-game-theme ${reducedMotion?'reduce-motion':''}`} onClickCapture={event=>{
    if((event.target as Element).closest('button,a,input,select,summary,.rpg-dialogue')){if(!sound.unlocked)sound.unlock();else sound.play('click');}
  }} onChangeCapture={event=>{if(event.target instanceof HTMLSelectElement||event.target instanceof HTMLInputElement&&event.target.type==='range'){if(!sound.unlocked)sound.unlock();else sound.play('click');}}}>
    <h1 className="sr-only">沙龍夫人的經營筆記</h1>
    <a className="skip-link" href="#salon-main" onClick={event=>{event.preventDefault();document.getElementById('salon-main')?.focus();}}>跳至遊戲內容</a>
    <main id="salon-main" tabIndex={-1} className="salon-stage" data-game-stage>
      <div className="scene-backdrop" aria-hidden="true" style={{backgroundImage:artFailed?'none':`url("${sceneUrl}")`}}/><div className="scene-vignette" aria-hidden="true"/>
      <div className="sr-only" role="status">{initial.notice}</div>
      {(storageFailed||artFailed)&&<p className="season-visible-notice" role="status">{storageFailed?'目前無法儲存；仍可在這個分頁完成遊戲。':'場景圖片暫時無法顯示。'}</p>}
      {route.kind==='intro'?<section className="intro-overlay season-intro" style={{visibility:conversation?.kind==='opening'?'hidden':undefined}} aria-labelledby="salon-intro-title" inert={blocked}>
        <div className="intro-brand"><img src={`${import.meta.env.BASE_URL}images/paris-salon/logo.png`} alt="沙龍夫人的經營筆記"/><h2 id="salon-intro-title" className="sr-only" tabIndex={-1}>沙龍夫人的經營筆記：巴黎 1900</h2></div>
        <p className="intro-tagline">在巴黎，辦起自己的沙龍。</p><p className="season-intro-summary">聊聊客人想做什麼，安排助手和經費，辦完再看看下場能怎麼改。</p>
        <div className="intro-menu"><button className="button primary" onClick={start}>{session.started?'繼續這一季':'翻開故事'} <Glyph name="arrow"/></button>{session.started&&<button className="button ghost-light" onClick={()=>open('restart')}>重新開始一季</button>}<button className="button ghost-light" onClick={()=>open('settings')}>設定與操作</button></div>
        <div className="season-public-share"><GameShare compact/></div>
      </section>:route.kind==='result'?<section className="season-result-overlay" aria-label="六場經營報告" inert={blocked}><SeasonPanels {...panels} panel="report" onRestart={()=>open('restart')} onTitle={()=>open('title')}/></section>:<>
        <header className="floating-hud rpg-hud" inert={blocked}><div className="hud-story"><span className="hud-kicker">巴黎 1900</span><strong id="salon-world-title" tabIndex={-1}>第 {round}／6 場沙龍</strong></div>
          <div className="rpg-hud-right"><div className="rpg-hud-assets">{(Object.keys(metricHelp) as HudMetricKey[]).map(key=><button className="rpg-metric" key={key} onMouseEnter={()=>setDismissedMetric(null)} onFocus={()=>setDismissedMetric(null)} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();setDismissedMetric(key);}}} aria-label={`${metricHelp[key].label} ${replay.assets[key]}`} aria-describedby={`metric-${key}`} onClick={()=>open('ledger')}><b>{replay.assets[key]}</b><small>{metricHelp[key].label}</small><span className="rpg-metric-tip" style={{display:dismissedMetric===key?'none':undefined}} id={`metric-${key}`} role="tooltip"><strong>{metricHelp[key].label}</strong><span>{metricHelp[key].incoming}</span><span>{metricHelp[key].outgoing}</span></span></button>)}</div>{route.kind==='play'&&<button className="button rpg-ledger-button" onClick={()=>open('ledger')}>經營帳冊</button>}</div>
        </header>
        <div className="rpg-world-actors" inert={blocked} role="group" aria-label="沙龍人物"><div className="rpg-world-actor player" style={{left:'18%',top:'88%','--actor-height':'30vh'} as CSSProperties}><Sprite index={0}/><span className="actor-label">克萊爾夫人</span></div>
          {scene.npcs.map(npc=><button key={npc.id} className={`rpg-world-actor npc-button ${npc.facing==='left'?'faces-left':''}`} style={{left:`${npc.x}%`,top:`${npc.y}%`,'--actor-height':`${npc.size}vh`,zIndex:Math.round(npc.y-70)} as CSSProperties} onClick={()=>talk(npc.id)} onMouseEnter={inspect} onFocus={inspect} aria-label={`與${npc.name}交談`}><span className={`quest-dot ${heard.includes(npc.id)?'is-heard':''}`} aria-hidden="true">{heard.includes(npc.id)?'✓':'…'}</span><Sprite index={npc.id}/><span className="actor-label">{npc.name}</span></button>)}
        </div>
        {route.kind==='play'&&<>
        <nav className="floating-tools" aria-label="遊戲選單" inert={blocked}><button onClick={()=>open('title')} aria-label="返回標題">⌂<span>返回標題</span></button><button onClick={()=>open('settings')} aria-label="設定與操作"><Glyph name="sound"/></button></nav>
        <p className="rpg-round-cue" inert={blocked}>{pending?'本場已落幕':canPlanSeason(session)?'消息已記下，可以安排沙龍了':'先找一位在場朋友聊聊'}</p>
        {pending?<button className="button primary rpg-plan-button" inert={blocked} onClick={()=>open('outcome')}>查看本場回顧</button>:<button className="button primary rpg-plan-button" inert={blocked} disabled={!canPlanSeason(session)} onClick={()=>open('plan')}>沙龍計劃</button>}
        </>}
      </>}
      {conversation&&<div className="rpg-dialogue-layer"><RpgDialogue key={`${conversation.kind}-${conversation.round}-${conversation.npcId??''}`} lines={conversation.lines} reducedMotion={reducedMotion} onComplete={finishDialogue} onClose={conversation.kind==='npc'?()=>setConversation(null):undefined}/></div>}
      {hosting&&<div className="rpg-hosting-layer"><HostingSequence eventNumber={hosting} reducedMotion={reducedMotion} onComplete={()=>{setHosting(null);setPanel('outcome');sound.play('success');}}/></div>}
    </main>
    {panel&&<div className="salon-modal-backdrop season-modal-backdrop"><div className={`paper-panel salon-modal season-modal panel-${panel}`} ref={layer} role="dialog" aria-modal="true" aria-labelledby="salon-panel-title"><button className="close-panel" aria-label="關閉面板" onClick={closePanel}><Glyph name="close"/></button><div className="salon-letter-content"><SeasonPanels {...panels} panel={panel}/></div></div></div>}
  </div>;
}
