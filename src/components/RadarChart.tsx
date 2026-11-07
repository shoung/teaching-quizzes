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
  return <div className="radar-chart"><svg viewBox="0 0 560 440" role="img" aria-label={title} aria-describedby={id}>
    <desc id={id}>{axes.map((axis) => `${axis.label}：${axis.score === null ? '個人感受，不計分' : `${axis.score} 分`}`).join('；')}</desc>
    {[25, 50, 75, 100].map((value) => <polygon key={value} points={path(axes.map(() => value))} className="radar-grid" />)}
    {axes.map((axis, i) => { const edge = point(i, radius); const label = point(i, radius + 43); return <g key={axis.id}><line x1={cx} y1={cy} x2={edge[0]} y2={edge[1]} className="radar-spoke" /><text x={label[0]} y={label[1] - 3} textAnchor="middle" className="radar-label">{axis.label}</text><text x={label[0]} y={label[1] + 17} textAnchor="middle" className="radar-label-value">{axis.score === null ? '感受紀錄' : `${axis.score} / 100`}</text></g>; })}
    {targets && <polygon points={path(axes.map((axis) => axis.target!))} className="radar-target" />}
    {complete ? <polygon points={path(axes.map((axis) => axis.score!))} className="radar-area" /> : <polyline points={axes.flatMap((axis, i) => axis.score === null ? [] : [point(i, radius * axis.score / 100).join(',')]).join(' ')} className="radar-partial" />}
    {axes.map((axis, i) => { if (axis.score === null) return null; const p = point(i, radius * axis.score / 100); return <circle key={axis.id} cx={p[0]} cy={p[1]} r="4.5" className="radar-point" />; })}
    <text x={cx + 5} y={cy - 7} className="radar-scale">0</text>
  </svg><p className="radar-legend"><span />本次表現{targets && <><i />課堂顧問挑戰線</>}{!complete && <em>主觀面向保留感受，不繪製能力分數</em>}</p></div>;
}
