export function SalonOrnament({ className = '' }: { className?: string }) {
  return <svg className={`salon-ornament ${className}`} viewBox="0 0 320 74" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 61c35 0 40-35 74-35 18 0 27 10 37 20-19-4-30 2-37 15-8-16-26-18-40-8 10 0 14 7 14 14H12Zm296 0c-35 0-40-35-74-35-18 0-27 10-37 20 19-4 30 2 37 15 8-16 26-18 40-8-10 0-14 7-14 14h48Z" />
      <path d="M160 6c-14 13-14 25 0 35 14-10 14-22 0-35Zm-21 33c-4-12-12-17-23-15 2 12 10 18 23 15Zm42 0c4-12 12-17 23-15-2 12-10 18-23 15Zm-21 2v25m-10-12c7 3 13 3 20 0m-45 4c11-2 18 0 25 8m50-8c-11-2-18 0-25 8" />
      <path d="M53 8c8 6 13 13 14 21M267 8c-8 6-13 13-14 21M23 41c8 1 15 5 19 12m255-12c-8 1-15 5-19 12" />
      <circle cx="160" cy="8" r="2" fill="currentColor"/><circle cx="13" cy="61" r="2" fill="currentColor"/><circle cx="307" cy="61" r="2" fill="currentColor"/>
    </g>
  </svg>;
}
