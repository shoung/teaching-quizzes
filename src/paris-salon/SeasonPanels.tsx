import { useState } from 'react';
import type { ReactNode } from 'react';
import type { ActionId, Audience, Scale, SeasonAction, SeasonAssets, SeasonEvent, SeasonForecast, SeasonPlan, SeasonReplay, SeasonSession, Theme } from './season-types';
import { canPlanSeason, forecastSeason } from './season-engine';
import { getEventVoices, getNpcConversation, seasonScenes } from '../data/paris-salon-rpg';
import { seasonActions, seasonAudiences, seasonScales, seasonThemes, seasonPositioningLesson } from '../data/paris-salon-season';
import type { SalonNpcId } from './rpg-types';
import { SalonCardHand } from './SalonCardHand';
import { SalonOrnament } from './SalonOrnament';
import { Glyph } from '../paris-salon-preview/PreviewPrimitives';
import { SALON_MUSIC_CREDIT } from './use-salon-audio';

export type SeasonPanelKind = 'plan' | 'outcome' | 'ledger' | 'settings' | 'restart' | 'title' | 'report' | null;

function Heading({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return <header className="paper-heading"><span className="eyebrow">{kicker}</span><h2 id="salon-panel-title" tabIndex={-1}>{title}</h2>{children}</header>;
}
function Actions({ children }: { children: ReactNode }) { return <div className="action-row season-actions-row">{children}</div>; }
function Money({ value }: { value: number }) { return <>{value}<span className="season-unit"> 點</span></>; }

interface Props {
  panel: SeasonPanelKind;
  session: SeasonSession;
  replay: SeasonReplay;
  forecast: SeasonForecast;
  actions: SeasonAction[];
  reducedMotion: boolean;
  muted: boolean;
  volume: number;
  musicStatus: string;
  onToggleMute: () => void;
  onVolume: (value: number) => void;
  onMotion: (value: boolean) => void;
  onDraft: (plan: SeasonPlan) => void;
  onHold: () => void;
  onAcknowledge: () => void;
  onOpen: (panel: SeasonPanelKind) => void;
  onClose: () => void;
  onRestart: () => void;
  onTitle: () => void;
  onInspect: () => void;
}

type AssetKey = 'cash' | 'regulars' | 'reputation' | 'awareness' | 'seats' | 'training' | 'ambience';
const assetLabels: [AssetKey, string, string][] = [
  ['cash', '現金', '點'], ['regulars', '熟客', '人'], ['reputation', '口碑', ''],
  ['awareness', '知名度', ''], ['seats', '座位', '席'], ['training', '助手培訓', '級'], ['ambience', '環境改善', '級'],
];

export function SeasonPanels(props: Props) {
  const { panel, session, replay, forecast, actions } = props;
  const [actionNotice, setActionNotice] = useState('');
  if (!panel) return null;

  if (panel === 'plan') {
    const draft = session.draft;
    const round = Math.min(session.plans.length + 1, 6);
    const updatePlan = (candidate: SeasonPlan) => {
      const estimate = forecastSeason(session, candidate);
      if (estimate.issues.length > 0) { setActionNotice(estimate.issues[0]); return; }
      setActionNotice('');
      props.onDraft(candidate);
    };
    const toggleAction = (id: ActionId) => {
      const next = draft.actions.includes(id) ? draft.actions.filter(item => item !== id) : [...draft.actions, id];
      updatePlan({ ...draft, actions: next });
    };
    const getIssue = (id: ActionId) => {
      const candidate = draft.actions.includes(id)
        ? { ...draft, actions: draft.actions.filter(item => item !== id) }
        : { ...draft, actions: [...draft.actions, id] };
      return forecastSeason(session, candidate).issues[0] ?? null;
    };
    const canPlan = canPlanSeason(session);
    return <div className="rpg-plan">
      <Heading kicker={`第 ${round}／6 場 · 本場規劃`} title="安排本場沙龍。" />
      <div className="rpg-config season-config">
        <fieldset><legend>基本配置</legend>
          <label>主要來客<select value={draft.audience} onChange={event => updatePlan({ ...draft, audience: event.target.value as Audience })}>{seasonAudiences.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          <p className="season-field-note">{seasonAudiences.find(item => item.id === draft.audience)?.need}</p>
          <label>聚會主題<select value={draft.theme} onChange={event => updatePlan({ ...draft, theme: event.target.value as Theme })}>{seasonThemes.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          <p className="season-field-note">{seasonThemes.find(item => item.id === draft.theme)?.promise}</p>
          <label>聚會規模<select value={draft.scale} onChange={event => updatePlan({ ...draft, scale: event.target.value as Scale })}>{seasonScales.map(item => <option key={item.id} value={item.id}>{item.title}（{item.limit} 人）</option>)}</select></label>
          <p className="season-field-note">基本支出 {seasonScales.find(item => item.id === draft.scale)?.cost} 點。</p>
          <details className="season-positioning-lesson"><summary>定位筆記</summary><p>{seasonPositioningLesson}</p></details>
        </fieldset>
      </div>
      <div className="rpg-card-area"><SalonCardHand actions={actions} selected={draft.actions} onToggle={toggleAction} getIssue={getIssue} reducedMotion={props.reducedMotion} onInspect={props.onInspect} /></div>
      <p className="season-action-notice" role="status" aria-live="polite">{actionNotice}</p>
      <section className="rpg-forecast season-forecast" aria-live="polite" aria-label="本場預估">
        <h3>本場預估</h3>
        <details className="season-income-guide"><summary>收入怎麼來？</summary><p>本教學模型以到場支持、熟客往來及符合條件的贊助計算收入；數字是課堂假設，不是售票或營收保證。</p></details>
        <dl><div><dt>總支出</dt><dd><Money value={forecast.cost} /></dd></div><div><dt>支出後現金（未計收入）</dt><dd><Money value={replay.assets.cash} /> → <Money value={replay.assets.cash - forecast.cost} /></dd></div><div><dt>準備時間</dt><dd>{forecast.time}／{forecast.timeLimit} 時段</dd></div><div><dt>需求／入場</dt><dd>{forecast.demand[0]}–{forecast.demand[1]}／{forecast.attendance[0]}–{forecast.attendance[1]} 人</dd></div><div><dt>本場上限／舒適接待量</dt><dd>{forecast.capacity}／{forecast.safeCapacity} 人</dd></div></dl>
        {forecast.issues.length > 0 && <ul className="season-forecast-issues">{forecast.issues.map((item, index) => <li key={index}>{item}</li>)}</ul>}
        {forecast.insights.length > 0 && <ul className="season-forecast-insights">{forecast.insights.map((item, index) => <li key={index}>{item}</li>)}</ul>}
      </section>
      <Actions><button className="button secondary" onClick={props.onClose}>返回場景</button><button className="button primary rpg-hold" aria-label="舉辦沙龍" onClick={props.onHold} disabled={!canPlan || forecast.issues.length > 0}><SalonOrnament className="rpg-hold-ornament" />舉辦沙龍</button></Actions>
      {!canPlan && <p className="rpg-plan-requirement" role="status">先與一位在場來賓交談，記下本場線索，才能舉辦沙龍。</p>}
    </div>;
  }

  if (panel === 'outcome') {
    const event = replay.events.at(-1);
    if (!event || event.number <= session.acknowledged) return <><Heading kicker="本場回顧" title="尚無待確認的回顧。" /><Actions><button className="button primary" onClick={props.onClose}>返回</button></Actions></>;
    return <><Heading kicker={`第 ${event.number}／6 場 · 經營回顧`} title="本場沙龍回顧。" /><SeasonOutcomePreview event={event} /><Actions><button className="button primary" onClick={props.onAcknowledge}>{event.number === 6 ? '聽聽露易斯夫人怎麼說' : '前往下一場'} <Glyph name="arrow" /></button></Actions></>;
  }

  if (panel === 'ledger') return <><Heading kicker="跨場累積的經營資產" title="沙龍帳冊。" /><div className="rpg-ledger"><Assets assets={replay.assets} /><section className="rpg-heard-ledger"><h3>已聽線索</h3>{Object.entries(session.heard).length === 0 ? <p>目前還沒有記錄。</p> : Object.entries(session.heard).sort(([a], [b]) => Number(a) - Number(b)).map(([roundKey, ids]) => {
    const round = Number(roundKey);
    const scene = seasonScenes.find(item => item.number === round);
    const previous = replay.events[round - 2];
    const context = { assets: previous?.after ?? replay.assets, ...(previous ? { previous } : {}) };
    const items = ids.flatMap(id => {
      if (!scene?.npcs.some(npc => npc.id === id)) return [];
      const npc = scene.npcs.find(item => item.id === id)!;
      return [{ name: npc.name, clue: getNpcConversation(round, id as SalonNpcId, context).clue }];
    });
    return <section key={round}><h4>第 {round} 場</h4><ul>{items.map((item, index) => <li key={`${item.name}-${index}`}><strong>{item.name}：</strong>{item.clue}</li>)}</ul></section>;
  })}</section><p>場地、人手培訓、環境、熟客與口碑會延續到下一場；座位不會自行增加需求。</p></div><Actions><button className="button primary" onClick={props.onClose}>返回場景</button></Actions></>;

  if (panel === 'settings') return <><Heading kicker="遊戲設定" title="照自己的步調。" /><label className="season-setting"><input type="checkbox" checked={props.reducedMotion} onChange={event => props.onMotion(event.target.checked)} />減少動態效果</label><label className="audio-setting"><span>音量</span><input type="range" min="0" max="1" step="0.01" value={props.volume} aria-label="音量" onChange={event => props.onVolume(Number(event.target.value))} /><button className="button secondary" onClick={props.onToggleMute}>{props.muted ? '開啟聲音' : '靜音'}</button></label><p className="audio-status" role="status">{props.musicStatus}</p><p className="music-credit"><a href={SALON_MUSIC_CREDIT.sourceUrl} target="_blank" rel="noreferrer">{SALON_MUSIC_CREDIT.title}</a> · {SALON_MUSIC_CREDIT.creator} · <a href={SALON_MUSIC_CREDIT.licenseUrl} target="_blank" rel="noreferrer">{SALON_MUSIC_CREDIT.licenseName}</a></p><Actions><button className="button primary" onClick={props.onClose}>繼續</button></Actions></>;

  if (panel === 'restart') return <><Heading kicker="重新開始" title="重新翻開這本手帳？" /><p>這一季的經營紀錄會被清除，無法復原。</p><Actions><button className="button secondary" onClick={props.onClose}>取消</button><button className="button primary" onClick={props.onRestart}>清除此季並重新開始</button></Actions></>;

  if (panel === 'title') return <div className="rpg-title-confirm"><Heading kicker="返回標題" title="先回到標題頁嗎？" /><p>本季進度會保留，下次可從手帳繼續。</p><Actions><button className="button secondary" onClick={props.onClose}>繼續留在沙龍</button><button className="button primary" onClick={props.onTitle}>返回標題頁</button></Actions></div>;

  if (panel === 'report') return <SeasonReport replay={replay} onRestart={() => props.onOpen('restart')} onTitle={props.onTitle} />;
  return null;
}

function Assets({ assets }: { assets: SeasonAssets }) {
  return <dl className="season-assets">{assetLabels.map(([key, label, unit]) => <div key={key}><dt>{label}</dt><dd>{assets[key]}{unit}</dd></div>)}</dl>;
}

function AssetDelta({ before, after }: { before: SeasonAssets; after: SeasonAssets }) {
  return <dl className="rpg-asset-deltas">{assetLabels.map(([key, label, unit]) => {
    const delta = after[key] - before[key];
    return <div key={key}><dt>{label}</dt><dd><span>{before[key]}{unit}</span><span aria-hidden="true"> → </span><strong>{after[key]}{unit}</strong><small className={delta > 0 ? 'is-positive' : delta < 0 ? 'is-negative' : 'is-neutral'}>{delta > 0 ? '+' : ''}{delta}{unit}</small></dd></div>;
  })}</dl>;
}

function Outcome({ event }: { event: SeasonEvent }) {
  const voices = getEventVoices(event);
  return <div className="rpg-review season-outcome">
    <section aria-label="七項資產前後差異"><h3>經營資產變化</h3><AssetDelta before={event.before} after={event.after} /></section>
    <div className="season-outcome-grid"><section><h3>來客與體驗</h3><dl><div><dt>觸及／詢問／預約</dt><dd>{event.reach}／{event.inquiries}／{event.reservations}</dd></div><div><dt>到場／候補</dt><dd>{event.attendance}／{event.waiting} 人</dd></div><div><dt>舒適接待量／座位</dt><dd>{event.safeCapacity}／{event.seatCapacity} 人</dd></div><div><dt>新客／回訪</dt><dd>{event.newGuests}／{event.returning} 人</dd></div><div><dt>熟客留存／上場熟客</dt><dd>{event.retained}／{event.before.regulars} 人</dd></div><div><dt>滿意度</dt><dd>{event.satisfaction}／100</dd></div></dl></section><section><h3>收入與支出</h3><dl><div><dt>來客支持</dt><dd>+{event.income.support}</dd></div><div><dt>熟客往來</dt><dd>+{event.income.members}</dd></div><div><dt>贊助收入</dt><dd>+{event.income.sponsor}</dd></div><div><dt>總收入</dt><dd>+{event.income.total}</dd></div><div><dt>基本／行動成本</dt><dd>−{event.costs.base}／−{event.costs.actions}</dd></div><div><dt>本場結餘</dt><dd>{event.profit >= 0 ? '+' : '−'}{Math.abs(event.profit)}</dd></div></dl></section></div>
    <section className="rpg-voices"><h3>本場回饋與建議</h3><dl><div><dt>來賓回饋</dt><dd>{voices.guest}</dd></div><div><dt>露易斯夫人</dt><dd>{voices.mentor}</dd></div><div><dt>助手</dt><dd>{voices.assistant}</dd></div><div><dt>下一步</dt><dd>{voices.next}</dd></div></dl></section>
    {event.notes.length > 0 && <ul className="season-notes">{event.notes.map((note, index) => <li key={index}>{note}</li>)}</ul>}
    <details className="season-lessons"><summary>查看本場學習與帳務細節</summary><p>六場的前後差異不能單獨證明某項行動造成結果。</p><p>配置：{seasonAudiences.find(item => item.id === event.plan.audience)?.title} · {seasonThemes.find(item => item.id === event.plan.theme)?.title} · {seasonScales.find(item => item.id === event.plan.scale)?.title}；總成本 {event.costs.total} 點。</p>{event.lessons.length > 0 ? <ul>{event.lessons.map((lesson, index) => <li key={`${lesson.action}-${index}`}><strong>{lesson.concept}：</strong>{lesson.text}</li>)}</ul> : <p>本場沒有額外準備行動；基本配置與既有資產仍會影響結果。</p>}</details>
  </div>;
}

export function SeasonOutcomePreview({ event }: { event: SeasonEvent }) { return <Outcome event={event} />; }

function SeasonReport({ replay, onRestart, onTitle }: { replay: SeasonReplay; onRestart: () => void; onTitle: () => void }) {
  return <div className="rpg-report season-report"><Heading kicker="六場經營報告 · 課堂情境模型" title="一路走來的選擇。" /><Assets assets={replay.assets} />
    <div className="season-table-wrap" tabIndex={0} role="region" aria-label="六場知名度趨勢，可捲動"><table><caption>六場趨勢與資源變化</caption><thead><tr><th scope="col">場次／主題</th><th scope="col">知名度變化</th><th scope="col">知名度</th><th scope="col">滿意度</th><th scope="col">到場／候補</th></tr></thead><tbody>{replay.events.map(event => <tr key={event.number}><th scope="row">第 {event.number} 場 · {seasonThemes.find(theme => theme.id === event.plan.theme)?.title}</th><td>{event.after.awareness > event.before.awareness ? '+' : ''}{event.after.awareness - event.before.awareness}</td><td>{event.before.awareness} → {event.after.awareness}</td><td>{event.satisfaction}/100</td><td>{event.attendance}／{event.waiting}</td></tr>)}</tbody></table></div>
    <section className="season-report-decisions"><h3>逐場決策與 PDCA</h3>{replay.events.map(event => <details key={event.number}><summary>第 {event.number} 場：{event.plan.actions.length ? event.plan.actions.map(id => seasonActions.find(action => action.id === id)?.title ?? id).join('、') : '沒有額外準備行動'}</summary><p>受眾：{seasonAudiences.find(item => item.id === event.plan.audience)?.title} · 主題：{seasonThemes.find(item => item.id === event.plan.theme)?.title} · 規模：{seasonScales.find(item => item.id === event.plan.scale)?.title}；結餘 {event.profit >= 0 ? '+' : '−'}{Math.abs(event.profit)} 點，知名度 {event.before.awareness} → {event.after.awareness}。</p>{event.notes.length > 0 && <ul>{event.notes.map((note, index) => <li key={`note-${index}`}>{note}</li>)}</ul>}{event.lessons.length > 0 ? <ul>{event.lessons.map((lesson, index) => <li key={`${lesson.action}-${index}`}><strong>{lesson.concept}：</strong>{lesson.text}</li>)}</ul> : <p>本場選擇不額外準備，保留資源給其他需要。</p>}</details>)}</section>
    <Actions><button className="button secondary" onClick={onTitle}>返回標題頁</button><button className="button primary" onClick={onRestart}>重新開始一季</button></Actions>
  </div>;
}
