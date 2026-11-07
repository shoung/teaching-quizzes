import type { Quiz, Session } from '../types';
import { getResult, matchesReference } from '../quiz-engine';
import { dimensions } from '../data/chromatic';
import { Icon } from './Icon';

export function ResultPage({ quiz, session, onRestart, onShare }: { quiz: Quiz; session: Session; onRestart: () => void; onShare: () => void }) {
  const result = getResult(quiz, session);
  if (!result) return null;
  const assessment = quiz.mode === 'assessment';
  const dimensionResults = dimensions.map((dimension) => {
    const items = quiz.questions.map((q, i) => ({ q, answer: session.answers[i] })).filter(({ q }) => q.dimension === dimension.id);
    const scored = items.filter(({ q }) => !q.reflection);
    const matched = scored.filter(({ q, answer }) => matchesReference(q, answer)).length;
    return { ...dimension, total: scored.length, matched, score: scored.length ? Math.round(matched / scored.length * 100) : null, items };
  });
  const ranked = dimensionResults.filter((d) => d.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const nextStep = ranked[ranked.length - 1];
  const tier = result.score >= 80 ? '細節觀察者' : result.score >= 50 ? '色彩探索者' : '視覺新旅人';
  const summary = result.score >= 80 ? '你已能在多數參考題中辨識細節。接下來，試著把這份觀察力轉成有意識的創作選擇。' : result.score >= 50 ? '你已累積一些色彩觀察經驗。透過固定條件的比較與練習，可以把偶然的直覺變成穩定的理解。' : '你已完成第一輪色彩探索。從一組相近色、一次明暗比較開始，每次多看見一點，就是進步。';

  return <div className="result-page page-width">
    <section className="result-hero"><span className="result-complete"><Icon name="check" />{quiz.questions.length} 道題目，探索完成</span><span className="eyebrow">A LITTLE MORE UNDERSTANDING</span><h1 id="page-title" tabIndex={-1}>{assessment ? '你的色彩，自有光芒。' : '每一步，都算進步。'}</h1><p>{assessment ? '把直覺變成理解，從這份屬於你的觀察筆記開始。' : '帶著新的理解，繼續下一段學習旅程。'}</p></section>
    <section className="result-summary"><div className="score-circle" style={{ '--score': `${result.score}%` } as React.CSSProperties}><div><span className="score-value" aria-label="測驗分數">{result.score}<small>%</small></span><span>{assessment ? '教學參考符合度' : '本次測驗分數'}</span></div></div><div className="result-summary-copy"><span className="eyebrow">{assessment ? 'YOUR OBSERVATION NOTES' : quiz.title}</span><h2>{assessment ? tier : result.score === 100 ? '這次的理解，很完整。' : '再多理解一點，就更靠近了。'}</h2><p>{assessment ? summary : '每個答案都是一次檢視理解的機會。往下看看逐題解析，找出下一個可以練習的地方。'}</p><span className="result-total">{assessment ? `參考吻合 ${result.correct} / ${result.total} 題 · ${quiz.questions.length - result.total} 題為個人感受，不計對錯` : `答對 ${result.correct} / ${result.total} 題`}</span></div><span className="result-flower" aria-hidden="true">✳</span></section>
    {assessment && <>
      <section className="dimension-results"><div className="section-heading"><div><span className="eyebrow">FOUR WAYS OF SEEING</span><h2>四個面向，看見你的觀察方式</h2></div></div><div className="dimension-grid">{dimensionResults.map((d, i) => <article className={`dimension-card dimension-${d.id}`} key={d.id}><span className="dimension-number">0{i + 1}</span><h3>{d.name}</h3><p>{d.description}</p>{d.score === null ? <div className="dimension-reflection"><Icon name="spark" />已記錄 {d.items.length} 題感受<small>{d.id === 'psychology' ? '你的情緒聯想，值得被理解' : '你的配色偏好，可以有自己的理由'}</small></div> : <><div className="dimension-score"><b>{d.score}<small>%</small></b><span>{d.matched} / {d.total} 題符合參考</span></div><progress value={d.score} max={100} aria-label={`${d.name}參考符合度`} /></>}<p className="dimension-practice">{d.practice}</p></article>)}</div></section>
      <section className="next-step"><div className="next-step-icon"><Icon name="spark" /></div><div><span className="eyebrow">YOUR NEXT SMALL STEP</span><h2>{nextStep ? `下一次，從「${nextStep.name}」開始` : '下一次，把觀察帶進生活裡'}</h2><p>{nextStep?.practice}</p><p className="next-step-sub">試著與同學比較不同答案，說出你看見了什麼、為什麼這樣選。理解差異，也是學習的一部分。</p></div></section>
      <section className="personal-notes"><span className="eyebrow">A NOTE TO YOURSELF</span><h2>你選擇的，是你此刻的風景。</h2><div className="reflection-selections">{[16, 20, 26].map((index) => { const q = quiz.questions[index]; const answer = session.answers[index]; const selection = Array.isArray(answer) ? answer : answer === null ? [] : [answer]; return <div key={q.id}><span>QUESTION {index + 1}</span><h3>{q.prompt}</h3><p>你的選擇：{selection.map((i) => q.options[i]).join('、')}</p>{q.optionImages?.[selection[0]] && <img loading="lazy" src={`${import.meta.env.BASE_URL}${q.optionImages[selection[0]]}`} alt="你選擇的心境照片" />}<small>{q.explanation}</small></div>; })}</div></section>
    </>}
    <section className="answer-review"><div className="section-heading"><div><span className="eyebrow">LOOK A LITTLE CLOSER</span><h2>把理解再加深一點</h2></div><p>展開每道題目，回顧答案與教學筆記。</p></div>{quiz.questions.map((q, i) => {
      const answer = session.answers[i];
      const selected = Array.isArray(answer) ? answer : answer === null ? [] : [answer];
      const matched = matchesReference(q, answer);
      const reference = q.referenceAnswers ?? (q.correctAnswer !== undefined ? [q.correctAnswer] : []);
      return <details className="review-item" key={q.id}><summary><span className="review-number">{(i + 1).toString().padStart(2, '0')}</span><span>{q.prompt}</span><span className={`review-status ${q.reflection ? 'reflection' : matched ? 'matched' : 'learn'}`}>{q.reflection ? '個人感受' : matched ? assessment ? '符合參考' : '答對了' : '再看一眼'}</span><span className="review-expand" aria-hidden="true">+</span></summary><div className="review-content"><p><strong>你的答案：</strong>{selected.map((n) => q.options[n]).join('、')}</p>{!q.reflection && <p><strong>{assessment ? '教學參考：' : '正確答案：'}</strong>{reference.map((n) => q.options[n]).join('、')}</p>}<p className="review-explanation">{q.explanation}</p>{q.images?.map((image) => <img className="review-image" loading="lazy" key={image} src={`${import.meta.env.BASE_URL}${image}`} alt={`第 ${i + 1} 題觀察圖片`} />)}{q.optionImages?.some(Boolean) && <div className="review-image-options">{q.optionImages.map((image, n) => image && <figure key={image}><img loading="lazy" src={`${import.meta.env.BASE_URL}${image}`} alt={`選項 ${q.options[n]}`} /><figcaption>{q.options[n]}{selected.includes(n) ? ' · 你的選擇' : ''}</figcaption></figure>)}</div>}</div></details>;
    })}</section>
    {assessment && <aside className="assessment-note"><h3>關於這份教學回饋</h3><p>結果依本次作答與原題公開參考選項整理；主觀偏好題保留你的感受，未納入分數。每道參考題等權計算，複選須完整符合且不多選。四個面向的評價、解析與練習建議由本教學版設計。</p><p>這是一份色彩觀察練習；螢幕、亮度與環境光會影響感知，結果僅反映這次練習。標準化 FM100 測試需使用指定工具與測試條件。</p></aside>}
    <div className="result-actions"><button className="button primary" onClick={onRestart}><Icon name="refresh" />重新測驗</button><a className="button secondary" href="#/">返回測驗目錄</a><button className="text-button" onClick={onShare}><Icon name="share" />分享這份測驗</button><button className="text-button print-button" onClick={() => window.print()}>列印學習筆記</button></div>
  </div>;
}
