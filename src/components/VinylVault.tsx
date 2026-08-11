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

// Curated Bookish Woodcut Icons
function VintageRabbitBooks({ className = "w-10 h-10 text-dark-brown" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M42 32 C38 16 28 8 26 14 C24 20 34 32 38 40" strokeWidth="2.5" />
      <path d="M48 30 C52 14 62 8 64 14 C66 20 56 32 52 40" strokeWidth="2.5" />
      <ellipse cx="45" cy="46" rx="14" ry="12" />
      <circle cx="41" cy="44" r="1.5" fill="currentColor" />
      <circle cx="49" cy="44" r="1.5" fill="currentColor" />
      <path d="M44 48 Q45 50 46 48" />
      <path d="M35 56 C32 64 30 76 34 82 C38 88 52 88 56 82 C60 76 58 64 55 56" />
      <path d="M22 84 L68 84 L66 90 L20 90 Z" fill="currentColor" fillOpacity="0.1" />
      <path d="M20 78 L66 78 L64 84 L18 84 Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M24 72 L62 72 L60 78 L22 78 Z" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

function VintageBustStatue({ className = "w-10 h-10 text-dark-brown" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M38 22 C38 14 62 14 62 22 C64 26 62 34 60 38 C56 46 44 46 40 38 C38 34 36 26 38 22 Z" />
      <path d="M34 26 C36 20 44 16 50 16 C58 16 64 20 66 26 C64 30 60 32 50 32 C40 32 36 30 34 26 Z" strokeWidth="1.8" />
      <path d="M46 50 L46 64 L54 64 L54 50" />
      <path d="M32 64 C30 72 26 80 20 86 L80 86 C74 80 70 72 68 64 Z" />
      <path d="M16 86 L84 86 L86 94 L14 94 Z" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

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
  onAddMemory,
  onClose,
  onConnectSpotify,
  spotifyToken
}: VinylVaultProps) {
  const [activeTab, setActiveTab] = useState<'collection' | 'spotify' | 'memories'>('collection');
  const [selectedRecord, setSelectedRecord] = useState<Track | null>(LOCAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [needleDropped, setNeedleDropped] = useState(false);

  // Spotify state
  const [playlists, setPlaylists] = useState<SpotifyPlaylistSummary[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylistSummary | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrackItem[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [spotifySearchQuery, setSpotifySearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrackItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSpotifyTrack, setSelectedSpotifyTrack] = useState<SpotifyTrackItem | null>(null);
  const [activeSpotifyEmbedTrackId, setActiveSpotifyEmbedTrackId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playableAudioUrl = selectedRecord
    ? (selectedRecord.url || getPlayableAudioUrl(selectedRecord))
    : (selectedSpotifyTrack?.previewUrl || undefined);

  // Auto-fetch Spotify playlists when switching to Spotify tab
  useEffect(() => {
    if (activeTab === 'spotify' && isSpotifyConnected()) {
      loadSpotifyPlaylists();
    }
  }, [activeTab]);

  const loadSpotifyPlaylists = async () => {
    setIsLoadingPlaylists(true);
    try {
      const res = await getSpotifyPlaylists();
      setPlaylists(res.playlists || []);
    } catch (err) {
      console.error('Failed to load Spotify playlists:', err);
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
    } catch (err) {
      console.error('Failed to load tracks for playlist:', err);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleSpotifySearch = async () => {
    if (!spotifySearchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await searchSpotifyTracks(spotifySearchQuery);
      setSearchResults(res.tracks || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setNeedleDropped(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setNeedleDropped(true);
      }).catch((err) => {
        console.warn('Audio play error:', err);
        setIsPlaying(true);
        setNeedleDropped(true);
      });
    }
  };

  const selectTrackForPlayback = (track: Track | SpotifyTrackItem) => {
    if ('genre' in track) {
      // Local Track
      setSelectedRecord(track as Track);
      setSelectedSpotifyTrack(null);
      setActiveSpotifyEmbedTrackId(null);
    } else {
      // Spotify Track
      const sTrack = track as SpotifyTrackItem;
      setSelectedSpotifyTrack(sTrack);
      setActiveSpotifyEmbedTrackId(sTrack.id);
      setSelectedRecord({
        id: sTrack.id,
        title: sTrack.name,
        artist: sTrack.artists.map(a => a.name).join(', '),
        albumArt: sTrack.album.images[0]?.url || 'https://picsum.photos/seed/spotify/400/400',
        url: sTrack.previewUrl || getPlayableAudioUrl({ title: sTrack.name }),
        genre: 'Spotify'
      });
    }

    setIsPlaying(true);
    setNeedleDropped(true);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setNeedleDropped(false);
      setPlaybackProgress(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-[#f4efe4] text-[#2c241e] flex flex-col overflow-hidden font-body"
    >
      <div className="film-grain" />

      {/* Global Audio Element */}
      <audio
        ref={audioRef}
        src={playableAudioUrl}
        preload="auto"
        muted={isMuted}
      />

      {/* ── HEADER ── */}
      <header className="bg-[#dfb141] text-[#1e1b18] px-6 py-3.5 border-b-2 border-[#2c241e] flex items-center justify-between flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <Disc className={`w-6 h-6 ${isPlaying ? 'animate-spin' : ''}`} />
          <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight uppercase">
            The Vinyl Vault & Music Journal
          </h1>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#2c241e]/10 p-1 rounded-full border border-[#2c241e]/30">
            <button
              onClick={() => setActiveTab('collection')}
              className={`px-3.5 py-1 rounded-full text-xs font-serif font-bold uppercase transition-all ${
                activeTab === 'collection' ? 'bg-[#2c241e] text-[#f4efe4] shadow-xs' : 'text-[#2c241e] hover:bg-[#2c241e]/10'
              }`}
            >
              Vault Shelves
            </button>
            <button
              onClick={() => setActiveTab('spotify')}
              className={`px-3.5 py-1 rounded-full text-xs font-serif font-bold uppercase transition-all flex items-center gap-1 ${
                activeTab === 'spotify' ? 'bg-[#2c241e] text-[#f4efe4] shadow-xs' : 'text-[#2c241e] hover:bg-[#2c241e]/10'
              }`}
            >
              <span>Spotify Sync</span>
              {isSpotifyConnected() && <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />}
            </button>
            <button
              onClick={() => setActiveTab('memories')}
              className={`px-3.5 py-1 rounded-full text-xs font-serif font-bold uppercase transition-all ${
                activeTab === 'memories' ? 'bg-[#2c241e] text-[#f4efe4] shadow-xs' : 'text-[#2c241e] hover:bg-[#2c241e]/10'
              }`}
            >
              Soundtrack Memories
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#2c241e] text-[#f4efe4] flex items-center justify-center hover:bg-[#1a1410] transition-transform active:scale-95 shadow-sm ml-2"
              title="Close Vault"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Top Section: Editorial Quote Card & Turntable Station */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Vintage Bookish Quote Card */}
            <div className="lg:col-span-5 bg-[#faf6ee] rounded-2xl border-2 border-[#2c241e] p-6 flex flex-col justify-between shadow-[4px_4px_0px_#2c241e] relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-[#2c241e]/20">
                <span className="font-serif text-xs font-bold uppercase tracking-widest text-[#2c241e]/70">
                  Vol. IV — Acoustic Resonances
                </span>
                <div className="flex gap-2 text-dark-brown/40">
                  <VintageRabbitBooks className="w-8 h-8" />
                  <VintageBustStatue className="w-8 h-8" />
                </div>
              </div>

              <div className="my-6 text-center">
                <p className="font-serif italic text-xl text-[#1e1b18] leading-relaxed">
                  "Music is a uniquely portable magic. It turns everyday rooms into cathedral memories."
                </p>
                <span className="font-hand text-sm text-[#2c241e]/70 mt-2 block">
                  — The Reminiq Archives
                </span>
              </div>

              {/* Status / Selected Track Metadata Table */}
              <div className="border border-[#2c241e]/30 rounded-xl overflow-hidden text-xs">
                <div className="flex border-b border-[#2c241e]/20 bg-[#2c241e]/5">
                  <div className="w-24 p-2 font-serif font-bold uppercase text-[#2c241e]/70 border-r border-[#2c241e]/20">
                    Now Playing:
                  </div>
                  <div className="p-2 font-semibold truncate flex-1 text-[#1e1b18]">
                    {selectedRecord?.title || selectedSpotifyTrack?.name || 'No Record Selected'}
                  </div>
                </div>
                <div className="flex border-b border-[#2c241e]/20">
                  <div className="w-24 p-2 font-serif font-bold uppercase text-[#2c241e]/70 border-r border-[#2c241e]/20">
                    Artist:
                  </div>
                  <div className="p-2 truncate flex-1 text-[#1e1b18]">
                    {selectedRecord?.artist || selectedSpotifyTrack?.artists.map(a => a.name).join(', ') || 'Various'}
                  </div>
                </div>
                <div className="flex bg-[#2c241e]/5">
                  <div className="w-24 p-2 font-serif font-bold uppercase text-[#2c241e]/70 border-r border-[#2c241e]/20">
                    Status:
                  </div>
                  <div className="p-2 flex items-center gap-2 flex-1">
                    <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
                    <span className="font-serif font-bold text-[11px] uppercase">
                      {isPlaying ? 'Spinning 33⅓ RPM' : 'Idle on Turntable'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Interactive Vinyl Turntable & Sound Engine */}
            <div className="lg:col-span-7 bg-[#201c18] rounded-2xl border-2 border-[#2c241e] p-6 text-[#f4efe4] shadow-[4px_4px_0px_#2c241e] flex flex-col justify-between relative overflow-hidden">
              
              {/* Turntable & Vinyl Disc */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                
                {/* Spinning Vinyl Platter */}
                <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex-shrink-0 flex items-center justify-center">
                  {/* Outer Platter Base */}
                  <div className="w-full h-full rounded-full bg-[#110e0c] border-4 border-[#3a322c] shadow-2xl flex items-center justify-center relative">
                    
                    {/* Vinyl Grooves */}
                    <div 
                      className={`w-[90%] h-[90%] rounded-full bg-[radial-gradient(circle,#1a1614_30%,#0a0807_70%)] border-2 border-[#2a2420] flex items-center justify-center relative shadow-inner ${isPlaying ? 'animate-spin' : ''}`}
                      style={{ animationDuration: '6s' }}
                    >
                      {/* Concentric Vinyl Ridges */}
                      <div className="absolute inset-3 rounded-full border border-white/5" />
                      <div className="absolute inset-7 rounded-full border border-white/5" />
                      <div className="absolute inset-11 rounded-full border border-white/5" />

                      {/* Center Record Label */}
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#dfb141] relative shadow-md bg-[#dfb141]">
                        {selectedRecord?.albumArt ? (
                          <img src={selectedRecord.albumArt} alt="Label" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#dfb141] text-[#1e1b18] font-serif font-bold text-xs">
                            33⅓
                          </div>
                        )}
                        <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-[#110e0c] border border-white/40" />
                      </div>
                    </div>

                    {/* Turntable Tone Arm */}
                    <div 
                      className={`absolute top-2 right-2 w-20 h-2 bg-gradient-to-r from-[#d4aa40] to-[#8c6d20] origin-top-right rounded-full shadow-lg transition-transform duration-700 pointer-events-none ${
                        needleDropped ? 'rotate-[-32deg]' : 'rotate-[-10deg]'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full bg-[#dfb141] absolute -right-1 -top-0.5" />
                      <div className="w-2.5 h-4 bg-zinc-300 rounded-xs absolute -left-1 -top-1" />
                    </div>
                  </div>
                </div>

                {/* Track Details & Controls */}
                <div className="flex-1 w-full flex flex-col justify-between min-w-0">
                  <div>
                    <span className="text-[10px] font-serif uppercase tracking-widest text-[#dfb141] font-bold">
                      Acoustic Session
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white truncate mt-0.5">
                      {selectedRecord?.title || selectedSpotifyTrack?.name || 'Select a Record'}
                    </h3>
                    <p className="font-serif text-sm text-[#f4efe4]/70 truncate">
                      {selectedRecord?.artist || selectedSpotifyTrack?.artists.map(a => a.name).join(', ') || 'Reminiq Vault'}
                    </p>
                  </div>

                  {/* Playback Progress Bar */}
                  <div className="my-4">
                    <div className="w-full bg-[#3a322c] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#dfb141] h-full transition-all duration-200"
                        style={{ width: `${playbackProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="px-5 py-2.5 rounded-full bg-[#dfb141] text-[#1e1b18] font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-[#ebd074] transition-transform active:scale-95 shadow-md"
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} className="fill-[#1e1b18]" />}
                      <span>{isPlaying ? 'Pause' : 'Play Record'}</span>
                    </button>

                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2.5 rounded-full bg-[#2c241e] text-[#f4efe4] hover:bg-[#3a322c] transition-colors border border-white/10"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Official Spotify Web Player Embed (For Spotify Tracks) */}
              {activeSpotifyEmbedTrackId && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-serif uppercase tracking-widest text-[#dfb141] flex items-center gap-1.5">
                      <Sparkles size={12} /> Official Spotify Web Stream:
                    </span>
                    <a
                      href={`https://open.spotify.com/track/${activeSpotifyEmbedTrackId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#f4efe4]/60 hover:text-white flex items-center gap-1"
                    >
                      Open in Spotify <ExternalLink size={10} />
                    </a>
                  </div>
                  <iframe
                    src={`https://open.spotify.com/embed/track/${activeSpotifyEmbedTrackId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-xl shadow-md"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── TAB 1: VAULT SHELVES (LOCAL TRACKS CATALOG) ── */}
          {activeTab === 'collection' && (
            <div className="bg-[#faf6ee] rounded-2xl border-2 border-[#2c241e] p-6 shadow-[4px_4px_0px_#2c241e]">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#2c241e]/20">
                <div className="flex items-center gap-2">
                  <Disc className="text-dark-brown" size={20} />
                  <h3 className="font-serif text-lg font-bold uppercase tracking-tight">
                    Library Catalog ({LOCAL_TRACKS.length} Master Discs)
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {LOCAL_TRACKS.map((track) => {
                  const isSelected = selectedRecord?.id === track.id;

                  return (
                    <motion.div
                      key={track.id}
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => selectTrackForPlayback(track)}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-[#dfb141]/20 border-[#2c241e] shadow-md ring-2 ring-[#dfb141]'
                          : 'bg-white border-[#2c241e]/30 hover:border-[#2c241e] shadow-xs'
                      }`}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-[#2c241e]/10 border border-[#2c241e]/20 relative">
                        <img src={track.albumArt} alt={track.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-[#2c241e]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Play size={20} className="fill-white" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-xs text-[#1e1b18] truncate">{track.title}</h4>
                        <p className="text-[11px] text-[#2c241e]/70 truncate">{track.artist}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB 2: SPOTIFY SYNC & PLAYLISTS ── */}
          {activeTab === 'spotify' && (
            <div className="bg-[#faf6ee] rounded-2xl border-2 border-[#2c241e] p-6 shadow-[4px_4px_0px_#2c241e]">
              
              {/* Spotify Authentication Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#2c241e]/20">
                <div>
                  <h3 className="font-serif text-xl font-bold uppercase text-[#1e1b18]">
                    Spotify Cloud Synchronizer
                  </h3>
                  <p className="font-body text-xs text-[#2c241e]/70 mt-0.5">
                    Sync your personal Spotify playlists or search 100M+ songs with instant in-browser playback
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {isSpotifyConnected() ? (
                    <button
                      onClick={loadSpotifyPlaylists}
                      disabled={isLoadingPlaylists}
                      className="px-3.5 py-1.5 rounded-full bg-[#2c241e]/10 hover:bg-[#2c241e]/20 text-[#2c241e] text-xs font-serif font-bold uppercase flex items-center gap-1.5 transition-all"
                    >
                      <RefreshCw size={12} className={isLoadingPlaylists ? 'animate-spin' : ''} />
                      Refresh Playlists
                    </button>
                  ) : (
                    <button
                      onClick={onConnectSpotify}
                      className="px-4 py-2 rounded-full bg-[#1DB954] text-white font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-[#1aa34a] shadow-md transition-transform hover:scale-105"
                    >
                      <Disc size={16} /> Connect Spotify
                    </button>
                  )}
                </div>
              </div>

              {/* Spotify Search Bar */}
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1 flex items-center bg-white rounded-xl border border-[#2c241e]/30 px-3 py-1.5">
                  <Search size={16} className="text-[#2c241e]/40 mr-2" />
                  <input
                    type="text"
                    value={spotifySearchQuery}
                    onChange={(e) => setSpotifySearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSpotifySearch()}
                    placeholder="Search any song or artist on Spotify..."
                    className="w-full bg-transparent text-xs text-[#1e1b18] focus:outline-none placeholder:text-[#2c241e]/40"
                  />
                </div>
                <button
                  onClick={handleSpotifySearch}
                  disabled={isSearching || !spotifySearchQuery.trim()}
                  className="px-4 py-2 rounded-xl bg-[#2c241e] text-[#f4efe4] font-serif text-xs font-bold uppercase hover:bg-[#1a1410] disabled:opacity-50 transition-all"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Search Results if any */}
              {searchResults.length > 0 && (
                <div className="mb-8">
                  <h4 className="font-serif font-bold text-sm uppercase text-[#1e1b18] mb-3">
                    Search Results ({searchResults.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {searchResults.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => selectTrackForPlayback(t)}
                        className="p-2.5 rounded-xl bg-white border border-[#2c241e]/30 hover:border-[#2c241e] shadow-xs flex items-center gap-3 cursor-pointer group hover:bg-[#dfb141]/10 transition-all"
                      >
                        <img
                          src={t.album.images[0]?.url || 'https://picsum.photos/seed/music/200/200'}
                          alt={t.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="font-serif font-bold text-xs text-[#1e1b18] truncate group-hover:text-[#dfb141]">
                            {t.name}
                          </h5>
                          <p className="text-[10px] text-[#2c241e]/70 truncate">
                            {t.artists.map(a => a.name).join(', ')}
                          </p>
                        </div>
                        <Play size={14} className="text-[#2c241e]/50 group-hover:text-[#2c241e] flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Spotify Playlists */}
              <div>
                <h4 className="font-serif font-bold text-sm uppercase text-[#1e1b18] mb-3">
                  Your Synced Playlists ({playlists.length})
                </h4>

                {isLoadingPlaylists ? (
                  <div className="py-12 text-center text-[#2c241e]/60 font-serif">
                    Loading your Spotify playlists...
                  </div>
                ) : playlists.length === 0 ? (
                  <div className="p-8 text-center bg-white/60 rounded-xl border border-dashed border-[#2c241e]/30">
                    <MusicIcon size={32} className="mx-auto text-[#2c241e]/40 mb-2" />
                    <p className="font-serif text-sm font-bold text-[#1e1b18]">No Playlists Loaded Yet</p>
                    <p className="text-xs text-[#2c241e]/60 mt-1">
                      Connect your account above or search for individual tracks to start listening!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {playlists.map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => loadPlaylistTracks(pl)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          selectedPlaylist?.id === pl.id
                            ? 'bg-[#dfb141]/20 border-[#2c241e] shadow-md'
                            : 'bg-white border-[#2c241e]/30 hover:border-[#2c241e]'
                        }`}
                      >
                        <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-[#2c241e]/10 border border-[#2c241e]/20">
                          <img
                            src={pl.images[0]?.url || 'https://picsum.photos/seed/playlist/300/300'}
                            alt={pl.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h5 className="font-serif font-bold text-xs text-[#1e1b18] truncate">{pl.name}</h5>
                        <span className="text-[10px] text-[#2c241e]/60">{pl.tracksTotal} tracks</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Playlist Tracks Modal / Panel */}
              {selectedPlaylist && (
                <div className="mt-8 pt-6 border-t border-[#2c241e]/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-serif font-bold text-sm uppercase text-[#1e1b18]">
                      Tracks in "{selectedPlaylist.name}" ({playlistTracks.length})
                    </h4>
                    <button
                      onClick={() => setSelectedPlaylist(null)}
                      className="text-xs text-[#2c241e]/60 hover:text-[#1e1b18]"
                    >
                      Close Playlist
                    </button>
                  </div>

                  {isLoadingTracks ? (
                    <div className="py-8 text-center text-[#2c241e]/60 font-serif">Loading tracks...</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {playlistTracks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => selectTrackForPlayback(t)}
                          className="p-2.5 rounded-xl bg-white border border-[#2c241e]/30 hover:border-[#2c241e] shadow-xs flex items-center gap-3 cursor-pointer group hover:bg-[#dfb141]/10 transition-all"
                        >
                          <img
                            src={t.album.images[0]?.url || 'https://picsum.photos/seed/track/200/200'}
                            alt={t.name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h5 className="font-serif font-bold text-xs text-[#1e1b18] truncate group-hover:text-[#dfb141]">
                              {t.name}
                            </h5>
                            <p className="text-[10px] text-[#2c241e]/70 truncate">
                              {t.artists.map(a => a.name).join(', ')}
                            </p>
                          </div>
                          <Play size={14} className="text-[#2c241e]/50 group-hover:text-[#2c241e] flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: SOUNDTRACK MEMORIES ── */}
          {activeTab === 'memories' && (
            <div className="bg-[#faf6ee] rounded-2xl border-2 border-[#2c241e] p-6 shadow-[4px_4px_0px_#2c241e]">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#2c241e]/20">
                <h3 className="font-serif text-lg font-bold uppercase tracking-tight">
                  Memories Paired with Songs
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {memories.filter(m => m.music || m.type === 'music').map((mem) => (
                  <div
                    key={mem.id}
                    className="bg-white p-4 rounded-xl border border-[#2c241e]/30 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {mem.photoUrl && (
                        <div className="aspect-[4/3] rounded-lg overflow-hidden mb-3 bg-[#2c241e]/10">
                          <img src={mem.photoUrl} alt={mem.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <h4 className="font-serif font-bold text-sm text-[#1e1b18]">{mem.title}</h4>
                      <p className="font-body text-xs text-[#2c241e]/70 mt-1 line-clamp-2">{mem.desc}</p>
                    </div>

                    {mem.music && (
                      <div className="mt-4 pt-3 border-t border-[#2c241e]/10 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-serif uppercase tracking-widest text-[#dfb141] font-bold block">
                            Song
                          </span>
                          <p className="font-serif font-bold text-xs text-[#1e1b18] truncate">
                            {mem.music.song}
                          </p>
                          <p className="text-[10px] text-[#2c241e]/60 truncate">{mem.music.artist}</p>
                        </div>

                        <button
                          onClick={() => {
                            if (mem.music) {
                              selectTrackForPlayback({
                                id: mem.id,
                                title: mem.music.song,
                                artist: mem.music.artist,
                                albumArt: mem.music.albumArt || mem.photoUrl || 'https://picsum.photos/seed/album/400/400',
                                url: mem.audioUrl || getPlayableAudioUrl({ title: mem.music.song }),
                                genre: 'Memory Soundtrack'
                              });
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-[#dfb141] text-[#1e1b18] flex items-center justify-center hover:bg-[#ebd074] transition-transform active:scale-95 flex-shrink-0 ml-2"
                          title="Play Memory Soundtrack"
                        >
                          <Play size={14} className="fill-[#1e1b18]" />
                        </button>
                      </div>
                    )}
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
