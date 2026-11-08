import { useState } from 'react';
import type { MarketingResult } from '../types';
import { Glyph } from './GameUi';

export default function GameResult({result,titleId,onRestart,onShare}:{result:MarketingResult;titleId:string;onRestart:()=>void;onShare:()=>void}) {
  const [reviewIndex,setReviewIndex]=useState(0);
  const item=result.review[reviewIndex];
  const radarPoint=(index:number,value:number)=>{
    const angle=Math.PI*2*index/3-Math.PI/2;
    return `${125+Math.cos(angle)*90*value/100},${110+Math.sin(angle)*90*value/100}`;
  };
  const polygon=(values:number[])=>values.map((score,i)=>radarPoint(i,score)).join(' ');
  return <><span className="md-section-label">18:00 · 下班之前</span><h2 id={titleId} tabIndex={-1} data-initial-focus>{result.title}</h2><p className="md-result-intro">{result.summary}</p>
    <div className="md-result-summary"><div className="md-result-score"><strong aria-label="教學參考分數">{result.score}<span>/100</span></strong><p>教學參考分數</p><span>{result.highestCount} / 6 題達最高參考分</span></div>
      <div className="md-mini-radar"><svg viewBox="0 0 250 220" role="img" aria-label="三面向雷達圖，數值見下方分數表"><desc>{result.axes.map(a=>`${a.label} ${a.score} 分`).join('；')}</desc><g fill="none" stroke="#536970">{[25,50,75,100].map(n=><polygon key={n} points={polygon([n,n,n])}/>)}{result.axes.map((axis,i)=><line key={axis.id} x1="125" y1="110" x2={radarPoint(i,100).split(',')[0]} y2={radarPoint(i,100).split(',')[1]}/>)}</g><polygon points={polygon(result.axes.map(a=>a.score))} fill="#d5b66d" fillOpacity=".23" stroke="#e3c57f" strokeWidth="2.5"/>{result.axes.map((axis,i)=><circle key={axis.id} cx={radarPoint(i,axis.score).split(',')[0]} cy={radarPoint(i,axis.score).split(',')[1]} r="4" fill="#efd79a"/>)}</svg></div>
    </div>
    <table className="md-score-table"><caption className="sr-only">三面向能力分數</caption><thead><tr><th scope="col">面向</th><th scope="col">參考分數</th></tr></thead><tbody>{result.axes.map(axis=><tr key={axis.id}><th scope="row">{axis.label}</th><td>{axis.score} / 100 <span className="md-axis-points">（{axis.points} / {axis.maxPoints}）</span></td></tr>)}</tbody></table>
    <details className="md-result-review"><summary>逐題回顧</summary><div className="md-review-numbers" role="group" aria-label="選擇回顧題目">{result.review.map((row,i)=><button key={row.decision.id} aria-label={`回顧第 ${i+1} 題`} aria-pressed={reviewIndex===i} onClick={()=>setReviewIndex(i)}>{i+1}</button>)}</div>
      <div className="md-review-detail" aria-live="polite"><span className="md-step">決策 {reviewIndex+1} · {item.selected.score} / 2 分</span><h3>{item.decision.title}</h3><p><strong>你的選擇：</strong>{item.selected.label}</p><p>{item.selected.feedback}</p><p><strong>教學參考做法：</strong>{item.reference.label}</p><p>{item.decision.explanation}</p></div>
    </details>
    <details className="md-result-review"><summary>下一次，先練習這兩件事</summary><ol className="md-practice-list">{result.practice.map(text=><li key={text}>{text}</li>)}</ol></details>
    <details className="md-result-review"><summary>這份回顧怎麼計分？</summary><p>每題 0–2 分：2 分完整處理關鍵條件，1 分方向部分合理但有遺漏，0 分忽略關鍵證據或風險。你得到 {result.points} / {result.maxPoints} 分，再換算成 100 分。</p><p>三個面向各有兩題，各依自身滿分 4 分換算。最高參考分題數指得 2 分的題數。這是課堂情境參考，不是工作能力診斷、錄取機率或實際業績預測。</p></details>
    <div className="md-panel-actions"><button className="md-secondary" onClick={onRestart}>重新上班</button><button className="md-primary" onClick={onShare}>分享遊戲 <Glyph name="arrow"/></button></div>
  </>;
}
