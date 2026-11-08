import { useCallback, useEffect, useRef, useState } from 'react';

export const SALON_MUSIC_CREDIT = {
  title: 'Gymnopédies – la 1ére. lent et douloureux (Gymnopédie No. 1)',
  creator: 'Erik Satie 作曲；Robin Alciatore 演奏',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg',
  licenseName: 'Public domain（錄音者釋出；Musopen 請求禮貌署名）',
  licenseUrl: 'https://commons.wikimedia.org/wiki/File:Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg',
} as const;

type SalonSound = 'click' | 'move' | 'confirm' | 'page' | 'success' | 'error';
type AudioContextConstructor = typeof AudioContext;

const MUSIC_PATH = `${import.meta.env.BASE_URL}audio/paris-salon/background-v4.mp3`;
const FOOTSTEP_INTERVAL_MS = 190;

const SOUND_NOTES: Record<Exclude<SalonSound, 'error'>, number[]> = {
  click: [740],
  move: [392, 523],
  confirm: [523, 659],
  page: [587, 784],
  success: [523, 659, 784, 1047],
};

function createNoiseBuffer(context: AudioContext): AudioBuffer {
  const length = Math.floor(context.sampleRate * 0.055);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / length);
  }
  return buffer;
}

export function useSalonAudio(moving: boolean) {
  const [unlocked, setUnlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.75);
  const [musicReady, setMusicReady] = useState(false);
  const [musicError, setMusicError] = useState('');
  const contextRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);
  const mutedRef = useRef(false);
  const volumeRef = useRef(0.75);
  const movingRef = useRef(moving);
  const hiddenRef = useRef(false);
  const activeNodesRef = useRef(new Set<AudioScheduledSourceNode>());
  const mountedRef = useRef(false);
  const playRef = useRef<(kind: SalonSound) => void>(() => {});

  movingRef.current = moving;

  const applyAudioState = useCallback(() => {
    const context = contextRef.current;
    const music = musicRef.current;
    if (music) {
      music.volume = volumeRef.current * 0.8;
      if (mutedRef.current || hiddenRef.current || !unlockedRef.current) {
        music.pause();
      } else if (music.paused) {
        void Promise.resolve(music.play()).then(() => {
          if (mountedRef.current) setMusicError('');
        }).catch(() => {
          if (!mountedRef.current || mutedRef.current || hiddenRef.current) return;
          setMusicError('背景音樂暫時無法播放。');
        });
      }
    }
    if (context) {
      if (mutedRef.current || hiddenRef.current) void context.suspend().catch(() => {});
      else if (unlockedRef.current) void context.resume().catch(() => {});
    }
  }, []);

  const unlock = useCallback(() => {
    if (!unlockedRef.current) {
      unlockedRef.current = true;
      setUnlocked(true);
      try {
        const browserWindow = window as Window & { webkitAudioContext?: AudioContextConstructor };
        const Constructor = window.AudioContext ?? browserWindow.webkitAudioContext;
        if (Constructor) {
          const context = new Constructor();
          contextRef.current = context;
          void context.resume().catch(() => {});
        }
        const music = new Audio(MUSIC_PATH);
        music.loop = true;
        music.preload = 'auto';
        music.volume = volumeRef.current * 0.8;
        music.addEventListener('canplay', () => {
          if (mountedRef.current) setMusicReady(true);
        });
        music.addEventListener('error', () => {
          if (mountedRef.current) {
            setMusicReady(false);
            setMusicError('背景音樂載入失敗，請檢查連線或瀏覽器音訊支援。');
          }
        });
        musicRef.current = music;
        if (!mutedRef.current && !hiddenRef.current) {
          void Promise.resolve(music.play()).then(() => {
            if (mountedRef.current) setMusicError('');
          }).catch(() => {
            if (mountedRef.current && !mutedRef.current && !hiddenRef.current) {
              setMusicError('背景音樂暫時無法播放。');
            }
          });
        }
        // The gesture that unlocks audio also gets its own click sound.
        playRef.current('click');
      } catch {
        setMusicError('此瀏覽器無法啟用音訊；遊戲仍可繼續。');
      }
    }
  }, []);

  const play = useCallback((kind: SalonSound) => {
    if (!unlockedRef.current || mutedRef.current || hiddenRef.current || volumeRef.current === 0) return;
    const context = contextRef.current;
    if (!context) return;
    if (context.state === 'suspended') void context.resume().catch(() => {});

    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(Math.max(0.0001, volumeRef.current * 0.36), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'success' ? 0.52 : 0.13));
    gain.connect(context.destination);

    if (kind === 'error') {
      const noise = context.createBufferSource();
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1150, now);
      noise.buffer = createNoiseBuffer(context);
      noise.connect(filter);
      filter.connect(gain);
      activeNodesRef.current.add(noise);
      noise.onended = () => {
        activeNodesRef.current.delete(noise);
        noise.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
      noise.start(now);
      return;
    }

    const notes = SOUND_NOTES[kind];
    let remainingNotes = notes.length;
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const noteGain = context.createGain();
      const start = now + index * (kind === 'success' ? 0.105 : 0.035);
      oscillator.type = kind === 'move' ? 'triangle' : 'square';
      oscillator.frequency.setValueAtTime(frequency, start);
      noteGain.gain.setValueAtTime(1 / Math.max(notes.length, 1), start);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, start + (kind === 'success' ? 0.095 : 0.075));
      oscillator.connect(noteGain);
      noteGain.connect(gain);
      activeNodesRef.current.add(oscillator);
      oscillator.onended = () => {
        activeNodesRef.current.delete(oscillator);
        oscillator.disconnect();
        noteGain.disconnect();
        remainingNotes -= 1;
        if (remainingNotes === 0) gain.disconnect();
      };
      oscillator.start(start);
      oscillator.stop(start + (kind === 'success' ? 0.105 : 0.085));
    });
  }, []);
  playRef.current = play;

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    applyAudioState();
  }, [applyAudioState]);

  const setVolume = useCallback((nextVolume: number) => {
    const safeVolume = Number.isFinite(nextVolume) ? Math.min(1, Math.max(0, nextVolume)) : 0;
    volumeRef.current = safeVolume;
    setVolumeState(safeVolume);
    applyAudioState();
  }, [applyAudioState]);

  useEffect(() => {
    mountedRef.current = true;
    const onVisibilityChange = () => {
      hiddenRef.current = document.visibilityState === 'hidden';
      applyAudioState();
    };
    hiddenRef.current = document.visibilityState === 'hidden';
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      const music = musicRef.current;
      if (music) {
        music.pause();
        music.removeAttribute('src');
        music.load();
        musicRef.current = null;
      }
      for (const node of activeNodesRef.current) {
        try { node.stop(); } catch { /* Already ended. */ }
        node.disconnect();
      }
      activeNodesRef.current.clear();
      const context = contextRef.current;
      contextRef.current = null;
      if (context) void context.close().catch(() => {});
    };
  }, [applyAudioState]);

  useEffect(() => {
    if (!moving || !unlocked || muted) return undefined;
    play('move');
    const interval = window.setInterval(() => {
      if (movingRef.current && unlockedRef.current && !mutedRef.current && !hiddenRef.current) play('move');
    }, FOOTSTEP_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [moving, unlocked, muted, play]);

  return { unlocked, muted, volume, musicReady, musicError, unlock, toggleMute, setVolume, play };
}
