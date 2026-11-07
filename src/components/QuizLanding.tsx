import type { Quiz, Session } from '../types';
import { ShareCard } from './ShareCard';
import { Icon } from './Icon';
import { consultingDimensions, consultingStages } from '../data/consulting';

export function QuizLanding({ quiz, session, onStart, onResume, onResult }: {
  quiz: Quiz; session: Session; onStart: () => void; onResume: () => void; onResult: () => void;
}) {
  const adventure = quiz.mode === 'consulting';
  const hasProgress = session.answers.some((a) => a !== null) && !session.completed;
  return <div className={`quiz-landing ${adventure ? 'adventure-landing' : 'color-landing'}`}>
    <section className="landing-hero">
      <div className="landing-copy">
        <span className="landing-kicker">{adventure ? '顧問入場闖關 / 你的面試前哨站' : '從觀察開始 / 發現你的色彩直覺'}</span>
        <h2 id="page-title" tabIndex={-1}>{adventure ? '你的顧問入場券，準備好了嗎？' : '你的眼裡，藏著哪一種色彩天賦？'}</h2>
        <p className="landing-lead">{adventure ? '不必穿西裝，也不用背商業黑話。帶著你的腦袋和一位 AI 隊友，挑戰 28 道小關卡，看看你離麥肯錫式的思考門檻還有幾步。' : '有些顏色一眼就認得，有些搭配就是說不出的喜歡。透過色塊、照片與生活選擇，看看你的觀察力，也留下一份自己的色彩偏好。'}</p>
        <ul className="landing-facts" aria-label="測驗資訊"><li><strong>{quiz.questions.length}</strong> 道挑戰</li><li>約 <strong>{quiz.minutes}</strong> 分鐘</li><li>免登入 · 立即看結果</li></ul>
        <div className="landing-actions"><button className="button primary" onClick={hasProgress ? onResume : onStart}>{hasProgress ? '繼續測驗' : '開始測驗'}<Icon name="arrow" /></button>{hasProgress && <button className="text-button" onClick={onStart}>重新開始</button>}{session.completed && <button className="text-button" onClick={onResult}>查看上次結果</button>}</div>
        {hasProgress && <p className="landing-progress">這個瀏覽器保留了你的答案，繼續就能接著挑戰。</p>}
        <p className="landing-fine">{adventure ? '趣味模擬，非官方招募。結果是本次闖關表現與練習方向。' : '不蒐集姓名或 Email；個人感受題不計對錯。'}</p>
      </div>
      <figure className="landing-art"><img src={`${import.meta.env.BASE_URL}${adventure ? 'images/ai-consulting/hero.webp' : quiz.cover}`} alt={adventure ? '大學生與 AI 隊友拿著入場券，走向顧問挑戰的大門' : '用色彩與日常影像開啟觀察之旅'} /><figcaption>{adventure ? '一張入場券，六種超能力。' : '沒有標準喜好，只有你的色彩。'}</figcaption></figure>
    </section>
    {adventure ? <section className="landing-stages"><div className="landing-section-intro"><span className="landing-kicker">今天的闖關路線</span><h2>從「等等，讓我想一下」到「這題我來」。</h2><p>六項能力穿插出場。不比誰會背名詞，比誰看得清楚、想得有道理。</p></div><ol>{consultingStages.map((stage,i)=><li key={stage.id}><img src={`${import.meta.env.BASE_URL}images/ai-consulting/${stage.art}.webp`} alt="" loading="lazy" /><span>第 {i+1} 站 · {stage.range}</span><h3>{stage.name}</h3><p>{stage.teaser}</p></li>)}</ol><div className="landing-skills" aria-label="六項能力">{consultingDimensions.map((d)=><span key={d.id}>{d.name}</span>)}</div></section> : <section className="color-intro"><h2>這趟色彩探索，怎麼玩？</h2><ol><li><strong>慢慢看。</strong>每頁一題，照片可放大，選好再往下走。</li><li><strong>放心選。</strong>有知識參考題，也有單純記錄感受的題目。</li><li><strong>讀懂自己。</strong>完成後直接查看雷達圖、解析與偏好紀錄。</li></ol><p>觀察前，建議關閉護眼／夜間模式，並保持螢幕亮度穩定。螢幕顯色可能影響參考結果。</p></section>}
    <section className="landing-share"><div><span className="landing-kicker">一起挑戰</span><h2>把這一頁，帶進教室。</h2><p>短網址和 QR code 都會開啟這份介紹頁。每位同學的答案只留在自己的瀏覽器。</p></div><ShareCard quiz={quiz} /></section>
  </div>;
}
