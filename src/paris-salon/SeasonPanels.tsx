import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Audience, Scale, SeasonAction, SeasonAssets, SeasonEvent, SeasonForecast, SeasonMarket, SeasonPlan, SeasonSession, SeasonReplay, Theme } from './season-types';
import { forecastSeason } from './season-engine';
import { seasonActions, seasonAudiences, seasonScales, seasonThemes, seasonPositioningLesson } from '../data/paris-salon-season';
import { Glyph, Sprite } from '../paris-salon-preview/PreviewPrimitives';
import { GameShare } from './GamePanels';
import { SALON_MUSIC_CREDIT } from './use-salon-audio';

export type SeasonPanelKind = 'dialogue' | 'plan' | 'outcome' | 'ledger' | 'settings' | 'restart' | 'report' | 'share' | null;
export type SeasonCategory = SeasonAction['category'] | 'all';

const categoryLabels: Record<SeasonCategory, string> = {
  all: '全部行動', insight: '研究與測試', experience: '體驗設計', operations: '人手與場地', growth: '邀請與關係',
};

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
  market: SeasonMarket;
  actions: SeasonAction[];
  npc: { index: number; name: string; role: string; dialogue: string };
  reducedMotion: boolean;
  muted: boolean;
  volume: number;
  musicStatus: string;
  onToggleMute: () => void;
  onVolume: (value: number) => void;
  onMotion: (value: boolean) => void;
  onDraft: (plan: SeasonPlan) => void;
  onPlan: () => void;
  onHold: () => void;
  onAcknowledge: () => void;
  onOpen: (panel: SeasonPanelKind) => void;
  onClose: () => void;
  onRestart: () => void;
  onShare: () => void;
  storageFailed: boolean;
}

export function SeasonPanels(props: Props) {
  const { panel, session, replay, forecast, market, actions, npc } = props;
  const [category, setCategory] = useState<SeasonCategory>('all');
  const [actionNotice, setActionNotice] = useState('');
  if (!panel) return null;

  if (panel === 'dialogue') return <>
    <Heading kicker={`與${npc.name}交談 · ${npc.role}`} title={npc.name === '路易斯' ? '先聽市場，再排好資源。' : '沙龍裡的每個細節，都能成為線索。'} />
    <div className="season-dialogue-layout"><div className="portrait-column"><Sprite index={npc.index} /><strong>{npc.name}</strong><span>{npc.role}</span></div><div className="dialogue-copy"><p>{npc.dialogue}</p><p><strong>本場消息：</strong>{market.news}</p><p>選擇主題、受眾和規模後，再自由安排準備行動。每個方案都有成本和取捨，沒有單一正解。</p></div></div>
    <Actions><button className="button primary" onClick={() => props.onOpen('plan')}>查看本場計畫 <Glyph name="arrow" /></button><button className="button secondary" onClick={() => props.onOpen('ledger')}>看看經營帳冊</button></Actions>
  </>;

  if (panel === 'plan') {
    const draft = session.draft;
    const shownActions = category === 'all' ? actions : actions.filter(action => action.category === category);
    const updatePlan = (candidate: SeasonPlan) => {
      const estimate = forecastSeason(session, candidate);
      if (estimate.issues.length > 0) { setActionNotice(estimate.issues[0]); return; }
      setActionNotice('');
      props.onDraft(candidate);
    };
    const toggleAction = (id: SeasonAction['id']) => {
      const next = draft.actions.includes(id) ? draft.actions.filter(item => item !== id) : [...draft.actions, id];
      updatePlan({ ...draft, actions: next });
    };
    return <>
      <Heading kicker={`第 ${session.plans.length + 1}／6 場 · 本場規劃`} title="安排一場適合來客的聚會。"><p className="season-market-title">{market.title}</p><p className="season-market-news">{market.news}</p></Heading>
      <section className="season-forecast" aria-live="polite" aria-label="本場預估"><h3>本場預估</h3><details className="season-income-guide"><summary>收入怎麼來？</summary><p>來客自願支持在模型中簡化為每位到場 1–2 點：主受眾切合市場消息時為 2 點，否則 1 點。回訪熟客另支持每人 1 點；安排熟客往來時為 3 點。這些是教學假設，並非售票。洽談贊助且主題符合受眾時，支持者按到場人數提供至少 4 點；所有支出仍須在舉辦前付清。</p></details><dl><div><dt>總支出</dt><dd><Money value={forecast.cost} /></dd></div><div><dt>支出後現金（未計收入）</dt><dd><Money value={replay.assets.cash} /> → <Money value={replay.assets.cash - forecast.cost} /></dd></div><div><dt>準備時間</dt><dd>{forecast.time}／{forecast.timeLimit}</dd></div><div><dt>本場上限／舒適接待量</dt><dd>{forecast.capacity}／{forecast.safeCapacity} 人</dd></div><div><dt>預估需求／可入場</dt><dd><span>需求 {forecast.demand[0]}–{forecast.demand[1]} 人</span><br /><span>入場 {forecast.attendance[0]}–{forecast.attendance[1]} 人</span></dd></div></dl>{forecast.issues.length > 0 && <ul className="season-forecast-issues">{forecast.issues.map((item, index) => <li key={index}>{item}</li>)}</ul>}{forecast.insights.length > 0 && <ul className="season-forecast-insights">{forecast.insights.map((item, index) => <li key={index}>{item}</li>)}</ul>}</section>
      <div className="season-plan-grid">
        <fieldset className="season-config"><legend>基本配置</legend><label>主受眾<select value={draft.audience} onChange={event => updatePlan({ ...draft, audience: event.target.value as Audience })}>{seasonAudiences.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><p className="season-field-note">{seasonAudiences.find(item => item.id === draft.audience)?.need}</p><label>聚會主題<select value={draft.theme} onChange={event => updatePlan({ ...draft, theme: event.target.value as Theme })}>{seasonThemes.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><p className="season-field-note">{seasonThemes.find(item => item.id === draft.theme)?.promise}</p><label>規模<select value={draft.scale} onChange={event => updatePlan({ ...draft, scale: event.target.value as Scale })}>{seasonScales.map(item => <option key={item.id} value={item.id}>{item.title}（{item.limit} 人）</option>)}</select></label><p className="season-field-note">本場規模上限 {seasonScales.find(item => item.id === draft.scale)?.limit} 人，基礎支出 {seasonScales.find(item => item.id === draft.scale)?.cost} 點。場地有 {forecast.seats} 席；實際入場上限 {forecast.capacity} 人。</p><details className="season-positioning-lesson"><summary>定位筆記：受眾與主題如何配合</summary><p>{seasonPositioningLesson}</p></details></fieldset>
        <section className="season-action-picker" aria-labelledby="season-action-title"><div className="season-subheading"><h3 id="season-action-title">自由組合準備行動</h3><p>可選多項，也可不加行動，留出低成本恢復空間。</p></div><div className="season-category-tabs" role="group" aria-label="行動分類">{(Object.keys(categoryLabels) as SeasonCategory[]).map(value => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}>{categoryLabels[value]}</button>)}</div><p className="season-action-notice" aria-live="polite">{actionNotice}</p><div className="season-action-list">{shownActions.map(action => {
          const selected = draft.actions.includes(action.id);
          return <label key={action.id} className={`season-action-card ${selected ? 'is-selected' : ''}`}><input type="checkbox" data-action={action.id} checked={selected} onChange={() => toggleAction(action.id)} /><span className="season-action-main"><strong>{action.title}</strong><span className="season-action-cost">成本 <Money value={action.cost} /> · {action.time} 準備時</span><span>{action.basis}</span><span className="season-tradeoff"><b>取捨：</b>{action.tradeoff}</span><details><summary>教學概念：{action.concept}</summary><p>{action.lesson}</p></details></span></label>;
        })}</div></section>
      </div>
      <Actions><button className="button secondary" onClick={props.onClose}>稍後再決定</button><button className="button primary" onClick={props.onHold} disabled={forecast.issues.length > 0}>舉辦本場</button></Actions>
    </>;
  }

  if (panel === 'outcome') {
    const event = replay.events.at(-1);
    if (!event || event.number <= session.acknowledged) return <><Heading kicker="本場回顧" title="尚無待確認的回顧。" /><Actions><button className="button primary" onClick={props.onClose}>返回</button></Actions></>;
    return <><Heading kicker={`第 ${event.number}／6 場 · 經營回顧`} title={market.title}><p className="season-outcome-intro">檢視收入與成本、邀請漏斗、留存分母和本場決策。</p></Heading><Outcome event={event} /><Actions><button className="button primary" onClick={props.onAcknowledge}>{event.number === 6 ? '完成六場回顧' : '確認回顧，前往下一場'} <Glyph name="arrow" /></button></Actions></>;
  }

  if (panel === 'ledger') return <><Heading kicker="跨場累積的經營資產" title="沙龍帳冊。" /><Assets assets={replay.assets} /><p>場地、人手培訓、環境、熟客與口碑會帶到下一場。擴充場地不會憑空增加需求。</p><p className="season-ledger-progress">已完成 {replay.events.length}／6 場。{replay.events.length < 6 && '待確認的回顧仍會在場景中保留入口。'}</p><Actions><button className="button primary" onClick={props.onClose}>返回場景</button></Actions></>;

  if (panel === 'settings') return <><Heading kicker="遊戲設定" title="照自己的步調。" /><label className="season-setting"><input type="checkbox" checked={props.reducedMotion} onChange={event => props.onMotion(event.target.checked)} />減少動態效果</label><label className="audio-setting"><span>音量</span><input type="range" min="0" max="1" step="0.01" value={props.volume} aria-label="音量" onChange={event => props.onVolume(Number(event.target.value))} /><button className="button secondary" onClick={props.onToggleMute}>{props.muted ? '開啟聲音' : '靜音'}</button></label><p className="audio-status" role="status">{props.musicStatus}</p><p className="music-credit"><a href={SALON_MUSIC_CREDIT.sourceUrl} target="_blank" rel="noreferrer">{SALON_MUSIC_CREDIT.title}</a> · {SALON_MUSIC_CREDIT.creator} · <a href={SALON_MUSIC_CREDIT.licenseUrl} target="_blank" rel="noreferrer">{SALON_MUSIC_CREDIT.licenseName}</a></p><Actions><button className="button primary" onClick={props.onClose}>繼續</button></Actions></>;

  if (panel === 'restart') return <><Heading kicker="重新開始" title="要重新翻開這本手帳嗎？" /><p>這一季的經營紀錄會被清除，無法復原。</p><Actions><button className="button secondary" onClick={props.onClose}>取消</button><button className="button primary" onClick={props.onRestart}>清除此季並重新開始</button></Actions></>;

  if (panel === 'report') return <SeasonReport replay={replay} onRestart={() => props.onOpen('restart')} onShare={props.onShare} />;

  if (panel === 'share') return <><Heading kicker="分享沙龍手帳" title="邀朋友一起經營。" /><p>分享連結固定開啟介紹頁，不含作答或個人資料。</p><GameShare /><Actions><button className="button secondary" onClick={props.onClose}>返回</button></Actions></>;
  return null;
}

function Assets({ assets }: { assets: SeasonAssets }) {
  const values: [string, number, string][] = [['現金', assets.cash, '點'], ['熟客', assets.regulars, '人'], ['口碑', assets.reputation, ''], ['知名度', assets.awareness, ''], ['座位', assets.seats, '席'], ['固定助手培訓', assets.training, '級'], ['環境改善', assets.ambience, '級']];
  return <dl className="season-assets">{values.map(([label, value, unit]) => <div key={label}><dt>{label}</dt><dd>{value}{unit}</dd></div>)}</dl>;
}

function Outcome({ event }: { event: SeasonEvent }) {
  return <div className="season-outcome"><Assets assets={event.after} /><div className="season-outcome-grid"><section><h3>財務</h3><dl><div><dt>來客／熟客／贊助支持</dt><dd>{event.income.support}／{event.income.members}／{event.income.sponsor}</dd></div><div><dt>總收入</dt><dd>+{event.income.total}</dd></div><div><dt>基礎／行動成本</dt><dd>{event.costs.base}／{event.costs.actions}</dd></div><div><dt>本場結餘</dt><dd>{event.profit >= 0 ? '+' : ''}{event.profit}</dd></div></dl></section><section><h3>邀請漏斗與到場</h3><dl><div><dt>新客觸及</dt><dd>{event.reach}</dd></div><div><dt>新客詢問</dt><dd>{event.inquiries}</dd></div><div><dt>新客預約</dt><dd>{event.reservations}</dd></div><div><dt>熟客回訪</dt><dd>{event.returning}</dd></div><div><dt>總到場／候補</dt><dd>{event.attendance}／{event.waiting}</dd></div><div><dt>舒適接待量／座位上限</dt><dd>{event.safeCapacity}／{event.seatCapacity}</dd></div></dl></section><section><h3>熟客與體驗</h3><dl><div><dt>新來賓</dt><dd>{event.newGuests}</dd></div><div><dt>既有熟客留存</dt><dd>{event.retained}／{event.before.regulars} 位上場熟客</dd></div><div><dt>本次加入熟客</dt><dd>{event.newRegulars}</dd></div><div><dt>體驗回饋</dt><dd>{event.satisfaction}／100</dd></div></dl></section></div><ul className="season-notes">{event.notes.map((note, index) => <li key={index}>{note}</li>)}</ul><details className="season-lessons"><summary>展開本場決策與教學連結</summary><p>六場的前後差異不能單獨證明某項行動造成結果。</p>{event.lessons.length ? <ul>{event.lessons.map((lesson, index) => <li key={`${lesson.action}-${index}`}><strong>{lesson.concept}：</strong>{lesson.text}</li>)}</ul> : <p>本場未加入額外準備行動；基本配置和既有資產也會影響聚會。</p>}</details></div>;
}

function SeasonReport({ replay, onRestart, onShare }: { replay: SeasonReplay; onRestart: () => void; onShare: () => void }) {
  return <div className="season-report"><Heading kicker="六場經營報告 · 課堂情境模型" title="一路走來的選擇。"><p>比較每場的背景、配置、準備與體驗。六場有限觀察不能單靠一項數字判斷。</p></Heading><Assets assets={replay.assets} /><div className="season-table-wrap" tabIndex={0} role="region" aria-label="六場趨勢表，可捲動"><table><caption>六場趨勢與資源變化</caption><thead><tr><th scope="col">場次／主題</th><th scope="col">現金</th><th scope="col">熟客</th><th scope="col">口碑</th><th scope="col">到場／座位</th><th scope="col">熟客留存／上場熟客</th><th scope="col">結餘</th></tr></thead><tbody>{replay.events.map(event => <tr key={event.number}><th scope="row">{event.number}. {event.plan.theme === 'workshop' ? '工坊' : event.plan.theme === 'exhibition' ? '小展' : '初見午後'}</th><td>{event.after.cash}</td><td>{event.after.regulars}</td><td>{event.after.reputation}</td><td>{event.attendance}/{event.seatCapacity}</td><td>{event.retained}／{event.before.regulars} 位上場熟客</td><td>{event.profit >= 0 ? '+' : ''}{event.profit}</td></tr>)}</tbody></table></div><section className="season-report-decisions"><h3>逐場決策回顧</h3>{replay.events.map(event => <details key={event.number}><summary>第 {event.number} 場：{event.plan.actions.length ? event.plan.actions.map(id => seasonActions.find(action => action.id === id)?.title ?? id).join('、') : '沒有額外準備行動'}</summary><p>受眾：{seasonAudiences.find(audience => audience.id === event.plan.audience)?.title} · 主題：{seasonThemes.find(theme => theme.id === event.plan.theme)?.title} · 規模：{seasonScales.find(scale => scale.id === event.plan.scale)?.title}；行動成本 {event.costs.actions}。</p>{event.lessons.length > 0 ? <ul>{event.lessons.map((lesson, index) => <li key={`${lesson.action}-${index}`}><strong>{lesson.concept}：</strong>{lesson.text}</li>)}</ul> : <p>本場選擇不額外準備，保留資源給其他需要。</p>}</details>)}</section><Actions><button className="button secondary" onClick={onShare}>分享</button><button className="button primary" onClick={onRestart}>重新開始一季</button></Actions></div>;
}

export function SeasonOutcomePreview({ event }: { event: SeasonEvent }) { return <Outcome event={event} />; }
