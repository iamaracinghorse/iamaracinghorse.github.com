import { useState, useCallback, useRef } from 'react';
import { AppleMusicSong, MusicKitInstance } from '../types';
import { loadDevToken, saveDevToken } from '../utils/storage';

const BYPASS = import.meta.env.VITE_BYPASS_AUTH === 'true';
const EMBEDDED_TOKEN: string | undefined = import.meta.env.VITE_MUSICKIT_TOKEN;

export type PlaybackState = 'none' | 'loading' | 'playing' | 'paused' | 'stopped' | 'ended';

interface UseAppleMusic {
  isReady: boolean;
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  volume: number;
  nowPlayingId: string | null;
  configure: (token: string) => Promise<void>;
  authorize: () => Promise<void>;
  search: (query: string) => Promise<AppleMusicSong[]>;
  playTrack: (id: string) => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
  seekTo: (seconds: number) => void;
  setVolume: (v: number) => void;
  devToken: string | null;
}

function numericStateToString(n: number): PlaybackState {
  switch (n) {
    case 1: return 'loading';
    case 2: return 'playing';
    case 3: return 'paused';
    case 4: return 'stopped';
    case 5: return 'ended';
    default: return 'none';
  }
}

function waitForMusicKit(): Promise<void> {
  if (window.MusicKit) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('MusicKit JS timed out loading. Check your internet connection.')),
      10_000,
    );
    document.addEventListener('musickitloaded', () => { clearTimeout(timer); resolve(); }, { once: true });
  });
}

export function useAppleMusic(): UseAppleMusic {
  const musicRef = useRef<MusicKitInstance | null>(null);
  const [isReady, setIsReady] = useState(BYPASS);
  const [isAuthorized, setIsAuthorized] = useState(BYPASS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('none');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [nowPlayingId, setNowPlayingId] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(() => loadDevToken());

  function attachListeners(instance: MusicKitInstance) {
    instance.addEventListener('playbackStateDidChange', () => {
      setPlaybackState(numericStateToString(instance.playbackState));
    });
    instance.addEventListener('playbackTimeDidChange', () => {
      setCurrentTime(instance.currentPlaybackTime);
      setDuration(instance.currentPlaybackDuration);
    });
    instance.addEventListener('mediaItemStateDidChange', () => {
      setNowPlayingId(instance.nowPlayingItem?.id ?? null);
    });
  }

  const configure = useCallback(async (token: string) => {
    if (BYPASS) return;
    setIsLoading(true);
    setError(null);
    try {
      await waitForMusicKit();

      // MusicKit v3 configure() may return a Promise — await it either way
      await Promise.resolve(window.MusicKit.configure({
        developerToken: token,
        app: { name: "Boddydock's Magical Music Box", build: '1.0.0' },
      }));
      const instance = window.MusicKit.getInstance();

      if (!instance) throw new Error('MusicKit failed to initialize. Please refresh and try again.');

      musicRef.current = instance;
      if (!EMBEDDED_TOKEN) {
        saveDevToken(token);
        setDevToken(token);
      }
      attachListeners(instance);
      setIsReady(true);
      setIsAuthorized(instance.isAuthorized);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Configuration failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const authorize = useCallback(async () => {
    if (!musicRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      await musicRef.current.authorize();
      setIsAuthorized(musicRef.current.isAuthorized);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authorization failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const search = useCallback(async (query: string): Promise<AppleMusicSong[]> => {
    if (BYPASS) return [];
    if (!musicRef.current || !query.trim()) return [];
    try {
      const result = await musicRef.current.api.music('/v1/catalog/us/search', {
        term: query.trim(),
        types: 'songs',
        limit: '15',
      }) as { data: { results?: { songs?: { data: AppleMusicSong[] } } } };
      return result.data?.results?.songs?.data ?? [];
    } catch {
      return [];
    }
  }, []);

  const playTrack = useCallback(async (id: string) => {
    if (BYPASS) { setNowPlayingId(id); setPlaybackState('playing'); return; }
    if (!musicRef.current) return;
    try {
      await musicRef.current.setQueue({ song: id });
      await musicRef.current.play();
      setNowPlayingId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Playback failed');
    }
  }, []);

  const pause = useCallback(() => {
    if (BYPASS) { setPlaybackState('paused'); return; }
    musicRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    if (BYPASS) { setPlaybackState('playing'); return; }
    await musicRef.current?.play();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    musicRef.current?.seekToTime(seconds);
  }, []);

  const setVolume = useCallback((v: number) => {
    if (musicRef.current) musicRef.current.volume = v;
    setVolumeState(v);
  }, []);

  return {
    isReady,
    isAuthorized,
    isLoading,
    error,
    playbackState,
    currentTime,
    duration,
    volume,
    nowPlayingId,
    configure,
    authorize,
    search,
    playTrack,
    pause,
    resume,
    seekTo,
    setVolume,
    devToken,
  };
}
