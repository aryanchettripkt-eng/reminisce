import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Search, 
  Plus, 
  Disc, 
  Music, 
  Camera, 
  ChevronRight, 
  Sparkles, 
  Check, 
  Volume2, 
  VolumeX,
  X,
  ExternalLink
} from 'lucide-react';
import { Memory } from '../lib/groq';
import { LOCAL_TRACKS, Track } from '../lib/music';

interface VinylVaultProps {
  memories: Memory[];
  spotifyToken: string | null;
  onConnectSpotify: () => void;
  onSelectTrackForMemory?: (track: Track) => void;
}

export default function VinylVault({ memories, spotifyToken, onConnectSpotify }: VinylVaultProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedRecord, setSelectedRecord] = useState<Track | null>(LOCAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [spotifySearchQuery, setSpotifySearchQuery] = useState('');
  const [spotifyTracks, setSpotifyTracks] = useState<any[]>([]);
  const [isSearchingSpotify, setIsSearchingSpotify] = useState(false);
  const [showSpotifyDrawer, setShowSpotifyDrawer] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const categories = [
    { name: 'All', count: 29 },
    { name: 'Jazz', count: 14 },
    { name: 'Soul', count: 6 },
    { name: 'Ambient', count: 9 },
    { name: 'Indie', count: 8 },
    { name: 'Pop', count: 7 }
  ];

  const filteredTracks = activeCategory === 'All' 
    ? LOCAL_TRACKS 
    : LOCAL_TRACKS.filter(t => t.genre.toLowerCase() === activeCategory.toLowerCase());

  // Associated photo memories for selected record
  const associatedMemories = memories.filter(m => 
    m.photoUrl && (m.music?.song?.toLowerCase().includes(selectedRecord?.title.toLowerCase() || '') || m.type === 'photo')
  ).slice(0, 4);

  const searchSpotify = async (query: string) => {
    if (!spotifyToken || !query) return;
    setIsSearchingSpotify(true);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      const data = await res.json();
      setSpotifyTracks(data.tracks?.items || []);
    } catch (e) {
      console.error("Spotify search error:", e);
    } finally {
      setIsSearchingSpotify(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50/40 via-cream to-parchment/60 py-10 px-4 sm:px-8 relative overflow-hidden">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Disc className="text-moss animate-spin-slow" size={24} />
            <span className="font-hand text-xs text-moss tracking-[0.2em] uppercase font-semibold">Vinyl Collection</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-dark-brown font-bold tracking-tight">
            My Vinyl <span className="font-serif italic font-normal text-brown">VAULT</span>
          </h1>
          <p className="font-hand text-sm text-brown/60 mt-1">Sleeves tell their own stories — music tied to your visual memories.</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSpotifyDrawer(!showSpotifyDrawer)}
            className="btn-tactile px-5 py-2.5 rounded-full bg-emerald-700 text-white font-hand text-sm tracking-wide flex items-center gap-2 shadow-md hover:bg-emerald-800"
          >
            <Music size={16} />
            {spotifyToken ? 'Spotify Connected' : 'Sync Spotify'}
          </button>
          
          <button 
            onClick={() => setShowSpotifyDrawer(true)}
            className="btn-tactile w-11 h-11 rounded-full bg-white/90 border border-light-brown/30 text-dark-brown flex items-center justify-center shadow-sm hover:bg-white"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Spotify Sync Drawer */}
      <AnimatePresence>
        {showSpotifyDrawer && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-6xl mx-auto mb-10 bg-white/95 backdrop-blur-md rounded-2xl border border-emerald-500/20 p-6 shadow-xl relative"
          >
            <button 
              onClick={() => setShowSpotifyDrawer(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Music size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-dark-brown font-semibold">Spotify Music Library Sync</h3>
                  <p className="font-hand text-xs text-brown/60">Import saved albums directly into your acrylic vinyl shelves</p>
                </div>
              </div>

              {!spotifyToken ? (
                <button 
                  onClick={onConnectSpotify}
                  className="btn-tactile px-6 py-2 rounded-full bg-emerald-600 text-white font-hand text-sm shadow-md hover:bg-emerald-700"
                >
                  Connect Spotify Account
                </button>
              ) : (
                <span className="font-hand text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <Check size={14} /> Active Session
                </span>
              )}
            </div>

            {spotifyToken && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={spotifySearchQuery}
                    onChange={(e) => setSpotifySearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchSpotify(spotifySearchQuery)}
                    placeholder="Search Spotify for albums or tracks to add to Vinyl Vault..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-hand text-sm text-dark-brown outline-none focus:border-emerald-500"
                  />
                  <button 
                    onClick={() => searchSpotify(spotifySearchQuery)}
                    disabled={isSearchingSpotify}
                    className="btn-tactile px-6 py-2.5 rounded-xl bg-dark-brown text-cream font-hand text-sm hover:bg-black"
                  >
                    {isSearchingSpotify ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {spotifyTracks.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {spotifyTracks.map((t) => (
                      <div 
                        key={t.id}
                        onClick={() => {
                          setSelectedRecord({
                            id: t.id,
                            title: t.name,
                            artist: t.artists[0].name,
                            albumArt: t.album.images[0]?.url || '',
                            url: t.preview_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                            genre: 'Spotify'
                          });
                          setIsPlaying(true);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-100 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all"
                      >
                        <img src={t.album.images[2]?.url} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="font-hand text-sm text-dark-brown font-semibold truncate">{t.name}</div>
                          <div className="font-hand text-xs text-brown/50 truncate">{t.artists[0].name}</div>
                        </div>
                        <Plus size={16} className="text-emerald-600" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Pills Bar */}
      <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto pb-6 scrollbar-hide mb-8">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={`btn-tactile px-5 py-2 rounded-full font-hand text-xs tracking-wider uppercase transition-all whitespace-nowrap ${
              activeCategory === cat.name
                ? 'bg-dark-brown text-cream shadow-md scale-105'
                : 'bg-white/80 border border-light-brown/20 text-brown/70 hover:bg-white'
            }`}
          >
            {cat.name} <span className="ml-1.5 opacity-60 font-sans text-[10px]">{cat.count} records</span>
          </button>
        ))}
      </div>

      {/* 3D ACRYLIC SHELVES RACK DISPLAY */}
      <div className="max-w-5xl mx-auto space-y-16 mb-20 relative">

        {/* Shelf Tier 1 — Lavender Glass */}
        <div className="relative pt-6 pb-2">
          {/* Metallic rivets */}
          <div className="absolute top-0 left-4 rivet-stud z-20" />
          <div className="absolute top-0 right-4 rivet-stud z-20" />

          {/* Records standing on Shelf 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 px-6 relative z-10">
            {filteredTracks.slice(0, 4).map((track, idx) => (
              <motion.div 
                key={track.id}
                whileHover={{ y: -12, rotate: -2 }}
                onClick={() => { setSelectedRecord(track); setIsPlaying(true); }}
                className="group cursor-pointer relative"
              >
                {/* Vinyl Record sliding out from back */}
                <div className="absolute -top-6 right-2 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-zinc-900 border-4 border-zinc-800 shadow-xl flex items-center justify-center group-hover:-translate-y-6 group-hover:rotate-45 transition-all duration-500 z-0">
                  <div className="w-10 h-10 rounded-full border-2 border-amber-600 bg-amber-500 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-zinc-900" />
                  </div>
                </div>

                {/* Album Sleeve Jacket */}
                <div className="relative z-10 bg-white p-3 rounded-xl shadow-xl border border-white/60 aspect-square group-hover:shadow-2xl transition-all">
                  <img src={track.albumArt} className="w-full h-full object-cover rounded-lg shadow-inner" />
                  
                  {/* Photo Memory Badge attached to vinyl sleeve */}
                  {associatedMemories[idx] && (
                    <div className="absolute -bottom-3 -right-2 bg-cream/95 p-1.5 pb-3 rounded shadow-md border border-light-brown/20 rotate-6 w-14 h-16 z-20">
                      <img src={associatedMemories[idx].photoUrl} className="w-full h-10 object-cover rounded-[1px]" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col justify-end p-3 text-white">
                    <div className="font-serif italic font-bold text-sm truncate">{track.title}</div>
                    <div className="font-hand text-xs opacity-80 truncate">{track.artist}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Translucent Lavender Acrylic Shelf Body */}
          <div className="acrylic-shelf-purple h-12 w-full rounded-2xl mt-[-24px] relative z-0 flex items-center justify-between px-6">
            <span className="font-hand text-[10px] uppercase tracking-widest text-purple-950/60">Tier 01 // Lavender Acrylic</span>
            <span className="font-hand text-[10px] uppercase tracking-widest text-purple-950/60">Heavy-Duty Mount</span>
          </div>
        </div>

        {/* Shelf Tier 2 — Lime Green Glass */}
        <div className="relative pt-6 pb-2">
          {/* Metallic rivets */}
          <div className="absolute top-0 left-4 rivet-stud z-20" />
          <div className="absolute top-0 right-4 rivet-stud z-20" />

          {/* Records standing on Shelf 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 px-6 relative z-10">
            {filteredTracks.slice(2, 6).map((track, idx) => (
              <motion.div 
                key={track.id + '-tier2'}
                whileHover={{ y: -12, rotate: 2 }}
                onClick={() => { setSelectedRecord(track); setIsPlaying(true); }}
                className="group cursor-pointer relative"
              >
                {/* Vinyl Record sliding out */}
                <div className="absolute -top-6 right-2 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-zinc-900 border-4 border-zinc-800 shadow-xl flex items-center justify-center group-hover:-translate-y-6 group-hover:rotate-45 transition-all duration-500 z-0">
                  <div className="w-10 h-10 rounded-full border-2 border-lime-500 bg-lime-400 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-zinc-900" />
                  </div>
                </div>

                {/* Album Sleeve Jacket */}
                <div className="relative z-10 bg-white p-3 rounded-xl shadow-xl border border-white/60 aspect-square group-hover:shadow-2xl transition-all">
                  <img src={track.albumArt} className="w-full h-full object-cover rounded-lg shadow-inner" />
                  
                  {/* Photo Memory Badge */}
                  {associatedMemories[idx % associatedMemories.length] && (
                    <div className="absolute -bottom-3 -left-2 bg-cream/95 p-1.5 pb-3 rounded shadow-md border border-light-brown/20 -rotate-6 w-14 h-16 z-20">
                      <img src={associatedMemories[idx % associatedMemories.length].photoUrl} className="w-full h-10 object-cover rounded-[1px]" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col justify-end p-3 text-white">
                    <div className="font-serif italic font-bold text-sm truncate">{track.title}</div>
                    <div className="font-hand text-xs opacity-80 truncate">{track.artist}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Translucent Green Acrylic Shelf Body */}
          <div className="acrylic-shelf-green h-12 w-full rounded-2xl mt-[-24px] relative z-0 flex items-center justify-between px-6">
            <span className="font-hand text-[10px] uppercase tracking-widest text-emerald-950/60">Tier 02 // Neon Acrylic</span>
            <span className="font-hand text-[10px] uppercase tracking-widest text-emerald-950/60">Precision Wall Rack</span>
          </div>
        </div>

      </div>

      {/* SELECTED RECORD & ASSOCIATED PHOTO MEMORIES DISPLAY PANEL */}
      {selectedRecord && (
        <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-xl rounded-3xl border border-light-brown/20 p-6 sm:p-8 shadow-2xl mb-24">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            
            {/* Spinning Vinyl Record Player Representation */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex-shrink-0 flex items-center justify-center">
              <div className={`w-full h-full rounded-full bg-zinc-950 border-8 border-zinc-900 shadow-2xl flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : ''}`}>
                <div className="w-20 h-20 rounded-full border-4 border-amber-500 overflow-hidden shadow-inner">
                  <img src={selectedRecord.albumArt} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Track Info & Photo Associations */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-hand text-xs text-moss uppercase tracking-widest bg-moss/10 px-3 py-1 rounded-full border border-moss/20">Now Playing Vault Track</span>
                <span className="font-hand text-xs text-brown/50">• {selectedRecord.genre}</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-dark-brown font-bold italic">{selectedRecord.title}</h2>
              <p className="font-hand text-lg text-brown/70 mb-6">{selectedRecord.artist}</p>

              {/* Photo Memories Associated with this Vinyl Record */}
              <div className="mb-6">
                <div className="flex items-center gap-2 font-hand text-xs text-dark-brown uppercase tracking-wider mb-3">
                  <Camera size={14} className="text-dusty-rose" />
                  <span>Associated Photo Memories ({associatedMemories.length})</span>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {associatedMemories.map((mem) => (
                    <div 
                      key={mem.id}
                      className="bg-white p-2 pb-5 rounded-md shadow-md border border-brown/10 w-24 flex-shrink-0 rotate-1 hover:rotate-0 transition-transform cursor-pointer"
                    >
                      <img src={mem.photoUrl} className="w-full h-20 object-cover rounded-[1px]" />
                      <div className="font-hand text-[9px] text-brown/70 truncate mt-1 text-center">{mem.title}</div>
                    </div>
                  ))}
                  {associatedMemories.length === 0 && (
                    <div className="font-hand text-xs text-brown/40 italic">No photos directly tagged with this vinyl yet.</div>
                  )}
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="btn-tactile w-12 h-12 rounded-full bg-dark-brown text-cream flex items-center justify-center shadow-lg hover:bg-black"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>
                <div className="flex-1 h-2 bg-brown/10 rounded-full overflow-hidden">
                  <div className={`h-full bg-moss transition-all duration-300 ${isPlaying ? 'w-2/3' : 'w-0'}`} />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
