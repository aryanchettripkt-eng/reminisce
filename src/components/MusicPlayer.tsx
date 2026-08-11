import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Music, ExternalLink } from 'lucide-react';
import { getPlayableAudioUrl } from '../lib/music';

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

  const playableAudio = audioUrl || getPlayableAudioUrl({ song, title: song, uri, url: audioUrl });
  const isSpotify = provider === 'spotify' || Boolean(externalUrl && externalUrl.includes('spotify.com')) || Boolean(uri && uri.startsWith('spotify:'));
  const spotifyLink = externalUrl || (uri ? `https://open.spotify.com/track/${uri.replace('spotify:track:', '')}` : undefined);

  useEffect(() => {
    if (autoPlay && playableAudio && audioRef.current) {
      audioRef.current.src = playableAudio;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [playableAudio, autoPlay]);

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
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src || audioRef.current.src === '' || audioRef.current.src.includes('undefined')) {
        audioRef.current.src = playableAudio;
      }
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn("Playback error:", e);
      });
    }
  };

  return (
    <div className="bg-[#fcfaf7] p-4 rounded-2xl border-2 border-[#2c241e]/20 flex items-center gap-4 group shadow-sm">
      <audio ref={audioRef} src={playableAudio} preload="auto" />
      
      <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-[#2c241e]/10 border border-[#2c241e]/20">
        {albumArt ? (
          <img
            src={albumArt}
            alt={song}
            className={`w-full h-full object-cover transition-transform duration-[5s] linear ${isPlaying ? 'scale-110 rotate-6' : ''}`}
          />
        ) : (
          <div className="w-full h-full bg-[#dfb141]/20 flex items-center justify-center">
            <Music size={22} className="text-[#2c241e]/60" />
          </div>
        )}
        <button 
          onClick={togglePlay}
          className="absolute inset-0 bg-[#2c241e]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
          title={isPlaying ? 'Pause' : 'Play Sound'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-white" />}
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-serif font-bold text-[#1e1b18] text-sm truncate">{song}</h4>
          {isSpotify && (
            <span className="text-[9px] font-body uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#dfb141] text-[#1e1b18] flex-shrink-0">
              Spotify
            </span>
          )}
        </div>
        <p className="text-xs font-body text-[#2c241e]/70 truncate">{artist}</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-[#2c241e]/10 h-1 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-[#dfb141] h-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-[#2c241e] text-[#f4efe4] flex items-center justify-center hover:bg-[#1a1410] transition-transform active:scale-95 shadow-xs"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-[#f4efe4]" />}
        </button>

        {spotifyLink && (
          <a
            href={spotifyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-[#f4efe4] border border-[#2c241e]/30 flex items-center justify-center text-[#2c241e] hover:bg-white transition-all shadow-xs"
            title="Open in Spotify"
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </div>
  );
}
