import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Sparkles, 
  X, 
  RefreshCw, 
  MapPin, 
  Music as MusicIcon, 
  Clock, 
  Heart,
  Tag,
  ArrowRight
} from 'lucide-react';
import { Memory, searchMemories } from '../lib/groq';
import { 
  WashiTapeRemember, 
  WashiTapeGoldenHour, 
  WaxSealBotanical, 
  BrassPaperClip,
  RibbonBowSage 
} from './AestheticStickers';

interface AISearchProps {
  memories: Memory[];
  onClose: () => void;
  onSelectMemory?: (memory: Memory) => void;
}

const CURATED_CATEGORIES = [
  { id: 'cat-1', emoji: '🌅', label: 'Golden Hour', query: 'sunset golden hour warm amber sunlight afternoon glow' },
  { id: 'cat-2', emoji: '🌧️', label: 'Rainy Days', query: 'rain storm rainy cozy tea coffee sound on window' },
  { id: 'cat-3', emoji: '🌙', label: 'Night Adventures', query: 'night midnight city lights late drive stars evening' },
  { id: 'cat-4', emoji: '☕', label: 'Café Moments', query: 'coffee cafe espresso latte reading bookstore bakery' },
  { id: 'cat-5', emoji: '🎵', label: 'With Music', query: 'listening to records vinyl singing concert headphones' },
  { id: 'cat-6', emoji: '🍽️', label: 'Food & Feasts', query: 'cooking dinner recipe family meal restaurant sweet treats' },
  { id: 'cat-7', emoji: '✈️', label: 'Travel & Places', query: 'travel road trip airport new city exploring vacation' },
  { id: 'cat-8', emoji: '🌲', label: 'Nature Walks', query: 'hiking trees forest mountains lake trail flowers' },
  { id: 'cat-9', emoji: '💖', label: 'People I Love', query: 'friends family partner smiling together hugs laughter' },
  { id: 'cat-10', emoji: '📍', label: 'Memorable Places', query: 'favorite spots old house courtyard park beach' },
  { id: 'cat-11', emoji: '📷', label: 'Candid Shots', query: 'unposed moments film snapshot authentic laughter smile' },
  { id: 'cat-12', emoji: '⭐', label: 'Feel-Good', query: 'peaceful joy gratitude simple happiness sunny morning' }
];

export default function AISearch({ memories, onClose, onSelectMemory }: AISearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ memories: Memory[]; message: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleSearch = async (text: string, categoryLabel?: string) => {
    if (!text.trim()) return;
    setIsSearching(true);
    if (categoryLabel) setActiveCategory(categoryLabel);
    try {
      const result = await searchMemories(text, memories);
      setSearchResults(result);
    } catch (err) {
      console.error('Groq AI Search Error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const displayedMemories = searchResults ? searchResults.memories : memories;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.97, filter: 'blur(8px)' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[10000] bg-[#f7f2e7]/95 backdrop-blur-2xl flex flex-col overflow-hidden text-[#2c241e]"
    >
      <div className="film-grain" />

      {/* Header */}
      <header className="px-6 sm:px-10 py-5 border-b border-[#c4ab91]/30 bg-white/80 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-moss/20 text-moss flex items-center justify-center shadow-xs">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-dark-brown font-bold italic">
              AI Memory Search
            </h1>
            <p className="font-hand text-sm text-brown/80 -mt-0.5">
              Describe a sensation, weather, or half-remembered emotion
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[#eae0ce] border border-[#c4ab91]/40 flex items-center justify-center text-dark-brown hover:bg-[#c4ab91]/30 transition-transform active:scale-95 shadow-xs"
        >
          <X size={20} />
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 max-w-6xl mx-auto w-full z-10 space-y-8">
        
        {/* Notebook-Lined Natural Language Search Bar */}
        <div className="bg-white rounded-3xl border-2 border-[#c4ab91]/50 shadow-xl p-4 sm:p-6 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <Search className="text-moss flex-shrink-0 mt-2" size={24} />
            <div className="flex-1 min-w-0">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch(query);
                  }
                }}
                rows={2}
                placeholder="Describe your memory... e.g. 'rainy coffee morning with Bill Evans record' or 'sunsets by the beach with orange clouds'"
                className="w-full bg-transparent font-hand text-xl text-dark-brown placeholder:text-brown/40 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#c4ab91]/20 flex items-center justify-between gap-4">
            <span className="font-hand text-xs text-brown/60 hidden sm:inline">
              Powered by Groq LPUs & Llama 3.3 Semantic Search
            </span>
            <button
              onClick={() => handleSearch(query)}
              disabled={isSearching || !query.trim()}
              className="btn-aesthetic-primary py-2 px-6 ml-auto"
            >
              {isSearching ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
              <span>{isSearching ? 'Librarian is Searching...' : 'Search Vault'}</span>
            </button>
          </div>
        </div>

        {/* 12 Curated Browse Categories */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-serif text-sm font-bold uppercase tracking-widest text-brown/80">
              Curated Mood Inquiries:
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {CURATED_CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.label;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setQuery(cat.label);
                    handleSearch(cat.query, cat.label);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all hover:scale-105 active:scale-95 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-moss text-white border-moss shadow-md ring-2 ring-moss/30'
                      : 'bg-white/80 hover:bg-white border-[#c4ab91]/40 text-dark-brown shadow-xs'
                  }`}
                >
                  <span className="text-xl mb-1">{cat.emoji}</span>
                  <span className="font-serif text-xs font-bold truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Librarian Reflection Note */}
        {searchResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-white border border-[#c4ab91]/40 shadow-md relative overflow-hidden"
          >
            <div className="absolute top-3 right-4 opacity-75 hidden sm:block">
              <WaxSealBotanical size={42} />
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="text-moss flex-shrink-0 mt-1" size={20} />
              <div>
                <h4 className="font-serif font-bold text-dark-brown text-base italic">
                  Librarian's Memory Note:
                </h4>
                <p className="font-hand text-lg text-brown mt-1 leading-relaxed">
                  "{searchResults.message}"
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Polaroid Memory Results Grid */}
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#c4ab91]/30">
            <h3 className="font-serif text-xl font-bold text-dark-brown italic">
              {searchResults ? `Found Moments (${displayedMemories.length})` : `All Moments (${displayedMemories.length})`}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-12">
            {displayedMemories.map((mem, idx) => (
              <motion.div
                key={mem.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => onSelectMemory?.(mem)}
                className="bg-white p-4 pb-5 rounded-2xl border border-[#c4ab91]/40 shadow-md relative polaroid-shadow cursor-pointer group"
              >
                {/* Washi tape accent */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rotate-1 pointer-events-none">
                  {idx % 2 === 0 ? <WashiTapeRemember size={70} /> : <WashiTapeGoldenHour size={70} />}
                </div>

                {mem.photoUrl ? (
                  <div className="aspect-[4/3] rounded-xl overflow-hidden mt-2 mb-3 bg-[#eae0ce]/30 border border-[#c4ab91]/20 relative shadow-inner">
                    <img src={mem.photoUrl} alt={mem.title} className="w-full h-full object-cover" />
                    {mem.emotion && (
                      <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-hand">
                        ✦ {mem.emotion}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-6 mt-2 bg-[#eae0ce]/30 rounded-xl mb-3 border border-[#c4ab91]/20">
                    <p className="font-hand text-base text-brown line-clamp-3 italic">
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
