import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSalonAudio } from './use-salon-audio';

class MockNode {
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class MockGain extends MockNode {
  gain = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
}

class MockOscillator extends MockNode {
  type = 'sine';
  frequency = { setValueAtTime: vi.fn() };
}

class MockBufferSource extends MockNode {
  buffer: AudioBuffer | null = null;
}

class MockFilter extends MockNode {
  type = 'lowpass';
  frequency = { setValueAtTime: vi.fn() };
}

class MockContext {
  static instances: MockContext[] = [];
  state: AudioContextState = 'suspended';
  currentTime = 1;
  sampleRate = 44100;
  destination = new MockNode() as unknown as AudioDestinationNode;
  oscillators: MockOscillator[] = [];
  gains: MockGain[] = [];
  buffers: MockBufferSource[] = [];
  filters: MockFilter[] = [];
  resume = vi.fn(async () => { this.state = 'running'; });
  suspend = vi.fn(async () => { this.state = 'suspended'; });
  close = vi.fn(async () => { this.state = 'closed'; });
  createGain = vi.fn(() => {
    const gain = new MockGain();
    this.gains.push(gain);
    return gain as unknown as GainNode;
  });
  createOscillator = vi.fn(() => {
    const oscillator = new MockOscillator();
    this.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  });
  createBufferSource = vi.fn(() => {
    const source = new MockBufferSource();
    this.buffers.push(source);
    return source as unknown as AudioBufferSourceNode;
  });
  createBiquadFilter = vi.fn(() => {
    const filter = new MockFilter();
    this.filters.push(filter);
    return filter as unknown as BiquadFilterNode;
  });
  createBuffer = vi.fn(() => ({ getChannelData: () => new Float32Array(8) }) as unknown as AudioBuffer);

  constructor() { MockContext.instances.push(this); }
}

class MockAudio extends EventTarget {
  static instances: MockAudio[] = [];
  loop = false;
  preload = '';
  volume = 1;
  paused = true;
  src = '';
  play = vi.fn(() => {
    this.paused = false;
    return Promise.resolve();
  });
  pause = vi.fn(() => { this.paused = true; });
  load = vi.fn();
  removeAttribute = vi.fn((name: string) => { if (name === 'src') this.src = ''; });

  constructor(src = '') {
    super();
    this.src = src;
    MockAudio.instances.push(this);
  }
}

beforeEach(() => {
  MockContext.instances = [];
  MockAudio.instances = [];
  vi.stubGlobal('AudioContext', MockContext);
  vi.stubGlobal('Audio', MockAudio);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useSalonAudio', () => {
  it('does not create or play audio before a user gesture; unlock plays music and the first click', () => {
    const { result } = renderHook(() => useSalonAudio(false));
    expect(MockContext.instances).toHaveLength(0);
    expect(MockAudio.instances).toHaveLength(0);
    expect(result.current.unlocked).toBe(false);

    act(() => result.current.unlock());
    expect(result.current.unlocked).toBe(true);
    expect(MockAudio.instances[0].play).toHaveBeenCalledOnce();
    expect(MockContext.instances[0].oscillators).toHaveLength(1);
  });

  it('mute pauses music and suppresses all sound effects', () => {
    const { result } = renderHook(() => useSalonAudio(false));
    act(() => result.current.unlock());
    const context = MockContext.instances[0];
    const audio = MockAudio.instances[0];
    const initialCount = context.oscillators.length;

    act(() => result.current.toggleMute());
    act(() => result.current.play('page'));

    expect(result.current.muted).toBe(true);
    expect(audio.pause).toHaveBeenCalled();
    expect(context.suspend).toHaveBeenCalled();
    expect(context.oscillators).toHaveLength(initialCount);
  });

  it('clamps volume and emits no SFX at zero volume', () => {
    const { result } = renderHook(() => useSalonAudio(false));
    act(() => result.current.unlock());
    const context = MockContext.instances[0];
    const initialCount = context.oscillators.length;

    act(() => result.current.setVolume(-4));
    expect(result.current.volume).toBe(0);
    act(() => result.current.play('confirm'));
    expect(context.oscillators).toHaveLength(initialCount);

    act(() => result.current.setVolume(4));
    expect(result.current.volume).toBe(1);
    act(() => result.current.play('confirm'));
    expect(context.oscillators).toHaveLength(initialCount + 2);
  });

  it('plays movement steps every 190 ms, stops when movement ends or sound is disabled, and clears its timer', () => {
    vi.useFakeTimers();
    const { result, rerender, unmount } = renderHook(({ moving }) => useSalonAudio(moving), {
      initialProps: { moving: false },
    });
    act(() => result.current.unlock());
    const context = MockContext.instances[0];
    const afterUnlock = context.oscillators.length;

    act(() => rerender({ moving: true }));
    expect(context.oscillators).toHaveLength(afterUnlock + 2);
    act(() => vi.advanceTimersByTime(190));
    expect(context.oscillators).toHaveLength(afterUnlock + 4);

    act(() => rerender({ moving: false }));
    act(() => vi.advanceTimersByTime(570));
    expect(context.oscillators).toHaveLength(afterUnlock + 4);

    act(() => rerender({ moving: true }));
    act(() => result.current.toggleMute());
    const afterMute = context.oscillators.length;
    act(() => vi.advanceTimersByTime(380));
    expect(context.oscillators).toHaveLength(afterMute);
    act(() => result.current.toggleMute());

    act(() => result.current.setVolume(0));
    const afterZeroVolume = context.oscillators.length;
    act(() => vi.advanceTimersByTime(380));
    expect(context.oscillators).toHaveLength(afterZeroVolume);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it('pauses both audio systems when the page becomes hidden', () => {
    const { result } = renderHook(() => useSalonAudio(false));
    act(() => result.current.unlock());
    const visibility = vi.spyOn(document, 'visibilityState', 'get');
    visibility.mockReturnValue('hidden');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(MockAudio.instances[0].pause).toHaveBeenCalled();
    expect(MockContext.instances[0].suspend).toHaveBeenCalled();

    visibility.mockReturnValue('visible');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(MockAudio.instances[0].play).toHaveBeenCalledTimes(2);
    expect(MockContext.instances[0].resume).toHaveBeenCalledTimes(2);
  });

  it('releases music, scheduled nodes and AudioContext on unmount', () => {
    const { result, unmount } = renderHook(() => useSalonAudio(false));
    act(() => result.current.unlock());
    const audio = MockAudio.instances[0];
    const context = MockContext.instances[0];
    const oscillator = context.oscillators[0];

    unmount();

    expect(audio.pause).toHaveBeenCalled();
    expect(audio.removeAttribute).toHaveBeenCalledWith('src');
    expect(audio.load).toHaveBeenCalled();
    expect(oscillator.stop).toHaveBeenCalled();
    expect(context.close).toHaveBeenCalled();
  });
});
