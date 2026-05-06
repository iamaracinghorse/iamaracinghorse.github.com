import { useState } from 'react';
import { SavedTrack, TrackColor, TrackType } from '../types';
import { TRACK_COLORS, ALL_COLORS } from '../utils/colors';

const DEFAULT_TAGS = ['battle', 'intro', 'exposition'];

interface EditModalProps {
  track: SavedTrack;
  onSave: (values: { title: string; emoji: string; tags: string[]; color: TrackColor; type: TrackType }) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function EditModal({ track, onSave, onDelete, onClose }: EditModalProps) {
  const [title, setTitle] = useState(track.title);
  const [emoji, setEmoji] = useState(track.emoji);
  const [tags, setTags] = useState<string[]>(track.tags);
  const [tagInput, setTagInput] = useState('');
  const [color, setColor] = useState<TrackColor>(track.color);
  const [type, setType] = useState<TrackType>(track.type);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const addTag = (t: string) => {
    const cleaned = t.trim().toLowerCase();
    if (cleaned && !tags.includes(cleaned)) {
      setTags(prev => [...prev, cleaned]);
    }
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), emoji: emoji.trim() || '🎵', tags, color, type });
  };

  const colorDef = TRACK_COLORS[color];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: 'linear-gradient(145deg, #2d1a0e, #1e120a)',
          border: '1.5px solid #7a5c2e',
          boxShadow: '0 -8px 60px rgba(0,0,0,0.8)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          className="px-5 pt-4 pb-3 border-b"
          style={{ borderColor: '#4a3520', background: `${colorDef.bg}44` }}
        >
          <div className="flex items-center justify-between">
            <h2
              className="text-fantasy-gold font-bold tracking-widest uppercase text-sm"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Edit Enchantment
            </h2>
            <button className="text-fantasy-text-muted hover:text-fantasy-text transition-colors text-xl" onClick={onClose}>
              ×
            </button>
          </div>
          <p className="text-fantasy-text-muted text-xs mt-0.5 truncate">{track.realTitle} — {track.artist}</p>
        </div>

        <div className="px-5 py-4 space-y-4">
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

          {/* Color picker */}
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
                  className="rounded-full transition-transform active:scale-95"
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
            <p className="text-fantasy-text-dim text-xs mt-1.5">{TRACK_COLORS[color].label}</p>
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
                  onClick={() => removeTag(tag)}
                  className="tag-pill hover:bg-red-900/40 transition-colors"
                  style={{ color: colorDef.text }}
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

          {/* Save */}
          <button
            className="btn-fantasy w-full"
            disabled={!title.trim()}
            onClick={handleSave}
          >
            ✦ Save Changes
          </button>

          {/* Delete */}
          {!confirmDelete ? (
            <button
              className="w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700/70"
              style={{ fontFamily: "'Cinzel', serif", background: 'transparent' }}
              onClick={() => setConfirmDelete(true)}
            >
              ⚔ Banish Track
            </button>
          ) : (
            <div className="rounded-lg border border-red-800/60 p-3 text-center">
              <p className="text-red-300 text-xs mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
                This enchantment shall be unmade. Are you certain?
              </p>
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 rounded-lg text-xs font-bold uppercase border border-fantasy-border text-fantasy-text-muted hover:text-fantasy-text transition-colors"
                  style={{ fontFamily: "'Cinzel', serif" }}
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2 rounded-lg text-xs font-bold uppercase"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    background: '#7a1818',
                    color: '#ffe8e8',
                    border: '1px solid #b03030',
                  }}
                  onClick={onDelete}
                >
                  Banish
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
