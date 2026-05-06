import { useState, useCallback } from 'react';
import { SavedTrack, TrackFormValues, AppleMusicSong } from '../types';
import { loadTracks, saveTracks } from '../utils/storage';
import { getArtworkUrl } from '../utils/colors';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useTracks() {
  const [tracks, setTracks] = useState<SavedTrack[]>(() => loadTracks());

  const addTrack = useCallback((song: AppleMusicSong, form: TrackFormValues) => {
    const artworkUrl = song.attributes.artwork
      ? getArtworkUrl(song.attributes.artwork.url, 600)
      : null;

    const track: SavedTrack = {
      id: generateId(),
      appleMusicId: song.id,
      title: form.title,
      realTitle: song.attributes.name,
      artist: song.attributes.artistName,
      album: song.attributes.albumName,
      artworkUrl,
      durationInMillis: song.attributes.durationInMillis,
      emoji: form.emoji,
      tags: form.tags,
      color: form.color,
      type: form.type,
      addedAt: Date.now(),
    };

    setTracks(prev => {
      const next = [...prev, track];
      saveTracks(next);
      return next;
    });

    return track;
  }, []);

  const updateTrack = useCallback((id: string, form: Partial<TrackFormValues>) => {
    setTracks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...form } : t);
      saveTracks(next);
      return next;
    });
  }, []);

  const deleteTrack = useCallback((id: string) => {
    setTracks(prev => {
      const next = prev.filter(t => t.id !== id);
      saveTracks(next);
      return next;
    });
  }, []);

  return { tracks, addTrack, updateTrack, deleteTrack };
}
