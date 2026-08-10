import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Music, ExternalLink } from 'lucide-react';

interface MusicPlayerProps {
  song: string;
  artist: string;
  album?: string;
  albumArt?: string;
  audioUrl?: string;
  externalUrl?: string;
  uri?: string;
  provider?: string;
  autoPlay?: boolean;
}

export default function MusicPlayer({
  song,
  artist,
  album,
  albumArt,
  audioUrl,
  externalUrl,
  uri,
  provider,
  autoPlay = false,
}: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isSpotify = provider === 'spotify' || Boolean(externalUrl && externalUrl.includes('spotify.com')) || Boolean(uri && uri.startsWith('spotify:'));
  const spotifyLink = externalUrl || (uri ? `https://open.spotify.com/track/${uri.replace('spotify:track:', '')}` : undefined);

  useEffect(() => {
    if (autoPlay && audioUrl) {
      setIsPlaying(true);
      audioRef.current?.play().catch(() => setIsPlaying(false));
    }
  }, [audioUrl, autoPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (isSpotify && spotifyLink) {
      window.open(spotifyLink, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/10 flex items-center gap-4 group">
      {audioUrl && <audio ref={audioRef} src={audioUrl} />}
      
      <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg flex-shrink-0 bg-zinc-900 border border-white/5">
        {albumArt ? (
          <img
            src={albumArt}
            alt={song}
            className={`w-full h-full object-cover transition-transform duration-[5s] linear ${isPlaying ? 'scale-110 rotate-6' : ''}`}
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
            <Music size={24} className="text-white/20" />
          </div>
        )}
        <button 
          onClick={togglePlay}
          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          title={isSpotify ? 'Open & Play on Spotify' : (isPlaying ? 'Pause' : 'Play')}
        >
          {isSpotify ? (
            <ExternalLink size={20} className="text-white" />
          ) : isPlaying ? (
            <Pause size={24} className="text-white" />
          ) : (
            <Play size={24} className="text-white fill-white" />
          )}
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-white font-serif italic text-lg truncate">{song}</div>
        <div className="text-white/50 font-hand text-sm truncate">
          {artist} {album && <span className="opacity-70">• {album}</span>}
        </div>
        
        {audioUrl ? (
          <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-moss transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : isSpotify && spotifyLink ? (
          <div className="mt-2 flex items-center gap-2">
            <a
              href={spotifyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1DB954]/20 hover:bg-[#1DB954]/30 border border-[#1DB954]/40 text-[#1DB954] font-hand text-[11px] uppercase tracking-wider transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-pulse" />
              Play on Spotify
              <ExternalLink size={10} />
            </a>
          </div>
        ) : null}
      </div>

      <div className="flex-shrink-0">
        {audioUrl ? (
          <Volume2 size={16} className="text-white/20" />
        ) : isSpotify ? (
          <span className="text-[10px] font-hand text-white/30 tracking-widest uppercase">Spotify</span>
        ) : null}
      </div>
    </div>
  );
}
