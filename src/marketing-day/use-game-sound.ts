import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioEngine, type AudioEngine, type SoundCue } from './audio-engine';

export type { SoundCue };

export interface GameSoundOptions {
  moving?: boolean;
  paused?: boolean;
}

export function useGameSound(options: GameSoundOptions = {}) {
  const [muted, setMuted] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolumeState] = useState(0.25);
  const [effectsVolume, setEffectsVolumeState] = useState(0.35);
  const [status, setStatus] = useState<'locked' | 'ready' | 'unavailable'>('locked');
  const engineRef = useRef<AudioEngine | null>(null);
  const mountedRef = useRef(false);
  const paused = options.paused ?? false;
  const settingsRef = useRef({ muted, musicEnabled, musicVolume, effectsVolume, paused });
  settingsRef.current = { muted, musicEnabled, musicVolume, effectsVolume, paused };
  const statusRef = useRef(status);
  statusRef.current = status;

  const unlock = useCallback(() => {
    if (statusRef.current === 'unavailable') return;
    const engine = engineRef.current ?? (engineRef.current = createAudioEngine());
    const settings = settingsRef.current;
    engine.setMuted(settings.muted);
    engine.setMusicEnabled(settings.musicEnabled);
    engine.setMusicVolume(settings.musicVolume);
    engine.setEffectsVolume(settings.effectsVolume);
    engine.setPaused(settings.paused);
    engine.setHidden(typeof document !== 'undefined' && document.hidden);
    void engine.unlock().then(() => {
      if (!mountedRef.current) return;
      statusRef.current = engine.status;
      setStatus(engine.status);
    });
  }, []);

  const play = useCallback((cueOrComplete: SoundCue | boolean = 'click', force = false) => {
    const cue: SoundCue = typeof cueOrComplete === 'boolean' ? (cueOrComplete ? 'complete' : 'confirm') : cueOrComplete;
    const settings = settingsRef.current;
    if (settings.muted && !force) return;
    if (statusRef.current === 'unavailable') return;
    const engine = engineRef.current ?? (engineRef.current = createAudioEngine());
    engine.setMuted(settings.muted);
    engine.setEffectsVolume(settings.effectsVolume);
    if (engine.status === 'locked') {
      unlock();
      void engine.unlock().then(() => {
        if (!mountedRef.current) return;
        statusRef.current = engine.status;
        setStatus(engine.status);
        if (engine.status === 'ready') engine.play(cue, force);
      });
      return;
    }
    engine.play(cue, force);
  }, [unlock]);

  const toggle = useCallback(() => {
    const next = !settingsRef.current.muted;
    settingsRef.current = { ...settingsRef.current, muted: next };
    setMuted(next);
    engineRef.current?.setMuted(next);
    if (!next) unlock();
  }, [unlock]);

  const toggleMusic = useCallback(() => {
    setMusicEnabled(previous => {
      const next = !previous;
      engineRef.current?.setMusicEnabled(next);
      return next;
    });
  }, []);

  const setMusicVolume = useCallback((value: number) => {
    const next = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
    setMusicVolumeState(next);
    engineRef.current?.setMusicVolume(next);
  }, []);

  const setEffectsVolume = useCallback((value: number) => {
    const next = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
    setEffectsVolumeState(next);
    engineRef.current?.setEffectsVolume(next);
  }, []);

  useEffect(() => {
    engineRef.current?.setMuted(muted);
  }, [muted]);
  useEffect(() => {
    engineRef.current?.setMusicEnabled(musicEnabled);
  }, [musicEnabled]);
  useEffect(() => {
    engineRef.current?.setMusicVolume(musicVolume);
  }, [musicVolume]);
  useEffect(() => {
    engineRef.current?.setEffectsVolume(effectsVolume);
  }, [effectsVolume]);
  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    const updateVisibility = () => engineRef.current?.setHidden(document.hidden);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (!options.moving || paused) return;
    // Movement effects never unlock audio from a React effect; that must happen in a trusted UI gesture.
    if (engineRef.current?.status !== 'ready' || muted) return;
    play('step');
    const timer = window.setInterval(() => play('step'), 210);
    return () => window.clearInterval(timer);
  }, [muted, options.moving, paused, play, status]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return { muted, toggle, play, unlock, musicEnabled, toggleMusic, musicVolume, setMusicVolume, effectsVolume, setEffectsVolume, status };
}
