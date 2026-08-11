import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Plus, 
  MapPin, 
  Folder, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Trash2, 
  Camera, 
  Mic, 
  Type, 
  Music as MusicIcon,
  Tag
} from 'lucide-react';
import { Memory, DayReaction } from '../lib/groq';
import { 
  ALL_STICKERS, 
  RibbonBowPink, 
  RibbonBowSage, 
  WaxSealRose, 
  WaxSealBotanical, 
  CoffeeLatteCup, 
  DriedPressedFlower, 
  WashiTapeRemember, 
  WashiTapeGoldenHour, 
  GoldPushPin, 
  BrassPaperClip 
} from './AestheticStickers';

interface MonthlyPinboardProps {
  memories: Memory[];
  dayReactions: DayReaction[];
  onUpdateDayReaction: (date: string, data: Partial<DayReaction>) => void;
  onClose: () => void;
  onAddMemoryAtDate: (date: string) => void;
  onDeleteMemory: (memoryId: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_PALETTES = [
  '#d6e4e5', '#f3d5dc', '#d4e2d4', '#faebd7', '#fce1e4', '#d8e2dc',
  '#ffe5d9', '#ffcad4', '#b5ead7', '#e2ece9', '#e8d890', '#c9c9ee'
];

// Sample handwritten event labels matching reference photo 3
const SAMPLE_NOTES: Record<string, string> = {
  '12': 'Stagiaire 🖋️',
  '15': 'Late night walk 🌙',
  '24': 'Thanksgiving 🍂',
  '28': 'Road trip 🚗',
  '05': 'Coffee date ☕',
  '18': 'Vinyl hunting 🎵',
  '08': 'Rainy afternoon 🌧️'
};

export default function MonthlyPinboard({
  memories,
  dayReactions,
  onUpdateDayReaction,
  onClose,
  onAddMemoryAtDate,
  onDeleteMemory
}: MonthlyPinboardProps) {
  const [selectedYear, setSelectedYear] = useState(2023);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(10); // November by default
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'pinboard' | 'gallery'>('pinboard');
  const [placedStickers, setPlacedStickers] = useState<Record<string, string[]>>({});
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
  const [activeStickerToPlace, setActiveStickerToPlace] = useState<string | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const totalDays = daysInMonth(selectedYear, selectedMonthIndex);
  const startOffset = firstDayOfMonth(selectedYear, selectedMonthIndex);
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: startOffset }, (_, i) => i);

  const getDayString = (day: number) => {
    const m = String(selectedMonthIndex + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${selectedYear}-${m}-${d}`;
  };

  const getMemoriesForDay = (day: number) => {
    const dayStr = getDayString(day);
    return memories.filter(m => m.date.startsWith(dayStr));
  };

  const getReactionForDay = (day: number) => {
    const dayStr = getDayString(day);
    return dayReactions.find(r => r.date === dayStr)?.emoji;
  };

  const getMemoriesForCurrentMonth = () => {
    const mStr = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}`;
    return memories.filter(m => m.date.startsWith(mStr));
  };

  const monthMemories = getMemoriesForCurrentMonth();

  const handleDayClick = (day: number) => {
    if (activeStickerToPlace) {
      const dayKey = getDayString(day);
      setPlacedStickers(prev => ({
        ...prev,
        [dayKey]: [...(prev[dayKey] || []), activeStickerToPlace]
      }));
      setActiveStickerToPlace(null);
      return;
    }
    setSelectedDay(selectedDay === day ? null : day);
  };

  const selectedDateStr = selectedDay ? getDayString(selectedDay) : '';
  const selectedDayMemories = selectedDay ? getMemoriesForDay(selectedDay) : [];

  const commonEmojis = ['✨', '❤️', '🌙', '🍃', '🌊', '🕯️', '🎞️', '☕', '🍂', '🌸'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-cream/95 backdrop-blur-xl flex flex-col overflow-hidden"
    >
      {/* Film grain */}
      <div className="film-grain" />

      {/* Top Header Bar */}
      <header className="px-6 py-4 border-b border-light-brown/30 bg-warm-white/80 backdrop-blur-md flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-moss text-cream flex items-center justify-center shadow-md">
            <Folder size={20} />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-dark-brown font-semibold tracking-tight">
              Monthly Journal & Pinboard
            </h1>
            <p className="font-hand text-sm text-brown -mt-0.5">
              Curated folders with pinned polaroids & handwritten notes
            </p>
          </div>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-parchment/60 p-1 rounded-full border border-light-brown/30">
            <button
              onClick={() => setActiveTab('pinboard')}
              className={`px-4 py-1.5 rounded-full font-body text-xs font-semibold transition-all ${
                activeTab === 'pinboard'
                  ? 'bg-moss text-white shadow-sm'
                  : 'text-dark-brown/70 hover:text-dark-brown'
              }`}
            >
              📌 Pinboard Grid
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-1.5 rounded-full font-body text-xs font-semibold transition-all ${
                activeTab === 'gallery'
                  ? 'bg-moss text-white shadow-sm'
                  : 'text-dark-brown/70 hover:text-dark-brown'
              }`}
            >
              🎞️ Photo Reel ({monthMemories.length})
            </button>
          </div>

          <button
            onClick={() => setIsStickerDrawerOpen(!isStickerDrawerOpen)}
            className={`btn-aesthetic ${isStickerDrawerOpen ? 'border-moss text-moss' : ''}`}
            title="Open Cute Sticker Drawer"
          >
            🎀 Cute Stickers
          </button>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-parchment/80 border border-light-brown/40 flex items-center justify-center text-dark-brown hover:bg-brown/10 transition-transform active:scale-95 shadow-sm"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Month Folders Selector Bar */}
      <div className="px-6 pt-3 pb-1 bg-parchment/40 border-b border-light-brown/20 overflow-x-auto no-scrollbar flex items-center gap-2 flex-shrink-0 z-10">
        <div className="flex items-center gap-2 mr-3 bg-white/70 px-3 py-1.5 rounded-lg border border-light-brown/30">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="text-brown hover:text-dark-brown p-1"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-serif font-bold text-dark-brown text-sm px-1">
            {selectedYear}
          </span>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            className="text-brown hover:text-dark-brown p-1"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {MONTH_NAMES.map((name, idx) => {
          const isSelected = selectedMonthIndex === idx;
          const mPrefix = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
          const count = memories.filter(m => m.date.startsWith(mPrefix)).length;

          return (
            <button
              key={name}
              onClick={() => {
                setSelectedMonthIndex(idx);
                setSelectedDay(null);
              }}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-t-xl transition-all duration-300 flex-shrink-0 border-t border-x ${
                isSelected
                  ? 'bg-cream text-dark-brown font-semibold shadow-md -mb-1 pb-3 border-light-brown/60 z-10'
                  : 'bg-warm-white/70 text-brown/70 hover:bg-warm-white hover:text-dark-brown border-light-brown/30'
              }`}
              style={{
                borderTopColor: isSelected ? '#7a5e45' : undefined,
                borderTopWidth: isSelected ? '3px' : '1px'
              }}
            >
              <span className="font-serif text-sm tracking-wide">{name}</span>
              {count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-moss text-white' : 'bg-light-brown/30 text-dark-brown'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area: Pinboard vs Gallery */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex gap-6 relative">
        {/* Left / Main Board */}
        <div className="flex-1 flex flex-col items-center">
          {activeTab === 'pinboard' ? (
            /* Aesthetic Cork / Linen Pinboard */
            <div className="w-full max-w-6xl rounded-3xl p-6 sm:p-8 md:p-10 linen-board border-8 border-[#cbb399] shadow-2xl relative">
              {/* Board Corner Brass Brackets */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#8c6d4e]" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#8c6d4e]" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#8c6d4e]" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#8c6d4e]" />

              {/* Decorative Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between pb-6 mb-8 border-b-2 border-dashed border-[#d4bfab]/80">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-serif text-4xl sm:text-5xl text-dark-brown font-bold italic tracking-tight">
                      {MONTH_NAMES[selectedMonthIndex]}
                    </h2>
                    <span className="text-3xl text-film-orange font-bold font-hand rotate-[-6deg]">
                      '{String(selectedYear).slice(2)}
                    </span>
                  </div>
                  <p className="font-hand text-xl text-[#7a5e45] mt-1">
                    {monthMemories.length} moments saved to this corkboard
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                  <RibbonBowPink size={52} className="rotate-[-8deg]" />
                  <WaxSealBotanical size={48} className="rotate-[12deg]" />
                  <WashiTapeGoldenHour size={100} className="rotate-[-4deg]" />
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-4 text-center font-serif text-xs sm:text-sm font-semibold tracking-widest text-[#7a5e45] uppercase">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Calendar Grid Tiles */}
              <div className="grid grid-cols-7 gap-2 sm:gap-4">
                {blanksArray.map(i => (
                  <div key={`blank-${i}`} className="min-h-[90px] sm:min-h-[120px] rounded-xl opacity-20 border border-dashed border-light-brown/30" />
                ))}

                {daysArray.map(day => {
                  const dayMems = getMemoriesForDay(day);
                  const dayReaction = getReactionForDay(day);
                  const isSelected = selectedDay === day;
                  const firstPhotoMem = dayMems.find(m => m.photoUrl);
                  const dayKey = getDayString(day);
                  const stickersForThisDay = placedStickers[dayKey] || [];
                  const sampleNote = SAMPLE_NOTES[String(day).padStart(2, '0')];

                  return (
                    <motion.div
                      key={`day-${day}`}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleDayClick(day)}
                      className={`relative min-h-[95px] sm:min-h-[135px] p-2 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-visible ${
                        isSelected
                          ? 'bg-white shadow-xl border-moss ring-2 ring-moss/30 z-20'
                          : dayMems.length > 0
                          ? 'bg-[#fcfaf7] hover:bg-white shadow-md border-light-brown/50 hover:shadow-lg'
                          : 'bg-warm-white/60 hover:bg-white/90 border-light-brown/25'
                      }`}
                    >
                      {/* Top Row: Date Number & Reaction */}
                      <div className="flex items-center justify-between">
                        <span className={`font-serif text-sm sm:text-base font-bold ${
                          dayMems.length > 0 ? 'text-dark-brown' : 'text-brown/60'
                        }`}>
                          {day}
                        </span>

                        {dayReaction && (
                          <span className="text-base" title="Mood for the day">
                            {dayReaction}
                          </span>
                        )}
                      </div>

                      {/* Attached Polaroid Thumbnail if photo memory exists */}
                      {firstPhotoMem ? (
                        <div className="my-1 relative group">
                          {/* Brass Paperclip */}
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                            <BrassPaperClip size={24} />
                          </div>

                          {/* Mini Polaroid Frame */}
                          <div className="bg-white p-1 pb-3 rounded shadow-md border border-light-brown/30 transform rotate-[-2deg] group-hover:rotate-0 transition-transform">
                            <img
                              src={firstPhotoMem.photoUrl}
                              alt={firstPhotoMem.title}
                              className="w-full h-12 sm:h-16 object-cover rounded-xs"
                            />
                            <p className="font-hand text-[10px] text-dark-brown truncate mt-0.5 px-0.5">
                              {firstPhotoMem.title}
                            </p>
                          </div>
                        </div>
                      ) : dayMems.length > 0 ? (
                        /* Text/Voice/Music Note Sticker */
                        <div className="my-1 bg-[#fff8db] p-1.5 rounded-sm border border-[#e8d890] shadow-xs rotate-[1deg]">
                          <div className="flex items-center gap-1 text-[11px] font-hand text-dark-brown font-bold truncate">
                            {dayMems[0].type === 'voice' && <Mic size={10} />}
                            {dayMems[0].type === 'music' && <MusicIcon size={10} />}
                            {dayMems[0].type === 'text' && <Type size={10} />}
                            <span className="truncate">{dayMems[0].title}</span>
                          </div>
                        </div>
                      ) : sampleNote ? (
                        /* Cute script note for calendar vibes */
                        <div className="my-auto">
                          <p className="font-hand text-xs text-moss font-bold leading-tight rotate-[-3deg] opacity-80">
                            {sampleNote}
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-[11px] font-hand text-brown/60">+ add memory</span>
                        </div>
                      )}

                      {/* Stamped Stickers on this day */}
                      {stickersForThisDay.length > 0 && (
                        <div className="absolute -bottom-2 -right-2 z-10 pointer-events-none">
                          <RibbonBowPink size={28} />
                        </div>
                      )}

                      {/* Footer Badge Count */}
                      {dayMems.length > 1 && (
                        <div className="text-right">
                          <span className="text-[9px] font-body bg-light-brown/20 text-dark-brown px-1.5 py-0.5 rounded-full font-bold">
                            +{dayMems.length - 1} more
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Aesthetic Photo Gallery View */
            <div className="w-full max-w-6xl space-y-6">
              <div className="flex items-center justify-between bg-warm-white/90 p-6 rounded-3xl border border-light-brown/30 shadow-sm">
                <div>
                  <h2 className="font-serif text-3xl text-dark-brown font-bold italic">
                    {MONTH_NAMES[selectedMonthIndex]} {selectedYear} Gallery
                  </h2>
                  <p className="font-hand text-lg text-brown">
                    Showing all {monthMemories.length} captured moments for this month
                  </p>
                </div>
                <button
                  onClick={() => onAddMemoryAtDate(getDayString(1))}
                  className="btn-aesthetic-primary"
                >
                  <Plus size={16} />
                  Add New Moment
                </button>
              </div>

              {monthMemories.length === 0 ? (
                <div className="p-16 text-center bg-white/60 rounded-3xl border border-dashed border-light-brown/40">
                  <Camera size={48} className="mx-auto text-light-brown mb-3 opacity-60" />
                  <h3 className="font-serif text-xl text-dark-brown font-semibold">No memories in this month yet</h3>
                  <p className="font-hand text-base text-brown mt-1 mb-4">Click any date on the pinboard to attach your photos!</p>
                  <button
                    onClick={() => setActiveTab('pinboard')}
                    className="btn-aesthetic"
                  >
                    Return to Pinboard
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {monthMemories.map(mem => (
                    <motion.div
                      key={mem.id}
                      whileHover={{ scale: 1.03, rotate: 1 }}
                      className="bg-white p-4 pb-6 rounded-2xl border border-light-brown/30 shadow-md card-3d-tilt flex flex-col justify-between"
                    >
                      {mem.photoUrl ? (
                        <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-light-brown/20">
                          <img src={mem.photoUrl} alt={mem.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-[4/3] rounded-xl bg-parchment/40 mb-3 flex items-center justify-center border border-light-brown/20 text-light-brown">
                          {mem.type === 'voice' ? <Mic size={32} /> : mem.type === 'music' ? <MusicIcon size={32} /> : <Type size={32} />}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-serif font-bold text-dark-brown text-lg truncate">{mem.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-moss/10 text-moss font-bold uppercase">{mem.mood}</span>
                        </div>
                        <p className="font-body text-xs text-brown line-clamp-2">{mem.desc}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-light-brown/20 flex items-center justify-between text-[11px] text-brown/70 font-hand">
                        <span>{new Date(mem.date).toLocaleDateString()}</span>
                        {mem.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {mem.location}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Drawer: Day Detail & Quick Memory Inspector */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="w-80 md:w-96 bg-white/95 rounded-3xl p-6 border border-light-brown/40 shadow-2xl backdrop-blur-xl flex flex-col flex-shrink-0 z-30"
            >
              <div className="flex items-center justify-between pb-4 border-b border-light-brown/20">
                <div>
                  <span className="font-serif text-2xl font-bold text-dark-brown">
                    {MONTH_NAMES[selectedMonthIndex]} {selectedDay}, {selectedYear}
                  </span>
                  <p className="font-hand text-sm text-brown">
                    {selectedDayMemories.length} moment{selectedDayMemories.length === 1 ? '' : 's'} on this day
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-2 rounded-full hover:bg-parchment/60 text-dark-brown"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Day Mood Selector */}
              <div className="my-4">
                <label className="font-serif text-xs font-semibold text-dark-brown uppercase tracking-wider block mb-2">
                  Daily Vibe / Reaction
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {commonEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => onUpdateDayReaction(selectedDateStr, { emoji })}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-transform hover:scale-110 ${
                        getReactionForDay(selectedDay) === emoji
                          ? 'bg-moss/20 ring-2 ring-moss scale-110 shadow-xs'
                          : 'bg-parchment/40 hover:bg-parchment'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Memories List */}
              <div className="flex-1 overflow-y-auto space-y-4 my-2 pr-1">
                {selectedDayMemories.length === 0 ? (
                  <div className="text-center py-10 bg-warm-white/60 rounded-2xl border border-dashed border-light-brown/30">
                    <p className="font-hand text-lg text-brown mb-2">No moments on this date yet.</p>
                    <button
                      onClick={() => onAddMemoryAtDate(selectedDateStr)}
                      className="btn-aesthetic-primary text-xs"
                    >
                      <Plus size={14} />
                      Add Moment Now
                    </button>
                  </div>
                ) : (
                  selectedDayMemories.map(mem => (
                    <div key={mem.id} className="bg-cream/50 p-3.5 rounded-2xl border border-light-brown/30 relative group">
                      {mem.photoUrl && (
                        <img
                          src={mem.photoUrl}
                          alt={mem.title}
                          className="w-full h-32 object-cover rounded-xl mb-2"
                        />
                      )}
                      <h4 className="font-serif font-bold text-dark-brown text-base">{mem.title}</h4>
                      <p className="font-body text-xs text-brown mt-0.5">{mem.desc}</p>
                      
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-light-brown/20 text-xs">
                        <span className="font-hand text-moss font-bold">{mem.mood}</span>
                        <button
                          onClick={() => onDeleteMemory(mem.id)}
                          className="text-red-700 hover:text-red-900 opacity-60 hover:opacity-100 p-1"
                          title="Delete memory"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Memory Button on Date */}
              <button
                onClick={() => onAddMemoryAtDate(selectedDateStr)}
                className="w-full btn-aesthetic-primary mt-2"
              >
                <Plus size={16} />
                Pin New Memory Here
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticker Palette Drawer */}
        <AnimatePresence>
          {isStickerDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl p-4 rounded-3xl border border-light-brown/40 shadow-2xl z-40 max-w-2xl w-[90%]"
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-light-brown/20">
                <span className="font-serif text-sm font-bold text-dark-brown">
                  🎨 Cute Aesthetic Stickers (Click a sticker, then click any day on the pinboard)
                </span>
                <button
                  onClick={() => setIsStickerDrawerOpen(false)}
                  className="text-dark-brown p-1 hover:bg-parchment/40 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-48 overflow-y-auto p-1">
                {ALL_STICKERS.map(sticker => {
                  const Comp = sticker.component;
                  const isSelected = activeStickerToPlace === sticker.id;

                  return (
                    <button
                      key={sticker.id}
                      onClick={() => setActiveStickerToPlace(sticker.id)}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-moss/20 ring-2 ring-moss scale-105 shadow-md'
                          : 'bg-warm-white hover:bg-cream/80'
                      }`}
                    >
                      <Comp size={40} />
                      <span className="text-[10px] font-hand text-dark-brown font-bold truncate mt-1">
                        {sticker.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
