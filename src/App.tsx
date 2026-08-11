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
import { motion, AnimatePresence } from 'motion/react';



function ReminiqApp() {
  const { user, isConfigured } = useAuth();
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
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [googlePhotos, setGooglePhotos] = useState<any[]>([]);
  const [isFetchingPhotos, setIsFetchingPhotos] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        setGoogleToken(event.data.token);
        fetchGooglePhotos(event.data.token);
      }
      if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
        setSpotifyToken(event.data.token);
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
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const response = await fetch(`/api/auth/spotify/url?origin=${encodeURIComponent(origin)}`, {
      headers: { 'x-client-origin': origin }
    });
    const { url } = await response.json();
    window.open(url, 'spotify_auth', 'width=600,height=700');
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
        location: 'Home, late evening',
        date: new Date('2023-11-12T18:00:00Z').toISOString(),
        photoUrl: 'https://picsum.photos/seed/garden/800/600'
      },
      {
        id: '2',
        type: 'photo',
        title: 'The café in the rain',
        desc: 'It rained all afternoon and we stayed. Three rounds of coffee. We talked about everything we were afraid of.',
        mood: 'bittersweet',
        location: 'The corner café',
        date: new Date('2023-07-08T14:30:00Z').toISOString(),
        photoUrl: 'https://picsum.photos/seed/cafe/800/600'
      },
      {
        id: '3',
        type: 'text',
        title: 'Grandma folding cranes',
        desc: 'The light came through yellow curtains and made everything amber. I photographed it with my eyes.',
        mood: 'love',
        location: "Grandma's kitchen",
        date: new Date('2023-08-20T10:00:00Z').toISOString(),
        photoUrl: 'https://picsum.photos/seed/grandma/800/600'
      },
      {
        id: '4',
        type: 'photo',
        title: 'Neon Tokyo Nights',
        desc: 'The city never sleeps, and neither did we. Ramen at 3 AM tasted like victory.',
        mood: 'joy',
        location: 'Shinjuku, Tokyo',
        date: new Date('2023-12-15T03:00:00Z').toISOString(),
        photoUrl: 'https://picsum.photos/seed/tokyo/800/600'
      },
      {
        id: '5',
        type: 'photo',
        title: 'Mountain Mist',
        desc: 'Waking up above the clouds. The silence was so loud it felt like a physical weight.',
        mood: 'peaceful',
        location: 'Swiss Alps',
        date: new Date('2023-05-22T06:00:00Z').toISOString(),
        photoUrl: 'https://picsum.photos/seed/alps/800/600'
      },
      {
        id: '6',
        type: 'photo',
        title: 'Old Library Scent',
        desc: 'Dusty paper and vanilla. I could stay here forever, lost in stories that aren\'t mine.',
        mood: 'nostalgic',
        location: 'Oxford Library',
        date: new Date('2023-09-10T11:00:00Z').toISOString(),
        photoUrl: 'https://picsum.photos/seed/library/800/600'
      },
      {
        id: '7',
        type: 'photo',
        title: 'Golden Hour Beach',
        desc: 'The sand was warm and the water was cold. Perfect balance.',
        mood: 'joy',
        location: 'Malibu, CA',
        date: new Date('2023-08-05T19:30:00Z').toISOString(),
        photoUrl: 'https://picsum.photos/seed/beach/800/600'
      },
      {
        id: '8',
        type: 'photo',
        title: 'Abandoned Piano',
        desc: 'Found in a forest clearing. It played a song of decay and beauty.',
        mood: 'melancholic',
        location: 'Black Forest',
        date: new Date('2023-10-30T15:00:00Z').toISOString(),
        photoUrl: 'https://picsum.photos/seed/piano/800/600'
      }
    ];

    if (user && isConfigured) {
      listUserMemories()
        .then((dbMemories) => {
          if (dbMemories.length > 0) {
            setMemories(dbMemories);
          } else {
            setMemories([]);
          }
        })
        .catch((err) => {
          console.error('Failed to load user memories from Supabase:', err);
          setMemories(initialMemories);
        });

      listUserAlbums()
        .then((dbAlbums) => {
          if (dbAlbums.length > 0) {
            setAlbums(dbAlbums);
          } else {
            setAlbums([]);
          }
        })
        .catch((err) => {
          console.error('Failed to load user albums from Supabase:', err);
        });
    } else {
      setMemories(initialMemories);
      setAlbums([]);
    }
  }, [user, isConfigured]);

  const addMemory = (memory: Memory) => {
    setMemories(prev => [memory, ...prev]);
  };

  const deleteMemory = async (memoryId: string) => {
    setMemories(prev => prev.filter(m => m.id !== memoryId));
    setAlbums(prev => prev.map(a => ({
      ...a,
      memoryIds: a.memoryIds.filter(id => id !== memoryId),
      linkedMemoryIds: (a.linkedMemoryIds || a.memoryIds).filter(id => id !== memoryId),
    })));

    if (user && isConfigured) {
      try {
        await supabaseDeleteMemory(memoryId);
      } catch (err: any) {
        console.error('Failed to delete memory from Supabase:', err);
      }
    }
  };

  const updateAlbums = (newAlbums: Album[]) => {
    setAlbums(newAlbums);
  };

  const handleSortIntoAlbums = async () => {
    if (memories.length === 0) return;
    setIsSorting(true);
    try {
      const sortedAlbums = await sortMemoriesIntoAlbums(memories);
      if (sortedAlbums.length === 0) {
        setToast({ message: "AI couldn't find distinct groups for these memories. Try adding more context or photos.", type: 'error' });
      } else {
        if (user && isConfigured) {
          try {
            const { created, failed } = await createAlbumsBatch(sortedAlbums);
            if (created.length > 0) {
              setAlbums(created);
              if (failed.length > 0) {
                console.warn('Some albums failed to persist in batch:', failed);
              }
            } else {
              setAlbums(sortedAlbums);
            }
          } catch (batchErr) {
            console.error('Failed to persist batch albums:', batchErr);
            setAlbums(sortedAlbums);
          }
        } else {
          setAlbums(sortedAlbums);
        }
        setActiveOverlay('albums');
        setToast({ message: "Memories sorted into albums successfully.", type: 'success' });
      }
    } catch (error: any) {
      console.error("Sorting failed:", error);
      setToast({ message: error.message || "Sorting failed. Please check your API key and connection.", type: 'error' });
    } finally {
      setIsSorting(false);
    }
  };

  const updateAlbumTitle = (albumId: string, newTitle: string) => {
    setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, title: newTitle } : a));
    if (user && isConfigured) {
      supabaseUpdateAlbum(albumId, { title: newTitle }).catch((err) => {
        console.error('Failed to update album title in Supabase:', err);
      });
    }
  };

  const updateAlbum = (albumId: string, data: Partial<Album>) => {
    setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, ...data } : a));
    if (user && isConfigured) {
      supabaseUpdateAlbum(albumId, {
        title: data.title,
        journalText: data.journalText,
        voiceNoteUrl: data.voiceNoteUrl,
        memoryIds: data.memoryIds,
        linkedMemoryIds: data.linkedMemoryIds,
      }).catch((err) => {
        console.error('Failed to update album in Supabase:', err);
      });
    }
  };

  const deleteAlbum = async (albumId: string) => {
    setAlbums(prev => prev.filter(a => a.id !== albumId));
    if (user && isConfigured) {
      try {
        await supabaseDeleteAlbum(albumId);
      } catch (err: any) {
        console.error('Failed to delete album from Supabase:', err);
      }
    }
  };


  const updateDayReaction = (date: string, data: Partial<DayReaction>) => {
    setDayReactions(prev => {
      const existing = prev.find(r => r.date === date);
      if (existing) {
        return prev.map(r => r.date === date ? { ...r, ...data } : r);
      }
      return [...prev, { date, emoji: '✨', ...data }];
    });
  };

  const handleAddMemoryAtDate = (date: string) => {
    setPrefilledDate(date);
    setIsAddModalOpen(true);
    setActiveOverlay(null);
  };



  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Check for OAuth error redirected in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
      const queryParams = url.searchParams;

      const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
      const errorCode = hashParams.get('error') || queryParams.get('error');

      if (errorDescription || errorCode) {
        setToast({
          message: decodeURIComponent(errorDescription || errorCode || 'Authentication failed. Please try again.').replace(/\+/g, ' '),
          type: 'error',
        });
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

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

