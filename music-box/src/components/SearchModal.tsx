import { useState, useEffect, useRef, useCallback } from 'react';
import { AppleMusicSong, TrackColor, TrackType } from '../types';
import { TRACK_COLORS, ALL_COLORS } from '../utils/colors';

const DEFAULT_TAGS = ['battle', 'intro', 'exposition'];

interface SearchModalProps {
  onSearch: (query: string) => Promise<AppleMusicSong[]>;
  onAdd: (song: AppleMusicSong, values: {
    title: string;
    emoji: string;
    tags: string[];
    color: TrackColor;
    type: TrackType;
  }) => void;
  onClose: () => void;
}

function getArtworkUrl(template: string, size: number) {
  return template.replace('{w}', String(size)).replace('{h}', String(size));
}

export function SearchModal({ onSearch, onAdd, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AppleMusicSong[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSong, setSelectedSong] = useState<AppleMusicSong | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎵');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [color, setColor] = useState<TrackColor>('blue');
  const [type, setType] = useState<TrackType>('one-shot');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await onSearch(q);
        setResults(res);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  }, [onSearch]);

  const selectSong = (song: AppleMusicSong) => {
    setSelectedSong(song);
    setTitle(song.attributes.name);
    setEmoji('🎵');
    setTags([]);
    setColor('blue');
    setType('one-shot');
  };

  const addTag = (t: string) => {
    const cleaned = t.trim().toLowerCase();
    if (cleaned && !tags.includes(cleaned)) setTags(prev => [...prev, cleaned]);
    setTagInput('');
  };

  const handleAdd = () => {
    if (!selectedSong || !title.trim()) return;
    onAdd(selectedSong, {
      title: title.trim(),
      emoji: emoji.trim() || '🎵',
      tags,
      color,
      type,
    });
  };

  const colorDef = TRACK_COLORS[color];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-fade-in"
      style={{ background: '#0f0805' }}
    >
      {/* Header */}
      <div
        className="px-4 pt-safe-top flex items-center gap-3 border-b shrink-0"
        style={{
          paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
          paddingBottom: '0.75rem',
          borderColor: '#4a3520',
          background: '#1e120a',
        }}
      >
        <button
          className="text-fantasy-text-muted hover:text-fantasy-text transition-colors text-sm font-bold uppercase tracking-widest"
          style={{ fontFamily: "'Cinzel', serif" }}
          onClick={selectedSong ? () => setSelectedSong(null) : onClose}
        >
          {selectedSong ? '← Back' : '× Close'}
        </button>
        <h2
          className="flex-1 text-center text-fantasy-gold text-sm font-bold tracking-widest uppercase"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {selectedSong ? 'Inscribe Enchantment' : 'Seek a Melody'}
        </h2>
        {selectedSong ? (
          <button
            className="btn-fantasy text-xs px-3 py-1.5"
            disabled={!title.trim()}
            onClick={handleAdd}
          >
            ✦ Add
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      {!selectedSong ? (
        /* Search phase */
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 py-3 shrink-0">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fantasy-text-dim"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                className="input-fantasy pl-9"
                placeholder="Search Apple Music…"
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isSearching && (
              <div className="flex justify-center py-8">
                <svg className="w-6 h-6 animate-spin text-fantasy-gold" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}

            {!isSearching && results.length === 0 && query.trim() && (
              <p className="text-center text-fantasy-text-dim py-8 text-sm">No melodies found for "{query}"</p>
            )}

            {!isSearching && results.length === 0 && !query.trim() && (
              <p className="text-center text-fantasy-text-dim py-8 text-sm">Begin thy search above…</p>
            )}

            <div className="space-y-2">
              {results.map(song => (
                <button
                  key={song.id}
                  className="w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-white/5 active:bg-white/10"
                  style={{ border: '1px solid #4a3520', background: '#1e120a' }}
                  onClick={() => selectSong(song)}
                >
                  <div
                    className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-xl"
                    style={{ background: '#2d1a0e', border: '1px solid #4a3520' }}
                  >
                    {song.attributes.artwork ? (
                      <img
                        src={getArtworkUrl(song.attributes.artwork.url, 100)}
                        alt={song.attributes.name}
                        className="w-full h-full object-cover"
                      />
                    ) : '🎵'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-fantasy-text text-sm font-semibold truncate" style={{ fontFamily: "'Cinzel', serif" }}>
                      {song.attributes.name}
                    </p>
                    <p className="text-fantasy-text-muted text-xs truncate">{song.attributes.artistName}</p>
                    <p className="text-fantasy-text-dim text-xs truncate">{song.attributes.albumName}</p>
                  </div>
                  <svg className="w-4 h-4 text-fantasy-text-dim flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Configure phase */
        <div className="flex-1 overflow-y-auto">
          {/* Song preview banner */}
          <div
            className="px-4 py-3 flex items-center gap-3 border-b"
            style={{ borderColor: '#4a3520', background: '#1e120a' }}
          >
            <div
              className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-lg"
              style={{ background: '#2d1a0e', border: '1px solid #4a3520' }}
            >
              {selectedSong.attributes.artwork ? (
                <img
                  src={getArtworkUrl(selectedSong.attributes.artwork.url, 80)}
                  alt={selectedSong.attributes.name}
                  className="w-full h-full object-cover"
                />
              ) : '🎵'}
            </div>
            <div className="min-w-0">
              <p className="text-fantasy-text text-xs font-semibold truncate" style={{ fontFamily: "'Cinzel', serif" }}>
                {selectedSong.attributes.name}
              </p>
              <p className="text-fantasy-text-dim text-xs truncate">{selectedSong.attributes.artistName}</p>
            </div>
          </div>

          <div className="px-4 py-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-fantasy-text-muted text-xs uppercase tracking-widest mb-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
                Name
              </label>
              <input
                className="input-fantasy"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Name this enchantment…"
              />
            </div>

            {/* Emoji */}
            <div>
              <label className="block text-fantasy-text-muted text-xs uppercase tracking-widest mb-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
                Sigil (Emoji)
              </label>
              <input
                className="input-fantasy text-2xl"
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                maxLength={4}
                placeholder="🎵"
              />
            </div>

            {/* Type toggle */}
            <div>
              <label className="block text-fantasy-text-muted text-xs uppercase tracking-widest mb-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
                Casting Type
              </label>
              <div className="flex gap-2">
                {(['loop', 'one-shot'] as TrackType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                    style={{
                      fontFamily: "'Cinzel', serif",
                      background: type === t ? 'linear-gradient(135deg, #c9a227, #8a6910)' : '#2d1a0e',
                      color: type === t ? '#0f0805' : '#a08060',
                      border: `1px solid ${type === t ? '#e8c84e' : '#4a3520'}`,
                    }}
                  >
                    {t === 'loop' ? '↻ Loop' : '▶ One-Shot'}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-fantasy-text-muted text-xs uppercase tracking-widest mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                Aura
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_COLORS.map(c => (
                  <button
                    key={c}
                    title={TRACK_COLORS[c].label}
                    onClick={() => setColor(c)}
                    className="rounded-full transition-all"
                    style={{
                      width: 28,
                      height: 28,
                      background: TRACK_COLORS[c].swatch,
                      border: color === c ? '2.5px solid #c9a227' : '2px solid rgba(255,255,255,0.15)',
                      boxShadow: color === c ? '0 0 8px rgba(201,162,39,0.6)' : 'none',
                      transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
              <p className="text-fantasy-text-dim text-xs mt-1.5">{colorDef.label}</p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-fantasy-text-muted text-xs uppercase tracking-widest mb-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
                Runes (Tags)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setTags(prev => prev.filter(x => x !== tag))}
                    className="tag-pill hover:bg-red-900/40 transition-colors"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="input-fantasy flex-1"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="Add rune…"
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                />
                <button
                  className="px-3 rounded-lg text-sm font-bold"
                  style={{ background: '#2d1a0e', border: '1px solid #4a3520', color: '#c9a227' }}
                  onClick={() => addTag(tagInput)}
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {DEFAULT_TAGS.filter(t => !tags.includes(t)).map(t => (
                  <button
                    key={t}
                    onClick={() => addTag(t)}
                    className="tag-pill opacity-50 hover:opacity-100 transition-opacity"
                    style={{ color: '#a08060' }}
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview tile */}
            <div>
              <label className="block text-fantasy-text-muted text-xs uppercase tracking-widest mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                Preview
              </label>
              <div className="flex justify-center">
                <div
                  className="rounded-2xl p-3 flex flex-col"
                  style={{
                    width: 140,
                    height: 140,
                    background: `linear-gradient(145deg, ${colorDef.bg}, ${colorDef.bg}cc)`,
                    border: `1.5px solid ${colorDef.border}`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 16px ${colorDef.shadow}`,
                    color: colorDef.text,
                  }}
                >
                  <div className="text-3xl leading-none mb-1">{emoji || '🎵'}</div>
                  <p className="font-bold text-xs mt-auto line-clamp-2" style={{ fontFamily: "'Cinzel', serif" }}>
                    {title || 'Untitled'}
                  </p>
                  <p className="text-xs opacity-60 truncate mt-0.5" style={{ fontFamily: "'Cinzel', serif" }}>
                    {selectedSong.attributes.name}
                  </p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 overflow-hidden max-h-4">
                      {tags.slice(0, 2).map(t => (
                        <span key={t} className="tag-pill">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              className="btn-fantasy w-full"
              disabled={!title.trim()}
              onClick={handleAdd}
            >
              ✦ Add to Collection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
