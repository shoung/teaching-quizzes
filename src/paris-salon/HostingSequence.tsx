import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Sprite } from '../paris-salon-preview/PreviewPrimitives';
import type { HostingSequenceProps } from './rpg-types';
import './hosting-sequence.css';

const PHASES = ['點燈', '來賓到場', '交流', '落幕'] as const;
const DURATION = 3500;

export function HostingSequence({ eventNumber, reducedMotion, onComplete }: HostingSequenceProps) {
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const completedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const callback = useRef(onComplete);
  const skipRef = useRef<HTMLButtonElement>(null);
  callback.current = onComplete;
  const duration = reducedMotion ? 300 : DURATION;

  useEffect(() => { skipRef.current?.focus(); }, []);

  useEffect(() => {
    setElapsed(0);
    setCompleted(false);
    completedRef.current = false;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const next = Math.min(Date.now() - started, duration);
      setElapsed(next);
      if (next >= duration) {
        window.clearInterval(timer);
        timerRef.current = null;
        if (!completedRef.current) {
          completedRef.current = true;
          setCompleted(true);
          callback.current();
        }
      }
    }, 50);
    timerRef.current = timer;
    return () => { window.clearInterval(timer); timerRef.current = null; };
  }, [duration, eventNumber]);

  const finish = () => {
    if (completedRef.current) return;
    if (timerRef.current !== null) { window.clearInterval(timerRef.current); timerRef.current = null; }
    completedRef.current = true;
    setCompleted(true);
    setElapsed(duration);
    callback.current();
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Tab') { event.preventDefault(); skipRef.current?.focus(); }
  };
  const progress = completed ? 100 : Math.round((elapsed / duration) * 100);
  const phase = PHASES[Math.min(PHASES.length - 1, Math.floor(progress / 25))];

  return <section className={`hosting-sequence${reducedMotion ? ' hosting-sequence-reduced' : ''}`} onKeyDown={handleKeyDown} aria-label={`第 ${eventNumber} 場沙龍演出`}>
    <div className="hosting-sequence-scene" style={{ backgroundImage: `url("${import.meta.env.BASE_URL}images/paris-salon/scenes-v3/salon.png")` }}>
      <span className="hosting-sequence-lamp" aria-hidden="true">✦</span>
      <div className="hosting-sequence-guests" aria-hidden="true"><Sprite index={(eventNumber % 5) + 1} className="hosting-sequence-guest" /><Sprite index={((eventNumber + 2) % 5) + 1} className="hosting-sequence-guest" /><Sprite index={((eventNumber + 4) % 5) + 1} className="hosting-sequence-guest" /></div>
      <p className="hosting-sequence-phase" aria-live="polite">{phase}</p>
    </div>
    <div className="hosting-sequence-progress-wrap"><label htmlFor="hosting-sequence-progress">沙龍進行中：{phase}</label><progress id="hosting-sequence-progress" className="hosting-sequence-progress" max={100} value={progress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={`${phase}，${progress}%`} /><span className="hosting-sequence-percent">{progress}%</span></div>
    <button ref={skipRef} type="button" className="hosting-sequence-skip" onClick={finish}>{completed ? '演出完成' : '略過演出'}</button>
  </section>;
}
