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
  BarChart2,
  User,
  ArrowRight
} from 'lucide-react';
import { Memory, Album } from '../lib/groq';
import { LOCAL_TRACKS, Track } from '../lib/music';
import { 
  getSpotifyPlaylists, 
  getPlaylistItems, 
  importSpotifyTracks, 
  searchSpotifyTracks, 
  isSpotifyConnected, 
  getSpotifyProfile,
  disconnectSpotify as disconnectSpotifyService
} from '../services/supabase/spotifyService';
import { SpotifyPlaylistSummary, SpotifyTrackItem } from '../types/storage';

interface VinylVaultProps {
  memories: Memory[];
  albums: Album[];
  onAddMemory: (memory: Memory) => void;
  onClose: () => void;
  onConnectSpotify: () => void;
  spotifyToken: string | null;
}

// Vintage Blue Woodcut Engraving: Rabbit on Stacked Books
const VintageRabbitBooks: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 80 }) => (
  <svg width={size} height={size * 0.85} viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Stacked Vintage Books */}
    <path d="M25 65 L95 50 L108 68 L36 84 Z" fill="#416999" fillOpacity="0.15" stroke="#2c5382" strokeWidth="1.5" />
    <path d="M25 65 L22 75 L33 94 L105 78 L108 68" fill="#2c5382" fillOpacity="0.2" stroke="#2c5382" strokeWidth="1.5" />
    <path d="M28 68 L98 53 M30 72 L100 57 M32 76 L102 61 M34 80 L104 65" stroke="#2c5382" strokeWidth="0.8" strokeDasharray="2 1" />
    
    {/* Middle Book */}
    <path d="M40 45 L98 35 L106 50 L48 60 Z" fill="#2c5382" fillOpacity="0.3" stroke="#2c5382" strokeWidth="1.5" />
    <path d="M40 45 L38 52 L46 67 L104 57 L106 50" fill="#2c5382" fillOpacity="0.25" stroke="#2c5382" strokeWidth="1.5" />
    <path d="M42 48 L96 39 M44 52 L98 43 M46 56 L100 47" stroke="#2c5382" strokeWidth="0.8" />

    {/* Vintage Rabbit */}
    <path d="M72 15 C75 10 78 8 82 12 C85 15 82 22 80 26 C84 28 88 32 86 38 C84 44 76 48 70 48 C66 48 62 44 64 38 C65 34 68 30 70 26 C68 22 66 16 70 12 C72 10 74 12 72 15 Z" fill="#2c5382" fillOpacity="0.85" stroke="#1d3d63" strokeWidth="1.5" />
    {/* Rabbit Ears */}
    <path d="M75 10 C76 4 82 2 84 8 C85 12 82 18 78 18" stroke="#1d3d63" strokeWidth="1.5" fill="#416999" fillOpacity="0.4" />
    <path d="M72 10 C71 5 75 3 77 7 C78 10 76 16 74 17" stroke="#1d3d63" strokeWidth="1.2" fill="#416999" fillOpacity="0.4" />
    {/* Rabbit Eye & Details */}
    <circle cx="80" cy="18" r="1.5" fill="#f5f0e6" />
    <path d="M68 34 C64 36 60 42 66 45 M78 36 C82 40 84 44 80 46" stroke="#1d3d63" strokeWidth="1" strokeLinecap="round" />
    {/* Hatching shadows */}
    <path d="M64 42 L68 40 M66 44 L70 42 M68 46 L72 44 M74 46 L78 44" stroke="#1d3d63" strokeWidth="0.8" />
  </svg>
);

// Vintage Blue Woodcut Engraving: Classic Bust Sculpture
const VintageBustStatue: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 52 }) => (
  <svg width={size} height={size * 1.15} viewBox="0 0 80 92" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Pedestal Base */}
    <rect x="25" y="74" width="30" height="12" rx="1" fill="#2c5382" fillOpacity="0.8" stroke="#1d3d63" strokeWidth="1.5" />
    <rect x="20" y="86" width="40" height="4" rx="1" fill="#1d3d63" />
    {/* Torso & Drapery */}
    <path d="M22 55 C20 62 26 74 40 74 C54 74 60 62 58 55 C52 50 48 52 40 52 C32 52 28 50 22 55 Z" fill="#416999" fillOpacity="0.4" stroke="#1d3d63" strokeWidth="1.5" />
    <path d="M30 55 C34 62 38 68 40 74 M50 55 C46 62 42 68 40 74" stroke="#1d3d63" strokeWidth="1" />
    {/* Head & Facial Silhouette */}
    <path d="M32 30 C30 20 36 12 40 12 C44 12 50 20 48 30 C48 38 45 48 40 48 C35 48 32 38 32 30 Z" fill="#2c5382" fillOpacity="0.75" stroke="#1d3d63" strokeWidth="1.5" />
    {/* Classical Curly Hair */}
    <path d="M30 24 C26 20 28 14 34 12 C38 8 44 8 48 12 C54 14 56 20 52 24 C50 18 46 16 40 16 C34 16 32 18 30 24 Z" fill="#1d3d63" />
    {/* Nose & Beard */}
    <path d="M40 28 L43 33 L39 34 M35 38 C37 44 43 44 45 38" stroke="#1d3d63" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export default function VinylVault({
  memories,
  albums,
  onAddMemory,
  onClose,
  onConnectSpotify,
  spotifyToken
}: VinylVaultProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<{
    title: string;
    artist: string;
    albumArt?: string;
    url?: string;
    externalUrl?: string;
    provider?: string;
  }>({
    title: 'Little Women (Theme)',
    artist: 'Louisa May Alcott Suite',
    albumArt: 'https://picsum.photos/seed/vintagebook/400/400',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    provider: 'local'
  });

  const [activeTab, setActiveTab] = useState<'shelves' | 'spotify' | 'search'>('shelves');
  const [spotifyConnected, setSpotifyConnected] = useState(isSpotifyConnected());
  const [spotifyProfile, setSpotifyProfile] = useState<{ id: string; displayName?: string; images?: any[] } | null>(null);
  
  // Spotify Data
  const [playlists, setPlaylists] = useState<SpotifyPlaylistSummary[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylistSummary | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrackItem[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [destinationAlbumId, setDestinationAlbumId] = useState<string>('');

  // Search Data
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrackItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);

  // Music memories from Supabase
  const musicMemories = memories.filter(m => m.type === 'music' || m.music);

  useEffect(() => {
    if (spotifyToken || isSpotifyConnected()) {
      setSpotifyConnected(true);
      getSpotifyProfile()
        .then(profile => setSpotifyProfile(profile))
        .catch(() => {});
      
      loadSpotifyPlaylists();
    }
  }, [spotifyToken]);

  const loadSpotifyPlaylists = async () => {
    setIsLoadingPlaylists(true);
    try {
      const list = await getSpotifyPlaylists();
      setPlaylists(list);
    } catch (e) {
      console.error("Failed to load Spotify playlists", e);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const loadPlaylistTracks = async (playlist: SpotifyPlaylistSummary) => {
    setSelectedPlaylist(playlist);
    setIsLoadingTracks(true);
    setSelectedTrackIds(new Set());
    try {
      const res = await getPlaylistItems(playlist.id);
      setPlaylistTracks(res.tracks);
    } catch (e) {
      console.error("Failed to load playlist tracks", e);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleSearchSpotify = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await searchSpotifyTracks(searchQuery);
      setSearchResults(res.tracks);
    } catch (e) {
      console.error("Failed to search Spotify", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleTrackSelect = (trackId: string) => {
    setSelectedTrackIds(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  };

  const handleImportSelectedTracks = async () => {
    const tracksToImport = (selectedPlaylist ? playlistTracks : searchResults).filter(t => selectedTrackIds.has(t.id));
    if (tracksToImport.length === 0) return;

    setIsImporting(true);
    try {
      const result = await importSpotifyTracks(tracksToImport, destinationAlbumId || undefined);
      if (result.imported.length > 0) {
        for (const mem of result.imported) {
          onAddMemory(mem);
        }
        alert(`Successfully imported ${result.imported.length} track${result.imported.length > 1 ? 's' : ''} into your Vinyl Vault!`);
        setSelectedTrackIds(new Set());
        setActiveTab('shelves');
      }
    } catch (e: any) {
      alert(e.message || "Failed to import tracks.");
    } finally {
      setIsImporting(false);
    }
  };

  const playTrack = (track: { title: string; artist: string; albumArt?: string; url?: string; externalUrl?: string; provider?: string }) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    if (track.url && audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-[#f4efe4] text-[#1e1b18] flex flex-col overflow-hidden font-body"
    >
      {/* Hidden audio player */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={() => {
          if (audioRef.current && audioRef.current.duration) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
          }
        }}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="film-grain" />

      {/* Top Mustard Ochre Banner Bar (Matching Reference Image) */}
      <header className="bg-[#dfb141] text-[#1e1b18] px-6 sm:px-10 py-4 border-b-2 border-[#2c241e] flex items-center justify-between z-20 flex-shrink-0 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#2c241e] text-[#f4efe4] flex items-center justify-center shadow-md">
            <Disc size={22} className={isPlaying ? 'animate-spin-slow' : ''} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight uppercase text-[#1e1b18]">
              The Vinyl Vault
            </h1>
            <p className="text-xs font-serif italic text-[#1e1b18]/80 -mt-0.5">
              Curated Musical Stories & Portable Magic
            </p>
          </div>
        </div>

        {/* Segmented Arch-style Navigation Tabs (Matching Reference Image Header/Footer) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#f4efe4]/80 p-1 rounded-full border border-[#2c241e]/40 shadow-xs">
            <button
              onClick={() => setActiveTab('shelves')}
              className={`px-4 py-1.5 rounded-full font-body text-xs uppercase tracking-wider font-bold transition-all ${
                activeTab === 'shelves'
                  ? 'bg-[#2c241e] text-[#f4efe4] shadow-sm'
                  : 'text-[#2c241e]/70 hover:text-[#2c241e]'
              }`}
            >
              Library ({musicMemories.length + LOCAL_TRACKS.length})
            </button>
            <button
              onClick={() => setActiveTab('spotify')}
              className={`px-4 py-1.5 rounded-full font-body text-xs uppercase tracking-wider font-bold transition-all ${
                activeTab === 'spotify'
                  ? 'bg-[#2c241e] text-[#f4efe4] shadow-sm'
                  : 'text-[#2c241e]/70 hover:text-[#2c241e]'
              }`}
            >
              Spotify Sync
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-1.5 rounded-full font-body text-xs uppercase tracking-wider font-bold transition-all ${
                activeTab === 'search'
                  ? 'bg-[#2c241e] text-[#f4efe4] shadow-sm'
                  : 'text-[#2c241e]/70 hover:text-[#2c241e]'
              }`}
            >
              Search
            </button>
          </div>

          {!spotifyConnected ? (
            <button
              onClick={onConnectSpotify}
              className="px-4 py-1.5 rounded-full bg-[#2c241e] hover:bg-[#1a1410] text-white font-body text-xs uppercase tracking-wider font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
            >
              <Radio size={13} />
              Connect Spotify
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-serif font-bold text-[#1e1b18] px-2 py-0.5 rounded bg-[#f4efe4]/60 border border-[#2c241e]/30">
                {spotifyProfile?.displayName || 'Connected'}
              </span>
              <button
                onClick={() => {
                  disconnectSpotifyService();
                  setSpotifyConnected(false);
                }}
                className="text-xs font-serif underline text-[#2c241e]/80 hover:text-red-800"
              >
                Disconnect
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f4efe4] border border-[#2c241e]/50 flex items-center justify-center text-[#1e1b18] hover:bg-white transition-transform active:scale-95 ml-2 shadow-xs"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Studio Body (Warm Cream / Tabular Bookish Design) */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 max-w-7xl mx-auto w-full">
        
        {/* Left Column: Editorial Turntable & Tabular Metadata (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-6">
          
          {/* Card: Mustard Top + Cream Body + Tabular Outline (Matching Reference Phone 1) */}
          <div className="w-full bg-[#fcfaf7] rounded-2xl border-2 border-[#2c241e] overflow-hidden shadow-xl">
            
            {/* Top Mustard Block */}
            <div className="bg-[#dfb141] p-6 pb-4 border-b-2 border-[#2c241e] flex flex-col items-center justify-center relative">
              {/* Turntable Platter */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-[#2c241e] border-4 border-[#1a1410] shadow-xl flex items-center justify-center">
                {/* Vinyl Grooves */}
                <div
                  className={`w-full h-full rounded-full border-[8px] border-[#151210] relative flex items-center justify-center ${
                    isPlaying ? 'animate-spin-slow' : ''
                  }`}
                  style={{
                    backgroundImage: 'radial-gradient(circle, #2c241e 15%, #151210 35%, #2c241e 55%, #100e0d 75%)',
                    boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)'
                  }}
                >
                  {/* Center Label (Mustard Yellow with Album Art) */}
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#dfb141] shadow-md relative bg-[#dfb141]">
                    {currentTrack.albumArt ? (
                      <img src={currentTrack.albumArt} alt={currentTrack.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#2c241e]">
                        <MusicIcon size={20} />
                      </div>
                    )}
                    {/* Spindle hole */}
                    <div className="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-[#2c241e] border border-white" />
                  </div>
                </div>

                {/* Tonearm */}
                <div
                  className="absolute top-2 right-2 w-20 h-32 pointer-events-none transition-transform duration-700 origin-top-right"
                  style={{ transform: isPlaying ? 'rotate(16deg)' : 'rotate(0deg)' }}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-[#dfb141] border border-[#2c241e] absolute top-0 right-0" />
                  <div className="w-1 h-24 bg-[#2c241e] absolute top-2 right-1 rounded-full" />
                  <div className="w-4 h-6 bg-[#2c241e] absolute bottom-6 right-0 rounded-xs border border-[#dfb141]" />
                </div>
              </div>

              {/* Start Session / Playback Pill Button (Matching "START A SESSION" in Reference Image) */}
              <button
                onClick={togglePlay}
                className="mt-4 px-8 py-2.5 rounded-full bg-[#2c241e] hover:bg-[#1a1410] text-[#f4efe4] font-body text-xs font-bold uppercase tracking-widest transition-transform hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause size={14} /> Pause Session
                  </>
                ) : (
                  <>
                    <Play size={14} className="fill-[#f4efe4]" /> Start A Session
                  </>
                )}
              </button>
            </div>

            {/* Tabular Metadata Rows (Matching Reference Image "Title", "Author", "Page Progress") */}
            <div className="divide-y divide-[#2c241e]/30 font-serif text-sm">
              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-[#2c241e]/60 font-body text-xs uppercase tracking-wider">Title:</span>
                <span className="font-bold text-[#1e1b18] truncate ml-2">{currentTrack.title}</span>
              </div>
              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-[#2c241e]/60 font-body text-xs uppercase tracking-wider">Artist:</span>
                <span className="font-medium text-[#1e1b18] truncate ml-2">{currentTrack.artist}</span>
              </div>
              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-[#2c241e]/60 font-body text-xs uppercase tracking-wider">Status:</span>
                <span className="font-bold text-[#2c241e] flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-700 animate-pulse' : 'bg-[#dfb141]'}`} />
                  {isPlaying ? 'Spinning at 33 RPM' : 'Ready on Shelf'}
                </span>
              </div>
            </div>

            {/* Audio Progress Bar */}
            <div className="bg-[#2c241e]/10 h-1.5 w-full">
              <div
                className="bg-[#dfb141] h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Quote Banner (Matching Reference Image "Books are a uniquely portable magic.") */}
          <div className="w-full bg-[#fcfaf7] p-6 rounded-2xl border-2 border-[#2c241e] shadow-md relative overflow-hidden">
            <div className="flex items-start gap-4">
              <VintageRabbitBooks size={72} className="flex-shrink-0" />
              <div>
                <p className="font-serif text-xl sm:text-2xl text-[#1e1b18] leading-snug">
                  "Music is a uniquely portable{' '}
                  <span className="bg-[#dfb141] px-1 py-0.5 font-bold text-[#1e1b18]">
                    magic.
                  </span>
                  "
                </p>
                <p className="text-xs font-serif italic text-[#2c241e]/70 mt-2">
                  — The Reminiq Vault Archive
                </p>
              </div>
            </div>

            {currentTrack.externalUrl && (
              <div className="mt-4 pt-3 border-t border-[#2c241e]/20 flex justify-end">
                <a
                  href={currentTrack.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-serif text-xs font-bold text-[#1e1b18] hover:underline flex items-center gap-1"
                >
                  Listen on Spotify <ArrowRight size={12} />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Library Margin & Shelves (7 cols - Matching Reference Phone 3) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {activeTab === 'shelves' && (
            <div className="bg-[#fcfaf7] rounded-3xl border-2 border-[#2c241e] p-6 sm:p-8 shadow-xl">
              
              {/* Arched Margin Header (Matching Reference Phone 3 "MARGIN") */}
              <div className="border-b-2 border-[#2c241e] pb-6 mb-6 text-center flex flex-col items-center justify-center">
                <div className="w-32 h-20 border-t-2 border-x-2 border-[#2c241e] rounded-t-full flex items-center justify-center bg-[#dfb141]/20 mb-2">
                  <VintageBustStatue size={44} />
                </div>
                <h2 className="font-serif text-2xl font-bold tracking-widest uppercase text-[#1e1b18]">
                  MARGIN ARCHIVE
                </h2>
                <p className="text-xs font-serif italic text-[#2c241e]/70 mt-0.5">
                  Vintage Vinyl & Classical Book Spines ({musicMemories.length + LOCAL_TRACKS.length} items in vault)
                </p>
              </div>

              {/* Grid of Vinyl / Book Spines (Matching Reference Image Grid) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Local ambient tracks */}
                {LOCAL_TRACKS.map((track, idx) => {
                  const isCurrent = currentTrack.title === track.title;

                  return (
                    <motion.div
                      key={track.id}
                      whileHover={{ scale: 1.03, y: -4 }}
                      onClick={() => playTrack({
                        title: track.title,
                        artist: track.artist,
                        albumArt: track.albumArt,
                        url: track.url,
                        provider: 'local'
                      })}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isCurrent
                          ? 'border-[#2c241e] bg-[#dfb141]/30 ring-2 ring-[#2c241e]/20 shadow-md'
                          : 'border-[#2c241e]/30 bg-white/70 hover:bg-white hover:border-[#2c241e]'
                      }`}
                    >
                      {/* Album Art Frame */}
                      <div className="aspect-square rounded-lg overflow-hidden border border-[#2c241e]/40 shadow-xs mb-2.5 relative group">
                        <img src={track.albumArt} alt={track.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-[#2c241e]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play size={24} className="fill-white text-white" />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#1e1b18] truncate leading-tight">
                          {track.title}
                        </h4>
                        <p className="text-[11px] font-body text-[#2c241e]/70 truncate mt-0.5">
                          {track.artist}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#2c241e]/20 flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-[#2c241e]/70">
                        <span>{track.genre}</span>
                        <span>#{idx + 1}</span>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Supabase Saved Music Memories */}
                {musicMemories.map((mem, idx) => {
                  const trackData = mem.music || { song: mem.title, artist: mem.mood };
                  const isCurrent = currentTrack.title === trackData.song;

                  return (
                    <motion.div
                      key={mem.id}
                      whileHover={{ scale: 1.03, y: -4 }}
                      onClick={() => playTrack({
                        title: trackData.song,
                        artist: trackData.artist,
                        albumArt: trackData.albumArt || mem.photoUrl,
                        externalUrl: trackData.externalUrl,
                        provider: trackData.provider || 'spotify'
                      })}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isCurrent
                          ? 'border-[#2c241e] bg-[#dfb141]/30 ring-2 ring-[#2c241e]/20 shadow-md'
                          : 'border-[#2c241e]/30 bg-white/70 hover:bg-white hover:border-[#2c241e]'
                      }`}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden border border-[#2c241e]/40 shadow-xs mb-2.5 bg-[#dfb141]/10 relative group">
                        {trackData.albumArt || mem.photoUrl ? (
                          <img
                            src={trackData.albumArt || mem.photoUrl}
                            alt={trackData.song}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#2c241e]/40">
                            <Disc size={28} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-[#2c241e]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play size={24} className="fill-white text-white" />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#1e1b18] truncate leading-tight">
                          {trackData.song}
                        </h4>
                        <p className="text-[11px] font-body text-[#2c241e]/70 truncate mt-0.5">
                          {trackData.artist}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#2c241e]/20 flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-[#2c241e]">
                        <span className="px-1.5 py-0.5 rounded bg-[#dfb141]/40">Spotify</span>
                        <span>#{LOCAL_TRACKS.length + idx + 1}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'spotify' && (
            <div className="bg-[#fcfaf7] rounded-3xl border-2 border-[#2c241e] p-6 sm:p-8 shadow-xl">
              <div className="border-b-2 border-[#2c241e] pb-4 mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-bold uppercase text-[#1e1b18]">
                    Spotify Playlists
                  </h2>
                  <p className="text-xs font-serif italic text-[#2c241e]/70">
                    Sync and import classical & modern vinyl collections
                  </p>
                </div>

                {!spotifyConnected && (
                  <button
                    onClick={onConnectSpotify}
                    className="px-4 py-2 rounded-full bg-[#2c241e] text-[#f4efe4] font-body text-xs font-bold uppercase tracking-wider"
                  >
                    Connect Account
                  </button>
                )}
              </div>

              {!spotifyConnected ? (
                <div className="p-12 text-center border-2 border-dashed border-[#2c241e]/30 rounded-2xl bg-[#dfb141]/10">
                  <Disc size={48} className="mx-auto text-[#2c241e] mb-3 animate-spin-slow" />
                  <h3 className="font-serif text-xl font-bold text-[#1e1b18]">Spotify Handshake Required</h3>
                  <p className="text-xs font-serif italic text-[#2c241e]/70 max-w-sm mx-auto mt-1 mb-5">
                    Connect your Spotify account to import full playlist tracks into your Reminiq Vinyl Vault.
                  </p>
                  <button
                    onClick={onConnectSpotify}
                    className="px-6 py-2.5 rounded-full bg-[#2c241e] hover:bg-[#1a1410] text-[#f4efe4] font-body text-xs font-bold uppercase tracking-widest shadow-md"
                  >
                    Connect Spotify Now
                  </button>
                </div>
              ) : (
                <div>
                  {selectedPlaylist ? (
                    <div>
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2c241e]/20">
                        <button
                          onClick={() => setSelectedPlaylist(null)}
                          className="text-xs font-serif font-bold text-[#1e1b18] hover:underline"
                        >
                          ← Back to Playlists
                        </button>
                        <span className="font-serif font-bold text-sm text-[#1e1b18] truncate">
                          {selectedPlaylist.name} ({playlistTracks.length} tracks)
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#dfb141]/20 border border-[#2c241e]/30 mb-4">
                        <span className="text-xs font-serif font-bold text-[#1e1b18]">
                          {selectedTrackIds.size} tracks selected
                        </span>
                        <button
                          onClick={handleImportSelectedTracks}
                          disabled={selectedTrackIds.size === 0 || isImporting}
                          className="px-4 py-1.5 rounded-full bg-[#2c241e] text-[#f4efe4] font-body text-xs font-bold uppercase tracking-wider disabled:opacity-40"
                        >
                          {isImporting ? 'Importing...' : `Import to Shelf`}
                        </button>
                      </div>

                      {isLoadingTracks ? (
                        <div className="py-12 text-center text-[#2c241e]/60 font-serif italic">Loading tracks...</div>
                      ) : (
                        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                          {playlistTracks.map(track => {
                            const isSelected = selectedTrackIds.has(track.id);

                            return (
                              <div
                                key={track.id}
                                onClick={() => handleToggleTrackSelect(track.id)}
                                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#dfb141]/30 border-[#2c241e]'
                                    : 'bg-white/60 border-[#2c241e]/20 hover:bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                                    isSelected ? 'bg-[#2c241e] border-[#2c241e] text-[#f4efe4]' : 'border-[#2c241e]/40'
                                  }`}>
                                    {isSelected && <Check size={10} strokeWidth={3} />}
                                  </div>

                                  {track.albumArt && (
                                    <img src={track.albumArt} alt={track.name} className="w-9 h-9 rounded object-cover border border-[#2c241e]/30" />
                                  )}

                                  <div className="min-w-0">
                                    <div className="text-xs font-serif font-bold text-[#1e1b18] truncate">{track.name}</div>
                                    <div className="text-[10px] font-body text-[#2c241e]/70 truncate">{track.artists}</div>
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playTrack({
                                      title: track.name,
                                      artist: track.artists,
                                      albumArt: track.albumArt,
                                      externalUrl: track.externalUrl,
                                      provider: 'spotify'
                                    });
                                  }}
                                  className="p-1.5 rounded-full hover:bg-[#2c241e]/10 text-[#2c241e]"
                                >
                                  <Play size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {isLoadingPlaylists ? (
                        <div className="py-12 text-center text-[#2c241e]/60 font-serif italic">Loading playlists...</div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {playlists.map(pl => (
                            <motion.div
                              key={pl.id}
                              whileHover={{ scale: 1.03 }}
                              onClick={() => loadPlaylistTracks(pl)}
                              className="p-3 rounded-xl border-2 border-[#2c241e]/30 bg-white/70 hover:bg-white hover:border-[#2c241e] cursor-pointer"
                            >
                              <div className="aspect-square rounded-lg overflow-hidden mb-2 border border-[#2c241e]/20 bg-[#dfb141]/20">
                                {pl.images?.[0]?.url ? (
                                  <img src={pl.images[0].url} alt={pl.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#2c241e]/40">
                                    <MusicIcon size={24} />
                                  </div>
                                )}
                              </div>
                              <h4 className="font-serif font-bold text-xs text-[#1e1b18] truncate">{pl.name}</h4>
                              <p className="text-[10px] font-body text-[#2c241e]/70">{pl.tracksCount} tracks</p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="bg-[#fcfaf7] rounded-3xl border-2 border-[#2c241e] p-6 sm:p-8 shadow-xl space-y-4">
              <div className="border-b-2 border-[#2c241e] pb-3">
                <h2 className="font-serif text-2xl font-bold uppercase text-[#1e1b18]">
                  Search Spotify Archive
                </h2>
                <p className="text-xs font-serif italic text-[#2c241e]/70">
                  Search any classical, vintage, or modern track to pin to your vault
                </p>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2c241e]/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSpotify()}
                    placeholder="Search song title, artist, or vintage score..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#2c241e]/30 rounded-xl text-[#1e1b18] placeholder-[#2c241e]/40 text-xs font-body focus:outline-none focus:border-[#2c241e]"
                  />
                </div>
                <button
                  onClick={handleSearchSpotify}
                  disabled={isSearching}
                  className="px-5 py-2.5 bg-[#2c241e] hover:bg-[#1a1410] text-[#f4efe4] font-body font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-40"
                >
                  {isSearching ? '...' : 'Search'}
                </button>
              </div>

              {/* Search Results */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {searchResults.map(track => {
                  const isSelected = selectedTrackIds.has(track.id);

                  return (
                    <div
                      key={track.id}
                      onClick={() => handleToggleTrackSelect(track.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#dfb141]/30 border-[#2c241e]'
                          : 'bg-white/60 border-[#2c241e]/20 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {track.albumArt && (
                          <img src={track.albumArt} alt={track.name} className="w-9 h-9 rounded object-cover border border-[#2c241e]/30" />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-serif font-bold text-[#1e1b18] truncate">{track.name}</div>
                          <div className="text-[10px] font-body text-[#2c241e]/70 truncate">{track.artists} • {track.album}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playTrack({
                              title: track.name,
                              artist: track.artists,
                              albumArt: track.albumArt,
                              externalUrl: track.externalUrl,
                              provider: 'spotify'
                            });
                          }}
                          className="p-1.5 rounded-full hover:bg-[#2c241e]/10 text-[#2c241e]"
                        >
                          <Play size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            importSpotifyTracks([track]).then(res => {
                              if (res.imported.length > 0) {
                                onAddMemory(res.imported[0]);
                                alert(`Saved "${track.name}" to Vinyl Vault!`);
                              }
                            });
                          }}
                          className="px-2.5 py-1 rounded bg-[#dfb141] hover:bg-[#dab044] text-[#1e1b18] font-serif text-[11px] font-bold"
                          title="Save to Vault"
                        >
                          + Save
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
