import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import { RpgDialogue } from './RpgDialogue';
import type { DialogueLine } from './rpg-types';

const lines: DialogueLine[] = [
  { speaker: '露易斯夫人', portrait: 1, text: '今晚先聽聽來客真正需要什麼。' },
  { speaker: '露易斯夫人', portrait: 1, text: '再決定要把時間花在哪裡。' },
];

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('RpgDialogue', () => {
  it('click fills only the current typewriter page, then advances and completes once', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { container } = render(<RpgDialogue lines={lines} reducedMotion={false} onComplete={onComplete} />);
    const bar = container.querySelector('.rpg-dialogue');
    expect(bar).toHaveAttribute('role', 'dialog');
    expect(bar).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('露易斯夫人')).toBeInTheDocument();
    expect(container.querySelector('.rpg-dialogue-copy')).toHaveFocus();
    fireEvent.keyDown(container.querySelector('.rpg-dialogue-copy')!, { key: 'Tab' });
    expect(container.querySelector('.rpg-dialogue-copy')).toHaveFocus();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(bar!);
    expect(container.querySelector('.rpg-dialogue-visible')).toHaveTextContent(lines[0].text);
    expect(container.querySelector('.rpg-dialogue-visible')).not.toHaveTextContent(lines[1].text);
    const onAdvance = vi.fn();
    const keyboard = render(<RpgDialogue lines={lines} reducedMotion={false} onComplete={onComplete} onAdvance={onAdvance} />);
    const button = keyboard.container.querySelector('.rpg-dialogue-copy')!;
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(keyboard.container.querySelector('.rpg-dialogue-visible')).toHaveTextContent(lines[0].text);
    expect(onAdvance).not.toHaveBeenCalled();
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(keyboard.container.querySelector('.rpg-dialogue-visible')).not.toHaveTextContent(lines[0].text);
    expect(onAdvance).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(keyboard.container.querySelector('.rpg-dialogue-visible')).toHaveTextContent(lines[1].text);
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('announces complete pages once and paginates overlong dialogue without letter announcements', () => {
    vi.useFakeTimers();
    const long = '甲'.repeat(70);
    const { container } = render(<RpgDialogue lines={[{ ...lines[0], text: long }]} reducedMotion={false} onComplete={() => {}} />);
    const announcements = container.querySelector('[aria-live="polite"]');
    expect(announcements).toHaveTextContent('甲'.repeat(42));
    expect(container.querySelector('.rpg-dialogue-visible')).toHaveAttribute('aria-hidden', 'true');
    fireEvent.click(container.querySelector('.rpg-dialogue')!);
    expect(announcements).toHaveTextContent('甲'.repeat(42));
  });


  it('repaginates to the measured width and preserves every source character across pages', () => {
    vi.useFakeTimers();
    let resize: (() => void) | undefined;
    class ObserverMock {
      constructor(callback: ResizeObserverCallback) { resize = () => callback([], this as unknown as ResizeObserver); }
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('ResizeObserver', ObserverMock);
    const text = '甲'.repeat(90);
    const onComplete = vi.fn();
    const { container } = render(<RpgDialogue lines={[{ ...lines[0], text }]} reducedMotion onComplete={onComplete} />);
    const button = container.querySelector('.rpg-dialogue-copy')!;
    const pages: string[] = [container.querySelector('[aria-live="polite"]')!.textContent ?? ''];
    fireEvent.click(button);
    const announcedBeforeReflow = container.querySelector('[aria-live="polite"]')!.textContent;
    const visible = container.querySelector('.rpg-dialogue-visible') as HTMLElement;
    Object.defineProperty(visible, 'clientWidth', { configurable: true, value: 72 });
    Object.defineProperty(visible, 'offsetWidth', { configurable: true, value: 72 });
    act(() => { resize?.(); });
    expect(container.querySelector('[aria-live="polite"]')!.textContent).toBe(announcedBeforeReflow);
    for (let index = 0; index < 20 && !onComplete.mock.calls.length; index += 1) {
      pages.push(container.querySelector('.rpg-dialogue-visible')!.textContent ?? '');
      fireEvent.click(button);
    }
    expect(pages.join('')).toBe(text);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(Math.max(...pages.slice(1).map(page => Array.from(page).length))).toBeLessThanOrEqual(15);
  });

  it('reduced motion reveals immediately and Escape closes without completing', () => {
    const onClose = vi.fn();
    const onComplete = vi.fn();
    const { container } = render(<RpgDialogue lines={lines} reducedMotion onComplete={onComplete} onClose={onClose} />);
    expect(container.querySelector('.rpg-dialogue-visible')).toHaveTextContent(lines[0].text);
    fireEvent.keyDown(container.querySelector('.rpg-dialogue')!, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
