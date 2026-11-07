import { useEffect, useRef, useState } from 'react';
import { quizzes } from './data/quizzes';
import { Catalog } from './components/Catalog';
import { QuizLanding } from './components/QuizLanding';
import { QuizPage } from './components/QuizPage';
import { ResultPage } from './components/ResultPage';
import { Icon } from './components/Icon';
import { shareLinks } from './components/ShareCard';
import { newSession, restoreSession, resumeQuestion } from './quiz-engine';
import type { Quiz, Session } from './types';

export const quizPath = (quiz: Quiz, page: number | 'result') => `#/quiz/${quiz.id}/${page === 'result' ? 'result' : `play/${page}`}`;
export const landingPath = (quiz: Quiz) => `#/quiz/${quiz.id}/1`;
const storageKey = (quiz: Quiz) => `learning-lab:quiz:${quiz.id}:v${quiz.version}`;

export function navigate(hash: string, replace = false) {
  if (window.location.hash === hash) return;
  window.history[replace ? 'replaceState' : 'pushState'](null, '', hash);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function loadSessions(): Record<string, Session> {
  const sessions: Record<string, Session> = {};
  for (const quiz of quizzes) {
    try {
      const saved = restoreSession(JSON.parse(localStorage.getItem(storageKey(quiz)) ?? 'null'), quiz);
      if (saved) sessions[quiz.id] = saved;
    } catch { /* A missing or blocked browser store must never prevent a quiz. */ }
  }
  return sessions;
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash || '#/');
  const [sessions, setSessions] = useState(loadSessions);
  const [shareMessage, setShareMessage] = useState('');
  const previousHash = useRef<string | null>(null);
  const route = /^#\/quiz\/([a-z0-9-]+)\/(play\/[1-9]\d*|[1-9]\d*|result)$/.exec(hash);
  const quiz = route ? quizzes.find((q) => q.id === route[1]) : undefined;
  const session = quiz ? sessions[quiz.id] ?? newSession(quiz) : undefined;
  const isHome = hash === '#/' || hash === '#' || !hash;
  const requested = route?.[2];
  const isLanding = requested === '1';
  const resume = session ? resumeQuestion(session) : 0;
  const index = requested && requested !== 'result' ? Math.min(Number(requested.replace('play/', '')) - 1, resume) : resume;
  const canonical = quiz && session && !isLanding ? quizPath(quiz, session.completed ? 'result' : index + 1) : null;

  useEffect(() => {
    const sync = () => { setHash(window.location.hash || '#/'); setShareMessage(''); };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => { if (canonical && canonical !== hash) navigate(canonical, true); }, [canonical, hash]);
  useEffect(() => {
    document.title = quiz ? `${quiz.title}｜${isLanding ? '測驗介紹' : session?.completed ? '測驗結果' : `第 ${index + 1} / ${quiz.questions.length} 題`}`
      : isHome ? '學習小測所｜讓理解多走一步' : '測驗網址確認';
    if (previousHash.current !== null && previousHash.current !== hash) {
      document.getElementById('page-title')?.focus();
    }
    previousHash.current = hash;
  }, [hash, quiz, isHome, session?.completed, isLanding, index]);

  function updateSession(activeQuiz: Quiz, next: Session) {
    setSessions((previous) => ({ ...previous, [activeQuiz.id]: next }));
    try { localStorage.setItem(storageKey(activeQuiz), JSON.stringify(next)); } catch { /* Keep in-memory progress. */ }
  }
  async function shareQuiz(activeQuiz: Quiz) {
    const url = new URL(window.location.href);
    url.hash = landingPath(activeQuiz).slice(1);
    try {
      await navigator.clipboard.writeText(shareLinks[activeQuiz.id]?.shortUrl ?? url.href);
      setShareMessage('測驗連結已複製，可分享給同學');
    } catch { setShareMessage(`請複製網址：${url.href}`); }
  }


  return <div className={quiz?.mode === 'consulting' ? 'adventure-theme' : undefined}>
    <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>跳至主要內容</a>
    {isHome ? <header className="site-header"><a className="brand" href="#/" onClick={(e) => { e.preventDefault(); navigate('#/'); }}><span className="brand-mark"><Icon name="book" /></span><span>學習小測所<small lang="en">A LITTLE TEST, A LITTLE GROWTH.</small></span></a><nav aria-label="主導覽"><a className="nav-link active" href="#/" onClick={(e) => { e.preventDefault(); navigate('#/'); }}>測驗目錄</a><span className="header-note"><span />為好奇心，留一點時間</span></nav></header>
      : <header className="quiz-header"><div className="quiz-heading"><span className="brand-mark"><Icon name={quiz?.icon ?? 'book'} /></span><h1>{quiz?.title ?? '測驗網址確認'}</h1></div>{quiz && <button className="share-button" onClick={() => void shareQuiz(quiz)}><Icon name="share" />分享測驗</button>}</header>}
    <div className={shareMessage ? 'share-message' : 'sr-only'} role="status" aria-live="polite">{shareMessage}</div>
    <main id="main-content" tabIndex={-1}>
      {isHome ? <Catalog sessions={sessions} onStart={(q) => navigate(landingPath(q))} /> : quiz && session ? isLanding ? <QuizLanding quiz={quiz} session={session} onStart={() => { updateSession(quiz, newSession(quiz)); navigate(quizPath(quiz, 1)); }} onResume={() => navigate(quizPath(quiz, resume + 1))} onResult={() => navigate(quizPath(quiz, 'result'))} /> : session.completed
        ? <ResultPage quiz={quiz} session={session} onRestart={() => { updateSession(quiz, newSession(quiz)); navigate(landingPath(quiz)); }} onShare={() => void shareQuiz(quiz)} />
        : <QuizPage key={`${quiz.id}-${index}`} quiz={quiz} session={session} index={index} onAnswer={(answer) => { const answers = [...session.answers]; answers[index] = answer; updateSession(quiz, { ...session, answers }); }} onPrevious={() => navigate(quizPath(quiz, index))} onNext={() => {
          if (session.answers[index] === null) return;
          if (index === quiz.questions.length - 1) { updateSession(quiz, { ...session, completed: true }); navigate(quizPath(quiz, 'result')); }
          else navigate(quizPath(quiz, index + 2));
        }} />
        : <section className="not-found"><span className="eyebrow" lang="en">CHECK YOUR QUIZ LINK</span><h2 id="page-title" tabIndex={-1}>這份測驗還沒準備好</h2><p>請確認老師提供的測驗網址是否完整，或重新掃描這份測驗的 QR code。</p><button className="button primary" onClick={() => window.location.reload()}>重新載入 <Icon name="refresh" /></button></section>}
    </main>
    {isHome ? <footer className="site-footer"><span><Icon name="book" /> 學習小測所</span><p>測驗是探索的起點，每一次理解都值得被看見。</p><small>為學習而設計 · 不蒐集個人資料</small></footer>
      : <footer className="quiz-footer"><p>{quiz?.title ?? '測驗網址確認'}</p><small>本測驗的答案僅保存在此瀏覽器，不蒐集姓名或 Email。</small></footer>}
  </div>;
}
