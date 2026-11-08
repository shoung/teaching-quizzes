import { useEffect, useId, useRef, useState } from 'react';
import type { Quiz } from '../types';
import type { ConsultingReport } from '../consulting-engine';
import { buildResultPost, canShareResult, createResultImage, shareResult } from '../result-sharing';
import { shareLinks } from './ShareCard';
import { Icon } from './Icon';
import './result-sharing.css';

type PreparedImage = { file: File; url: string };

export function ResultShareButton({ quiz, report }: { quiz: Quiz; report: ConsultingReport }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const imageRef = useRef<PreparedImage | null>(null);
  const alive = useRef(true);
  const titleId = useId();
  const introductionUrl = shareLinks[quiz.id]?.shortUrl ?? new URL(`#/quiz/${quiz.id}/1`, window.location.href).href;
  const [post, setPost] = useState(() => buildResultPost(quiz, report, introductionUrl));
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const title = `${quiz.title}｜我的闖關成果`;
  const nativeSharing = image ? canShareResult(image.file, title, post) : false;

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; if (imageRef.current) URL.revokeObjectURL(imageRef.current.url); };
  }, []);

  async function prepare() {
    if (imageRef.current || loading) return;
    setLoading(true); setError(''); setMessage('');
    try {
      const file = await createResultImage(quiz, report, introductionUrl);
      if (!alive.current) return;
      const next = { file, url: URL.createObjectURL(file) };
      imageRef.current = next; setImage(next);
    } catch { if (alive.current) setError('成果圖暫時無法製作，請重試；貼文文字仍可複製。'); }
    finally { if (alive.current) setLoading(false); }
  }
  function open() {
    dialog.current?.showModal();
    void prepare();
  }
  async function share() {
    if (!image || sharing) return;
    setSharing(true); setError(''); setMessage('');
    try {
      // No image generation or clipboard awaits before this call: it needs this click's activation.
      const outcome = await shareResult(image.file, title, post);
      if (!alive.current) return;
      setMessage(outcome === 'handed-off' ? '圖文已交給分享 App，請在 App 內確認並發布。'
        : outcome === 'cancelled' ? '已取消分享，成果仍保留在預覽中。'
          : '此瀏覽器無法一起分享圖文。請下載成果圖，再複製貼文到社群。');
    } catch { if (alive.current) setError('分享尚未完成。你可以下載成果圖，再複製貼文到社群。'); }
    finally { if (alive.current) setSharing(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(post); setMessage('貼文已複製，記得一併附上成果圖。'); }
    catch { setMessage('無法自動複製，請選取「貼文文字」欄位的內容，手動複製。'); }
  }

  return <>
    <button className="text-button" onClick={open}><Icon name="share" />分享測驗結果</button>
    <dialog ref={dialog} className="result-post-dialog" aria-labelledby={titleId} onClick={event => {
      if (event.target === event.currentTarget) {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
      }
    }}>
      <div className="result-post-heading"><div><span className="landing-kicker">把你的入場券，帶到社群</span><h2 id={titleId}>分享你的闖關成果</h2></div><button className="result-post-close" onClick={() => dialog.current?.close()} aria-label="關閉成果分享"><Icon name="close" /><span>關閉</span></button></div>
      <p className="result-post-intro">成果圖會附上本次分數與技能成績。貼文可以改成你的口吻，再選擇社群 App 分享。</p>
      <div className="result-post-layout"><div className="result-post-art" aria-busy={loading}>
        {loading && <p role="status">正在製作你的成果貼圖…</p>}
        {image && <img src={image.url} alt={`成果貼圖：${report.tier.label}，${report.score} / 100 分；${report.axes.map(axis => `${axis.name} ${axis.score} 分`).join('；')}。`} width="1200" height="1400" />}
        {!image && !loading && error && <button className="text-button" onClick={() => void prepare()}>重新製作成果圖</button>}
      </div><div className="result-post-compose"><label htmlFor={`${titleId}-text`}>貼文文字</label><textarea id={`${titleId}-text`} value={post} onChange={event => setPost(event.target.value)} rows={13} />
        <p className="result-post-help">{nativeSharing ? '按下分享後，請在系統面板選擇 App。部分 App 只接收圖片，可另外複製貼文文字。' : '也可以先下載成果圖、複製貼文，再到社群 App 貼上；不用登入本網站。'}</p>
        <div className="result-post-actions">
          {nativeSharing && <button className="button primary" disabled={sharing} onClick={() => void share()}><Icon name="share" />{sharing ? '正在開啟分享…' : '分享到社群'}</button>}
          {image && <a className="button secondary" href={image.url} download={image.file.name}>下載成果圖（PNG）</a>}
          <button className="text-button" disabled={!post.trim()} onClick={() => void copy()}>複製貼文</button>
        </div>
      </div></div>
      <p className="result-post-message" role="status">{message}</p>
      {error && <p className="result-post-error" role="alert">{error}</p>}
    </dialog>
  </>;
}
