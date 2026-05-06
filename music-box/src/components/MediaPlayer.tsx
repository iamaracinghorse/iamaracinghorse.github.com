import { useEffect, useRef } from 'react';
import { SavedTrack } from '../types';
import { TRACK_COLORS } from '../utils/colors';
import { PlaybackState } from '../hooks/useAppleMusic';

interface MediaPlayerProps {
  track: SavedTrack;
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (t: number) => void;
  onVolumeChange: (v: number) => void;
  onClose: () => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function MediaPlayer({
  track,
  playbackState,
  currentTime,
  duration,
  volume,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onClose,
}: MediaPlayerProps) {
  const color = TRACK_COLORS[track.color];
  const isPlaying = playbackState === 'playing';
  const isLoading = playbackState === 'loading';
  const scrubRef = useRef<HTMLInputElement>(null);
  const isDraggingRef = useRef(false);

  const progress = duration > 0 ? currentTime / duration : 0;

  useEffect(() => {
    if (scrubRef.current && !isDraggingRef.current) {
      scrubRef.current.value = String(progress);
    }
  }, [progress]);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
      style={{
        background: `linear-gradient(180deg, ${color.bg}f0 0%, ${color.bg} 100%)`,
        backdropFilter: 'blur(20px)',
        borderTop: `1.5px solid ${color.border}`,
        boxShadow: `0 -8px 40px rgba(0,0,0,0.7)`,
        color: color.text,
      }}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full opacity-40" style={{ background: color.text }} />
      </div>

      <div className="px-4 pb-safe-bottom" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {/* Track info row */}
        <div className="flex items-center gap-3 mb-3">
          {/* Artwork */}
          <div
            className="flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-3xl"
            style={{
              width: 64,
              height: 64,
              background: `${color.bg}cc`,
              border: `1.5px solid ${color.border}`,
              boxShadow: `0 4px 12px rgba(0,0,0,0.5)`,
            }}
          >
            {track.artworkUrl ? (
              <img
                src={track.artworkUrl}
                alt={track.realTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              track.emoji || '🎵'
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xl leading-none">{track.emoji || '🎵'}</span>
              <p
                className="font-bold text-sm truncate"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {track.title}
              </p>
            </div>
            <p className="text-xs opacity-70 truncate" style={{ fontFamily: "'Cinzel', serif" }}>
              {track.realTitle} — {track.artist}
            </p>
            {track.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {track.tags.slice(0, 4).map(tag => (
                  <span key={tag} className="tag-pill">
                    {tag}
                  </span>
                ))}
                <span
                  className="text-xs font-bold uppercase tracking-widest opacity-50"
                  style={{ fontSize: '0.55rem', fontFamily: "'Cinzel', serif" }}
                >
                  {track.type === 'loop' ? '↻ Loop' : '▶ One-Shot'}
                </span>
              </div>
            )}
          </div>

          {/* Close */}
          <button
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            onClick={onClose}
            aria-label="Close player"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Scrubber */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs opacity-60 w-8 text-right tabular-nums" style={{ fontFamily: 'monospace' }}>
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 relative">
            <input
              ref={scrubRef}
              type="range"
              min={0}
              max={1}
              step={0.001}
              defaultValue={0}
              className="w-full"
              style={{
                background: `linear-gradient(to right, ${color.border} ${progress * 100}%, #2d1a0e ${progress * 100}%)`,
              }}
              onMouseDown={() => { isDraggingRef.current = true; }}
              onTouchStart={() => { isDraggingRef.current = true; }}
              onMouseUp={e => {
                isDraggingRef.current = false;
                onSeek(parseFloat((e.target as HTMLInputElement).value) * duration);
              }}
              onTouchEnd={e => {
                isDraggingRef.current = false;
                onSeek(parseFloat((e.target as HTMLInputElement).value) * duration);
              }}
              onChange={e => {
                if (!isDraggingRef.current) return;
                onSeek(parseFloat(e.target.value) * duration);
              }}
            />
          </div>
          <span className="text-xs opacity-60 w-8 tabular-nums" style={{ fontFamily: 'monospace' }}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3">
          {/* Volume */}
          <div className="flex items-center gap-2 flex-1">
            <svg className="w-3.5 h-3.5 opacity-50 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              className="w-full max-w-24"
              style={{
                background: `linear-gradient(to right, ${color.border} ${volume * 100}%, #2d1a0e ${volume * 100}%)`,
              }}
              onChange={e => onVolumeChange(parseFloat(e.target.value))}
            />
            <svg className="w-4 h-4 opacity-50 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          </div>

          {/* Play/Pause */}
          <button
            className="flex items-center justify-center rounded-full transition-transform active:scale-95"
            style={{
              width: 52,
              height: 52,
              background: `linear-gradient(135deg, #c9a227, #8a6910)`,
              boxShadow: '0 4px 16px rgba(201,162,39,0.4)',
              color: '#0f0805',
              flexShrink: 0,
            }}
            onClick={isPlaying ? onPause : onPlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Right spacer to balance volume on left */}
          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
}
