import { useEffect, useRef, useState } from 'react';
import type { SalonStoryBeat } from '../types';
import { seasonActions, seasonGame, seasonMarkets, seasonPrologue } from '../data/paris-salon-season';
import { Glyph, Sprite } from '../paris-salon-preview/PreviewPrimitives';
import { GameShare } from './GamePanels';
import { getMentorAdvice } from './season-mentor';
import { StoryPrologue } from './StoryPrologue';
import { SalonOrnament } from './SalonOrnament';
import { useSalonAudio } from './use-salon-audio';
import { resolveSeasonRoute, initialSeason, restoreSeason, replaySeason, forecastSeason, startSeason, setSeasonDraft, holdSeason, acknowledgeSeason } from './season-engine';
import { SEASON_INTRO, SEASON_LENGTH, SEASON_PLAY, SEASON_RESULT, SEASON_STORAGE_KEY, type SeasonSession } from './season-types';
import { SeasonPanels, type SeasonPanelKind } from './SeasonPanels';
import './game.css';
import './season.css';

// Kept for GamePanels.tsx, which remains as the v2 compatibility surface.
export type SalonPanel = 'dialogue' | 'evidence' | 'decision' | 'feedback' | 'ledger' | 'handbook' | 'share' | 'help' | 'change' | 'restart' | 'interlude' | null;

interface Loaded { session: SeasonSession; failed: boolean; notice: string }
function loadSeason(): Loaded {
  let raw: string | null;
  try { raw = localStorage.getItem(SEASON_STORAGE_KEY); }
  catch { return { session: initialSeason(), failed: true, notice: '無法讀取此裝置的進度；仍可在目前分頁完成遊戲。' }; }
  let restored: SeasonSession | null = null;
  try { restored = raw ? restoreSeason(JSON.parse(raw)) : null; } catch { /* Invalid saved JSON is handled as a recoverable new season. */ }
  return { session: restored ?? initialSeason(), failed: false, notice: raw && !restored ? '這份季節進度已損壞或版本不相容，已重新準備沙龍。' : '' };
}

const NPC_DIALOGUE = [
  { index: 1, name: '艾米爾', role: '沙龍管家', category: 'operations', line: '我先整理桌椅和人手，再按實際回覆安排接待。座位多了不代表來客一定會增加。' },
  { index: 2, name: '茱莉葉', role: '藝文寫作者', category: 'growth', line: '消息能讓更多人看見，但邀請、詢問、預約和到場是不同的步驟。' },
  { index: 3, name: '馬塞爾', role: '印刷店經營者', category: 'growth', line: '印刷用紙有限，先想清楚要向誰說什麼，也別把回函當成整座巴黎的答案。' },
  { index: 4, name: '安東', role: '新銳畫家', category: 'experience', line: '我可以帶作品來交流；只要事先講清楚時間、內容和彼此期待。' },
  { index: 6, name: '維克多', role: '潛在支持者', category: 'growth', line: '若談支持，得先把彼此的條件和來客承諾說清楚。贊助不是保證收入。' },
] as const;

export default function SalonGame() {
  const [initial] = useState(loadSeason);
  const [session, setSession] = useState<SeasonSession>(initial.session);
  const [hash, setHash] = useState(window.location.hash || SEASON_INTRO);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [panel, setPanel] = useState<SeasonPanelKind>(null);
  const [outcomeDismissed, setOutcomeDismissed] = useState(false);
  const [storageFailed, setStorageFailed] = useState(initial.failed);
  const [notice, setNotice] = useState(initial.notice);
  const [reducedMotion, setReducedMotion] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [artFailed, setArtFailed] = useState(false);
  const [npc, setNpc] = useState<{ index: number; name: string; role: string; dialogue: string }>( { index: 5, name: '路易斯', role: '沙龍經營導師', dialogue: getMentorAdvice(session, replaySeason(session.plans)!) } );
  const returnFocus = useRef<HTMLElement | null>(null);
  const layer = useRef<HTMLDivElement>(null);
  const latest = useRef(session);
  latest.current = session;
  const route = resolveSeasonRoute(hash, session);
  const replay = replaySeason(session.plans)!;
  const pendingOutcome = replay.events.length > session.acknowledged;
  const eventIndex = Math.min(Math.max(0, session.plans.length - (pendingOutcome ? 1 : 0)), SEASON_LENGTH - 1);
  const market = seasonMarkets[eventIndex];
  const forecast = forecastSeason(session);
  const storyBeat = route.kind === 'intro' && storyIndex !== null ? seasonPrologue[storyIndex] as SalonStoryBeat : null;
  const scenePlace = storyBeat?.place ?? (pendingOutcome ? 'salon' : ['salon', 'study', 'print', 'cafe', 'study', 'cafe'][eventIndex]);
  const sceneUrl = `${import.meta.env.BASE_URL}images/paris-salon/scenes-v3/${scenePlace}.png`;
  const sound = useSalonAudio(false);

  function navigate(path: string, replace = false) {
    if (window.location.hash === path) return;
    window.history[replace ? 'replaceState' : 'pushState'](null, '', path);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
  useEffect(() => {
    const sync = () => { setHash(window.location.hash); setPanel(null); };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    if (route.canonical !== hash) navigate(route.canonical, true);
  }, [route.canonical, hash]);
  useEffect(() => {
    const chapter = route.kind === 'intro' ? '巴黎 1900' : route.kind === 'result' ? '六場經營報告' : `第 ${eventIndex + 1}／${SEASON_LENGTH} 場`;
    document.title = `${seasonGame.title}｜${chapter}`;
  }, [route.kind, eventIndex]);
  useEffect(() => {
    const save = () => {
      try { localStorage.setItem(SEASON_STORAGE_KEY, JSON.stringify(latest.current)); }
      catch { setStorageFailed(true); }
    };
    const timer = window.setTimeout(save, 180);
    window.addEventListener('beforeunload', save);
    return () => { clearTimeout(timer); window.removeEventListener('beforeunload', save); };
  }, [session]);
  useEffect(() => () => {
    try { localStorage.setItem(SEASON_STORAGE_KEY, JSON.stringify(latest.current)); } catch { /* In-memory play remains available. */ }
  }, []);
  useEffect(() => {
    const img = new Image(); img.onload = () => setArtFailed(false); img.onerror = () => setArtFailed(true); img.src = sceneUrl;
    return () => { img.onload = null; img.onerror = null; };
  }, [sceneUrl]);
  useEffect(() => {
    if (!panel) return;
    const current = layer.current;
    const heading = current?.querySelector<HTMLElement>('h2');
    heading?.focus({ preventScroll: true });
    const keys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closePanel(); return; }
      if (event.key !== 'Tab' || !current) return;
      const nodes = [...current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select,summary,a[href],[tabindex="0"]')].filter(node => node.getClientRects().length);
      const first = nodes[0], last = nodes.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement?.tagName === 'H2')) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keys);
    return () => document.removeEventListener('keydown', keys);
  }, [panel]);
  useEffect(() => {
    if (panel) return;
    const restoredTrigger = returnFocus.current?.isConnected ? returnFocus.current : null;
    const target = restoredTrigger ?? (storyBeat ? document.getElementById('salon-story-title') : route.kind === 'result' ? document.getElementById('salon-panel-title') : route.kind === 'intro' ? document.getElementById('salon-intro-title') : document.getElementById('salon-world-title'));
    target?.focus({ preventScroll: true });
    if (restoredTrigger) returnFocus.current = null;
  }, [panel, route.kind, route.canonical, storyIndex]);
  useEffect(() => {
    if (route.kind === 'play' && pendingOutcome && !panel && !outcomeDismissed) setPanel('outcome');
  }, [route.kind, pendingOutcome, session.plans.length, panel, outcomeDismissed]);
  useEffect(() => {
    if (panel) sound.play('page');
  }, [panel]);
  useEffect(() => { if (!panel) sound.play('page'); }, [hash]);
  useEffect(() => { if (route.kind === 'result') sound.play('success'); }, [route.kind]);

  function open(next: SeasonPanelKind) {
    const active = document.activeElement;
    if (!panel && active instanceof HTMLElement && active.matches('button,a,input,select')) returnFocus.current = active;
    if (next === 'outcome') setOutcomeDismissed(false);
    setPanel(next);
  }
  function closePanel() {
    if (panel === 'outcome') setOutcomeDismissed(true);
    setPanel(null);
  }
  function start() {
    if (route.kind === 'result') return;
    if (session.started) { navigate(SEASON_PLAY); setStoryIndex(null); return; }
    setStoryIndex(0);
  }
  function beginSeason() {
    setSession(value => startSeason(value));
    setStoryIndex(null);
    navigate(SEASON_PLAY);
    if (session.plans.length < 2) {
      setNpc({ index: 5, name: '路易斯', role: '沙龍經營導師', dialogue: getMentorAdvice(session, replay) });
      setPanel('dialogue');
    }
  }
  function talkToMentor() {
    if (pendingOutcome) { open('outcome'); return; }
    setNpc({ index: 5, name: '路易斯', role: '沙龍經營導師', dialogue: getMentorAdvice(session, replay) });
    open('dialogue');
  }
  function talkToNpc(person: typeof NPC_DIALOGUE[number]) {
    if (pendingOutcome) { open('outcome'); return; }
    setNpc({ index: person.index, name: person.name, role: person.role, dialogue: person.line });
    open('dialogue');
  }
  function hold() {
    if (pendingOutcome || session.plans.length >= SEASON_LENGTH) return;
    sound.play('confirm');
    const next = holdSeason(session, session.plans.length + 1);
    if (next === session) return;
    setSession(next);
    setPanel('outcome');
  }
  function acknowledge() {
    const lastEvent = replay.events.at(-1);
    if (!lastEvent || lastEvent.number !== session.acknowledged + 1) return;
    const next = acknowledgeSeason(session);
    setSession(next);
    setPanel(null);
    if (next.acknowledged >= SEASON_LENGTH) navigate(SEASON_RESULT);
    else {
      navigate(SEASON_PLAY);
      if (next.acknowledged === 1) {
        setNpc({ index: 5, name: '路易斯', role: '沙龍經營導師', dialogue: getMentorAdvice(next, replaySeason(next.plans)!) });
        setPanel('dialogue');
      }
    }
  }
  function restart() {
    setSession(initialSeason()); setStoryIndex(null); setPanel(null); setStorageFailed(false); setNotice('');
    try { localStorage.removeItem(SEASON_STORAGE_KEY); } catch { setStorageFailed(true); }
    navigate(SEASON_INTRO);
  }

  return <div className={`salon-game-theme season-game-theme ${reducedMotion ? 'reduce-motion' : ''}`} onClickCapture={event => {
    const target = event.target instanceof Element ? event.target : null;
    const control = target?.closest<HTMLElement>('button,a,input,select,summary');
    if (control) { if (!sound.unlocked) sound.unlock(); else sound.play('click'); }
  }} onChangeCapture={event => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement) && !(target instanceof HTMLInputElement && target.type === 'range')) return;
    if (!sound.unlocked) sound.unlock(); else sound.play('click');
  }}>
    <h1 className="sr-only">沙龍夫人的經營筆記</h1>
    <a className="skip-link" href="#salon-main" onClick={event => { event.preventDefault(); document.getElementById('salon-main')?.focus(); }}>跳至遊戲內容</a>
    <main id="salon-main" tabIndex={-1} className="salon-stage" data-game-stage>
      <div className="scene-backdrop" aria-hidden="true" style={{ backgroundImage: artFailed ? 'none' : `url("${sceneUrl}")` }} />
      <div className="scene-vignette" aria-hidden="true" />
      <div className="salon-notice sr-only" role="status" aria-live="polite">{storageFailed ? '目前無法儲存；仍可在這個分頁完成遊戲，重新整理會失去進度。' : notice}{artFailed && '場景圖片暫時無法顯示。'}</div>{(storageFailed || artFailed) && <p className="season-visible-notice" role="status">{storageFailed ? '目前無法儲存；仍可在這個分頁完成遊戲。' : '場景圖片暫時無法顯示。'}</p>}
      {route.kind === 'intro' ? <div inert={Boolean(panel)}>
        {storyBeat ? <StoryPrologue beat={storyBeat} index={storyIndex!} total={seasonPrologue.length} onPrevious={() => setStoryIndex(value => Math.max(0, (value ?? 0) - 1))} onNext={() => setStoryIndex(value => Math.min(seasonPrologue.length - 1, (value ?? 0) + 1))} onBegin={beginSeason} /> : <section className="intro-overlay season-intro" aria-labelledby="salon-intro-title"><div className="intro-brand"><img src={`${import.meta.env.BASE_URL}images/paris-salon/logo.png`} alt="沙龍夫人的經營筆記" /><h2 id="salon-intro-title" className="sr-only" tabIndex={-1}>沙龍夫人的經營筆記：巴黎 1900</h2></div><p className="intro-tagline">六場沙龍，一季巴黎故事。</p><p className="season-intro-summary">陪克萊爾夫人籌辦六場沙龍，練習理解來客、安排資源，並從實際回饋中調整。</p><div className="intro-menu"><button className="button primary" onClick={start}>{session.started ? '繼續這一季' : '翻開故事'} <Glyph name="arrow" /></button>{session.started && <button className="button ghost-light" onClick={() => open('restart')}>重新開始一季</button>}<button className="button ghost-light" onClick={() => open('settings')}>設定與操作</button></div><div className="season-public-share"><GameShare compact /></div></section>}
      </div> : route.kind === 'result' ? <section className="season-result-overlay" aria-label="六場經營報告" inert={Boolean(panel)}><SeasonPanels panel="report" session={session} replay={replay} forecast={forecast} market={market} actions={seasonActions} npc={npc} reducedMotion={reducedMotion} muted={sound.muted} volume={sound.volume} musicStatus={sound.musicError || (sound.musicReady ? '背景音樂已就緒' : sound.unlocked ? '背景音樂載入中' : '開始遊戲後啟用音訊')} onToggleMute={sound.toggleMute} onVolume={sound.setVolume} onMotion={setReducedMotion} onDraft={plan => setSession(value => setSeasonDraft(value, plan))} onPlan={() => open('plan')} onHold={hold} onAcknowledge={acknowledge} onOpen={open} onClose={closePanel} onRestart={() => open('restart')} onShare={() => open('share')} storageFailed={storageFailed} /></section> : <>
        <header className="floating-hud" inert={Boolean(panel)}><div className="hud-story"><span className="hud-kicker">巴黎 1900 · 第 {Math.min(session.plans.length + (pendingOutcome ? 0 : 1), SEASON_LENGTH)}／{SEASON_LENGTH} 場</span><strong id="salon-world-title" tabIndex={-1}>{market.title}</strong></div><div className="hud-season-assets"><span><b>{replay.assets.cash}</b><small>現金</small></span><span><b>{replay.assets.regulars}</b><small>熟客</small></span><span><b>{replay.assets.reputation}</b><small>口碑</small></span><span><b>{replay.assets.awareness}</b><small>知名度</small></span><span><b>{replay.assets.seats}</b><small>座位</small></span><span><b>{replay.assets.training}</b><small>培訓</small></span><span><b>{replay.assets.ambience}</b><small>環境</small></span></div></header>
        <div className="scene-actors" inert={Boolean(panel)} role="group" aria-label="沙龍人物"><div className="scene-actor player" data-player><Sprite index={0} /><span className="actor-label">克萊爾夫人</span></div><button className="scene-actor npc npc-button" onClick={talkToMentor} aria-label="與路易斯交談"><span className="quest-dot" aria-hidden="true">❧</span><Sprite index={5} /><span className="actor-label">路易斯</span></button>{artFailed && <p className="scene-fallback">場景圖片暫時無法顯示。</p>}</div>
        {pendingOutcome ? <div className="season-pending-prompt" inert={Boolean(panel)}><p>第 {replay.events.at(-1)?.number} 場的回顧已準備好，看看結果後再安排下一場。</p><button className="button primary" onClick={() => open('outcome')}>查看本場回顧 <Glyph name="arrow" /></button></div> : <p className="character-invitation" inert={Boolean(panel)}>點選人物交談，或打開經營工具</p>}
        {!pendingOutcome && <div className="season-department-npcs" inert={Boolean(panel)} aria-label="沙龍協力者">{NPC_DIALOGUE.map(person => <button key={person.index} onClick={() => talkToNpc(person)} aria-label={`與${person.name}交談`}><Sprite index={person.index} /><span>{person.name}</span></button>)}</div>}
        <nav className="floating-tools" aria-label="經營工具" inert={Boolean(panel)}><button aria-label="經營帳冊" onClick={() => open('ledger')}><Glyph name="coin" /></button><button aria-label="分享沙龍" onClick={() => open('share')}><Glyph name="mail" /></button><button aria-label="設定與操作" onClick={() => open('settings')}><Glyph name="sound" /></button></nav>
      </>}
    </main>
    {panel && <div className="salon-modal-backdrop season-modal-backdrop"><div className={`paper-panel salon-modal season-modal panel-${panel}`} ref={layer} role="dialog" aria-modal="true" aria-labelledby="salon-panel-title"><SalonOrnament className="salon-modal-ornament" /><button className="close-panel" aria-label="關閉面板" onClick={closePanel}><Glyph name="close" /></button><div className="salon-letter-content"><SeasonPanels panel={panel} session={session} replay={replay} forecast={forecast} market={market} actions={seasonActions} npc={npc} reducedMotion={reducedMotion} muted={sound.muted} volume={sound.volume} musicStatus={sound.musicError || (sound.musicReady ? '背景音樂已就緒' : sound.unlocked ? '背景音樂載入中' : '開始遊戲後啟用音訊')} onToggleMute={sound.toggleMute} onVolume={sound.setVolume} onMotion={setReducedMotion} onDraft={plan => setSession(value => setSeasonDraft(value, plan))} onPlan={() => open('plan')} onHold={hold} onAcknowledge={acknowledge} onOpen={open} onClose={closePanel} onRestart={restart} onShare={() => open('share')} storageFailed={storageFailed} /></div></div></div>}
  </div>;
}
