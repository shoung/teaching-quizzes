import type { ReactNode } from 'react';
import { characterUrl } from './preview-data';

export function Glyph({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    book: <><path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4z" /><path d="M20 4h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 4-2h3z" /></>,
    arrow: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
    leaf: <><path d="M5 19C1 5 13 2 20 3c0 11-4 18-15 16ZM5 19l9-9" /></>,
    coin: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="M12 8v8" /></>,
    star: <path d="m12 2 2.8 6.2 6.7.8-5 4.5 1.5 6.6-6-3.4-6 3.4 1.5-6.6L2.5 9l6.7-.8z" />,
    people: <><circle cx="9" cy="7" r="3" /><path d="M3 20v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 6" /></>,
    map: <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16M15 5v16" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    check: <path d="m5 12 4 4L19 6" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 6 9 7 9-7" /></>,
    sound: <><path d="m3 9 5 0 5-5v16l-5-5H3zM17 8l5 8M22 8l-5 8" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>,
    spark: <><path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.leaf}</svg>;
}

export function Sprite({ index = 0, className = '' }: { index?: number; className?: string }) {
  const sponsor = index === 6;
  return <span className={`sprite character-${index} ${sponsor ? 'sponsor-sprite' : ''} ${className}`} style={sponsor ? { backgroundImage: `url("${import.meta.env.BASE_URL}images/paris-salon/sponsor-v2.png")`, backgroundSize: 'contain', backgroundPosition: 'center bottom' } : { backgroundImage: `url("${characterUrl}")`, backgroundPosition: `${index * 20}% 50%` }} aria-hidden="true" />;
}

export function PaperHeading({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return <header className="paper-heading"><span className="eyebrow">{kicker}</span><h2 id="preview-panel-title" tabIndex={-1}>{title}</h2>{children}</header>;
}
