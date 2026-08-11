import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  FolderHeart, 
  Edit2, 
  Trash2,
  ChevronLeft
} from 'lucide-react';
import { Memory, Album, DayReaction } from '../lib/groq';
import MonthlyPinboard from './MonthlyPinboard';
import VinylVault from './VinylVault';
import AISearchView from './AISearchView';
import InteractiveScrapbook from './InteractiveScrapbook';
import TimelineOverlay from './TimelineOverlay';
import AlbumDetail from './AlbumDetail';

interface ExtraPagesProps {
  activeOverlay: string | null;
  onClose: () => void;
  memories: Memory[];
  onAddMemory?: (memory: Memory) => void;
  onDeleteMemory: (memoryId: string) => void;
  albums: Album[];
  onUpdateAlbums: (albums: Album[]) => void;
  onUpdateAlbumTitle: (albumId: string, newTitle: string) => void;
  onUpdateAlbum: (albumId: string, data: Partial<Album>) => void;
  onDeleteAlbum?: (albumId: string) => void;
  dayReactions: DayReaction[];
  onUpdateDayReaction: (date: string, data: Partial<DayReaction>) => void;
  onSortAlbums: () => void;
  isSorting: boolean;
  onAddMemoryAtDate: (date: string) => void;
  spotifyToken?: string | null;
  onConnectSpotify?: () => void;
}

export default function ExtraPages({
  activeOverlay,
  onClose,
  memories,
  onAddMemory = () => {},
  onDeleteMemory,
  albums,
  onUpdateAlbums,
  onUpdateAlbumTitle,
  onUpdateAlbum,
  onDeleteAlbum,
  dayReactions,
  onUpdateDayReaction,
  onSortAlbums,
  isSorting,
  onAddMemoryAtDate,
  spotifyToken = null,
  onConnectSpotify = () => {}
}: ExtraPagesProps) {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!activeOverlay) return null;

  // 1. Monthly Pinboard (Connected 12-Month Folders & Calendar Board)
  if (activeOverlay === 'monthly-pinboard' || activeOverlay === 'calendar' || activeOverlay === 'folders') {
    return (
      <MonthlyPinboard
        memories={memories}
        dayReactions={dayReactions}
        onUpdateDayReaction={onUpdateDayReaction}
        onClose={onClose}
        onAddMemoryAtDate={onAddMemoryAtDate}
        onDeleteMemory={onDeleteMemory}
      />
    );
  }

  // 2. Vinyl Vault (Dedicated Music Storage & Spotify Sync & In-Browser Audio)
  if (activeOverlay === 'vinyl-vault' || activeOverlay === 'vinyl' || activeOverlay === 'music') {
    return (
      <VinylVault
        memories={memories}
        albums={albums}
        onAddMemory={onAddMemory}
        onClose={onClose}
        onConnectSpotify={onConnectSpotify}
        spotifyToken={spotifyToken}
      />
    );
  }

  // 3. AI Memory Search (Groq Llama 3.3 Semantic Librarian)
  if (activeOverlay === 'ai-search' || activeOverlay === 'try-it') {
    return (
      <AISearchView
        memories={memories}
        onClose={onClose}
      />
    );
  }

  // 4. Aesthetic Scrapbook
  if (activeOverlay === 'scrapbook') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-cream/95 backdrop-blur-xl flex flex-col p-4 sm:p-8"
      >
        <div className="flex items-center justify-between pb-4 max-w-7xl mx-auto w-full flex-shrink-0">
          <div>
            <h1 className="font-serif text-3xl text-dark-brown font-bold italic">
              Aesthetic Memory Scrapbook
            </h1>
            <p className="font-hand text-sm text-brown">
              Freeform digital scrapbooking with vector stickers, washi tapes & polaroid photos
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-parchment/80 border border-light-brown/40 flex items-center justify-center text-dark-brown hover:bg-brown/10 transition-transform active:scale-95 shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 max-w-7xl mx-auto w-full min-h-0">
          <InteractiveScrapbook memories={memories} />
        </div>
      </motion.div>
    );
  }

  // 5. Timeline Kodachrome Filmstrip View
  if (activeOverlay === 'timeline') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-zinc-950 overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="fixed top-8 right-8 z-[10001] p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md shadow-xl transition-transform hover:scale-105"
        >
          <X size={22} />
        </button>
        <TimelineOverlay memories={memories} scrollRef={scrollRef} />
      </motion.div>
    );
  }

  // 6. Curated Albums View
  if (activeOverlay === 'albums') {
    return (
      <motion.div
        ref={scrollRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-[10000] bg-cream overflow-y-auto"
      >
        <div className="film-grain" />

        <button
          onClick={onClose}
          className="fixed top-8 right-8 z-[10001] p-3 bg-moss text-cream rounded-full shadow-xl hover:scale-110 transition-transform"
        >
          <X size={24} />
        </button>

        <div className="max-w-6xl mx-auto px-6 py-20">
          {selectedAlbum ? (
            <AlbumDetail
              album={selectedAlbum}
              memories={memories}
              onBack={() => setSelectedAlbum(null)}
              onUpdateAlbum={(data) => {
                onUpdateAlbum(selectedAlbum.id, data);
                setSelectedAlbum({ ...selectedAlbum, ...data });
              }}
            />
          ) : (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-light-brown/30">
                <div>
                  <h1 className="font-serif text-4xl font-bold text-dark-brown italic">
                    AI Curated Albums
                  </h1>
                  <p className="font-hand text-lg text-brown mt-1">
                    Memories automatically clustered by visual tone & emotional mood
                  </p>
                </div>

                <button
                  onClick={onSortAlbums}
                  disabled={isSorting || memories.length === 0}
                  className="btn-aesthetic-primary"
                >
                  <Sparkles size={16} />
                  {isSorting ? 'AI is Curating...' : 'Auto-Group with Groq AI'}
                </button>
              </div>

              {albums.length === 0 ? (
                <div className="p-16 text-center bg-warm-white/70 rounded-3xl border-2 border-dashed border-light-brown/40 max-w-lg mx-auto">
                  <FolderHeart size={48} className="mx-auto text-moss mb-3 opacity-60" />
                  <h3 className="font-serif text-2xl text-dark-brown font-bold">No Albums Created Yet</h3>
                  <p className="font-hand text-base text-brown mt-1 mb-6">
                    Click the button above to let Groq AI analyze your photos with vision models and group them by mood and aesthetic!
                  </p>
                  <button
                    onClick={onSortAlbums}
                    disabled={isSorting || memories.length === 0}
                    className="btn-aesthetic-primary"
                  >
                    <Sparkles size={16} />
                    Run AI Album Sorter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                  {albums.map((album) => {
                    const albumMemories = memories.filter(m => album.memoryIds.includes(m.id));
                    const coverPhoto = albumMemories.find(m => m.photoUrl)?.photoUrl;

                    return (
                      <motion.div
                        key={album.id}
                        whileHover={{ y: -8, scale: 1.02 }}
                        onClick={() => setSelectedAlbum(album)}
                        className="bg-white p-5 rounded-3xl border border-light-brown/40 shadow-lg cursor-pointer card-3d-tilt flex flex-col justify-between"
                      >
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-parchment/40 relative shadow-inner">
                          {coverPhoto ? (
                            <img src={coverPhoto} alt={album.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-brown">
                              <BookOpen size={36} />
                            </div>
                          )}
                          <span className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-hand text-xs">
                            {albumMemories.length} items
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            {editingAlbumId === album.id ? (
                              <input
                                type="text"
                                value={editTitleValue}
                                onChange={(e) => setEditTitleValue(e.target.value)}
                                onBlur={() => {
                                  onUpdateAlbumTitle(album.id, editTitleValue);
                                  setEditingAlbumId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    onUpdateAlbumTitle(album.id, editTitleValue);
                                    setEditingAlbumId(null);
                                  }
                                }}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                className="font-serif font-bold text-dark-brown text-lg border-b border-moss focus:outline-none"
                              />
                            ) : (
                              <h3 className="font-serif font-bold text-dark-brown text-xl truncate">{album.title}</h3>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAlbumId(album.id);
                                setEditTitleValue(album.title);
                              }}
                              className="p-1 text-brown/60 hover:text-dark-brown"
                              title="Edit Title"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>

                          {album.journalText && (
                            <p className="font-hand text-sm text-brown line-clamp-2 mt-1">
                              "{album.journalText}"
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-light-brown/20 flex items-center justify-between text-xs font-hand text-moss font-bold">
                          <span>Explore Album →</span>
                          {onDeleteAlbum && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete album "${album.title}"?`)) {
                                  onDeleteAlbum(album.id);
                                }
                              }}
                              className="text-red-700 hover:text-red-900 p-1"
                              title="Delete Album"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
}
