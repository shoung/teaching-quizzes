import { useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { ActionId } from './season-types';
import type { SalonCardHandProps } from './rpg-types';
import './salon-card-hand.css';

const categoryLabels = { insight: '洞察', experience: '體驗', operations: '營運', growth: '成長' } as const;

export function SalonCardHand({ actions, selected, staffAvailable, onToggle, getIssue, reducedMotion, onInspect }: SalonCardHandProps) {
  const pendingFocus = useRef<ActionId | null>(null);
  const root = useRef<HTMLElement>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const prior = useRef(selected);

  useLayoutEffect(() => {
    const changed = pendingFocus.current;
    if (changed && prior.current.includes(changed) !== selected.includes(changed)) {
      root.current?.querySelector<HTMLButtonElement>(`[data-action-id="${changed}"]`)?.focus();
      pendingFocus.current = null;
    }
    prior.current = selected;
  }, [selected]);

  const inspect = (issue: string | null) => {
    onInspect?.();
    setStatusMessage(issue ?? '');
  };
  const toggle = (id: ActionId) => {
    pendingFocus.current = id;
    onToggle(id);
  };
  const focusNeighbor = (event: KeyboardEvent<HTMLButtonElement>, id: ActionId, issue: string | null) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (issue) { setStatusMessage(issue); return; }
      toggle(id);
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const hand = event.currentTarget.closest('.salon-card-hand-list');
    const cards = Array.from(hand?.querySelectorAll<HTMLButtonElement>('.salon-card-hand-card') ?? []);
    const index = cards.indexOf(event.currentTarget);
    const next = cards[index + (event.key === 'ArrowRight' ? 1 : -1)];
    if (next) { event.preventDefault(); next.focus(); }
  };
  const selectedActions = actions.filter(action => selected.includes(action.id));
  const handActions = actions.filter(action => !selected.includes(action.id));

  return <section className={`salon-card-hand${reducedMotion ? ' salon-card-hand-reduced' : ''}`} ref={root} aria-label="本場經營卡牌">
    <div className="salon-card-selected" role="group" aria-label="已選牌池">
      <div className="salon-card-selected-heading"><div><span className="salon-card-eyebrow">本場選擇</span><strong>已選牌池</strong></div><span>{selectedActions.reduce((sum, action) => sum + action.cost, 0)} 點經費・已安排 {selectedActions.reduce((sum, action) => sum + action.staff, 0)}／{staffAvailable} 位助手</span></div>
      <div className="salon-card-selected-list">
        {selectedActions.length ? selectedActions.map(action => <button key={action.id} type="button" data-action-id={action.id} className={`salon-card-picked salon-card-category-${action.category}`} aria-label={`移回手牌：${action.title}`} onClick={() => toggle(action.id)} onFocus={onInspect}><span>{categoryLabels[action.category]}</span><strong>{action.title}</strong><small>{action.cost} 點・{action.staff ? `${action.staff} 位助手` : '克萊爾辦理'}</small></button>) : <p className="salon-card-empty">選擇卡牌後會放在這裡</p>}
      </div>
    </div>
    <div className="salon-card-hand-heading"><div><span className="salon-card-eyebrow">點選卡牌加入上方牌池</span><strong>經營卡牌</strong></div><span>{handActions.length} 張可選</span></div>
    <div className="salon-card-hand-scroll" role="region" tabIndex={0} aria-label="可選經營卡牌，使用左右方向鍵瀏覽">
      <div className="salon-card-hand-list">
        {handActions.map((action, index) => {
          const issue = getIssue(action.id);
          return <button key={action.id} type="button" data-action-id={action.id} className={`salon-card-hand-card salon-card-category-${action.category}`} style={{ zIndex: index + 1 }} aria-label={`選擇：${action.title}`} aria-disabled={issue ? 'true' : undefined} aria-describedby={issue ? `salon-card-issue-${action.id}` : undefined} onClick={() => { if (issue) { setStatusMessage(issue); return; } toggle(action.id); }} onFocus={() => inspect(issue)} onMouseEnter={() => inspect(issue)} onKeyDown={event => focusNeighbor(event, action.id, issue)}>
            <span className="salon-card-category-label">{categoryLabels[action.category]}</span><strong className="salon-card-title">{action.title}</strong>
            <span className="salon-card-expanded"><span className="salon-card-price">費用 {action.cost} 點・{action.staff ? `需 ${action.staff} 位助手` : '克萊爾辦理'}</span><span><b>會做什麼</b>{action.basis}</span><span><b>要留意</b>{action.tradeoff}</span><span><b>經營知識</b>{action.concept}</span></span>
            {issue && <span id={`salon-card-issue-${action.id}`} className="salon-card-issue">{issue}</span>}
          </button>;
        })}
      </div>
    </div>
    <p className="salon-card-live" role="status" aria-live="polite">{statusMessage}</p>
  </section>;
}
