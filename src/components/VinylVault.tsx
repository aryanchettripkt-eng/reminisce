import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Disc, 
  Play, 
  Pause, 
  Plus, 
  Search, 
  Music as MusicIcon, 
  ExternalLink, 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Check, 
  Radio, 
  Layers, 
  Heart,
  FolderPlus,
  BookOpen,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Memory, Album } from '../lib/groq';
import { LOCAL_TRACKS, Track, getPlayableAudioUrl } from '../lib/music';
import { 
  getSpotifyPlaylists, 
  getPlaylistItems, 
  importSpotifyTracks, 
  searchSpotifyTracks, 
  isSpotifyConnected, 
  getSpotifyProfile 
} from '../services/supabase/spotifyService';
import { SpotifyPlaylistSummary, SpotifyTrackItem } from '../types/storage';

interface VinylVaultProps {
  memories: Memory[];
  albums?: Album[];
  onAddMemory?: (memory: Memory) => void;
  onClose?: () => void;
  onConnectSpotify?: () => void;
  spotifyToken?: string | null;
}

export default function VinylVault({
  memories,
  albums = [],
  onAddMemory = () => {},
  onClose = () => {},
  onConnectSpotify = () => {},
  spotifyToken = null,
}: VinylVaultProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'collection' | 'spotify' | 'shelf'>('collection');
  
  // Player state
  const [currentTrack, setCurrentTrack] = useState<Track>(LOCAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  
  // Spotify Integration state
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylistSummary[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylistSummary | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrackItem[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrackItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [spotifyUser, setSpotifyUser] = useState<{ displayName?: string } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check Spotify status and load playlists
  const hasSpotify = isSpotifyConnected() || Boolean(spotifyToken);

  useEffect(() => {
    if (hasSpotify) {
      loadSpotifyPlaylists();
      getSpotifyProfile().then(p => setSpotifyUser(p)).catch(() => {});
    }
  }, [hasSpotify]);

  const loadSpotifyPlaylists = async () => {
    setIsLoadingPlaylists(true);
    try {
      const res = await getSpotifyPlaylists();
      setSpotifyPlaylists(res.playlists || []);
    } catch (e) {
      console.error("Failed to load Spotify playlists", e);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const loadPlaylistTracks = async (playlist: SpotifyPlaylistSummary) => {
    setSelectedPlaylist(playlist);
    setIsLoadingTracks(true);
    try {
      const res = await getPlaylistItems(playlist.id);
      setPlaylistTracks(res.tracks || []);
    } catch (e) {
      console.error("Failed to load playlist items", e);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleSpotifySearch = async (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    try {
      const res = await searchSpotifyTracks(q);
      setSearchResults(res.tracks || []);
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleTrackSelection = (id: string) => {
    const next = new Set(selectedTrackIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTrackIds(next);
  };

  const handleImportSelected = async () => {
    if (selectedTrackIds.size === 0) return;
    setIsImporting(true);
    try {
      const allTracks = [...playlistTracks, ...searchResults];
      const toImport = allTracks.filter(t => selectedTrackIds.has(t.id));
      const res = await importSpotifyTracks(toImport);
      
      if (res.imported.length > 0) {
        res.imported.forEach(m => onAddMemory(m));
        setImportSuccess(true);
        setSelectedTrackIds(new Set());
        setTimeout(() => setImportSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Import failed", e);
    } finally {
      setIsImporting(false);
    }
  };

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = track.url || getPlayableAudioUrl(track);
      audioRef.current.play().catch(e => console.warn("Audio play blocked", e));
    }
  };

  const playSpotifyTrack = (st: SpotifyTrackItem) => {
    const artistName = typeof st.artists === 'string' 
      ? st.artists 
      : (Array.isArray(st.artists) ? (st.artists as any).map((a: any) => a.name || a).join(', ') : 'Spotify Artist');
    const artUrl = st.albumArt || (st as any).album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800';

    const track: Track = {
      id: st.id,
      title: st.name,
      artist: artistName,
      albumArt: artUrl,
      url: getPlayableAudioUrl({ title: st.name, song: st.name, uri: st.uri }),
      genre: 'Spotify Track'
    };
    playTrack(track);
  };

  // Audio lifecycle
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src || audioRef.current.src === '' || audioRef.current.src.includes('undefined')) {
        audioRef.current.src = currentTrack.url || getPlayableAudioUrl(currentTrack);
      }
      audioRef.current.play().catch(e => console.warn("Play error:", e));
      setIsPlaying(true);
    }
  };

  const genres = ['All', 'Synthwave', 'Lofi Chill', 'Ambient', 'Jazz', 'Classical', 'Pop', 'Indie'];
  const filteredLocalTracks = selectedGenre === 'All'
    ? LOCAL_TRACKS
    : LOCAL_TRACKS.filter(t => t.genre.toLowerCase() === selectedGenre.toLowerCase());

  // Extract Spotify track id if currentTrack is a spotify item
  const spotifyTrackId = currentTrack.id.startsWith('spotify:track:')
    ? currentTrack.id.replace('spotify:track:', '')
    : (currentTrack as any).providerTrackId || (currentTrack.url && currentTrack.url.includes('spotify.com/track/') ? currentTrack.url.split('spotify.com/track/')[1]?.split('?')[0] : null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-[#f4efe4] text-[#2c241e] flex flex-col overflow-hidden font-body select-none"
    >
      <audio ref={audioRef} src={currentTrack.url || getPlayableAudioUrl(currentTrack)} preload="auto" />
      <div className="film-grain" />

      {/* Ochre Header Section */}
      <header className="bg-[#dfb141] text-[#1e1b18] px-6 sm:px-10 py-5 border-b-2 border-[#2c241e] flex items-center justify-between z-20 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#1e1b18] text-[#f4efe4] flex items-center justify-center shadow-inner">
            <Disc className={`animate-spin ${isPlaying ? 'duration-[3s]' : 'duration-[10s]'}`} size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight">
                THE VINYL VAULT
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#1e1b18] text-[#dfb141]">
                N° 402
              </span>
            </div>
            <p className="font-serif italic text-xs text-[#1e1b18]/80 font-medium">
              A private auditory archive of spinning records & synced playlists
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex bg-[#1e1b18]/10 p-1 rounded-full border border-[#1e1b18]/20">
            <button
              onClick={() => setActiveTab('collection')}
              className={`px-4 py-1 rounded-full font-serif text-xs font-bold transition-all ${
                activeTab === 'collection' ? 'bg-[#1e1b18] text-[#f4efe4] shadow-xs' : 'text-[#1e1b18] hover:bg-[#1e1b18]/10'
              }`}
            >
              Crate ({LOCAL_TRACKS.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('spotify');
                if (hasSpotify) loadSpotifyPlaylists();
              }}
              className={`px-4 py-1 rounded-full font-serif text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'spotify' ? 'bg-[#1e1b18] text-[#f4efe4] shadow-xs' : 'text-[#1e1b18] hover:bg-[#1e1b18]/10'
              }`}
            >
              <Radio size={13} /> Spotify Sync
            </button>
            <button
              onClick={() => setActiveTab('shelf')}
              className={`px-4 py-1 rounded-full font-serif text-xs font-bold transition-all ${
                activeTab === 'shelf' ? 'bg-[#1e1b18] text-[#f4efe4] shadow-xs' : 'text-[#1e1b18] hover:bg-[#1e1b18]/10'
              }`}
            >
              Library Shelves
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#1e1b18] text-[#f4efe4] flex items-center justify-center hover:bg-black transition-transform active:scale-95 shadow-md ml-2"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 max-w-7xl mx-auto w-full z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Vintage Player Card & Turntable */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Editorial Player Card */}
          <div className="bg-[#fcfaf7] rounded-2xl border-2 border-[#2c241e] shadow-[6px_6px_0px_#2c241e] p-6 relative overflow-hidden">
            
            {/* Top Table Metadata */}
            <div className="border-b-2 border-[#2c241e] pb-3 mb-4 flex items-center justify-between text-xs font-serif">
              <span className="uppercase font-bold tracking-widest text-[#2c241e]/60">Now Spinning:</span>
              <span className="font-mono text-xs text-[#2c241e] font-bold">SIDE A • 33 ⅓ RPM</span>
            </div>

            {/* Turntable Platter Visual */}
            <div className="relative aspect-square max-w-[280px] mx-auto my-2 flex items-center justify-center">
              {/* Outer Vinyl Groove Ring */}
              <motion.div 
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'linear' }}
                className="w-full h-full rounded-full bg-[#121212] border-4 border-[#2c241e] shadow-2xl flex items-center justify-center relative p-3"
              >
                <div className="w-full h-full rounded-full border border-white/10 flex items-center justify-center">
                  <div className="w-[85%] h-[85%] rounded-full border border-white/5 flex items-center justify-center">
                    {/* Vinyl Center Art */}
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#dfb141] shadow-inner relative">
                      <img 
                        src={currentTrack.albumArt || 'https://picsum.photos/seed/vintage/300/300'} 
                        alt={currentTrack.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#f4efe4] border-2 border-[#2c241e]" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tonearm Drop */}
              <div 
                className={`absolute -top-3 -right-2 w-20 h-28 origin-top-right transition-transform duration-700 pointer-events-none ${
                  isPlaying ? 'rotate-12' : '-rotate-12'
                }`}
              >
                <div className="w-2.5 h-20 bg-[#dfb141] border border-[#2c241e] rounded-full mx-auto" />
                <div className="w-4 h-6 bg-[#2c241e] rounded-xs -mt-1 ml-auto mr-4" />
              </div>
            </div>

            {/* Tabular Metadata Rows */}
            <div className="mt-4 space-y-1.5 font-serif text-sm border-t-2 border-[#2c241e] pt-3">
              <div className="flex justify-between py-1 border-b border-[#2c241e]/15">
                <span className="font-bold uppercase tracking-wider text-xs text-[#2c241e]/70">Title:</span>
                <span className="font-bold text-sm truncate max-w-[200px] text-right">{currentTrack.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2c241e]/15">
                <span className="font-bold uppercase tracking-wider text-xs text-[#2c241e]/70">Artist:</span>
                <span className="italic text-sm truncate max-w-[200px] text-right">{currentTrack.artist}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2c241e]/15">
                <span className="font-bold uppercase tracking-wider text-xs text-[#2c241e]/70">Genre:</span>
                <span className="text-xs uppercase tracking-widest">{currentTrack.genre || 'Acoustic / Vinyl'}</span>
              </div>
            </div>

            {/* In-Browser Audio Player Controls */}
            <div className="mt-5 pt-3 flex items-center justify-between gap-4">
              <button
                onClick={togglePlay}
                className="btn-aesthetic-primary py-2.5 px-6 flex-1 justify-center"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span>{isPlaying ? 'Pause Needle' : 'Drop Needle'}</span>
              </button>

              <button
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="w-10 h-10 rounded-full border-2 border-[#2c241e] bg-white flex items-center justify-center hover:bg-[#dfb141]/20 transition-colors shadow-xs"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            {/* Real Spotify Embed Player when a Spotify Track is selected */}
            {spotifyTrackId && (
              <div className="mt-4 pt-3 border-t-2 border-[#2c241e]/20">
                <div className="flex items-center justify-between text-xs font-serif font-bold mb-2">
                  <span className="text-emerald-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    Spotify Web Player Embed:
                  </span>
                  <a
                    href={`https://open.spotify.com/track/${spotifyTrackId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline flex items-center gap-1 text-[#2c241e]/70 hover:text-black"
                  >
                    Open <ExternalLink size={11} />
                  </a>
                </div>
                <div className="rounded-xl overflow-hidden shadow-inner border border-[#2c241e]/30 bg-black">
                  <iframe
                    src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title="Spotify Web Player"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bookish Quote Box */}
          <div className="bg-[#e8decb] rounded-2xl border-2 border-[#2c241e] p-5 relative shadow-[4px_4px_0px_#2c241e]">
            <p className="font-serif italic text-sm text-[#2c241e] leading-relaxed">
              "Music is a uniquely portable magic. It anchors the light of an afternoon to the melody in your heart."
            </p>
            <div className="mt-2 text-right font-hand text-xs text-[#2c241e]/60 font-bold">
              — The Reminiq Curator
            </div>
          </div>
        </div>

        {/* Right Column: Track Crate & Spotify Browser */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Tab Selector on Mobile */}
          <div className="flex sm:hidden bg-white/60 p-1 rounded-xl border border-[#2c241e]/30">
            <button
              onClick={() => setActiveTab('collection')}
              className={`flex-1 py-1.5 rounded-lg font-serif text-xs font-bold ${activeTab === 'collection' ? 'bg-[#2c241e] text-[#f4efe4]' : ''}`}
            >
              Crate
            </button>
            <button
              onClick={() => setActiveTab('spotify')}
              className={`flex-1 py-1.5 rounded-lg font-serif text-xs font-bold ${activeTab === 'spotify' ? 'bg-[#2c241e] text-[#f4efe4]' : ''}`}
            >
              Spotify
            </button>
            <button
              onClick={() => setActiveTab('shelf')}
              className={`flex-1 py-1.5 rounded-lg font-serif text-xs font-bold ${activeTab === 'shelf' ? 'bg-[#2c241e] text-[#f4efe4]' : ''}`}
            >
              Library
            </button>
          </div>

          {/* TAB 1: Local Vinyl Crate */}
          {activeTab === 'collection' && (
            <div>
              {/* Genre filter chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 custom-scrollbar">
                {genres.map(g => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-3 py-1 rounded-full text-xs font-serif font-bold transition-all whitespace-nowrap ${
                      selectedGenre === g
                        ? 'bg-[#2c241e] text-[#f4efe4] shadow-xs'
                        : 'bg-white/70 text-[#2c241e] hover:bg-white border border-[#2c241e]/20'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Tracks List */}
              <div className="space-y-2.5">
                {filteredLocalTracks.map(track => {
                  const isCurrent = currentTrack.id === track.id;

                  return (
                    <motion.div
                      key={track.id}
                      whileHover={{ x: 3 }}
                      onClick={() => playTrack(track)}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                        isCurrent
                          ? 'bg-[#dfb141]/20 border-[#2c241e] shadow-sm'
                          : 'bg-[#fcfaf7] hover:bg-white border-[#2c241e]/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-[#2c241e]/20 shadow-xs relative">
                          <img src={track.albumArt} alt={track.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            {isCurrent && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-serif font-bold text-sm text-[#1e1b18] truncate">{track.title}</h4>
                          <p className="font-serif italic text-xs text-[#2c241e]/70 truncate">{track.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#2c241e]/10 text-[#2c241e]">
                          {track.genre}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playTrack(track);
                          }}
                          className="w-8 h-8 rounded-full bg-[#2c241e] text-[#f4efe4] flex items-center justify-center hover:bg-black transition-transform active:scale-95"
                        >
                          {isCurrent && isPlaying ? <Pause size={13} /> : <Play size={13} />}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Spotify Sync & Playlists */}
          {activeTab === 'spotify' && (
            <div>
              {!hasSpotify ? (
                <div className="p-10 rounded-2xl bg-white border-2 border-[#2c241e] shadow-[4px_4px_0px_#2c241e] text-center max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-[#1db954]/20 text-[#1db954] flex items-center justify-center mx-auto mb-4">
                    <Radio size={32} />
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-dark-brown">Connect Spotify Account</h3>
                  <p className="font-serif italic text-sm text-[#2c241e]/70 mt-2 mb-6">
                    Link your Spotify profile to browse your favorite playlists, search millions of tracks, and drop real songs into your Reminiq memory vault.
                  </p>
                  <button
                    onClick={onConnectSpotify}
                    className="btn-aesthetic-primary w-full justify-center text-sm"
                  >
                    <Radio size={16} /> Link Spotify Account
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-[#2c241e] p-1.5 shadow-sm">
                    <Search size={18} className="text-[#2c241e]/50 ml-2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSpotifySearch(searchQuery)}
                      placeholder="Search Spotify for songs, artists, vinyl vibes..."
                      className="w-full px-2 py-1.5 font-serif text-sm bg-transparent focus:outline-none placeholder:text-[#2c241e]/40"
                    />
                    <button
                      onClick={() => handleSpotifySearch(searchQuery)}
                      disabled={isSearching || !searchQuery.trim()}
                      className="btn-aesthetic-primary py-1.5 px-4 text-xs whitespace-nowrap"
                    >
                      {isSearching ? <RefreshCw size={14} className="animate-spin" /> : 'Search'}
                    </button>
                  </div>

                  {/* Playlist Selection Row */}
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2c241e]/20">
                      <span className="font-serif font-bold text-sm uppercase tracking-wider">
                        Your Spotify Playlists ({spotifyPlaylists.length})
                      </span>
                      <button
                        onClick={loadSpotifyPlaylists}
                        className="font-serif text-xs underline text-[#2c241e]/70 hover:text-black flex items-center gap-1"
                      >
                        <RefreshCw size={12} className={isLoadingPlaylists ? 'animate-spin' : ''} /> Refresh
                      </button>
                    </div>

                    {isLoadingPlaylists ? (
                      <div className="py-6 text-center text-xs font-serif italic text-[#2c241e]/60">
                        Loading playlists from Spotify...
                      </div>
                    ) : spotifyPlaylists.length === 0 ? (
                      <div className="py-6 text-center text-xs font-serif italic text-[#2c241e]/60 bg-white/40 rounded-xl border border-dashed border-[#2c241e]/30">
                        No playlists found on your account. Search for tracks above!
                      </div>
                    ) : (
                      <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                        {spotifyPlaylists.map(pl => (
                          <button
                            key={pl.id}
                            onClick={() => loadPlaylistTracks(pl)}
                            className={`flex-shrink-0 w-32 p-2.5 rounded-xl border-2 transition-all text-left group ${
                              selectedPlaylist?.id === pl.id
                                ? 'bg-[#dfb141]/30 border-[#2c241e] shadow-sm'
                                : 'bg-white hover:bg-[#fcfaf7] border-[#2c241e]/30'
                            }`}
                          >
                            <div className="aspect-square rounded-lg overflow-hidden bg-black/10 mb-2 border border-[#2c241e]/20">
                              {pl.images?.[0]?.url ? (
                                <img src={pl.images[0].url} alt={pl.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#2c241e]/40">
                                  <Disc size={24} />
                                </div>
                              )}
                            </div>
                            <h5 className="font-serif font-bold text-xs truncate text-[#1e1b18]">{pl.name}</h5>
                            <span className="font-serif italic text-[10px] text-[#2c241e]/60">{pl.tracksTotal} songs</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Playlist Tracks / Search Results List */}
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#2c241e]/20">
                      <span className="font-serif font-bold text-sm uppercase tracking-wider">
                        {selectedPlaylist ? `Tracks in "${selectedPlaylist.name}"` : searchResults.length > 0 ? 'Search Results' : 'Tracks'}
                      </span>
                      {selectedTrackIds.size > 0 && (
                        <button
                          onClick={handleImportSelected}
                          disabled={isImporting}
                          className="btn-aesthetic-primary py-1 px-3 text-xs"
                        >
                          <FolderPlus size={13} />
                          {isImporting ? 'Adding...' : `Pin ${selectedTrackIds.size} to Vault`}
                        </button>
                      )}
                    </div>

                    {importSuccess && (
                      <div className="p-3 mb-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-serif font-bold flex items-center gap-2">
                        <Check size={14} /> Selected tracks have been pinned to your Reminiq Memory Vault!
                      </div>
                    )}

                    <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                      {(searchResults.length > 0 ? searchResults : playlistTracks).map(track => {
                        const isSelected = selectedTrackIds.has(track.id);

                        return (
                          <div
                            key={track.id}
                            className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                              isSelected ? 'bg-amber-50 border-[#2c241e]' : 'bg-white border-[#2c241e]/20 hover:border-[#2c241e]/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                onClick={() => toggleTrackSelection(track.id)}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                  isSelected ? 'bg-[#2c241e] text-white border-[#2c241e]' : 'border-[#2c241e]/40 hover:border-[#2c241e]'
                                }`}
                              >
                                {isSelected && <Check size={12} />}
                              </button>

                              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-black/10 border border-[#2c241e]/20">
                                <img
                                  src={track.albumArt || (track as any).album?.images?.[0]?.url || 'https://picsum.photos/seed/spotify/200/200'}
                                  alt={track.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="min-w-0">
                                <h4 className="font-serif font-bold text-xs text-[#1e1b18] truncate">{track.name}</h4>
                                <p className="font-serif italic text-[11px] text-[#2c241e]/70 truncate">
                                  {typeof track.artists === 'string' ? track.artists : (Array.isArray(track.artists) ? (track.artists as any).map((a: any) => a.name || a).join(', ') : 'Artist')}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => playSpotifyTrack(track)}
                              className="btn-aesthetic py-1 px-3 text-xs"
                            >
                              <Play size={12} /> Play
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Library Shelves Grid */}
          {activeTab === 'shelf' && (
            <div className="bg-[#e8decb] p-6 rounded-2xl border-2 border-[#2c241e] shadow-[4px_4px_0px_#2c241e]">
              <h3 className="font-serif font-bold text-lg text-dark-brown mb-2">The Margin Library Records</h3>
              <p className="font-serif italic text-xs text-[#2c241e]/70 mb-6">
                All musical memories linked to your physical journal notes and polaroid memories.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {LOCAL_TRACKS.map(t => (
                  <div
                    key={t.id}
                    onClick={() => playTrack(t)}
                    className="bg-[#fcfaf7] p-3 rounded-xl border-2 border-[#2c241e] shadow-sm hover:-translate-y-1 transition-transform cursor-pointer group"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-2 border border-[#2c241e]/20">
                      <img src={t.albumArt} alt={t.title} className="w-full h-full object-cover" />
                    </div>
                    <h5 className="font-serif font-bold text-xs truncate text-[#1e1b18]">{t.title}</h5>
                    <p className="font-serif italic text-[10px] text-[#2c241e]/60 truncate">{t.artist}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
