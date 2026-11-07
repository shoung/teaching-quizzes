import type { ReactNode } from 'react';

export function Icon({ name, className = '' }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    arrow: <path d="M4 12h15M13 5l7 7-7 7" />,
    back: <path d="M20 12H5M11 5l-7 7 7 7" />,
    book: <path d="M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2zM12 6v15" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>,
    list: <><rect x="6" y="3" width="15" height="18" rx="2" /><path d="M3 7h3M3 12h3M3 17h3M10 8h7M10 12h7M10 16h4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    share: <path d="M12 15V3M7 8l5-5 5 5M5 13v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6 7a7 7 0 0 1 11-2l3 4M4 15l3 4a7 7 0 0 0 11-2" /></>,
    spark: <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" />,
    web: <><rect x="2" y="3" width="20" height="18" rx="3" /><path d="M2 8h20M7 5.5h.1M10 5.5h.1M9 12l-3 3 3 3M15 12l3 3-3 3" /></>,
    ai: <><rect x="4" y="7" width="16" height="13" rx="4" /><path d="M12 7V3M10 3h4M2 11v5M22 11v5M8 12h.1M16 12h.1M9 16h6" /></>,
    color: <><circle cx="9" cy="9" r="6" /><circle cx="15" cy="9" r="6" /><circle cx="12" cy="15" r="6" /></>,
    media: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="m10 8 6 4-6 4z" /></>,
    zoom: <><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6M10 6v8M6 10h8" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.spark}</svg>;
}
