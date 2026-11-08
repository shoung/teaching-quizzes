import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { artUrl, endings, places, views } from './preview-data';
import type { Place, View } from './preview-data';
import { PreviewPanels } from './PreviewPanels';
import { Glyph, Sprite } from './PreviewPrimitives';

function StageArt({ place, showCharacters = true }: { place: Place; showCharacters?: boolean }) {
  return <div className="scene-art" style={{ '--scene-position': place.position, backgroundImage: `url("${artUrl}")` } as CSSProperties} role="img" aria-label={`${place.name}，手繪動畫風格的巴黎室內場景`}>
    {showCharacters && <><div className="scene-actor player"><Sprite /><span className="actor-label">克萊兒夫人 <b>你</b></span></div><div className="scene-actor npc"><span className="quest-dot">!</span><Sprite index={place.id === 'print' ? 3 : place.id === 'cafe' ? 2 : place.id === 'study' ? 5 : 1} /><span className="actor-label">{place.person}</span></div></>}
  </div>;
}

export function PreviewApp() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('screen');
  const [view, setView] = useState<View>(views.some(([id]) => id === requested) ? requested as View : 'scene');
  const [placeIndex, setPlaceIndex] = useState(0);
  const [device, setDevice] = useState(params.get('device') === 'mobile' ? 'mobile' : 'desktop');
  const [selected, setSelected] = useState<number | null>(null);
  const [cardState, setCardState] = useState('normal');
  const [ending, setEnding] = useState(0);
  const [errorIndex, setErrorIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const previousView = useRef(view);
  const returnFocus = useRef<HTMLElement | null>(null);
  const shouldRestoreFocus = useRef(false);
  const place = places[placeIndex];
  const overlay = !['scene', 'intro', 'characters', 'result', 'interlude'].includes(view);
  const fullPage = ['intro', 'characters', 'result', 'interlude'].includes(view);
  const hud = view === 'intro'
    ? { act: '序章', number: 'I', title: '一封來自未來的信', budget: 100, awareness: 10, progress: '00' }
    : view === 'result'
      ? { act: '終幕', number: 'IV', title: '藝術之夜落幕', budget: 20, awareness: endings[ending].awareness, progress: '12' }
      : view === 'interlude'
        ? { act: '第三幕', number: 'III', title: '名聲背後的工作', budget: 65, awareness: 38, progress: '07' }
        : { act: '第二幕', number: 'II', title: '讓巴黎開始談論你', budget: view === 'decision' && cardState === 'low' ? 12 : 65, awareness: 38, progress: '04' };

  function show(next: View) {
    const active = document.activeElement;
    if (!overlay && active instanceof HTMLElement && active.matches('button, select, a, input')) returnFocus.current = active;
    setView(next);
  }

  function closePanel() {
    shouldRestoreFocus.current = true;
    setView('scene');
  }

  useEffect(() => {
    if (previousView.current !== view) {
      const original = returnFocus.current;
      const restore = shouldRestoreFocus.current && view === 'scene';
      const target = restore && original?.isConnected && !original.closest('[inert]')
        ? original : panelRef.current?.querySelector<HTMLElement>('h2') ?? document.getElementById('scene-title');
      target?.focus({ preventScroll: true });
      shouldRestoreFocus.current = false;
      previousView.current = view;
    }
  }, [view]);

  useEffect(() => {
    if (!overlay) return;
    const layer = panelRef.current;
    function keys(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        shouldRestoreFocus.current = true;
        setView('scene');
      }
      if (event.key !== 'Tab' || !layer?.contains(document.activeElement)) return;
      const buttons = [...layer.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select, summary, [tabindex="0"]')].filter(el => el.getClientRects().length);
      const first = buttons[0], last = buttons.at(-1);
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || document.activeElement?.tagName === 'H2')) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', keys);
    return () => document.removeEventListener('keydown', keys);
  }, [overlay]);

  return <div className="salon-preview-root" onClickCapture={event => {
    if (!(event.target instanceof Element)) return;
    const trigger = event.target.closest<HTMLElement>('button');
    if (trigger && !trigger.closest('.paper-panel')) returnFocus.current = trigger;
  }}>
    <a href="#salon-content" className="skip-link">跳至展示內容</a>
    <div className="review-toolbar" aria-label="介面審核工具">
      <div className="review-caption"><span className="review-dot" />介面展示 <span className="review-version">版本 02・固定資料</span></div>
      <label className="screen-select">畫面<select value={view} onChange={e => show(e.target.value as View)}>{views.map(([id, title]) => <option value={id} key={id}>{title}</option>)}</select></label>
      <div className="device-switch" aria-label="預覽尺寸"><button aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}>桌面</button><button aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')}>手機</button></div>
      {view === 'decision' && <label className="state-select">狀態<select value={cardState} onChange={e => { setCardState(e.target.value); setSelected(null); }}><option value="normal">可選方案</option><option value="low">經費不足</option></select></label>}
      {view === 'result' && <label className="state-select">結局<select value={ending} onChange={e => setEnding(Number(e.target.value))}>{['人潮與名聲兼得', '熱鬧之後的考驗', '值得再來的小沙龍', '下一場的起點'].map((s, i) => <option key={s} value={i}>{s}</option>)}</select></label>}
      {view === 'exceptions' && <label className="state-select">狀態<select value={errorIndex} onChange={e => setErrorIndex(Number(e.target.value))}>{['可續玩', '儲存失敗', '損壞／過期', '無效網址', '圖片失敗', '複製失敗'].map((s, i) => <option key={s} value={i}>{s}</option>)}</select></label>}
    </div>
    <div className={`device-wrap ${device === 'mobile' ? 'is-mobile' : ''}`}>
      <div className="game-shell">
        <header className="salon-masthead" inert={overlay}>
          <div className="salon-wordmark"><span className="monogram" aria-hidden="true">C</span><div><span className="brand-overline" lang="fr">LE SALON DE CLAIRE</span><h1>沙龍夫人的經營筆記</h1></div></div>
          <div className="masthead-meta"><span lang="fr">Paris, 1900</span><span className="thin-rule" /><button className="icon-button" onClick={() => show('handbook')} aria-label="開啟操作與手帳"><Glyph name="book" /></button><button className="icon-button" onClick={() => show('share')} aria-label="查看分享樣稿"><Glyph name="mail" /></button></div>
        </header>
        <div className="game-hud" inert={overlay}><div className="chapter"><span className="chapter-num">{hud.number}</span><div><span>{hud.act}</span><strong>{hud.title}</strong></div></div><div className="hud-metrics"><span><Glyph name="coin" /><b>{hud.budget}</b><small>經費</small></span><span><Glyph name="star" /><b>{hud.awareness}</b><small>知名度</small></span><span className="hud-progress"><b>{hud.progress}</b><small>／12 決策</small></span></div></div>
        <main id="salon-content" className={`game-content ${fullPage ? 'full-page-content' : ''}`}>
          {fullPage ? <div ref={panelRef} className="standalone-panel"><PreviewPanels view={view} show={show} place={place} selected={selected} setSelected={setSelected} cardState={cardState} ending={ending} errorIndex={errorIndex} /></div> : <>
            <div ref={stageRef} className={`stage ${overlay ? 'has-panel' : ''}`}>
              <div className="scene-ground" inert={overlay}>
                <div className="location-plaque"><Glyph name="map" /><span id="scene-title" tabIndex={-1}>{place.name}</span><span className="location-time">下午 3:20</span></div>
                <StageArt place={place} />
                <div className="scene-callout"><div><span className="eyebrow">一封邀請，一種可能</span><p>{place.subtitle}</p></div><button className="button primary" onClick={() => show('dialogue')}>與{place.person}交談 <Glyph name="arrow" /></button></div>
              </div>
              {overlay && <div className="panel-backdrop"><div ref={panelRef} className={`paper-panel panel-${view}`} role="dialog" aria-modal="true" aria-labelledby="preview-panel-title"><button className="close-panel" aria-label="關閉面板，回到場景" onClick={closePanel}><Glyph name="close" /></button><PreviewPanels view={view} show={show} place={place} selected={selected} setSelected={setSelected} cardState={cardState} ending={ending} errorIndex={errorIndex} /></div></div>}
            </div>
            <aside className="mission-sidebar" inert={overlay}>
              <div className="mission-card"><div className="eyebrow"><span className="tiny-diamond">◆</span> 目前任務</div><h2>讓對的人，<br />收到你的邀請。</h2><p>和藝文寫作者聊聊，想一想誰會對你的沙龍感到好奇。</p><button className="button primary" onClick={() => { setPlaceIndex(3); show('dialogue'); }}>前往目前任務 <Glyph name="arrow" /></button><div className="task-progress"><span>第 4 個決策</span><span>4／12</span><div><i /></div></div></div>
              <nav className="destinations" aria-label="展示場景"><h3>巴黎小地圖</h3>{places.map((p, i) => <button key={p.id} aria-pressed={placeIndex === i} onClick={() => setPlaceIndex(i)}><span className="place-index">0{i + 1}</span><span>{p.short}</span>{i === placeIndex ? <span className="here">所在</span> : <Glyph name="arrow" size={18} />}</button>)}</nav>
              <p className="movement-note"><Glyph name="map" size={18} />正式版可移動或直接前往；<br />目前展示人物站位與場景。</p>
            </aside>
          </>}
        </main>
        <nav className="toolbelt" aria-label="遊戲工具展示" inert={overlay}><button onClick={() => show('scene')} aria-current={view === 'scene' ? 'page' : undefined}><Glyph name="map" />探索場景</button><button onClick={() => show('ledger')}><Glyph name="coin" />經營帳冊</button><button className="future-tool" onClick={() => show('handbook')}><Glyph name="book" />2026 經營手帳<span className="new-mark">未來來信</span></button><span className="sound-note"><Glyph name="sound" size={18} />靜音展示</span></nav>
        <footer className="preview-footer"><span>沙龍夫人的經營筆記 · 巴黎 1900</span><span>展示資料・遊戲規則與進度儲存尚未接上</span></footer>
      </div>
    </div>
    <p className="review-help">可使用上方「畫面」檢視全部介面；手機按鈕會縮至 390px。人物採 3–4 頭身原創設計。</p>
  </div>;
}
