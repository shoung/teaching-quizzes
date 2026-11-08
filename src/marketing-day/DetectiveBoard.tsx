import { useEffect, useRef } from 'react';
import type { DetectiveChoice } from '../types';

export function DetectiveBoard({ choices, selectedIds, onToggle, onSubmit, onAsk, canAsk, onBack, round, total }: {
  choices: DetectiveChoice[]; selectedIds: string[]; onToggle: (id: string, selected: boolean) => void;
  onSubmit: () => void; onAsk: () => void; canAsk: boolean; onBack?: () => void; round: number; total: number;
}) {
  const root=useRef<HTMLElement>(null);
  const pendingFocus=useRef<string|null>(null);
  const movingId = useRef<string | null>(null);
  useEffect(()=>{
    const id=pendingFocus.current;if(!id)return;
    const button=[...root.current?.querySelectorAll<HTMLButtonElement>('[data-choice-action]')??[]].find(item=>item.dataset.choiceAction===id);
    if(button){button.focus();pendingFocus.current=null;}
  },[selectedIds]);
  const proposalIds=choices.filter(choice=>choice.kind==='proposal').map(choice=>choice.id);
  const hasProposal=proposalIds.some(id=>selectedIds.includes(id));
  const pools: [string, DetectiveChoice[]][] = [
    ['clues', choices.filter(choice => !selectedIds.includes(choice.id))],
    ['selected', choices.filter(choice => selectedIds.includes(choice.id))],
  ];
  function move(id: string, selected: boolean, focusId = id) {
    pendingFocus.current=focusId;
    if(selected&&proposalIds.includes(id))proposalIds.filter(other=>other!==id&&selectedIds.includes(other)).forEach(other=>onToggle(other,false));
    onToggle(id, selected);
  }
  return <section ref={root} className="dd-board" aria-labelledby="dd-board-title">
    <div className="dd-board-heading"><p id="dd-board-title">{proposalIds.length?'選一張主方案卡，再加入支持理由；換方案會移回原主方案。':`第 ${round+1} 輪／${total} 輪 · 拖曳或按「加入」整理判斷，至少選一項。`}</p></div>
    <div className="dd-pools">
      {pools.map(([pool, items]) => <section key={pool} className={`dd-pool dd-pool-${pool}`} aria-label={pool === 'clues' ? '線索池' : '我的判斷'} onDragOver={event => event.preventDefault()} onDrop={event => {
        event.preventDefault(); const id = event.dataTransfer.getData('text/plain') || movingId.current;
        if (id && choices.some(choice => choice.id === id)) move(id, pool === 'selected'); movingId.current = null;
      }}>
        <h3>{pool === 'clues' ? '線索池' : `我的判斷 · ${items.length}`}</h3>
        {items.length === 0 ? <p className="dd-pool-empty">{pool === 'clues' ? '線索已全部移入右側。' : '從左側挑選支持你判斷的線索。'}</p> : <ul>{items.map(choice => <li key={choice.id} draggable onDragStart={event => {movingId.current = choice.id; event.dataTransfer.setData('text/plain', choice.id); event.dataTransfer.effectAllowed = 'move';}} onDragEnd={() => {movingId.current = null;}}>
          <span className="dd-choice-label">{choice.label}</span><button type="button" data-choice-action={choice.id} aria-label={`${pool === 'clues' ? '加入判斷' : '移回線索池'}：${choice.label}`} onClick={() => move(choice.id, pool === 'clues')}>{pool === 'clues' ? '加入 →' : '← 移回'}</button>
        </li>)}</ul>}
      </section>)}
    </div>
    <div className="dd-board-actions">{onBack && <button type="button" className="dd-secondary" onClick={onBack}>回去追問</button>}<button type="button" className="dd-secondary" onClick={onAsk} disabled={!canAsk}>查看客戶筆記</button><button type="button" className="dd-primary" onClick={onSubmit} disabled={selectedIds.length === 0||(proposalIds.length>0&&(!hasProposal||!selectedIds.some(id=>!proposalIds.includes(id))))}>{round === total - 1 ? '提交並查看結算' : '提交本輪，進入下一輪'}</button></div>
  </section>;
}
