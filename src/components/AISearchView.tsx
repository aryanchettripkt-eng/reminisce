import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Sparkles, 
  X, 
  MapPin, 
  RefreshCw,
  Heart,
  Music,
  Camera,
  Coffee,
  Sun,
  CloudRain,
  Moon,
  Utensils,
  Plane,
  Trees,
  Star
} from 'lucide-react';
import { Memory, searchMemories } from '../lib/groq';
import { WaxSealBotanical, BrassPaperClip, GoldPushPin } from './AestheticStickers';

interface AISearchViewProps {
  memories: Memory[];
  onClose: () => void;
}

const CURATED_CATEGORIES = [
  { id: 'c1', label: '🌅 Golden Hour', icon: Sun, query: 'sunset golden hour beaches ocean breeze amber light warm glow' },
  { id: 'c2', label: '🌧️ Rainy Days', icon: CloudRain, query: 'rainy coffee shops warm drinks reading books cozy rain on glass' },
  { id: 'c3', label: '🌙 Night Adventures', icon: Moon, query: 'midnight walks city lights neon quiet streets late evening driving' },
  { id: 'c4', label: '☕ Café Moments', icon: Coffee, query: 'coffee pastries conversations morning latte cortado reading' },
  { id: 'c5', label: '🎵 With Music', icon: Music, query: 'listening to records vinyl soundtrack song concerts acoustic guitar' },
  { id: 'c6', label: '🍽️ Food & Feasts', icon: Utensils, query: 'dinner cooking recipes grandma delicious meals gatherings baking' },
  { id: 'c7', label: '✈️ Travel & Places', icon: Plane, query: 'trips exploring new cities passport wandering landscapes oceans' },
  { id: 'c8', label: '🌲 Nature Walks', icon: Trees, query: 'hiking nature pine trees foggy mornings mountain peaks trail' },
  { id: 'c9', label: '💖 People I Love', icon: Heart, query: 'friends family loved ones laughs smiles holding hands together' },
  { id: 'c10', label: '📍 Memorable Places', icon: MapPin, query: 'special spot hometown old house favorite bench scenic viewpoint' },
  { id: 'c11', label: '📷 Candid Shots', icon: Camera, query: 'unposed moments natural laughs film cameras blurry polaroids raw' },
  { id: 'c12', label: '⭐ Feel-Good', icon: Star, query: 'gratitude simple joys happy sunny days peaceful smiles wholesome' }
];

export default function AISearchView({ memories, onClose }: AISearchViewProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ memories: Memory[]; message: string } | null>(null);
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);

  const handleSearch = async (searchQueryText: string) => {
    if (!searchQueryText.trim()) return;
    setIsSearching(true);
    try {
      const result = await searchMemories(searchQueryText, memories);
      setSearchResults(result);
    } catch (e) {
      console.error('AI search failed', e);
    } finally {
      setIsSearching(false);
    }
  };

  const displayedMemories = (searchResults?.memories || memories).filter(m => {
    if (!selectedMoodFilter) return true;
    return m.mood?.toLowerCase() === selectedMoodFilter.toLowerCase();
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[10000] bg-cream/95 backdrop-blur-xl flex flex-col overflow-hidden"
    >
      <div className="film-grain" />

      {/* Header */}
      <header className="px-6 py-4 border-b border-light-brown/30 bg-warm-white/85 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-moss/20 text-moss flex items-center justify-center shadow-xs">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-dark-brown font-bold italic">
              AI Memory Librarian
            </h1>
            <p className="font-hand text-sm text-brown/70 -mt-0.5">
              Describe a feeling, lighting, or specific memory in natural language
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-parchment/80 border border-light-brown/40 flex items-center justify-center text-dark-brown hover:bg-brown/10 transition-transform active:scale-95 shadow-sm"
        >
          <X size={18} />
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-5xl mx-auto w-full z-10 custom-scrollbar">
        
        {/* Notebook-lined Search Bar */}
        <div className="mb-6">
          <div className="relative flex items-center bg-white rounded-2xl border-2 border-light-brown/40 shadow-lg p-2 focus-within:border-moss transition-colors">
            <Search className="text-brown/40 ml-3 flex-shrink-0" size={22} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="Ask the AI librarian: 'Find quiet rainy afternoons with coffee', 'photos by the sea'..."
              className="w-full px-4 py-2 font-body text-base text-dark-brown bg-transparent focus:outline-none placeholder:text-brown/40 placeholder:font-hand placeholder:text-lg"
            />
            <button
              onClick={() => handleSearch(query)}
              disabled={isSearching || !query.trim()}
              className="btn-aesthetic-primary whitespace-nowrap"
            >
              {isSearching ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span>{isSearching ? 'Searching...' : 'Search'}</span>
            </button>
          </div>
        </div>

        {/* 12 Curated Category Inspiration Chips */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-hand text-xs uppercase tracking-widest text-brown/70 font-bold">
              12 Curated Memory Inquiries:
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {CURATED_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setQuery(cat.label);
                    handleSearch(cat.query);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/70 hover:bg-white border border-light-brown/40 text-dark-brown font-hand text-sm transition-all hover:scale-[1.03] active:scale-95 shadow-xs flex items-center gap-2 text-left"
                >
                  <Icon size={14} className="text-moss flex-shrink-0" />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Librarian Response Card */}
        {searchResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-3xl bg-warm-white border border-light-brown/40 shadow-md relative overflow-hidden"
          >
            <div className="absolute top-3 right-4 opacity-70">
              <WaxSealBotanical size={40} />
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="text-moss flex-shrink-0 mt-1" size={20} />
              <div>
                <h4 className="font-serif font-bold text-dark-brown text-lg italic">
                  Librarian's Note
                </h4>
                <p className="font-hand text-base text-brown mt-1 leading-relaxed">
                  "{searchResults.message}"
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Polaroid Gallery */}
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-light-brown/30">
            <h3 className="font-serif text-xl font-bold text-dark-brown italic">
              {searchResults ? `Found Moments (${displayedMemories.length})` : `All Vault Memories (${displayedMemories.length})`}
            </h3>

            {/* Mood Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['All', 'Joy', 'Nostalgic', 'Peaceful', 'Bittersweet'].map((mood) => {
                const isSelected = (!selectedMoodFilter && mood === 'All') || selectedMoodFilter?.toLowerCase() === mood.toLowerCase();

                return (
                  <button
                    key={mood}
                    onClick={() => setSelectedMoodFilter(mood === 'All' ? null : mood)}
                    className={`px-3 py-1 rounded-full text-xs font-hand transition-all ${
                      isSelected
                        ? 'bg-moss text-cream font-bold shadow-xs'
                        : 'bg-parchment/60 text-brown hover:bg-parchment'
                    }`}
                  >
                    {mood}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {displayedMemories.map((mem, idx) => (
              <motion.div
                key={mem.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -6, scale: 1.02, rotate: (idx % 2 === 0 ? 1 : -1) }}
                className="bg-white p-4 rounded-2xl border border-light-brown/40 shadow-md flex flex-col justify-between relative group"
              >
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 pointer-events-none z-10">
                  <GoldPushPin size={20} />
                </div>

                {mem.photoUrl ? (
                  <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-parchment/30 border border-light-brown/20 relative shadow-inner">
                    <img src={mem.photoUrl} alt={mem.title} className="w-full h-full object-cover" />
                    {mem.emotion && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-hand">
                        ✦ {mem.emotion}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-parchment/30 rounded-xl mb-3 border border-light-brown/20">
                    <p className="font-hand text-sm text-brown line-clamp-3 italic">
                      "{mem.desc}"
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-serif font-bold text-dark-brown text-base truncate">{mem.title}</h4>
                  <div className="flex items-center justify-between text-xs font-hand text-brown/70 mt-1">
                    <span>{new Date(mem.date).toLocaleDateString()}</span>
                    {mem.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={10} /> {mem.location}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
