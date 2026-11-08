export type SoundCue = 'click' | 'select' | 'open' | 'close' | 'back' | 'step' | 'arrival' | 'confirm' | 'complete' | 'error';

type Tone = { type: OscillatorType; frequency: number; duration: number; delay?: number; level?: number; bend?: number };
type CuePattern = { tones?: Tone[]; noise?: { duration: number; level: number; delay?: number } };

const patterns: Record<SoundCue, CuePattern> = {
  click: { noise: { duration: 0.026, level: 0.16 } },
  select: { tones: [{ type: 'triangle', frequency: 740, duration: 0.075, bend: 790, level: 0.32 }] },
  open: { tones: [{ type: 'square', frequency: 392, duration: 0.11, level: 0.23 }, { type: 'square', frequency: 587, duration: 0.13, delay: 0.075, level: 0.24 }] },
  close: { tones: [{ type: 'square', frequency: 587, duration: 0.10, level: 0.23 }, { type: 'triangle', frequency: 392, duration: 0.12, delay: 0.068, level: 0.25 }] },
  back: { tones: [{ type: 'triangle', frequency: 523, duration: 0.09, level: 0.30 }, { type: 'triangle', frequency: 330, duration: 0.12, delay: 0.055, level: 0.28 }] },
  step: { noise: { duration: 0.035, level: 0.15 }, tones: [{ type: 'square', frequency: 112, duration: 0.045, level: 0.16 }] },
  arrival: { tones: [{ type: 'triangle', frequency: 392, duration: 0.10, level: 0.23 }, { type: 'triangle', frequency: 523, duration: 0.10, delay: 0.075, level: 0.24 }, { type: 'square', frequency: 784, duration: 0.14, delay: 0.15, level: 0.21 }] },
  confirm: { tones: [{ type: 'square', frequency: 660, duration: 0.09, level: 0.26 }, { type: 'square', frequency: 880, duration: 0.14, delay: 0.06, level: 0.24 }] },
  complete: { tones: [{ type: 'triangle', frequency: 523, duration: 0.12, level: 0.25 }, { type: 'triangle', frequency: 659, duration: 0.12, delay: 0.07, level: 0.24 }, { type: 'square', frequency: 784, duration: 0.12, delay: 0.14, level: 0.23 }, { type: 'triangle', frequency: 1046, duration: 0.20, delay: 0.21, level: 0.25 }] },
  error: { tones: [{ type: 'square', frequency: 196, duration: 0.14, bend: 155, level: 0.27 }, { type: 'square', frequency: 147, duration: 0.17, delay: 0.09, bend: 110, level: 0.25 }] },
};

export interface AudioEngine {
  readonly status: 'locked' | 'ready' | 'unavailable';
  unlock(): Promise<void>;
  play(cue: SoundCue, force?: boolean): void;
  setMuted(muted: boolean): void;
  setEffectsVolume(volume: number): void;
  setMusicEnabled(enabled: boolean): void;
  setMusicVolume(volume: number): void;
  setPaused(paused: boolean): void;
  setHidden(hidden: boolean): void;
  dispose(): void;
}

export function createAudioEngine(options: { baseUrl?: string; maxVoices?: number } = {}): AudioEngine {
  const baseUrl = options.baseUrl ?? import.meta.env.BASE_URL;
  const maxVoices = Math.max(1, options.maxVoices ?? 5);
  let context: AudioContext | null = null;
  let music: HTMLAudioElement | null = null;
  let state: AudioEngine['status'] = 'locked';
  let muted = false;
  let effectsVolume = 0.35;
  let musicEnabled = true;
  let musicVolume = 0.25;
  let paused = false;
  let hidden = typeof document !== 'undefined' && document.hidden;
  let unlockPromise: Promise<void> | null = null;
  let disposed = false;
  const voices = new Set<AudioScheduledSourceNode>();
  const lastPlayed = new Map<SoundCue, number>();

  const setActualMusicVolume = () => {
    if (music) music.volume = muted ? 0 : Math.min(1, Math.max(0, musicVolume * (paused ? 0.58 : 1)));
  };
  const syncMusic = () => {
    if (!music) return;
    setActualMusicVolume();
    if (!musicEnabled || hidden || muted) {
      music.pause();
      return;
    }
    try { void music.play().catch(() => {}); } catch { /* Music is optional. */ }
  };

  const ensureMusic = () => {
    if (music || typeof Audio === 'undefined') return;
    try {
      music = new Audio(`${baseUrl}audio/marketing-day/background.mp3`);
      music.loop = true;
      music.preload = 'auto';
      setActualMusicVolume();
    } catch { music = null; }
  };

  const unlock = (): Promise<void> => {
    if (disposed) return Promise.resolve();
    if (state === 'ready') return Promise.resolve();
    if (state === 'unavailable') return Promise.resolve();
    if (unlockPromise) return unlockPromise;
    const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) {
      state = 'unavailable';
      return Promise.resolve();
    }
    try {
      // A rejected resume leaves a valid suspended context. Reuse it on the next gesture
      // instead of accumulating one suspended context per attempted unlock.
      if (!context || context.state === 'closed') context = new AudioContextConstructor();
      ensureMusic();
      // Invoke both play() calls in the trusted gesture stack for Safari activation.
      const musicAttempt = musicEnabled && !hidden && music ? music.play() : null;
      unlockPromise = Promise.allSettled([
        context.state === 'suspended' ? context.resume() : Promise.resolve(),
        musicAttempt ?? Promise.resolve(),
      ]).then(results => {
        const audioContextResult = results[0];
        if (disposed) return;
        if (audioContextResult.status === 'rejected') {
          // Browsers can reject resume before a trusted gesture. Keep this retryable.
          unlockPromise = null;
          return;
        }
        if (!context || context.state === 'closed') {
          state = 'unavailable';
          return;
        }
        state = 'ready';
      }).catch(() => { if (!disposed) unlockPromise = null; });
    } catch {
      if (context && context.state !== 'closed') {
        // A synchronous browser rejection can also mean "try again in a gesture".
        unlockPromise = null;
      } else {
        state = 'unavailable';
        unlockPromise = Promise.resolve();
      }
    }
    return unlockPromise ?? Promise.resolve();
  };

  const makeTone = (tone: Tone, now: number) => {
    if (!context || voices.size >= maxVoices) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + (tone.delay ?? 0);
    const end = start + tone.duration;
    oscillator.type = tone.type;
    oscillator.frequency.setValueAtTime(tone.frequency, start);
    if (tone.bend) oscillator.frequency.linearRampToValueAtTime(tone.bend, end);
    gain.gain.setValueAtTime(effectsVolume * (tone.level ?? 0.25), start);
    gain.gain.setValueAtTime(0, end);
    oscillator.connect(gain);
    gain.connect(context.destination);
    voices.add(oscillator);
    oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start);
    oscillator.stop(end + 0.005);
  };

  const makeNoise = (settings: NonNullable<CuePattern['noise']>, now: number) => {
    if (!context || voices.size >= maxVoices) return;
    const sampleRate = context.sampleRate || 44100;
    const length = Math.max(1, Math.ceil(sampleRate * settings.duration));
    const buffer = context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    // Quantize white noise to 8-bit steps for a crunchy, short arcade transient.
    for (let i = 0; i < length; i++) data[i] = Math.round((Math.random() * 2 - 1) * 127) / 127;
    const source = context.createBufferSource();
    const gain = context.createGain();
    const start = now + (settings.delay ?? 0);
    source.buffer = buffer;
    gain.gain.setValueAtTime(effectsVolume * settings.level, start);
    gain.gain.setValueAtTime(0, start + settings.duration);
    source.connect(gain);
    gain.connect(context.destination);
    voices.add(source);
    source.onended = () => { voices.delete(source); source.disconnect(); gain.disconnect(); };
    source.start(start);
    source.stop(start + settings.duration + 0.005);
  };

  return {
    get status() { return state; },
    unlock,
    play(cue, force = false) {
      if (disposed || (muted && !force) || hidden || (paused && cue === 'step')) return;
      if (state !== 'ready' || !context) {
        void unlock().then(() => { if (state === 'ready') this.play(cue, force); });
        return;
      }
      const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const throttleMs = cue === 'step' ? 205 : cue === 'click' ? 85 : 45;
      if (nowMs - (lastPlayed.get(cue) ?? -Infinity) < throttleMs) return;
      lastPlayed.set(cue, nowMs);
      const pattern = patterns[cue];
      const now = context.currentTime;
      if (pattern.noise) makeNoise(pattern.noise, now);
      for (const tone of pattern.tones ?? []) makeTone(tone, now);
    },
    setMuted(value) {
      muted = value;
      setActualMusicVolume();
      if (muted && context) {
        for (const voice of voices) { try { voice.stop(context.currentTime); } catch { /* Already stopped. */ } }
      }
      syncMusic();
    },
    setEffectsVolume(value) { effectsVolume = Math.min(1, Math.max(0, value)); },
    setMusicEnabled(value) { musicEnabled = value; if (state === 'locked' && value) return; syncMusic(); },
    setMusicVolume(value) { musicVolume = Math.min(1, Math.max(0, value)); setActualMusicVolume(); },
    setPaused(value) { paused = value; setActualMusicVolume(); },
    setHidden(value) { hidden = value; syncMusic(); },
    dispose() {
      disposed = true;
      for (const voice of voices) { try { voice.disconnect(); } catch { /* Already ended. */ } }
      voices.clear();
      if (music) { music.pause(); music.removeAttribute('src'); music.load(); music = null; }
      if (context && context.state !== 'closed') void context.close().catch(() => {});
      context = null;
      unlockPromise = null;
      lastPlayed.clear();
    },
  };
}
