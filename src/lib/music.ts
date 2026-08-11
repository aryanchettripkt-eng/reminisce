export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  url: string;
  genre: string;
}

export const VINTAGE_AUDIO_STREAMS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', // Acoustic / Golden Hour
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Synthwave / Midnight
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Lofi Chill
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', // Nostalgic Ambient
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', // Vintage Breeze
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', // Jazz Trio
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', // Classical Piano
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', // Serenade
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', // Nocturne
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', // Waltz
];

// Default tracks removed as requested — shelves are populated dynamically from user's Spotify imports & memories
export const LOCAL_TRACKS: Track[] = [];

/**
 * Returns a guaranteed working audio URL for any track, falling back to a deterministic vintage stream.
 */
export function getPlayableAudioUrl(track: { 
  id?: string; 
  title?: string; 
  song?: string; 
  url?: string; 
  audioUrl?: string;
  uri?: string;
  provider?: string;
  externalUrl?: string;
}): string {
  if (track.url && (track.url.startsWith('http://') || track.url.startsWith('https://') || track.url.startsWith('blob:'))) {
    return track.url;
  }
  if (track.audioUrl && (track.audioUrl.startsWith('http://') || track.audioUrl.startsWith('https://') || track.audioUrl.startsWith('blob:'))) {
    return track.audioUrl;
  }

  // Deterministically map identifier to an authentic audio stream
  const key = (track.id || track.title || track.song || track.uri || 'music');
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % VINTAGE_AUDIO_STREAMS.length;
  return VINTAGE_AUDIO_STREAMS[index];
}
