import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAudioEngine, type SoundCue } from './audio-engine';

class FakeAudioParam {
  value = 0;
  events: Array<[string, number, number?]> = [];
  setValueAtTime(value: number, time: number) { this.value = value; this.events.push(['set', value, time]); }
  linearRampToValueAtTime(value: number, time: number) { this.value = value; this.events.push(['linear', value, time]); }
  exponentialRampToValueAtTime(value: number, time: number) { this.value = value; this.events.push(['exp', value, time]); }
  cancelScheduledValues(time: number) { this.events.push(['cancel', 0, time]); }
}

class FakeAudioNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

class FakeOscillator extends FakeAudioNode {
  type: OscillatorType = 'sine';
  frequency = new FakeAudioParam();
  onended: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
}

class FakeBufferSource extends FakeAudioNode {
  buffer: AudioBuffer | null = null;
  onended: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  currentTime = 1;
  destination = new FakeAudioNode();
  state: AudioContextState = 'suspended';
  oscillators: FakeOscillator[] = [];
  buffers: FakeBufferSource[] = [];
  close = vi.fn(async () => { this.state = 'closed'; });
  async resume() { this.state = 'running'; }
  createOscillator() { const node = new FakeOscillator(); this.oscillators.push(node); return node; }
  createGain() { return Object.assign(new FakeAudioNode(), { gain: new FakeAudioParam() }); }
  createBuffer(_channels: number, length: number) {
    const data = new Float32Array(length);
    return { length, getChannelData: () => data } as unknown as AudioBuffer;
  }
  createBufferSource() { const node = new FakeBufferSource(); this.buffers.push(node); return node; }
  constructor() { FakeAudioContext.instances.push(this); }
}

class FakeAudioElement {
  static instances: FakeAudioElement[] = [];
  src = '';
  loop = false;
  volume = 1;
  paused = true;
  play = vi.fn(async () => { this.paused = false; });
  pause = vi.fn(() => { this.paused = true; });
  remove = vi.fn();
  removeAttribute = vi.fn();
  load = vi.fn();
  constructor(src?: string) { if (src) this.src = src; FakeAudioElement.instances.push(this); }
}

const cues: SoundCue[] = ['click', 'select', 'open', 'close', 'back', 'step', 'arrival', 'confirm', 'complete', 'error'];

beforeEach(() => {
  FakeAudioContext.instances = [];
  FakeAudioElement.instances = [];
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('Audio', FakeAudioElement);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('createAudioEngine', () => {
  it('waits for an explicit unlock gesture before creating audio or loading background music', () => {
    const engine = createAudioEngine({ baseUrl: '/class/' });
    expect(engine.status).toBe('locked');
    expect(FakeAudioContext.instances).toHaveLength(0);
    expect(FakeAudioElement.instances).toHaveLength(0);
    engine.dispose();
  });

  it('plays every cue with a distinct 8-bit tone/noise pattern and never uses sine', async () => {
    const engine = createAudioEngine({ baseUrl: '/class/' });
    await engine.unlock();
    const context = FakeAudioContext.instances[0];
    const signatures: string[] = [];
    for (const cue of cues) {
      const oscStart = context.oscillators.length;
      const noiseStart = context.buffers.length;
      engine.play(cue, true);
      const oscillators = context.oscillators.slice(oscStart).map(node => [node.type, node.frequency.events, node.start.mock.calls, node.stop.mock.calls]);
      const noises = context.buffers.slice(noiseStart).map(node => [node.buffer ? node.buffer.length : 0, node.start.mock.calls]);
      signatures.push(JSON.stringify([oscillators, noises]));
      context.oscillators.slice(oscStart).forEach(node => node.onended?.());
      context.buffers.slice(noiseStart).forEach(node => node.onended?.());
    }
    expect(context.oscillators.length + context.buffers.length).toBeGreaterThan(0);
    expect(context.oscillators.every(node => ['square', 'triangle'].includes(node.type))).toBe(true);
    expect(context.buffers.length).toBeGreaterThan(0);
    expect(new Set(signatures).size).toBe(cues.length);
    engine.dispose();
  });

  it('uses the fixed local music path, loops quietly, and pauses/resumes when hidden', async () => {
    const engine = createAudioEngine({ baseUrl: '/class/' });
    await engine.unlock();
    const music = FakeAudioElement.instances[0];
    expect(music.src).toBe('/class/audio/marketing-day/background.mp3');
    expect(music.loop).toBe(true);
    expect(music.volume).toBeCloseTo(0.25);
    engine.setHidden(true);
    expect(music.pause).toHaveBeenCalledTimes(1);
    engine.setHidden(false);
    expect(music.play).toHaveBeenCalledTimes(2);
    engine.dispose();
  });

  it('mutes the background track and stops active effects immediately; pause blocks footsteps', async () => {
    const engine = createAudioEngine();
    await engine.unlock();
    engine.play('confirm', true);
    const context = FakeAudioContext.instances[0];
    const music = FakeAudioElement.instances[0];
    expect(context.oscillators.length).toBeGreaterThan(0);
    engine.setMuted(true);
    expect(music.pause).toHaveBeenCalled();
    expect(context.oscillators.every(node => node.stop.mock.calls.length > 1)).toBe(true);
    engine.setMuted(false);
    engine.setPaused(true);
    engine.play('step', true);
    expect(context.buffers).toHaveLength(0);
    engine.dispose();
  });

  it('keeps a rejected context resume retryable and ignores late unlock after disposal', async () => {
    const resume = vi.spyOn(FakeAudioContext.prototype, 'resume')
      .mockRejectedValueOnce(new Error('gesture required'))
      .mockImplementationOnce(async () => { FakeAudioContext.instances.at(-1)!.state = 'running'; });
    const engine = createAudioEngine();
    await engine.unlock();
    expect(engine.status).toBe('locked');
    expect(FakeAudioContext.instances).toHaveLength(1);
    await engine.unlock();
    expect(engine.status).toBe('ready');
    expect(FakeAudioContext.instances).toHaveLength(1);
    engine.dispose();
    resume.mockRestore();

    let resolveResume!: () => void;
    vi.spyOn(FakeAudioContext.prototype, 'resume').mockImplementation(() => new Promise<void>(resolve => { resolveResume = resolve; }));
    const lateEngine = createAudioEngine();
    const lateUnlock = lateEngine.unlock();
    const music = FakeAudioElement.instances.at(-1)!;
    lateEngine.dispose();
    resolveResume();
    await lateUnlock;
    expect(music.play).toHaveBeenCalledOnce();
    expect(music.play).not.toHaveBeenCalledTimes(2);
    resume.mockRestore();
  });

  it('throttles rapid clicks, limits concurrent voices, and disposes timers and audio', async () => {
    vi.useFakeTimers();
    const engine = createAudioEngine({ baseUrl: '/', maxVoices: 4 });
    await engine.unlock();
    engine.play('click', true);
    engine.play('click', true);
    expect(FakeAudioContext.instances[0].buffers).toHaveLength(1);
    vi.advanceTimersByTime(100);
    for (const cue of cues) engine.play(cue, true);
    expect(FakeAudioContext.instances[0].oscillators.length + FakeAudioContext.instances[0].buffers.length).toBeLessThanOrEqual(4);
    engine.dispose();
    expect(FakeAudioContext.instances[0].close).toHaveBeenCalledOnce();
    expect(FakeAudioElement.instances[0].pause).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('keeps movement sound spacing inside the requested 180–240ms window', async () => {
    vi.useFakeTimers();
    const engine = createAudioEngine();
    await engine.unlock();
    engine.play('step');
    engine.play('step');
    expect(FakeAudioContext.instances[0].buffers).toHaveLength(1);
    vi.advanceTimersByTime(205);
    engine.play('step');
    expect(FakeAudioContext.instances[0].buffers).toHaveLength(2);
    engine.dispose();
    vi.useRealTimers();
  });
});
