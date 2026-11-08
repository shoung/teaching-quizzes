import { useEffect, useRef, useState } from 'react';
import './chapter-lobby.css';

export interface ChapterLobbyProps {
  firstStarted: boolean;
  firstCompleted: boolean;
  secondStarted?: boolean;
  secondCompleted?: boolean;
  onStartFirst: () => void;
  onStartSecond: () => void;
  onShare: () => void;
  onRestartFirst: () => void;
}

type Chapter = 'first' | 'second';

export default function ChapterLobby({
  firstStarted,
  firstCompleted,
  secondStarted=false,
  secondCompleted=false,
  onStartFirst,
  onStartSecond,
  onShare,
  onRestartFirst,
}: ChapterLobbyProps) {
  const [chapter, setChapter] = useState<Chapter>('first');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const firstAction = firstCompleted ? '查看當日回顧' : firstStarted ? '繼續今天' : '開始上班';

  return (
    <section className="md-lobby" aria-labelledby="md-lobby-title">
      <div className="md-lobby-panel">
        <p className="md-lobby-kicker"><span aria-hidden="true"/>行銷人的一天　／　選擇章節</p>
        <h2 id="md-lobby-title" ref={heading} tabIndex={-1}>行銷人的一天</h2>
        <p className="md-lobby-lede">選一段今天的工作，從任何一章開始。</p>

        <div className="md-lobby-choices" role="group" aria-label="選擇章節">
          <button type="button" className="md-lobby-choice" aria-pressed={chapter === 'first'} onClick={() => setChapter('first')}>
            <span className="md-lobby-choice-number">01</span>
            <span><strong>第一章</strong><small>新品上線日</small></span>
          </button>
          <button type="button" className="md-lobby-choice" aria-pressed={chapter === 'second'} onClick={() => setChapter('second')}>
            <span className="md-lobby-choice-number">02</span>
            <span><strong>第二章</strong><small>客戶來訪日</small></span>
          </button>
        </div>

        {chapter === 'first' ? (
          <article className="md-lobby-detail" aria-labelledby="md-chapter-title">
            <div className="md-lobby-detail-head"><span>第一章　／　新品上線日</span><span className="md-lobby-state">{firstCompleted ? '已結案' : firstStarted ? '進行中' : '可開始'}</span></div>
            <h3 id="md-chapter-title">新品今天上線，換你接下任務。</h3>
            <p>在辦公室裡和同事交換資料，做出六個行銷決策，完成這一天的工作。</p>
            <div className="md-lobby-meta"><span>六個情境決策</span><span>約 10 分鐘</span></div>
            <div className="md-lobby-actions">
              <button type="button" className="md-lobby-primary" onClick={onStartFirst}>{firstAction}</button>
              {firstStarted && <button type="button" className="md-lobby-secondary" onClick={onRestartFirst}>重新上班</button>}
            </div>
          </article>
        ) : (
          <article className="md-lobby-detail" aria-labelledby="md-chapter-title">
            <div className="md-lobby-detail-head"><span>第二章　／　客戶來訪日</span><span className="md-lobby-state">{secondCompleted?'已提案':secondStarted?'進行中':'可開始'}</span></div>
            <h3 id="md-chapter-title">健身房老闆來了。先聽懂他的需求。</h3>
            <p>林老闆想改善新客第一次來健身房的體驗。走近和他聊聊，再選出顧客痛點、樣貌與服務方案，最後提出你的規劃。</p>
            <div className="md-lobby-meta"><span>五輪訪談推理 · 每輪最多五問</span><span>預計 10–15 分鐘</span></div>
            <p className="md-lobby-unlocked">不需先完成第一章，可直接開始。</p>
            <div className="md-lobby-actions">
              <button type="button" className="md-lobby-primary" onClick={onStartSecond}>{secondCompleted?'查看提案評價':secondStarted?'繼續第二章':'開始第二章'}</button>
            </div>
          </article>
        )}

        <div className="md-lobby-footer">
          <p>本次遊玩不存檔；重新整理或關閉後需重新開始。</p>
          <button type="button" className="md-lobby-share" onClick={onShare}>分享與 QR code</button>
        </div>
      </div>
    </section>
  );
}
