import type { MarketingDecision, MarketingOption } from '../types';
import { Glyph, Portrait, TermButton, TermDefinition, TermText } from './GameUi';

interface Terms { activeTerm:string|null; onTerm:(name:string)=>void; closeTerm:()=>void }

export function DialoguePanel({question,index,titleId,onContinue,...terms}:{question:MarketingDecision;index:number;titleId:string;onContinue:()=>void}&Terms) {
  return <><span className="md-section-label">{question.time} · 決策 {index+1} / 6</span><div className="md-dialogue-person"><Portrait/><div><p>{question.role}</p><h2 id={titleId} tabIndex={-1} data-initial-focus>{question.speaker}</h2></div></div>
    {question.dialogue.map((text,i)=><p key={i} className="md-dialogue-copy"><TermText text={text} active={terms.activeTerm} onOpen={terms.onTerm}/></p>)}
    <TermDefinition name={terms.activeTerm} onClose={terms.closeTerm}/>
    {index===0&&<p className="md-note">有虛線的名詞可以點開，不影響你的選擇。</p>}
    <div className="md-dialogue-footer"><span>輕行品牌 · 新品上線日</span><button className="md-primary" onClick={onContinue}>我會怎麼做？ <Glyph name="arrow"/></button></div>
  </>;
}

export function DecisionPanel({question,index,titleId,selected,onSelect,onConfirm,onPrevious,...terms}:{
  question:MarketingDecision;index:number;titleId:string;selected:string|null;onSelect:(id:string)=>void;onConfirm:()=>void;onPrevious:()=>void;
}&Terms) {
  return <><div className="md-panel-top"><span className="md-step">決策 {String(index+1).padStart(2,'0')} <span>/ 06</span></span><span className="md-panel-time">{question.time}</span></div>
    <div className="md-speaker"><Portrait small/><div><strong>{question.speaker}</strong><span>{question.role}</span></div><span className="md-single">單選</span></div>
    <h2 id={titleId} tabIndex={-1} data-initial-focus>{question.title}</h2><p className="md-question-line">{question.question}</p>
    <div className="md-question-resources"><div className="md-term-chips">{question.terms.map(name=><TermButton key={name} name={name} active={terms.activeTerm} onOpen={terms.onTerm}/>)}</div>
      <details className="md-evidence" open={question.dimension==='data'}><summary>查看任務資料</summary><dl>{question.evidence.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></details>
    </div><TermDefinition name={terms.activeTerm} onClose={terms.closeTerm}/>
    <fieldset className="md-options"><legend className="sr-only">選擇你的做法</legend>{question.options.map((option,i)=><label key={option.id} className={`md-option ${selected===option.id?'is-selected':''}`}><input type="radio" name="marketing-decision" aria-label={option.label} checked={selected===option.id} onChange={()=>onSelect(option.id)}/><span className="md-option-letter" aria-hidden="true">{String.fromCharCode(65+i)}</span><span>{option.label}</span><span className="md-option-check" aria-hidden="true">{selected===option.id?'✓':''}</span></label>)}</fieldset>
    <div className="md-decision-footer"><div>{index>0&&<button className="md-previous" aria-label="上一頁" onClick={onPrevious}>← 上一頁</button>}<p>{selected===null?'先選一個做法，再確認。':'確認前，都可以改選。'}</p></div><button className="md-primary" disabled={selected===null} onClick={onConfirm}>確認選擇 <Glyph name="arrow"/></button></div>
  </>;
}

export function FeedbackPanel({question,option,index,titleId,onNext,onReview}:{question:MarketingDecision;option:MarketingOption;index:number;titleId:string;onNext:()=>void;onReview:()=>void}) {
  return <><span className="md-section-label">{question.speaker}的回應 · 決策 {index+1} / 6</span><div className="md-feedback-symbol" aria-hidden="true">{option.score===2?'✓':'!'}</div>
    <h2 id={titleId} tabIndex={-1} data-initial-focus>{option.score===2?'方向，更清楚了。':option.score===1?'先把缺口補起來。':'這裡，值得停一下。'}</h2>
    <p className="md-feedback-copy">{option.feedback}</p><div className="md-term-example"><span>接著發生的事</span><p>{option.outcome}</p></div>
    <details className="md-feedback-explanation"><summary>這個情境，想練習什麼？</summary><p>{question.explanation}</p></details>
    <div className="md-panel-actions"><button className="md-secondary" onClick={onReview}>回看這個決策</button><button className="md-primary" onClick={onNext}>{index===5?'查看結果':'下一頁'} <Glyph name="arrow"/></button></div>
  </>;
}
