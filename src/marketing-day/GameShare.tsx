import { useState } from 'react';
import sharing from '../data/sharing.json';
import { Glyph } from './GameUi';

export default function GameShare({titleId}:{titleId:string}) {
  const [message,setMessage]=useState('');
  const link=(sharing as Record<string,{longUrl:string;shortUrl:string;qrImage:string}>)['marketing-day'];
  const local=['localhost','127.0.0.1'].includes(window.location.hostname);
  const playUrl=new URL(window.location.href);playUrl.hash='/quiz/marketing-day/1';playUrl.search='';
  const url=local?playUrl.href:link?.shortUrl??playUrl.href;
  async function copy(){try{await navigator.clipboard.writeText(url);setMessage(local?'本機試玩網址已複製，只能在同一台電腦開啟。':'遊戲連結已複製');}catch{setMessage(`請選取並複製：${url}`);}}
  return <><span className="md-section-label">分享這個上線日</span><h2 id={titleId} tabIndex={-1} data-initial-focus>換下一位，坐上這個位子。</h2>
    <p className="md-note">分享只包含介紹頁，不會帶出你的答案或分數。</p>
    <label className="md-share-url-label" htmlFor="md-share-url">{local?'本機試玩網址':'遊戲連結'}</label><input id="md-share-url" className="md-share-url" readOnly value={url} onFocus={e=>e.currentTarget.select()}/>
    <button className="md-primary" onClick={()=>void copy()}>複製{local?'試玩網址':'連結'} <Glyph name="arrow"/></button><p role="status" className="md-note">{message}</p>
    {link&&<div className="md-share-assets"><div><span className="md-section-label">{local?'正式分享資料 · 待發布':'短網址與 QR code'}</span><a href={link.shortUrl} target="_blank" rel="noopener noreferrer">{link.shortUrl}</a>{local&&<p className="md-note">正式遊戲尚未發布。此 QR 與短址預留給正式版本，本機試玩請使用上方網址。</p>}</div><a className="md-qr-download" href={`${import.meta.env.BASE_URL}${link.qrImage}`} download="marketing-day-qr.png"><img src={`${import.meta.env.BASE_URL}${link.qrImage}`} width="128" height="128" alt="行銷人的一天正式介紹頁 QR code"/><span>下載 QR 圖片</span></a></div>}
  </>;
}
