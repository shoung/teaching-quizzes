import { useRef, useState } from 'react';
import { marketingTerms } from '../data/marketing-day';

export function Glyph({name}:{name:'book'|'chapters'|'close'|'arrow'|'help'|'volume'|'mute'}) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    {name==='book'?<><path d="M12 5v15M3 4l9 2 9-2v15l-9 2-9-2z"/><path d="M6 8l3 .5m6 0 3-.5"/></>:
      name==='chapters'?<><rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/><path d="M7 7h10M7 17h10"/></>:
      name==='close'?<path d="m6 6 12 12M6 18 18 6"/>:
      name==='arrow'?<path d="M4 12h15m-6-6 6 6-6 6"/>:
      name==='help'?<><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3 2.5L12 14m0 3v.1"/></>:
      <><path d="M10 4 5 8H2v8h3l5 4z"/>{name==='volume'?<path d="M14 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>:<path d="m15 9 6 6m0-6-6 6"/>}</>}
  </svg>;
}

export function Portrait({small=false}:{small?:boolean}) {
  return <span className={`md-portrait ${small?'md-portrait-small':''}`} aria-hidden="true"><i/><b/><em/></span>;
}

export function TermButton({name,active,onOpen}:{name:string;active:string|null;onOpen:(name:string)=>void}) {
  return <button className="md-term-button" aria-expanded={active===name} aria-controls={active===name?'md-term-definition':undefined} onClick={()=>onOpen(name)}>{name}</button>;
}

export function TermText({text,active,onOpen}:{text:string;active:string|null;onOpen:(name:string)=>void}) {
  return <>{text.split(/(\[\[[^\]]+\]\])/g).map((part,index)=>part.startsWith('[[')
    ? <TermButton key={index} name={part.slice(2,-2)} active={active} onOpen={onOpen}/>
    : part)}</>;
}

export function TermDefinition({name,onClose}:{name:string|null;onClose:()=>void}) {
  const term=marketingTerms.find(t=>t.name===name);
  if(!term)return null;
  return <aside id="md-term-definition" className="md-term-definition" aria-label={`${term.name} 名詞解釋`}>
    <div className="md-term-definition-head"><strong>{term.name} · {term.zh}</strong><button aria-label="關閉名詞解釋" className="md-icon-button" onClick={onClose}><Glyph name="close"/></button></div>
    <p>{term.meaning}</p><p>{term.example}</p><p className="md-note">留意：{term.caution}</p>
  </aside>;
}

export function GameGlossary({titleId}:{titleId:string}) {
  const [filter,setFilter]=useState('全部');
  const [active,setActive]=useState('KPI');
  const term=marketingTerms.find(t=>t.name===active)!;
  const detail=useRef<HTMLDivElement>(null);
  return <><span className="md-section-label">工作中，隨時查一下</span><h2 id={titleId} tabIndex={-1} data-initial-focus>行銷圖鑑</h2>
    <div className="md-term-filters" role="group" aria-label="名詞分類">{['全部','方向','素材','數據'].map(item=><button key={item} aria-pressed={filter===item} onClick={()=>{
      setFilter(item);if(item!=='全部'&&term.group!==item)setActive(marketingTerms.find(t=>t.group===item)!.name);
    }}>{item}</button>)}</div>
    <div className="md-glossary"><div className="md-term-list" role="group" aria-label="行銷名詞">{marketingTerms.filter(t=>filter==='全部'||t.group===filter).map(t=><button key={t.name} aria-pressed={active===t.name} onClick={()=>{setActive(t.name);detail.current?.scrollIntoView?.({block:'nearest'});}}><span>{t.name}</span><span>{t.zh}</span></button>)}</div>
      <div className="md-term-detail" ref={detail} aria-live="polite"><span className="md-term-abbreviation">{term.name}</span><h3>{term.zh}</h3><p>{term.meaning}</p><div className="md-term-example"><span>放進今天的情境</span><p>{term.example}</p></div><p className="md-term-caution">留意：{term.caution}</p></div>
    </div>
  </>;
}
