// Functional puzzle diagrams are rendered as HTML so labels remain readable at 200%.
// Exact values are also included in the question's scenario / evidence text.
export function ChallengeVisual({ id }: { id: string }) {
  if (id === 'chart-catch') return <figure className="puzzle-visual"><figcaption>AI 產出的圖：杯數</figcaption><div className="truncated-chart" role="img" aria-label="縱軸起點 80 杯。上週 90 杯的長條高度為一格，本週 100 杯為兩格。"><span className="chart-top">100 杯</span><span className="chart-mid">90 杯</span><span className="chart-zero">80 杯</span><div className="chart-columns"><div><span style={{height:'50%'}} /><strong>上週 90 杯</strong></div><div><span style={{height:'100%'}} /><strong>本週 100 杯</strong></div></div></div><p>注意：這張圖的縱軸從 80 杯開始。</p></figure>;
  if (id === 'average-trap') return <figure className="puzzle-visual"><figcaption>五位顧客的消費金額</figcaption><div className="spending-bars" role="img" aria-label="五筆消費：100、100、100、100、2100 元">{[100,100,100,100,2100].map((amount,i)=><div key={i}><span className="spend-value">{amount.toLocaleString()} 元</span><span className="spend-bar" style={{height:`${amount/2100*9}rem`}} /><span>顧客 {i+1}</span></div>)}</div></figure>;
  if (id === 'fair-experiment') return <figure className="puzzle-visual"><figcaption>兩張候選海報</figcaption><div className="poster-pair"><div><span className="poster-symbol" aria-hidden="true">ฅ^•ﻌ•^ฅ</span><strong>A / 貓咪主視覺</strong></div><div><span className="poster-symbol" aria-hidden="true">%</span><strong>B / 折扣主視覺</strong></div></div><p>海報不同，要怎麼讓比較條件公平？</p></figure>;
  if (id === 'survey-bias') return <figure className="puzzle-visual"><figcaption>品牌粉絲群裡的 20 份問卷</figcaption><div className="survey-dots" role="img" aria-label="20 位品牌粉絲中，18 位喜歡、2 位不喜歡">{Array.from({length:20},(_,i)=><span key={i} className={i<18?'yes':'no'} aria-hidden="true">{i<18?'✓':'−'}</span>)}</div><p>✓ 喜歡：18 人　− 不喜歡：2 人</p></figure>;
  const cards: Record<string, { title:string; items:{label:string;value:string;note:string}[] }> = {
    'price-twist': {title:'飲料店的兩個營業日',items:[{label:'原本',value:'50 元',note:'賣出 100 杯'},{label:'漲價後',value:'60 元',note:'賣出 80 杯'}]},
    'profit-not-sales': {title:'攤位結帳單',items:[{label:'甲攤',value:'收入 6,000',note:'總成本 4,500 元'},{label:'乙攤',value:'收入 8,000',note:'總成本 6,000 元'}]},
    'buy-rate': {title:'廣告成績卡',items:[{label:'廣告甲',value:'30 位買家',note:'1,000 人看到'},{label:'廣告乙',value:'20 位買家',note:'500 人看到'}]},
    'honest-confidence': {title:'一店、一週的試驗紀錄',items:[{label:'試驗前',value:'等待 8 分鐘',note:'平均等待時間'},{label:'試驗後',value:'等待 5 分鐘',note:'利潤也有上升'}]},
  };
  const card=cards[id];
  if(!card) return null;
  return <figure className={`puzzle-visual puzzle-${id}`}><figcaption>{card.title}</figcaption><div className="puzzle-cards">{card.items.map((item,i)=><div key={item.label}><span className="puzzle-token" aria-hidden="true">{i===0?'A':'B'}</span><span>{item.label}</span><strong>{item.value}</strong><span>{item.note}</span></div>)}</div></figure>;
}
