import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameSound } from './use-game-sound';

const mocks = vi.hoisted(() => {
  const engine = {
    status: 'locked' as 'locked' | 'ready' | 'unavailable',
    unlock: vi.fn(async () => { engine.status = 'ready'; }),
    play: vi.fn(),
    setMuted: vi.fn(),
    setEffectsVolume: vi.fn(),
    setMusicEnabled: vi.fn(),
    setMusicVolume: vi.fn(),
    setPaused: vi.fn(),
    setHidden: vi.fn(),
    dispose: vi.fn(),
  };
  return { engine, createAudioEngine: vi.fn(() => engine) };
});

vi.mock('./audio-engine', () => ({ createAudioEngine: mocks.createAudioEngine }));

beforeEach(() => {
  mocks.engine.status = 'locked';
  mocks.engine.unlock.mockClear();
  mocks.engine.play.mockClear();
  mocks.engine.setMuted.mockClear();
  mocks.engine.setEffectsVolume.mockClear();
  mocks.engine.setMusicEnabled.mockClear();
  mocks.engine.setMusicVolume.mockClear();
  mocks.engine.setPaused.mockClear();
  mocks.engine.setHidden.mockClear();
  mocks.engine.dispose.mockClear();
  mocks.createAudioEngine.mockClear();
});
afterEach(() => vi.useRealTimers());

describe('useGameSound', () => {
  it('starts audible but locked and adapts the legacy boolean API to named cues', async () => {
    const { result, unmount } = renderHook(() => useGameSound());
    expect(result.current).toMatchObject({ muted: false, musicEnabled: true, musicVolume: 0.25, effectsVolume: 0.35, status: 'locked' });
    const play = result.current.play;
    const unlock = result.current.unlock;
    await act(async () => { result.current.play(false); await Promise.resolve(); await Promise.resolve(); });
    expect(mocks.engine.play).toHaveBeenCalledWith('confirm', false);
    expect(result.current.play).toBe(play);
    expect(result.current.unlock).toBe(unlock);
    unmount();
    expect(mocks.engine.dispose).toHaveBeenCalledOnce();
  });

  it('blocks effects while muted but lets an explicitly forced cue through', async () => {
    const { result } = renderHook(() => useGameSound());
    await act(async () => { result.current.unlock(); await Promise.resolve(); });
    act(() => { result.current.toggle(); result.current.play('click'); });
    expect(mocks.engine.play).not.toHaveBeenCalled();
    act(() => result.current.play('error', true));
    expect(mocks.engine.play).toHaveBeenCalledWith('error', true);
  });

  it('plays throttled movement steps only while moving and not paused', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook((props: { moving: boolean; paused: boolean }) => useGameSound(props), { initialProps: { moving: false, paused: false } });
    await act(async () => { result.current.unlock(); await Promise.resolve(); });
    rerender({ moving: true, paused: false });
    expect(mocks.engine.play).toHaveBeenCalledTimes(1);
    expect(mocks.engine.play).toHaveBeenLastCalledWith('step', false);
    act(() => { vi.advanceTimersByTime(420); });
    expect(mocks.engine.play).toHaveBeenCalledTimes(3);
    rerender({ moving: true, paused: true });
    act(() => { vi.advanceTimersByTime(630); });
    expect(mocks.engine.play).toHaveBeenCalledTimes(3);
    expect(mocks.engine.setPaused).toHaveBeenLastCalledWith(true);
  });
});
