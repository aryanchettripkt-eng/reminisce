import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Sparkles, 
  X, 
  Camera, 
  Mic, 
  Type, 
  Music as MusicIcon, 
  MapPin, 
  ArrowRight,
  BookOpen,
  Filter
} from 'lucide-react';
import { Memory, searchMemories } from '../lib/groq';
import { WaxSealRose, DriedPressedFlower, WashiTapeRemember } from './AestheticStickers';

interface AISearchViewProps {
  memories: Memory[];
  onClose: () => void;
  onSelectMemory?: (memory: Memory) => void;
}

const CURATED_CATEGORIES = [
  { label: '☕ Cozy Rainy Cafés', query: 'rainy afternoon coffee shop warm conversation' },
  { label: '🌅 Golden Hour by the Coast', query: 'golden hour sunset warm sand ocean water' },
  { label: '🌃 Neon Late Night Walks', query: 'late night neon lights tokyo ramen city street' },
  { label: '🏔️ High Mountains & Mist', query: 'mountain mist silence clouds alps hike' },
  { label: '🌸 Grandma & Amber Light', query: 'grandma kitchen cranes yellow amber curtains' },
  { label: '📖 Old Books & Vanilla', query: 'old library books dusty paper stories vanilla' },
  { label: '🎶 Vinyl Records & Summer', query: 'vinyl record summer breeze acoustic music' },
  { label: '🌿 Quiet Forest & Clearings', query: 'forest abandoned piano nature peaceful green' }
];

const MOODS = ['all', 'joy', 'nostalgic', 'peaceful', 'bittersweet', 'melancholic', 'love'];

export default function AISearchView({
  memories,
  onClose,
  onSelectMemory
}: AISearchViewProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ intro: string; memoryId: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'photo' | 'voice' | 'text' | 'music'>('all');

  const handleExecuteSearch = async (searchTerm: string) => {
    if (!searchTerm.trim() || isSearching) return;
    setQuery(searchTerm);
    setIsSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const result = await searchMemories(searchTerm, memories);
      setSearchResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to search memories with Groq AI.');
    } finally {
      setIsSearching(false);
    }
  };

  const filteredMemories = memories.filter(m => {
    if (selectedMood !== 'all' && m.mood?.toLowerCase() !== selectedMood) return false;
    if (selectedType !== 'all' && m.type !== selectedType) return false;
    return true;
  });

  const matchingMemory = searchResult?.memoryId
    ? memories.find(m => m.id === searchResult.memoryId)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-cream/95 backdrop-blur-xl flex flex-col overflow-hidden"
    >
      <div className="film-grain" />

      {/* Header */}
      <header className="px-8 py-5 border-b border-light-brown/30 bg-warm-white/80 backdrop-blur-md flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-moss text-cream flex items-center justify-center shadow-lg border border-moss/20">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-dark-brown font-bold tracking-tight">
              AI Memory Librarian
            </h1>
            <p className="font-hand text-sm text-brown">
              Natural language semantic search powered by Groq Llama 3.3
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-parchment/80 border border-light-brown/40 flex items-center justify-center text-dark-brown hover:bg-brown/10 transition-transform active:scale-95 shadow-sm"
        >
          <X size={20} />
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8 z-10">
        
        {/* Search Box */}
        <div className="bg-warm-white p-6 sm:p-8 rounded-3xl border border-light-brown/40 shadow-xl relative">
          <div className="flex items-center gap-3 bg-white px-5 py-3.5 rounded-2xl border border-light-brown/40 shadow-inner">
            <Search size={22} className="text-brown/50" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecuteSearch(query)}
              placeholder="Describe a feeling, place, conversation, or moment..."
              className="flex-1 font-body text-base text-dark-brown placeholder-brown/40 focus:outline-none"
            />
            <button
              onClick={() => handleExecuteSearch(query)}
              disabled={isSearching || !query.trim()}
              className="btn-aesthetic-primary"
            >
              {isSearching ? 'Searching...' : 'Search Vault'}
            </button>
          </div>

          {/* Curated Category Inspiration Chips */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-serif text-xs font-bold text-dark-brown uppercase tracking-wider">
                💡 Curated Inspiration (Click to search):
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CURATED_CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => handleExecuteSearch(cat.query)}
                  className="px-3.5 py-1.5 rounded-full bg-cream hover:bg-parchment/80 border border-light-brown/40 text-xs font-body font-medium text-dark-brown transition-all hover:scale-105 active:scale-95 shadow-xs"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Librarian Result Card */}
        <AnimatePresence>
          {searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-[#faf6f0] p-8 rounded-3xl border-2 border-[#d4bfab] shadow-2xl relative linen-board"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <WaxSealRose size={48} className="rotate-[-6deg]" />
                  <div>
                    <span className="font-serif text-xs uppercase tracking-widest text-film-orange font-bold">
                      Reminiq Librarian Reflection
                    </span>
                    <h3 className="font-serif text-2xl text-dark-brown font-bold italic mt-0.5">
                      "{searchResult.intro}"
                    </h3>
                  </div>
                </div>
              </div>

              {/* Matched Memory Highlight */}
              {matchingMemory && (
                <div className="mt-6 pt-6 border-t border-dashed border-light-brown/40">
                  <div className="bg-white p-5 rounded-2xl border border-light-brown/30 shadow-md flex flex-col sm:flex-row gap-5 items-center">
                    {matchingMemory.photoUrl ? (
                      <img
                        src={matchingMemory.photoUrl}
                        alt={matchingMemory.title}
                        className="w-full sm:w-48 h-36 object-cover rounded-xl shadow-xs"
                      />
                    ) : (
                      <div className="w-full sm:w-48 h-36 rounded-xl bg-parchment/40 flex items-center justify-center text-light-brown">
                        {matchingMemory.type === 'voice' ? <Mic size={32} /> : matchingMemory.type === 'music' ? <MusicIcon size={32} /> : <Type size={32} />}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-moss/10 text-moss">
                          {matchingMemory.mood}
                        </span>
                        <span className="text-xs font-hand text-brown/70">
                          {new Date(matchingMemory.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-dark-brown text-xl">{matchingMemory.title}</h4>
                      <p className="font-body text-xs text-brown mt-1 line-clamp-3">{matchingMemory.desc}</p>
                      
                      {matchingMemory.location && (
                        <div className="flex items-center gap-1 text-xs text-brown/70 mt-2 font-hand">
                          <MapPin size={12} />
                          {matchingMemory.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-hand text-center">
            {error}
          </div>
        )}

        {/* Browse All Memories with Mood Filters */}
        <div className="pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-serif text-2xl text-dark-brown font-bold italic">
                Vault Memories Archive ({filteredMemories.length})
              </h2>
              <p className="font-hand text-sm text-brown">
                Filter memories by emotional mood or media type
              </p>
            </div>

            {/* Mood Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {MOODS.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMood(m)}
                  className={`px-3 py-1 rounded-full text-xs font-body capitalize transition-all ${
                    selectedMood === m
                      ? 'bg-moss text-white shadow-xs font-semibold'
                      : 'bg-parchment/60 text-dark-brown/70 hover:bg-parchment'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredMemories.map(mem => (
              <motion.div
                key={mem.id}
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => handleExecuteSearch(mem.title)}
                className="bg-white p-4 rounded-2xl border border-light-brown/30 shadow-sm hover:shadow-md cursor-pointer transition-all card-3d-tilt"
              >
                {mem.photoUrl ? (
                  <img src={mem.photoUrl} alt={mem.title} className="w-full h-40 object-cover rounded-xl mb-3" />
                ) : (
                  <div className="w-full h-40 rounded-xl bg-parchment/40 mb-3 flex items-center justify-center text-light-brown">
                    {mem.type === 'voice' ? <Mic size={28} /> : mem.type === 'music' ? <MusicIcon size={28} /> : <Type size={28} />}
                  </div>
                )}

                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-serif font-bold text-dark-brown text-base truncate">{mem.title}</h4>
                  <span className="text-[10px] font-hand px-2 py-0.5 rounded-full bg-light-brown/20 text-dark-brown font-bold uppercase">
                    {mem.mood}
                  </span>
                </div>
                <p className="font-body text-xs text-brown line-clamp-2">{mem.desc}</p>
                <div className="mt-3 pt-2 border-t border-light-brown/20 flex items-center justify-between text-[11px] text-brown/60 font-hand">
                  <span>{new Date(mem.date).toLocaleDateString()}</span>
                  <span className="text-moss font-bold">Search Similar →</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
