import { SavedTrack } from '../types';
import { TRACK_COLORS } from '../utils/colors';
import { useLongPress } from '../hooks/useLongPress';

interface TrackTileProps {
  track: SavedTrack;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export function TrackTile({ track, isActive, onPress, onLongPress }: TrackTileProps) {
  const color = TRACK_COLORS[track.color];
  const handlers = useLongPress(onLongPress, onPress);

  return (
    <div
      {...handlers}
      className="tile-press no-select relative rounded-2xl flex flex-col p-3 cursor-pointer overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${color.bg}, ${color.bg}cc)`,
        border: `1.5px solid ${isActive ? '#c9a227' : color.border}`,
        boxShadow: isActive
          ? `inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 24px ${color.shadow}, 0 0 0 2px #c9a22788`
          : `inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 16px ${color.shadow}`,
        aspectRatio: '1 / 1',
        minHeight: 0,
        color: color.text,
      }}
    >
      {/* Emoji — large, centered in the upper portion */}
      <div className="flex-1 flex items-center justify-center select-none">
        <span
          className="text-5xl leading-none"
          style={{
            filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.55))',
          }}
        >
          {track.emoji || '🎵'}
        </span>
      </div>

      {/* Bottom info block */}
      <div>
        {/* User title */}
        <p
          className="font-bold leading-tight text-sm line-clamp-2"
          style={{ fontFamily: "'Cinzel', serif", letterSpacing: '0.02em' }}
        >
          {track.title}
        </p>

        {/* Real track name */}
        <p
          className="text-xs mt-0.5 line-clamp-1 opacity-60"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {track.realTitle}
        </p>

        {/* Tags + type glyph */}
        <div className="flex items-center justify-between gap-1 mt-1.5">
          <div className="flex flex-wrap gap-1 overflow-hidden" style={{ maxHeight: '1.25rem' }}>
            {track.tags.slice(0, 2).map(tag => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))}
          </div>
          <span
            className="flex-shrink-0 opacity-50 leading-none"
            style={{ fontSize: '0.8rem' }}
            title={track.type === 'loop' ? 'Loop' : 'One-Shot'}
          >
            {track.type === 'loop' ? '∞' : '◆'}
          </span>
        </div>
      </div>

      {/* Active playing indicator */}
      {isActive && (
        <div
          className="absolute top-2 right-2 flex gap-0.5 items-end"
          style={{ height: 12 }}
        >
          {[4, 7, 5, 8, 6].map((h, i) => (
            <div
              key={i}
              className="w-0.5 rounded-sm"
              style={{
                height: h,
                background: '#c9a227',
                animation: `bounce ${0.4 + i * 0.07}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
