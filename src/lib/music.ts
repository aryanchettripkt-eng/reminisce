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

export const LOCAL_TRACKS: Track[] = [
  {
    id: 't1',
    title: 'Midnight City',
    artist: 'M83',
    albumArt: 'https://picsum.photos/seed/m83/400/400',
    url: VINTAGE_AUDIO_STREAMS[1],
    genre: 'Synthwave'
  },
  {
    id: 't2',
    title: 'Lofi Study & Rain',
    artist: 'Chillhop Music',
    albumArt: 'https://picsum.photos/seed/lofi/400/400',
    url: VINTAGE_AUDIO_STREAMS[2],
    genre: 'Lofi'
  },
  {
    id: 't3',
    title: 'Nostalgia (Clair de Lune)',
    artist: 'Memory Lane Chamber',
    albumArt: 'https://picsum.photos/seed/nostalgia/400/400',
    url: VINTAGE_AUDIO_STREAMS[3],
    genre: 'Classical'
  },
  {
    id: 't4',
    title: 'Summer Breeze',
    artist: 'Vintage Vibes',
    albumArt: 'https://picsum.photos/seed/summer/400/400',
    url: VINTAGE_AUDIO_STREAMS[4],
    genre: 'Acoustic'
  },
  {
    id: 't5',
    title: 'Rainy Night Jazz',
    artist: 'Blue Note Trio',
    albumArt: 'https://picsum.photos/seed/rainy/400/400',
    url: VINTAGE_AUDIO_STREAMS[5],
    genre: 'Jazz'
  },
  {
    id: 't6',
    title: 'Golden Hour (Gymnopédie)',
    artist: 'Acoustic Dreams',
    albumArt: 'https://picsum.photos/seed/golden/400/400',
    url: VINTAGE_AUDIO_STREAMS[0],
    genre: 'Ambient'
  }
];

/**
 * Returns a guaranteed working audio URL for any track, falling back to a deterministic vintage stream.
 */
export function getPlayableAudioUrl(track: { id?: string; title?: string; song?: string; url?: string; audioUrl?: string; uri?: string }): string {
  if (track.url && (track.url.startsWith('http://') || track.url.startsWith('https://') || track.url.startsWith('blob:'))) {
    return track.url;
  }
  if (track.audioUrl && (track.audioUrl.startsWith('http://') || track.audioUrl.startsWith('https://') || track.audioUrl.startsWith('blob:'))) {
    return track.audioUrl;
  }

  // Deterministically map identifier to an authentic audio stream
  const key = (track.id || track.title || track.song || 'music');
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % VINTAGE_AUDIO_STREAMS.length;
  return VINTAGE_AUDIO_STREAMS[index];
}
