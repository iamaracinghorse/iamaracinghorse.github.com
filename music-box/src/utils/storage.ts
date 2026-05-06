import { SavedTrack } from '../types';

const TRACKS_KEY = 'bmmb_tracks';
const DEV_TOKEN_KEY = 'bmmb_dev_token';

export function loadTracks(): SavedTrack[] {
  try {
    const raw = localStorage.getItem(TRACKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedTrack[];
  } catch {
    return [];
  }
}

export function saveTracks(tracks: SavedTrack[]): void {
  localStorage.setItem(TRACKS_KEY, JSON.stringify(tracks));
}

export function loadDevToken(): string | null {
  return localStorage.getItem(DEV_TOKEN_KEY);
}

export function saveDevToken(token: string): void {
  localStorage.setItem(DEV_TOKEN_KEY, token);
}

export function clearDevToken(): void {
  localStorage.removeItem(DEV_TOKEN_KEY);
}
