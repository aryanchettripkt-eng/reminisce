import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Vault from './components/Vault';
import Taskbar from './components/Taskbar';
import ExtraPages from './components/ExtraPages';
import { Memory, Album, DayReaction, sortMemoriesIntoAlbums } from './lib/groq';
import { 
  AuthProvider, 
  useAuth, 
  listUserMemories, 
  deleteMemory as supabaseDeleteMemory,
  listUserAlbums,
  createAlbumsBatch,
  updateAlbum as supabaseUpdateAlbum,
  deleteAlbum as supabaseDeleteAlbum
} from './services/supabase';
import { 
  connectSpotify as connectSpotifyService, 
  getSavedSpotifyAuthTicket 
} from './services/supabase/spotifyService';
import { motion, AnimatePresence } from 'motion/react';



function ReminiqApp() {
  const { user, isConfigured, signInWithGoogle } = useAuth();
  const [view, setView] = useState<'landing' | 'vault'>('landing');
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [dayReactions, setDayReactions] = useState<DayReaction[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);

  // Sync state
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(getSavedSpotifyAuthTicket());
  const [googlePhotos, setGooglePhotos] = useState<any[]>([]);
  const [isFetchingPhotos, setIsFetchingPhotos] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        setGoogleToken(event.data.token);
        fetchGooglePhotos(event.data.token);
      }
      if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
        setSpotifyToken(event.data.token || event.data.authTicket);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const connectGooglePhotos = async () => {
    const response = await fetch('/api/auth/google/url');
    const { url } = await response.json();
    window.open(url, 'google_auth', 'width=600,height=700');
  };

  const connectSpotify = async () => {
    if (!user) {
      setToast({ message: 'Please sign in to Reminiq first to connect your Spotify account.', type: 'error' });
      return;
    }
    try {
      await connectSpotifyService();
      const ticket = getSavedSpotifyAuthTicket();
      if (ticket) {
        setSpotifyToken(ticket);
        setToast({ message: 'Spotify connected successfully!', type: 'success' });
      }
    } catch (err: any) {
      if (err.name === 'AuthenticationRequiredError' || err.message?.includes('sign in')) {
        setToast({ message: 'Please sign in with Google to connect Spotify.', type: 'error' });
      } else if (!err.message?.includes('cancelled')) {
        setToast({ message: err.message || 'Failed to connect Spotify.', type: 'error' });
      }
    }
  };

  const fetchGooglePhotos = async (token: string) => {
    setIsFetchingPhotos(true);
    try {
      const response = await fetch('/api/photos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setGooglePhotos(data.mediaItems || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setIsFetchingPhotos(false);
    }
  };

  // Seed initial sample memories & hydrate from Supabase when authenticated
  useEffect(() => {
    const initialMemories: Memory[] = [
      {
        id: '1',
        type: 'text',
        title: 'A quiet Tuesday thought',
        desc: 'Had this idea about a community garden where each tile is made by a different neighbor. Something about the light on the courtyard.',
        mood: 'nostalgic',
        date: '2026-03-12',
        tags: ['garden', 'neighbors', 'light'],
      },
      {
        id: '2',
        type: 'photo',
        title: 'Morning mist over the lake',
        desc: 'The water was completely still. You could see the reflection of the old boathouse before the fog cleared.',
        mood: 'peaceful',
        date: '2026-03-10',
        tags: ['lake', 'morning', 'fog'],
        photoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60',
      },
      {
        id: '3',
        type: 'voice',
        title: 'Voice note: rain on the skylight',
        desc: 'Just listening to the storm roll in. 47 seconds of pure rain on glass.',
        mood: 'calm',
        date: '2026-03-08',
        tags: ['rain', 'sound', 'evening'],
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      {
        id: '4',
        type: 'music',
        title: 'Sunday morning record',
        desc: 'Put on the Bill Evans record while the coffee brewed. The whole kitchen smelled like dark roast.',
        mood: 'joy',
        date: '2026-03-05',
        tags: ['music', 'coffee', 'sunday'],
        music: {
          song: 'Peace Piece',
          artist: 'Bill Evans',
          album: 'Everybody Digs Bill Evans',
          albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60',
        },
      },
      {
        id: '5',
        type: 'photo',
        title: 'Coffee with Sarah',
        desc: 'Two cortados, outside even though it was slightly too cold. Talked about everything and nothing for two hours.',
        mood: 'joy',
        date: '2026-03-01',
        tags: ['coffee', 'sarah', 'conversation'],
        photoUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=60',
      },
      {
        id: '6',
        type: 'photo',
        title: 'Evening walk through the park',
        desc: 'The sky turned this incredible shade of amber right before dusk. Everyone was out walking their dogs.',
        mood: 'peaceful',
        date: '2026-02-28',
        tags: ['sunset', 'park', 'walk'],
        photoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60',
      },
      {
        id: '7',
        type: 'photo',
        title: 'Old bookstore on 4th',
        desc: 'Found a first edition with notes in the margins from 1962. Smelled like old paper and vanilla.',
        mood: 'nostalgic',
        date: '2026-02-24',
        tags: ['books', 'vintage', 'reading'],
        photoUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=60',
      },
      {
        id: '8',
        type: 'text',
        title: 'Recipe from grandma',
        desc: 'She wrote it on the back of an envelope: "a pinch of cardamom, but only the good kind." I still have the envelope.',
        mood: 'bittersweet',
        date: '2026-02-20',
        tags: ['grandma', 'recipe', 'baking'],
      },
      {
        id: '9',
        type: 'music',
        title: 'Driving home in the dark',
        desc: 'That synth track came on right as I hit the bridge. City lights reflected across the whole bay.',
        mood: 'melancholy',
        date: '2026-02-15',
        tags: ['driving', 'night', 'bridge'],
        music: {
          song: 'Midnight City',
          artist: 'M83',
          album: 'Hurry Up, We\'re Dreaming',
          albumArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=60',
        },
      },
      {
        id: '10',
        type: 'photo',
        title: 'First snow of the year',
        desc: 'Woke up to total silence. Everything was covered in about three inches of fresh powder. Made tea and just watched.',
        mood: 'peaceful',
        date: '2026-02-10',
        tags: ['snow', 'winter', 'morning'],
        photoUrl: 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=800&auto=format&fit=crop&q=60',
      },
      {
        id: '11',
        type: 'text',
        title: 'Overheard on the train',
        desc: '"Some things are only beautiful because they don\'t stay." An older woman saying goodbye to someone on platform 4.',
        mood: 'bittersweet',
        date: '2026-02-05',
        tags: ['train', 'overheard', 'strangers'],
      },
      {
        id: '12',
        type: 'photo',
        title: 'Studio cleanup afternoon',
        desc: 'Finally organized the brushes and found three rolls of film from last summer that I never developed.',
        mood: 'joy',
        date: '2026-01-28',
        tags: ['studio', 'art', 'film'],
        photoUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=60',
      },
    ];

    if (!user) {
      setMemories(initialMemories);
      return;
    }

    listUserMemories()
      .then((userMems) => {
        if (userMems.length > 0) {
          const mapped: Memory[] = userMems.map((m) => ({
            id: m.id,
            type: (m.type as Memory['type']) || 'text',
            title: m.title,
            desc: m.desc || '',
            mood: m.mood || 'peaceful',
            date: m.date || new Date().toISOString().split('T')[0],
            photoUrl: m.photo_url || undefined,
            audioUrl: m.audio_url || undefined,
            location: m.location || undefined,
            tags: m.tags || [],
            source: (m.source as Memory['source']) || 'local',
            music: (m as any).music || undefined,
            transcript: (m as any).transcript || undefined,
            emotion: (m as any).emotion || undefined,
          }));
          setMemories(mapped);
        } else {
          setMemories(initialMemories);
        }
      })
      .catch((err) => {
        console.error('Failed to load memories from Supabase:', err);
        setMemories(initialMemories);
      });

    listUserAlbums()
      .then((userAlbums) => {
        if (userAlbums.length > 0) {
          const mapped: Album[] = userAlbums.map((a) => ({
            id: a.id,
            title: a.title,
            coverPhoto: a.cover_photo || undefined,
            description: a.description || undefined,
            memoryIds: a.memory_ids || [],
            aestheticTone: a.aesthetic_tone || undefined,
            dominantEmotion: a.dominant_emotion || undefined,
            journalText: a.journal_text || undefined,
            colorPalette: a.color_palette || undefined,
            createdAt: a.created_at || undefined,
          }));
          setAlbums(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to load albums from Supabase:', err);
      });
  }, [user]);

  const addMemory = (memory: Memory) => {
    setMemories(prev => [memory, ...prev]);
  };

  const deleteMemory = async (memoryId: string) => {
    setMemories(prev => prev.filter(m => m.id !== memoryId));
    setAlbums(prev => prev.map(a => ({
      ...a,
      memoryIds: a.memoryIds.filter(id => id !== memoryId)
    })));

    if (user) {
      try {
        await supabaseDeleteMemory(memoryId);
      } catch (err) {
        console.error('Failed to delete memory from Supabase:', err);
      }
    }
  };

  const updateAlbums = (newAlbums: Album[]) => {
    setAlbums(newAlbums);
  };

  const updateAlbumTitle = async (albumId: string, newTitle: string) => {
    setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, title: newTitle } : a));
    if (user) {
      try {
        await supabaseUpdateAlbum(albumId, { title: newTitle });
      } catch (err) {
        console.error('Failed to update album title in Supabase:', err);
      }
    }
  };

  const updateAlbum = async (albumId: string, data: Partial<Album>) => {
    setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, ...data } : a));
    if (user) {
      try {
        await supabaseUpdateAlbum(albumId, {
          title: data.title,
          description: data.description,
          cover_photo: data.coverPhoto,
          aesthetic_tone: data.aestheticTone,
          dominant_emotion: data.dominantEmotion,
          journal_text: data.journalText,
          color_palette: data.colorPalette,
          memory_ids: data.memoryIds,
        });
      } catch (err) {
        console.error('Failed to update album in Supabase:', err);
      }
    }
  };

  const deleteAlbum = async (albumId: string) => {
    setAlbums(prev => prev.filter(a => a.id !== albumId));
    if (user) {
      try {
        await supabaseDeleteAlbum(albumId);
      } catch (err) {
        console.error('Failed to delete album from Supabase:', err);
      }
    }
  };

  const updateDayReaction = (date: string, data: Partial<DayReaction>) => {
    setDayReactions(prev => {
      const idx = prev.findIndex(r => r.date === date);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...data };
        return next;
      }
      return [...prev, { date, ...data }];
    });
  };

  const handleSortIntoAlbums = async () => {
    if (memories.length === 0) return;
    setIsSorting(true);
    try {
      const sorted = await sortMemoriesIntoAlbums(memories);
      setAlbums(sorted);
      if (user && sorted.length > 0) {
        createAlbumsBatch(
          sorted.map(a => ({
            title: a.title,
            description: a.description || null,
            cover_photo: a.coverPhoto || null,
            aesthetic_tone: a.aestheticTone || null,
            dominant_emotion: a.dominantEmotion || null,
            journal_text: a.journalText || null,
            color_palette: a.colorPalette || [],
            memory_ids: a.memoryIds,
          }))
        ).catch(err => console.error('Failed to save AI sorted albums:', err));
      }
      setActiveOverlay('albums');
    } catch (err) {
      console.error('AI sorting failed:', err);
    } finally {
      setIsSorting(false);
    }
  };

  const handleAddMemoryAtDate = (date: string) => {
    setPrefilledDate(date);
    setIsAddModalOpen(true);
    setActiveOverlay(null);
  };

  return (
    <main className="min-h-screen">
      {/* Film Grain Overlay (Global) */}
      <div className="film-grain" />
      
      {view === 'landing' ? (
        <LandingPage 
          onEnterVault={() => setView('vault')} 
          memories={memories} 
          onAddMemory={addMemory}
        />
      ) : (
        <Vault 
          onBack={() => setView('landing')} 
          memories={memories} 
          onAddMemory={addMemory}
          onDeleteMemory={deleteMemory}
          albums={albums}
          onUpdateAlbums={updateAlbums}
          onUpdateAlbumTitle={updateAlbumTitle}
          onUpdateAlbum={updateAlbum}
          dayReactions={dayReactions}
          onUpdateDayReaction={updateDayReaction}
          activeOverlay={activeOverlay}
          onCloseOverlay={() => setActiveOverlay(null)}
          onSortAlbums={handleSortIntoAlbums}
          isSorting={isSorting}
          isAddModalOpen={isAddModalOpen}
          onSetIsAddModalOpen={setIsAddModalOpen}
          prefilledDate={prefilledDate}
          onClearPrefilledDate={() => setPrefilledDate(null)}
          googleToken={googleToken}
          googlePhotos={googlePhotos}
          isFetchingPhotos={isFetchingPhotos}
          onConnectGoogle={connectGooglePhotos}
          onFetchPhotos={fetchGooglePhotos}
          spotifyToken={spotifyToken}
          onConnectSpotify={connectSpotify}
        />
      )}

      <Taskbar 
        view={view} 
        onViewChange={setView} 
        activeOverlay={activeOverlay} 
        onOverlayChange={setActiveOverlay}
      />

      <AnimatePresence>
        {activeOverlay && (
          <ExtraPages 
            activeOverlay={activeOverlay} 
            onClose={() => setActiveOverlay(null)} 
            memories={memories}
            onAddMemory={addMemory}
            onDeleteMemory={deleteMemory}
            albums={albums}
            onUpdateAlbums={updateAlbums}
            onUpdateAlbumTitle={updateAlbumTitle}
            onUpdateAlbum={updateAlbum}
            onDeleteAlbum={deleteAlbum}
            dayReactions={dayReactions}
            onUpdateDayReaction={updateDayReaction}
            onSortAlbums={handleSortIntoAlbums}
            isSorting={isSorting}
            onAddMemoryAtDate={handleAddMemoryAtDate}
            spotifyToken={spotifyToken}
            onConnectSpotify={connectSpotify}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[20000] px-6 py-3 rounded-full shadow-2xl font-hand text-lg flex items-center gap-3 border ${
              toast.type === 'error' ? 'bg-red-50 text-red-900 border-red-200' : 'bg-moss text-cream border-moss/20'
            }`}
          >
            {toast.type === 'error' ? '✕' : '✓'}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ReminiqApp />
    </AuthProvider>
  );
}
