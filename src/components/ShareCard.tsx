import { useState } from 'react';
import sharing from '../data/sharing.json';
import type { Quiz } from '../types';
import { Icon } from './Icon';

export const shareLinks = sharing as Record<string, { longUrl: string; shortUrl: string; qrImage: string }>;

export function ShareCard({ quiz }: { quiz: Quiz }) {
  const link = shareLinks[quiz.id];
  const [message, setMessage] = useState('');
  if (!link) return null;
  async function copy() {
    try { await navigator.clipboard.writeText(link.shortUrl); setMessage('短網址已複製'); }
    catch { setMessage('請長按或選取上方短網址複製'); }
  }
  return <aside className="share-card" aria-label="課堂分享"><div className="share-card-copy"><span className="eyebrow" lang="en">SCAN. SHARE. START.</span><p>把這份測驗，分享給同學。</p><a className="short-url" href={link.shortUrl} title="開啟這份測驗（另開分頁）" target="_blank" rel="noopener noreferrer">{link.shortUrl.replace('https://', '')}</a><button className="copy-short-link" onClick={() => void copy()}><Icon name="share" />複製短網址</button><span className="copy-message" role="status">{message}</span></div><a className="qr-download" href={`${import.meta.env.BASE_URL}${link.qrImage}`} download={`${quiz.id}-qr.png`} aria-label={`掃描開始 下載 QR 圖片：${quiz.title}（PNG）`}><img src={`${import.meta.env.BASE_URL}${link.qrImage}`} alt={`${quiz.title}分享 QR code`} width="104" height="104" /><span>掃描開始</span><span>下載 QR 圖片</span></a></aside>;
}
