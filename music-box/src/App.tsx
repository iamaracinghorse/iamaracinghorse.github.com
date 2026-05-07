import { useState } from 'react';
import { useAppleMusic } from './hooks/useAppleMusic';
import { useTracks } from './hooks/useTracks';
import { SetupScreen } from './components/SetupScreen';
import { TrackTile } from './components/TrackTile';
import { MediaPlayer } from './components/MediaPlayer';
import { SearchModal } from './components/SearchModal';
import { EditModal } from './components/EditModal';
import { SavedTrack, TrackColor, TrackType } from './types';

export default function App() {
  const music = useAppleMusic();
  const { tracks, addTrack, updateTrack, deleteTrack } = useTracks();

  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<SavedTrack | null>(null);

  const activeTrack = tracks.find(t => t.id === activeTrackId) ?? null;
  const isReady = music.isReady && music.isAuthorized;

  const [filterTag, setFilterTag] = useState<string | null>(null);
  const allTags = Array.from(new Set(tracks.flatMap(t => t.tags))).sort();
  const visibleTracks = filterTag ? tracks.filter(t => t.tags.includes(filterTag)) : tracks;


  const handleTilePress = async (track: SavedTrack) => {
    if (activeTrackId === track.id) {
      // Toggle play/pause
      if (music.playbackState === 'playing') {
        music.pause();
      } else {
        await music.resume();
      }
    } else {
      setActiveTrackId(track.id);
      setIsPlayerOpen(true);
      await music.playTrack(track.appleMusicId);
    }
  };

  const handleTileLongPress = (track: SavedTrack) => {
    setEditingTrack(track);
  };

  const handlePlayerClose = () => {
    setIsPlayerOpen(false);
    music.pause();
  };

  const handleAddTrack = (
    song: Parameters<typeof addTrack>[0],
    values: { title: string; emoji: string; tags: string[]; color: TrackColor; type: TrackType }
  ) => {
    addTrack(song, values);
    setIsSearchOpen(false);
  };

  const handleEditSave = (values: { title: string; emoji: string; tags: string[]; color: TrackColor; type: TrackType }) => {
    if (!editingTrack) return;
    updateTrack(editingTrack.id, values);
    setEditingTrack(null);
  };

  const handleDelete = () => {
    if (!editingTrack) return;
    if (activeTrackId === editingTrack.id) {
      music.pause();
      setIsPlayerOpen(false);
      setActiveTrackId(null);
    }
    deleteTrack(editingTrack.id);
    setEditingTrack(null);
  };

  // Setup phase
  if (!isReady) {
    return (
      <div
        className="min-h-full overflow-y-auto"
        style={{ background: 'linear-gradient(180deg, #0f0805 0%, #1e120a 100%)' }}
      >
        <SetupScreen
          isConfigured={music.isReady}
          isAuthorized={music.isAuthorized}
          isLoading={music.isLoading}
          error={music.error}
          onConfigure={music.configure}
          onAuthorize={music.authorize}
        />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ background: 'linear-gradient(180deg, #0f0805 0%, #1e120a 100%)' }}
    >
      {/* Header */}
      <header
        className="shrink-0 px-4 border-b"
        style={{
          paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
          paddingBottom: '0.75rem',
          borderColor: '#4a3520',
          background: 'rgba(15,8,5,0.85)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <h1
              className="text-fantasy-gold leading-tight text-base font-black"
              style={{
                fontFamily: "'Cinzel Decorative', serif",
                textShadow: '0 0 20px rgba(201,162,39,0.35)',
                lineHeight: 1.2,
              }}
            >
              Boddydock's
              <br />
              <span style={{ fontSize: '0.7em', opacity: 0.9 }}>Magical Music Box</span>
            </h1>
          </div>
          <button
            className="btn-fantasy text-xs px-3 py-2"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Add track"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </header>

      {/* Tag filter strip */}
      {allTags.length > 0 && (
        <div
          className="shrink-0 flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar"
          style={{ borderBottom: '1px solid #2a1a0e' }}
        >
          <button
            onClick={() => setFilterTag(null)}
            className="shrink-0 text-xs px-3 py-1 rounded-full border transition-colors"
            style={{
              fontFamily: "'Cinzel', serif",
              background: filterTag === null ? '#c9a227' : 'transparent',
              color: filterTag === null ? '#0f0805' : '#a07840',
              borderColor: filterTag === null ? '#c9a227' : '#4a3520',
            }}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className="shrink-0 text-xs px-3 py-1 rounded-full border transition-colors"
              style={{
                fontFamily: "'Cinzel', serif",
                background: filterTag === tag ? '#c9a227' : 'transparent',
                color: filterTag === tag ? '#0f0805' : '#a07840',
                borderColor: filterTag === tag ? '#c9a227' : '#4a3520',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Track grid */}
      <main
        className="flex-1 overflow-y-auto px-3 py-3 max-w-2xl mx-auto w-full"
        style={{ paddingBottom: isPlayerOpen ? '160px' : '1rem' }}
      >
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
            <div
              className="text-7xl mb-6 select-none"
              style={{ filter: 'drop-shadow(0 4px 16px rgba(201,162,39,0.3))' }}
            >
              🔮
            </div>
            <h2
              className="text-fantasy-gold font-black text-xl mb-3"
              style={{ fontFamily: "'Cinzel Decorative', serif", textShadow: '0 0 24px rgba(201,162,39,0.3)' }}
            >
              The Box Awaits
            </h2>
            <p
              className="text-fantasy-text-muted text-sm mb-2 leading-relaxed max-w-xs"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Thy collection of sonic enchantments lies empty.
            </p>
            <p className="text-fantasy-text-dim text-xs mb-8 leading-relaxed max-w-xs">
              Search thy Apple Music library, bestow a name and an omen upon each melody, and let the box remember.
            </p>
            <button className="btn-fantasy px-6 py-3 text-sm" onClick={() => setIsSearchOpen(true)}>
              ✦ Enchant the First Track
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visibleTracks.map(track => (
              <TrackTile
                key={track.id}
                track={track}
                isActive={activeTrackId === track.id && isPlayerOpen}
                onPress={() => handleTilePress(track)}
                onLongPress={() => handleTileLongPress(track)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Media player */}
      {isPlayerOpen && activeTrack && (
        <MediaPlayer
          track={activeTrack}
          playbackState={music.playbackState}
          currentTime={music.currentTime}
          duration={music.duration}
          volume={music.volume}
          onPlay={music.resume}
          onPause={music.pause}
          onSeek={music.seekTo}
          onVolumeChange={music.setVolume}
          onClose={handlePlayerClose}
        />
      )}

      {/* Search modal */}
      {isSearchOpen && (
        <SearchModal
          onSearch={music.search}
          onAdd={handleAddTrack}
          onClose={() => setIsSearchOpen(false)}
        />
      )}

      {/* Edit modal */}
      {editingTrack && (
        <EditModal
          track={editingTrack}
          onSave={handleEditSave}
          onDelete={handleDelete}
          onClose={() => setEditingTrack(null)}
        />
      )}
    </div>
  );
}
