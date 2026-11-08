import { useState } from 'react';
import type { ReactNode } from 'react';
import type { SalonDecision, SalonDecisionBrief, SalonReplay, SalonResolvedChoice, SalonSession } from '../types';
import { salonActs, salonGame, salonTerms } from '../data/paris-salon';
import sharing from '../data/sharing.json';
import { Glyph, Sprite } from '../paris-salon-preview/PreviewPrimitives';
import type { SalonPanel } from './SalonGame';
import { SALON_MUSIC_CREDIT, useSalonAudio } from './use-salon-audio';

const shareLink = (sharing as Record<string, { longUrl: string; shortUrl: string; qrImage: string }>)['paris-salon'];
const isLocal = () => ['127.0.0.1', 'localhost'].includes(location.hostname);
export const salonShareUrl = () => isLocal()
  ? `${new URL(import.meta.env.BASE_URL, location.href).href.split('#')[0]}#/quiz/paris-salon/1`
  : shareLink?.shortUrl ?? `${new URL(import.meta.env.BASE_URL, location.href).href.split('#')[0]}#/quiz/paris-salon/1`;

function Heading({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return <header className="paper-heading"><span className="eyebrow">{kicker}</span><h2 id="salon-panel-title" tabIndex={-1}>{title}</h2>{children}</header>;
}
function Actions({ children }: { children: ReactNode }) { return <div className="action-row">{children}</div>; }

export function GameShare({ compact = false }: { compact?: boolean }) {
  const [message, setMessage] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(salonShareUrl()); setMessage('遊戲介紹連結已複製。'); }
    catch { setMessage(`無法自動複製，請選取這個連結：${salonShareUrl()}`); }
  }
  return <div className={`live-share ${compact ? 'live-share-compact' : ''}`}><div className="share-copy"><p>{isLocal() ? '本機試玩' : '分享短網址'}</p><a className="live-short-link" href={salonShareUrl()} target="_blank" rel="noreferrer">{salonShareUrl()}</a><button className="button secondary" onClick={() => void copy()}>複製連結 <Glyph name="mail" /></button><p className="copy-status" aria-live="polite">{message}</p></div>{shareLink && <div className="live-share-qr"><a href={`${import.meta.env.BASE_URL}${shareLink.qrImage}`} download="paris-salon-qr.png"><img src={`${import.meta.env.BASE_URL}${shareLink.qrImage}`} width="150" height="150" alt="沙龍夫人的經營筆記公開分享 QR code" /><span>下載 QR</span></a><div><p>公開版 QR</p><a href={shareLink.shortUrl} target="_blank" rel="noreferrer">{shareLink.shortUrl}</a></div></div>}</div>;
}

export function GameIntro({ session, onStart, onRestart, onShare, onHelp }: { session: SalonSession; onStart: () => void; onRestart: () => void; onShare: () => void; onHelp: () => void }) {
  return <section className="intro-overlay" aria-labelledby="salon-intro-title">
    <div className="intro-brand"><img src={`${import.meta.env.BASE_URL}images/paris-salon/logo.png`} alt="沙龍夫人的經營筆記" /><h2 id="salon-intro-title" className="sr-only" tabIndex={-1}>沙龍夫人的經營筆記：巴黎 1900</h2></div>
    <p className="intro-tagline">一封邀請，一場藝術之夜。</p>
    <div className="intro-menu">
      <button className="button primary" aria-label={`${session.completed ? '查看結果' : session.started ? '繼續' : '開始'}：翻開克萊兒的故事`} onClick={onStart}>{session.completed ? '查看結果' : session.started ? '繼續' : '開始'} <Glyph name="arrow" /></button>
      {session.started && <button className="button ghost-light" onClick={onRestart}>重新開始</button>}
      <button className="button ghost-light" onClick={onShare}>分享</button>
      <button className="button ghost-light" onClick={onHelp}>設定與操作</button>
    </div>
    <GameShare compact />
  </section>;
}

interface Props {
  panel: SalonPanel; question: SalonDecision; brief: SalonDecisionBrief; index: number; selected: string | null;
  before: SalonReplay; replay: SalonReplay; choice?: SalonResolvedChoice;
  onSelect: (id: string) => void; onSubmit: () => void; onNext: () => void; onPrevious: () => void;
  onShow: (panel: SalonPanel) => void; onClose: () => void; onRestart: () => void; onConfirmChange: () => void;
  reducedMotion: boolean; setReducedMotion: (value: boolean) => void;
  audio: ReturnType<typeof useSalonAudio>;
}

export function GamePanels(props: Props) {
  const { panel, question: q, brief, index, selected, before, replay, choice, onSelect, onSubmit, onNext, onPrevious, onShow, onClose } = props;
  const [termId, setTermId] = useState(Object.keys(salonTerms)[0]);
  const term = salonTerms[termId];

  if (panel === 'dialogue') return <><Heading kicker={`與${q.speaker}交談`} title={q.title} /><div className="dialogue-layout salon-dialogue"><div className="portrait-column"><Sprite index={q.npc} /><strong>{q.speaker}</strong><span>{q.role}</span></div><div className="dialogue-copy"><blockquote>「{brief.setup}」</blockquote></div></div><Actions><button className="text-button" onClick={onClose}>稍後再聊</button><button className="button primary" onClick={() => onShow('decision')}>開始做決策 <Glyph name="arrow" /></button></Actions></>;

  if (panel === 'evidence') return <><Heading kicker="判斷線索" title={brief.objective} /><div className="evidence-notes">{brief.clues.map(item => <article key={item.label}><h3>{item.label}</h3><p>{item.text}</p></article>)}</div><Actions><button className="button primary" onClick={() => onShow('decision')}>回到決策 <Glyph name="arrow" /></button></Actions></>;

  if (panel === 'decision') {
    const previousTarget = q.options.some(option => option.fit) && before.target
      ? salonGame.decisions[0].options.find(option => option.target === before.target)?.title
      : undefined;
    const stateNote = q.id === 'salon-06'
      ? `目前：有效確認 ${before.stats.confirmed}/36 · 知名度 ${before.stats.awareness}（目標70）· 信任 ${before.stats.trust}（目標60）· 接待準備 ${before.stats.preparation}（目標60）`
      : q.id === 'salon-08'
        ? `帳冊：有效確認 ${before.stats.confirmed}/36 · 候補 ${before.stats.waiting}人；抽查非總名單。`
        : q.id === 'salon-09'
          ? `目前：有效確認 ${before.stats.confirmed}/36 · 信任 ${before.stats.trust}（目標60）· 接待準備 ${before.stats.preparation}（目標60）`
          : undefined;
    return <><Heading kicker={`第 ${String(index + 1).padStart(2, '0')} 題 · 單選`} title={q.question} />{previousTarget && <p role="note" aria-label="先前選定的受眾">先前選定的受眾：{previousTarget}</p>}{stateNote && <p role="note" aria-label="當前經營狀態">{stateNote}</p>}<p className="decision-objective">{brief.objective}</p><div className="decision-clues">{brief.clues.map(item => <article key={item.label}><strong>{item.label}</strong><p>{item.text}</p></article>)}</div><section className="decision-principle" aria-label="判斷觀念"><strong>{brief.principle.title}</strong><p>{brief.principle.text}</p></section><div className="decision-evidence"><span><Glyph name="coin" />可用經費 <b>{before.stats.budget} 點</b></span></div><fieldset className="decision-cards"><legend className="sr-only">選擇一個做法</legend>{q.options.map((option, i) => {
    const unavailable = option.cost > before.stats.budget;
    const teaching = brief.options[option.id];
    return <label className={`decision-card ${selected === option.id ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}`} key={option.id}><input type="radio" name="salon-choice" value={option.id} aria-label={option.title} checked={selected === option.id} disabled={unavailable} onChange={() => onSelect(option.id)} /><span className="card-top"><span className="card-letter">{String.fromCharCode(65 + i)}</span><span>{option.label}</span><span className="radio-circle">{selected === option.id && <Glyph name="check" size={16} />}</span></span><h3>{option.title}</h3><p className="decision-basis">{teaching.basis}</p><p className="decision-tradeoff"><b>取捨</b> · {teaching.tradeoff}</p><span className="card-cost"><Glyph name="coin" size={18} />{option.cost} 點<span>{unavailable ? '經費不足' : selected === option.id ? '已選擇' : '成本'}</span></span></label>;
  })}</fieldset><Actions>{index > 0 && <button className="text-button" onClick={onPrevious}>← 上一頁</button>}<span className="selection-hint">{selected ? '確認後才執行這項決定' : '請先選擇一個做法'}</span><button className="button primary" disabled={!selected || !q.options.some(o => o.id === selected && o.cost <= before.stats.budget)} onClick={onSubmit}>{index === 11 ? '確認，查看結果' : '確認，下一頁'} <Glyph name="arrow" /></button></Actions></>;
  }

  if (panel === 'feedback' && choice) {
    const teaching = brief.options[choice.option.id];
    return <><Heading kicker={`第 ${index + 1} 題 · 選擇後果`} title={choice.option.title} /><div className="feedback-letter"><Sprite index={q.npc} /><div><blockquote>{teaching.outcome}</blockquote><p className="feedback-lesson"><b>{teaching.lesson}</b></p><cite>—— {q.speaker}</cite></div></div>{q.id === 'salon-09' && replay.opening && <p className="opening-milestone">藝術之夜開場：{replay.opening.attendance} 位來賓到場。</p>}<div className="change-strip">{(['budget', 'awareness', 'trust', 'preparation', 'confirmed', 'waiting'] as const).map((key, i) => { const diff = choice.after[key] - choice.before[key]; return diff === 0 ? null : <span key={key}>{['經費', '知名度', '信任', '接待準備', '有效確認', '候補'][i]}<b>{diff > 0 ? '+' : ''}{diff}</b></span>; })}</div><Actions><button className="text-button" onClick={() => onShow('decision')}>回看選擇</button><button className="button primary" onClick={onNext}>繼續 <Glyph name="arrow" /></button></Actions></>;
  }

  if (panel === 'ledger') return <><Heading kicker="LE CARNET DES COMPTES · 經營帳冊" title="有多少人知道，又有多少人會來？" /><div className="ledger-grid">{[['經費', replay.stats.budget], ['知名度', replay.stats.awareness], ['信任', replay.stats.trust], ['接待準備', replay.stats.preparation]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{label === '經費' ? '點／初始 100 點' : '／100 遊戲指數'}</small></div>)}</div><div className="guest-funnel"><div><span>有效確認</span><strong>{replay.stats.confirmed}<small>／36 人</small></strong></div><Glyph name="arrow" /><div><span>候補</span><strong>{replay.stats.waiting}<small>人</small></strong></div><Glyph name="arrow" /><div><span>當晚到場</span><strong>{replay.opening?.attendance ?? '待開場'}</strong></div></div><p className="source-note">知名度是遊戲指數，不是巴黎人口百分比。候補不列入當晚到場；到場於第三幕結束時鎖定，後續回訪不會回頭增加人數。</p><h3 className="subsection-title">已確認的經營筆記</h3>{replay.choices.length ? replay.choices.map((item, i) => <div className="ledger-entry" key={item.decision.id}><span>決策 {i + 1}</span><p>{item.option.title}</p><span>{item.option.cost} 點</span></div>) : <p>你的第一封邀請，還在等待一個想法。</p>}<Actions><button className="button primary" onClick={onClose}>闔上帳冊 <Glyph name="arrow" /></button></Actions></>;

  if (panel === 'handbook') return <><Heading kicker="UN LIVRE DU FUTUR · 2026 經營手帳" title="先從一個好問題開始。"><p>手帳隨時可讀，不扣分；現代方法透過 1900 年的媒體與人際關係運用。</p></Heading><label className="handbook-term-select">選擇經營觀念<select value={termId} onChange={event => setTermId(event.target.value)}>{Object.entries(salonTerms).map(([id, value]) => <option key={id} value={id}>{value.title}</option>)}</select></label>{term && <div className="handbook-page"><h3>{term.title}</h3><p>{term.definition}</p><div className="then-now"><span>1900 · 放回這場沙龍</span><p>{term.then}</p><span>2026 · 帶回今天</span><p>{term.now}</p><b>常見誤解</b><p>{term.pitfall}</p></div></div>}<Actions><button className="button primary" onClick={onClose}>帶著想法，繼續經營 <Glyph name="arrow" /></button></Actions></>;

  if (panel === 'help') return <><Heading kicker="遊戲設定" title="照自己的步調。" /><label className="setting-row"><input type="checkbox" checked={props.reducedMotion} onChange={e => props.setReducedMotion(e.target.checked)} />減少動態效果</label><label className="setting-row audio-setting"><span>音量</span><input type="range" min="0" max="1" step="0.01" value={props.audio.volume} aria-label="音量" onChange={e => props.audio.setVolume(Number(e.target.value))} /><button className="button secondary" onClick={() => props.audio.toggleMute()}>{props.audio.muted ? '開啟聲音' : '靜音'}</button></label><p className="audio-status" role="status">{props.audio.musicError || (props.audio.musicReady ? '背景音樂已就緒' : props.audio.unlocked ? '背景音樂載入中' : '開始遊戲後啟用音訊')}</p><p className="music-credit"><a href={SALON_MUSIC_CREDIT.sourceUrl} target="_blank" rel="noreferrer">{SALON_MUSIC_CREDIT.title}</a> · {SALON_MUSIC_CREDIT.creator} · <a href={SALON_MUSIC_CREDIT.licenseUrl} target="_blank" rel="noreferrer">{SALON_MUSIC_CREDIT.licenseName}</a></p><Actions><button className="button primary" onClick={onClose}>繼續</button></Actions></>;

  if (panel === 'share') return <><Heading kicker="UNE INVITATION · 分享這場冒險" title="把下一封邀請，交給朋友。" /><GameShare /><Actions><button className="button primary" onClick={onClose}>關閉分享</button></Actions></>;

  if (panel === 'change') return <><Heading kicker="重新推演" title="從這次選擇，重新走一遍？" /><p>改選會重寫這之後的選擇與結果，之前的決定會保留。</p><Actions><button className="button secondary" onClick={onClose}>取消，保留原選擇</button><button className="button primary" onClick={props.onConfirmChange}>確認修改，重新推演</button></Actions></>;

  if (panel === 'restart') return <><Heading kicker="開始新的一場" title="重新經營這間沙龍？" /><p>重新開始會清除這場故事的選擇與結果。</p><Actions><button className="button secondary" onClick={onClose}>先保留這場故事</button><button className="button primary" onClick={props.onRestart}>確認重新開始</button></Actions></>;

  if (panel === 'interlude') return <div className="live-interlude"><span className="interlude-ornament">{['I', 'II', 'III', 'IV'][q.act - 1]}</span><Heading kicker={`ACTE ${q.act} · 新的一幕`} title={salonActs[q.act - 1]} /><p>{q.act === 4 ? '邀請已送出，來賓開始到場。現在，讓每份期待都有被接住的準備。' : '上一幕的取捨，已成為下一幕的起點。帶著目前的資源，繼續這場故事。'}</p><Actions><button className="button primary" onClick={() => onShow(null)}>走進下一幕 <Glyph name="arrow" /></button></Actions></div>;
  return null;
}
