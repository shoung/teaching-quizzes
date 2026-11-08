import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Sprite } from '../paris-salon-preview/PreviewPrimitives';
import type { RpgDialogueProps } from './rpg-types';
import './rpg-dialogue.css';

const MAX_PAGE_LENGTH = 42;
type DialoguePage = { speaker: string; portrait: number; text: string; sourceLine: number; start: number };
type DialogueCursor = { line: number; offset: number };

function paginate(lines: RpgDialogueProps['lines'], limit: number, cursor: DialogueCursor): DialoguePage[] {
  const pages: DialoguePage[] = [];
  for (let sourceLine = cursor.line; sourceLine < lines.length; sourceLine += 1) {
    const line = lines[sourceLine];
    const chars = Array.from(line.text);
    let start = sourceLine === cursor.line ? cursor.offset : 0;
    if (!chars.length && start === 0) {
      pages.push({ ...line, text: '', sourceLine, start: 0 });
      continue;
    }
    while (start < chars.length) {
      let end = Math.min(chars.length, start + limit);
      if (end < chars.length) {
        const breakAt = chars.slice(start, end).lastIndexOf(' ');
        if (breakAt > limit * 0.6) end = start + breakAt + 1;
      }
      pages.push({ ...line, text: chars.slice(start, end).join(''), sourceLine, start });
      start = end;
    }
  }
  return pages;
}

export function RpgDialogue({ lines, reducedMotion, onComplete, onClose, onAdvance, label }: RpgDialogueProps) {
  const sourceKey = JSON.stringify(lines);
  const [pageLimit, setPageLimit] = useState(MAX_PAGE_LENGTH);
  const [cursor, setCursor] = useState<DialogueCursor>({ line: 0, offset: 0 });
  const pages = useMemo(() => paginate(lines, pageLimit, cursor), [lines, pageLimit, cursor]);
  const page = pages[0] ?? { speaker: '', portrait: 0, text: '', sourceLine: lines.length, start: 0 };
  const pageCharacters = Array.from(page.text);
  const [visibleCount, setVisibleCount] = useState(reducedMotion ? pageCharacters.length : 0);
  const [announcement, setAnnouncement] = useState(page.text);
  const [done, setDone] = useState(false);
  const copyRef = useRef<HTMLButtonElement>(null);
  const visibleRef = useRef<HTMLSpanElement>(null);
  const previousSource = useRef(sourceKey);
  const previousPageKey = useRef(`${sourceKey}:0:0`);
  const closeRef = useRef(false);
  const callbacks = useRef({ onComplete, onClose, onAdvance });
  callbacks.current = { onComplete, onClose, onAdvance };

  useEffect(() => { copyRef.current?.focus(); }, []);

  useEffect(() => {
    if (previousSource.current === sourceKey) return;
    previousSource.current = sourceKey;
    setCursor({ line: 0, offset: 0 });
    setVisibleCount(reducedMotion ? Array.from(lines[0]?.text ?? '').length : 0);
    setAnnouncement(paginate(lines, pageLimit, { line: 0, offset: 0 })[0]?.text ?? '');
    previousPageKey.current = `${sourceKey}:0:0`;
    setDone(false);
    closeRef.current = false;
  }, [lines, reducedMotion, sourceKey]);

  useEffect(() => {
    const measure = () => {
      const copy = copyRef.current;
      const visible = visibleRef.current;
      if (!copy || !visible) return;
      const width = visible.clientWidth || visible.offsetWidth || copy.clientWidth;
      if (!width) return;
      const fontSize = Number.parseFloat(window.getComputedStyle(copy).fontSize) || 24;
      const nextLimit = Math.max(1, Math.min(MAX_PAGE_LENGTH, Math.floor(width / fontSize) * 3));
      setPageLimit(value => value === nextLimit ? value : nextLimit);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    if (copyRef.current) observer?.observe(copyRef.current);
    if (visibleRef.current) observer?.observe(visibleRef.current);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [sourceKey]);

  useEffect(() => {
    const pageKey = `${sourceKey}:${cursor.line}:${cursor.offset}`;
    if (previousPageKey.current !== pageKey) {
      previousPageKey.current = pageKey;
      setAnnouncement(page.text);
    }
  }, [cursor, page.text, sourceKey]);

  useEffect(() => { if (reducedMotion) setVisibleCount(Array.from(page.text).length); }, [page.text, reducedMotion]);

  useEffect(() => {
    if (done || reducedMotion || visibleCount >= pageCharacters.length) return;
    const timer = window.setTimeout(() => setVisibleCount(value => Math.min(value + 1, pageCharacters.length)), 22);
    return () => window.clearTimeout(timer);
  }, [done, page.text, pageCharacters.length, reducedMotion, visibleCount]);

  const advance = () => {
    if (done) return;
    if (visibleCount < pageCharacters.length) {
      setVisibleCount(page.text.length);
      return;
    }
    callbacks.current.onAdvance?.();
    if (pages.length > 1) {
      const next = pages[1];
      setCursor(next ? { line: next.sourceLine, offset: next.start } : { line: lines.length, offset: 0 });
      setVisibleCount(reducedMotion ? Array.from(next?.text ?? '').length : 0);
      return;
    }
    setDone(true);
    callbacks.current.onComplete();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      copyRef.current?.focus();
      return;
    }
    if (event.key === 'Escape') {
      if (!closeRef.current && onClose) {
        closeRef.current = true;
        event.stopPropagation();
        callbacks.current.onClose?.();
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      advance();
    }
  };

  return <section className="rpg-dialogue" role="dialog" aria-modal="true" aria-label={label ?? page.speaker} onKeyDown={handleKeyDown} onClick={event => { if (!(event.target as HTMLElement).closest('button')) advance(); }}>

    <div className="rpg-dialogue-portrait"><Sprite index={page.portrait} className="rpg-dialogue-sprite" /><span className="rpg-dialogue-speaker">{page.speaker}</span></div>
    <button ref={copyRef} className="rpg-dialogue-copy" type="button" aria-label={done ? '對話已結束' : '繼續對話'} onClick={advance}>
      <span ref={visibleRef} className="rpg-dialogue-visible" aria-hidden="true">{pageCharacters.slice(0, visibleCount).join('')}</span>
      <span className="rpg-dialogue-reader" aria-live="polite" aria-atomic="true">{announcement}</span>
      {!done && <span className="rpg-dialogue-caret" aria-hidden="true">▾</span>}
    </button>
  </section>;
}
