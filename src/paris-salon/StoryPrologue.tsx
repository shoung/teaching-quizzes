import type { SalonStoryBeat } from '../types';
import { Glyph, Sprite } from '../paris-salon-preview/PreviewPrimitives';
import { SalonOrnament } from './SalonOrnament';

interface Props {
  beat: SalonStoryBeat;
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  onBegin: () => void;
}

export function StoryPrologue({ beat, index, total, onPrevious, onNext, onBegin }: Props) {
  return <section className="story-prologue" role="region" aria-label="故事開場">
    <SalonOrnament />
    <span className="prologue-kicker">序章 · {index + 1}／{total}</span>
    <h2 id="salon-story-title" tabIndex={-1}>{beat.title}</h2>
    <div className="prologue-speaker"><Sprite index={beat.npc} /><span>{beat.speaker}</span></div>
    <p className="prologue-copy">{beat.text}</p>
    <div className="prologue-actions">
      {index > 0 && <button className="text-button" onClick={onPrevious}>上一段</button>}
      {index < total - 1
        ? <button className="button primary" onClick={onNext}>繼續故事 <Glyph name="arrow" /></button>
        : <button className="button primary" onClick={onBegin}>開始經營 <Glyph name="arrow" /></button>}
    </div>
  </section>;
}
