import { useEffect, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export function PreviewDialog({ titleId, onClose, children, className = '' }: {
  titleId: string; onClose: () => void; children: ReactNode; className?: string;
}) {
  const ref=useRef<HTMLDialogElement>(null);
  const closeRef=useRef(onClose);closeRef.current=onClose;
  useEffect(()=>{
    const dialog=ref.current!;
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-initial-focus]')?.focus();
    return()=>{
      dialog.close();document.body.style.overflow=previousOverflow;
      const target=previous?.isConnected&&previous!==document.body&&!previous.closest('dialog')
        ?previous:document.querySelector<HTMLElement>('[data-world-interact]');
      target?.focus();
    };
  },[]);
  function containFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if(event.key==='Escape'){event.preventDefault();closeRef.current();return;}
    if(event.key!=='Tab')return;
    const candidates=[...ref.current!.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),summary,[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length>0);
    const controls=candidates.filter(el=>{
      if(!(el instanceof HTMLInputElement)||el.type!=='radio')return true;
      const group=candidates.filter(item=>item instanceof HTMLInputElement&&item.type==='radio'&&item.name===el.name) as HTMLInputElement[];
      return el===(group.find(item=>item.checked)??group[0]);
    });
    if(!controls.length)return;
    event.preventDefault();
    const index=controls.indexOf(document.activeElement as HTMLElement);
    const next=index<0?(event.shiftKey?controls.length-1:0):(index+(event.shiftKey?-1:1)+controls.length)%controls.length;
    controls[next].focus();
  }
  return <dialog ref={ref} aria-labelledby={titleId} aria-modal="true" className={`md-dialog ${className}`} onKeyDown={containFocus} onCancel={e=>{e.preventDefault();closeRef.current();}}>
    {children}
  </dialog>;
}
