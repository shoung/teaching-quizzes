import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import { HostingSequence } from './HostingSequence';

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('HostingSequence', () => {
  it('shows an illustrated, accessible timed sequence and completes once when elapsed', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { container, rerender } = render(<HostingSequence eventNumber={2} reducedMotion={false} onComplete={onComplete} />);
    expect(container.querySelector('.hosting-sequence-scene')).toHaveStyle({ backgroundImage: expect.stringContaining('images/paris-salon/scenes-v3/salon.png') });
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
    const skip = screen.getByRole('button', { name: '略過演出' });
    expect(skip).toHaveFocus();
    fireEvent.keyDown(skip, { key: 'Tab' });
    expect(skip).toHaveFocus();
    expect(container.querySelector('.hosting-sequence-phase')).toHaveTextContent(/點燈|來賓到場|交流|落幕/);
    act(() => { vi.advanceTimersByTime(3500); });
    expect(onComplete).toHaveBeenCalledTimes(1);
    rerender(<HostingSequence eventNumber={2} reducedMotion={false} onComplete={onComplete} />);
    act(() => { vi.advanceTimersByTime(4000); });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('skip completes once, cleans up, and reduced motion completes quickly', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const view = render(<HostingSequence eventNumber={1} reducedMotion={false} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: '略過演出' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(4000); });
    expect(onComplete).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    render(<HostingSequence eventNumber={1} reducedMotion onComplete={onComplete} />);
    act(() => { vi.advanceTimersByTime(300); });
    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});
