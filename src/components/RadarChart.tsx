import { useId } from 'react';

export interface RadarAxis { id: string; label: string; score: number | null; target?: number }

export function RadarChart({ axes, title }: { axes: RadarAxis[]; title: string }) {
  const id = useId();
  const cx = 280; const cy = 219; const radius = 141;
  const point = (index: number, amount: number) => {
    const angle = Math.PI * 2 * index / axes.length - Math.PI / 2;
    return [cx + Math.cos(angle) * amount, cy + Math.sin(angle) * amount];
  };
  const path = (values: number[]) => values.map((value, i) => point(i, radius * value / 100).join(',')).join(' ');
  const complete = axes.every((axis) => axis.score !== null);
  const targets = axes.every((axis) => axis.target !== undefined);
  return <div className="radar-chart"><div className="radar-plot"><svg viewBox="0 0 560 440" role="img" aria-label={title} aria-describedby={id}>
    <desc id={id}>{axes.map((axis) => `${axis.label}：${axis.score === null ? '個人感受，不計分' : `${axis.score} 分`}`).join('；')}</desc>
    {[25, 50, 75, 100].map((value) => <polygon key={value} points={path(axes.map(() => value))} className="radar-grid" />)}
    {axes.map((axis, i) => { const edge = point(i, radius); return <line key={axis.id} x1={cx} y1={cy} x2={edge[0]} y2={edge[1]} className="radar-spoke" />; })}
    {targets && <polygon points={path(axes.map((axis) => axis.target!))} className="radar-target" />}
    {complete ? <polygon points={path(axes.map((axis) => axis.score!))} className="radar-area" /> : <polyline points={axes.flatMap((axis, i) => axis.score === null ? [] : [point(i, radius * axis.score / 100).join(',')]).join(' ')} className="radar-partial" />}
    {axes.map((axis, i) => { if (axis.score === null) return null; const p = point(i, radius * axis.score / 100); return <circle key={axis.id} cx={p[0]} cy={p[1]} r="4.5" className="radar-point" />; })}
  </svg>{axes.map((axis, i) => { const p = point(i, radius + 43); return <span key={axis.id} className="radar-axis-marker" aria-hidden="true" style={{ left: `${p[0] / 560 * 100}%`, top: `${p[1] / 440 * 100}%` }}>{i + 1}</span>; })}</div><ol className="radar-values" aria-label="雷達圖數值">{axes.map((axis, i) => <li key={axis.id}><span className="radar-value-number" aria-hidden="true">{i + 1}</span><span>{axis.label}</span><strong>{axis.score === null ? '感受紀錄' : `${axis.score} / 100`}</strong></li>)}</ol><p className="radar-legend"><span />本次表現{targets && <><i />課堂顧問挑戰線</>}{!complete && <em>主觀面向保留感受，不繪製能力分數</em>}</p></div>;
}
