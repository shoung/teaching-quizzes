import { useState } from 'react';
import type { DetectiveCase, DetectiveResult } from '../types';

export function DetectiveResult({ result, detectiveCase, onRestart, onChapters }: {
  result: DetectiveResult; detectiveCase: DetectiveCase; onRestart: () => void; onChapters: () => void;
}) {
  const [section, setSection] = useState<'boss' | 'expert' | 'rounds'>('boss');
  const [confirmRestart, setConfirmRestart] = useState(false);
  return <section className="dd-result" aria-labelledby="dd-result-title">
    <p className="dd-eyebrow">五輪提案 · 教學角色回饋</p><h2 id="dd-result-title" tabIndex={-1} data-initial-focus>{confirmRestart?'重新接案？':`這次提案得到 ${result.score} 分`}</h2>
    {confirmRestart ? <><p className="dd-restart-copy">確認後只會重設第二章的本次進度；你可以取消並保留眼前結果。</p><footer className="dd-result-actions"><button type="button" className="dd-secondary" onClick={()=>setConfirmRestart(false)}>保留本次結果</button><button type="button" className="dd-primary" onClick={onRestart}>確認重新接案</button></footer></> : <>
    <div className="dd-score-strip"><strong>{result.grade}<small>等級</small></strong><strong>{result.score}<small>／100 分</small></strong><strong>{result.satisfaction.split('（')[0]}<small>老闆滿意度</small></strong></div>
    <p className="dd-counts">抓中 {result.totalHits} 項 · 誤選 {result.totalWrong} 項 · 漏掉 {result.totalMissed} 項</p>
    <nav className="dd-result-tabs" aria-label="結算內容">{(['boss','expert','rounds'] as const).map(item => <button key={item} type="button" aria-pressed={section === item} onClick={() => setSection(item)}>{item === 'boss' ? '老闆回應' : item === 'expert' ? '專家教學' : '逐輪解析'}</button>)}</nav>
    {section === 'boss' && <article className="dd-quote"><h3>{detectiveCase.clientName}｜{detectiveCase.brand}</h3><blockquote>「{result.bossComment.replace(/^【[^】]+】/,'')}」</blockquote><p>{result.satisfaction.split('（')[0]}</p></article>}
    {section === 'expert' && <article className="dd-quote"><h3>世界級行銷企劃專家｜教學角色</h3><blockquote>「{result.expertComment.replace(/^【[^】]+】/,'')}」</blockquote><p>以下是依本案線索設計的教學回饋，不代表真人評審或即時 AI。</p></article>}
    {section === 'rounds' && <div className="dd-round-review"><table><caption>各輪教學分數（每輪 20 分，共 100 分）</caption><thead><tr><th scope="col">輪次</th><th scope="col">分數</th><th scope="col">命中</th><th scope="col">誤選</th><th scope="col">漏選</th></tr></thead><tbody>{result.rounds.map((round, index) => <tr key={round.stageId}><th scope="row">{index + 1}. {round.title}</th><td>{round.points}／{round.maxPoints}</td><td>{round.hits.length}</td><td>{round.wrong.length}</td><td>{round.missed.length}</td></tr>)}</tbody></table><div className="dd-mobile-scores" aria-label="各輪得分">{result.rounds.map(round=><article key={round.stageId}><h3>{round.title}</h3><dl><dt>分數</dt><dd>{round.points}／{round.maxPoints}</dd><dt>命中</dt><dd>{round.hits.length}</dd><dt>誤選</dt><dd>{round.wrong.length}</dd><dt>漏選</dt><dd>{round.missed.length}</dd></dl></article>)}</div>{result.rounds.map((round,index) => {
      const stage=detectiveCase.stages[index];
      const evidenceLabel=(id:string) => stage.questions.find(question=>question.id===id)?.label ?? (()=>{const match=id.match(/(?:intro|opening|客戶)[-_]?(\d+)/i);const introIndex=match?Number(match[1])-1:-1;return introIndex>=0&&stage.intro[introIndex]?`客戶原句：「${stage.intro[introIndex]}」`:'本案相關客戶線索';})();
      return <details key={round.stageId}><summary>第 {index + 1} 輪解析 · {round.title}</summary><p><b>抓中的線索：</b>{round.hits.length ? round.hits.map(item => item.label).join('、') : '尚無'}</p><p><b>誤選的線索：</b>{round.wrong.length ? round.wrong.map(item => item.label).join('、') : '無'}</p><p><b>漏掉的線索：</b>{round.missed.length ? round.missed.map(item => item.label).join('、') : '無'}</p>{[...round.hits,...round.wrong,...round.missed].map(item => <article className="dd-choice-review" key={item.id}><p><b>{item.label}</b>：{item.explanation}</p><p className="dd-source-note"><b>線索來源：</b>{item.evidenceIds.length?item.evidenceIds.map(evidenceLabel).join('；'):'本輪客戶敘述'}</p></article>)}<p className="dd-source-note">本輪已問：{round.askedIds.length ? round.askedIds.map(id => stage.questions.find(question => question.id === id)?.label ?? id).join('、') : '無；依客戶開場敘述判斷'}</p></details>;
    })}</div>}
    <p className="dd-score-rule">計分方式：每輪 20 分，以命中正確線索數扣除誤選數後按本輪正確線索總數換算；漏選不加分，全選也會因誤選扣分。這是課堂練習規則。</p>
    <footer className="dd-result-actions"><button type="button" className="dd-secondary" onClick={onChapters}>選擇章節</button><button type="button" className="dd-primary" onClick={()=>setConfirmRestart(true)}>重新挑戰第二章</button></footer>
    </>}
  </section>;
}
