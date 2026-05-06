export type TrackColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'black'
  | 'white';

export type TrackType = 'loop' | 'one-shot';

export interface SavedTrack {
  id: string;
  appleMusicId: string;
  title: string;
  realTitle: string;
  artist: string;
  album: string;
  artworkUrl: string | null;
  durationInMillis: number;
  emoji: string;
  tags: string[];
  color: TrackColor;
  type: TrackType;
  addedAt: number;
}

export interface AppleMusicSong {
  id: string;
  attributes: {
    name: string;
    artistName: string;
    albumName: string;
    durationInMillis: number;
    artwork: {
      url: string;
      width: number;
      height: number;
    } | null;
  };
}

export interface TrackFormValues {
  title: string;
  emoji: string;
  tags: string[];
  color: TrackColor;
  type: TrackType;
}

// Global MusicKit v3 declarations
declare global {
  interface Window {
    MusicKit: MusicKitNamespace;
  }
}

interface MusicKitNamespace {
  configure(config: {
    developerToken: string;
    app: { name: string; build: string };
  }): MusicKitInstance;
  getInstance(): MusicKitInstance;
}

export interface MusicKitInstance {
  isAuthorized: boolean;
  playbackState: number;
  currentPlaybackTime: number;
  currentPlaybackDuration: number;
  currentPlaybackProgress: number;
  volume: number;
  nowPlayingItem: { id: string } | null;
  authorize(): Promise<string>;
  unauthorize(): Promise<void>;
  setQueue(options: { song?: string; songs?: string[] }): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  seekToTime(time: number): void;
  addEventListener(event: string, handler: (e: unknown) => void): void;
  removeEventListener(event: string, handler: (e: unknown) => void): void;
  api: {
    music(
      path: string,
      params?: Record<string, string>
    ): Promise<{ data: unknown }>;
  };
}
