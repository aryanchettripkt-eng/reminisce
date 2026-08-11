import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Plus, 
  Image as ImageIcon, 
  Heart, 
  Trash2, 
  Grid, 
  Folder 
} from 'lucide-react';
import { Memory, DayReaction } from '../lib/groq';
import { 
  RibbonBowPink, 
  RibbonBowSage, 
  WaxSealRose, 
  WaxSealBotanical, 
  CoffeeLatteCup, 
  DriedPressedFlower, 
  WashiTapeRemember, 
  WashiTapeGoldenHour, 
  WashiTapeCherish, 
  GoldPushPin, 
  BrassPaperClip, 
  AirmailStamp, 
  PastelHeartPink 
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

const MONTH_SUBTITLES = [
  'Winter Frost & Fresh Pages',
  'Rosewater & Quiet Love',
  'First Petals & Morning Rain',
  'Soft Green Shoots & Sunbeams',
  'Warm Breezes & Blooming Lilacs',
  'Golden Afternoons & Strawberries',
  'Midsummer Light & Distant Waves',
  'Harvest Glow & Amber Dusks',
  'First Autumn Leaf & Hot Tea',
  'Spiced Cider & Cinnamon Mist',
  'Cozy Cardigans & Starlight',
  'Hearthfires & Velvet Memories'
];

export default function MonthlyPinboard({
  memories,
  dayReactions,
  onUpdateDayReaction,
  onClose,
  onAddMemoryAtDate,
  onDeleteMemory,
}: MonthlyPinboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeFolderIndex, setActiveFolderIndex] = useState(new Date().getMonth());
  const [viewMode, setViewMode] = useState<'pinboard' | 'gallery'>('pinboard');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = activeFolderIndex;

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthMemories = useMemo(() => {
    return memories.filter(m => {
      const d = new Date(m.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [memories, year, month]);

  const getMemoriesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return memories.filter(m => m.date.startsWith(dateStr));
  };

  const getDayReaction = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dayReactions.find(r => r.date === dateStr);
  };

  const daysWithPhotosCount = useMemo(() => {
    const days = new Set<number>();
    monthMemories.forEach(m => {
      if (m.photoUrl) {
        days.add(new Date(m.date).getDate());
      }
    });
    return days.size;
  }, [monthMemories]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-cream/95 backdrop-blur-xl flex flex-col overflow-hidden"
    >
      <div className="film-grain" />

      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-light-brown/30 bg-warm-white/80 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-moss" size={24} />
            <h1 className="font-serif text-2xl sm:text-3xl text-dark-brown font-bold italic">
              {MONTH_NAMES[month]} {year}
            </h1>
          </div>
          <span className="hidden sm:inline-block font-hand text-base text-brown/70 bg-parchment/60 px-3 py-1 rounded-full border border-light-brown/20">
            {MONTH_SUBTITLES[month]}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-parchment/60 p-1 rounded-full border border-light-brown/30">
            <button
              onClick={() => setViewMode('pinboard')}
              className={`px-3 py-1 rounded-full font-hand text-sm flex items-center gap-1.5 transition-all ${
                viewMode === 'pinboard' ? 'bg-brown text-cream shadow-xs' : 'text-brown hover:bg-brown/10'
              }`}
            >
              <Grid size={14} /> Pinboard
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-3 py-1 rounded-full font-hand text-sm flex items-center gap-1.5 transition-all ${
                viewMode === 'gallery' ? 'bg-brown text-cream shadow-xs' : 'text-brown hover:bg-brown/10'
              }`}
            >
              <ImageIcon size={14} /> Photo Reel ({monthMemories.length})
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-parchment/80 border border-light-brown/40 flex items-center justify-center text-dark-brown hover:bg-brown/10 transition-transform active:scale-95 shadow-sm"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Connected 12-Month Folders Bar */}
      <div className="bg-[#e8decb] border-b border-light-brown/40 px-4 py-2 flex gap-1.5 overflow-x-auto custom-scrollbar flex-shrink-0 z-10">
        {MONTH_NAMES.map((name, idx) => {
          const isActive = idx === month;
          const monthCount = memories.filter(m => {
            const d = new Date(m.date);
            return d.getFullYear() === year && d.getMonth() === idx;
          }).length;

          return (
            <button
              key={name}
              onClick={() => {
                setActiveFolderIndex(idx);
                setSelectedDay(null);
              }}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-t-xl font-hand text-sm transition-all relative flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#f6efe2] text-dark-brown font-bold border-t-2 border-x-2 border-light-brown shadow-sm -mb-2.5 pb-3.5 z-10'
                  : 'bg-parchment/60 text-brown/80 hover:bg-parchment border-t border-x border-transparent hover:border-light-brown/30'
              }`}
            >
              <Folder size={13} className={isActive ? 'text-moss' : 'text-brown/50'} />
              <span>{name.slice(0, 3)}</span>
              {monthCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-moss/20 text-moss text-[10px] flex items-center justify-center font-body font-bold">
                  {monthCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Board Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 linen-board relative">
        
        {/* Floating Aesthetic Stickers on the Board */}
        <div className="absolute top-4 left-6 pointer-events-none opacity-85 hidden md:block">
          <RibbonBowPink size={56} />
        </div>
        <div className="absolute top-6 right-8 pointer-events-none opacity-80 hidden md:block">
          <AirmailStamp size={54} />
        </div>
        <div className="absolute bottom-6 left-12 pointer-events-none opacity-80 hidden md:block">
          <DriedPressedFlower size={58} />
        </div>
        <div className="absolute bottom-8 right-16 pointer-events-none opacity-85 hidden md:block">
          <WaxSealRose size={48} />
        </div>

        <div className="max-w-6xl mx-auto">
          
          {viewMode === 'pinboard' ? (
            <div>
              {/* Day Header Row */}
              <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-2 text-center font-serif text-xs font-bold text-dark-brown/70 tracking-wider uppercase">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-2 sm:gap-3.5">
                {/* Empty filler cells before 1st of the month */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[105px] sm:min-h-[135px] rounded-2xl bg-black/[0.02] border border-dashed border-light-brown/20 opacity-40"
                  />
                ))}

                {/* Actual Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayMems = getMemoriesForDay(dayNum);
                  const reaction = getDayReaction(dayNum);
                  const firstPhotoMem = dayMems.find(m => m.photoUrl);
                  const isSelected = selectedDay === dayNum;

                  return (
                    <motion.div
                      key={dayNum}
                      whileHover={{ y: -3, scale: 1.02 }}
                      onClick={() => setSelectedDay(dayNum)}
                      className={`min-h-[110px] sm:min-h-[145px] p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-white border-moss shadow-xl ring-2 ring-moss/30'
                          : 'bg-white/85 hover:bg-white border-light-brown/40 shadow-sm'
                      }`}
                    >
                      {/* Day Number & Emoji / Pin */}
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-sm sm:text-base font-bold text-dark-brown">
                          {dayNum}
                        </span>

                        <div className="flex items-center gap-1">
                          {reaction?.emoji && (
                            <span className="text-xs">{reaction.emoji}</span>
                          )}
                          {dayMems.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                          )}
                        </div>
                      </div>

                      {/* Attached Polaroid on date */}
                      {firstPhotoMem?.photoUrl ? (
                        <div className="my-1 aspect-square rounded-lg overflow-hidden bg-parchment/30 border border-light-brown/40 relative shadow-xs group-hover:shadow-md transition-shadow">
                          <img
                            src={firstPhotoMem.photoUrl}
                            alt={firstPhotoMem.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-0 right-1 pointer-events-none">
                            <BrassPaperClip size={18} />
                          </div>
                          {dayMems.length > 1 && (
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[9px] font-hand">
                              +{dayMems.length - 1}
                            </span>
                          )}
                        </div>
                      ) : dayMems.length > 0 ? (
                        <div className="my-1 p-1.5 rounded-lg bg-parchment/40 border border-light-brown/20 text-left">
                          <p className="font-hand text-xs text-dark-brown font-bold truncate">
                            {dayMems[0].title}
                          </p>
                          <p className="font-hand text-[10px] text-brown/70 line-clamp-1">
                            {dayMems[0].desc}
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddMemoryAtDate(dateStr);
                            }}
                            className="w-6 h-6 rounded-full bg-moss/10 text-moss flex items-center justify-center hover:bg-moss hover:text-cream transition-colors"
                            title="Pin a memory on this day"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      )}

                      {/* Script Note or Location */}
                      {reaction?.note ? (
                        <div className="font-script text-xs text-dusty-rose font-bold truncate">
                          "{reaction.note}"
                        </div>
                      ) : firstPhotoMem?.location ? (
                        <div className="font-hand text-[9px] text-brown/60 truncate">
                          📍 {firstPhotoMem.location}
                        </div>
                      ) : null}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Photo Reel Gallery View */
            <div>
              {monthMemories.length === 0 ? (
                <div className="py-20 text-center bg-white/60 rounded-3xl border border-light-brown/30">
                  <ImageIcon size={48} className="mx-auto text-brown/30 mb-3" />
                  <h3 className="font-serif text-2xl text-dark-brown font-bold">No Photos in {MONTH_NAMES[month]}</h3>
                  <p className="font-hand text-base text-brown/60 mt-1 mb-4">
                    Switch to the Pinboard view to add journal memories to any date in this month!
                  </p>
                  <button
                    onClick={() => onAddMemoryAtDate(`${year}-${String(month + 1).padStart(2, '0')}-01`)}
                    className="btn-aesthetic-primary"
                  >
                    <Plus size={16} /> Pin a Photo Memory
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {monthMemories.map((mem) => (
                    <motion.div
                      key={mem.id}
                      whileHover={{ y: -6, rotate: 1 }}
                      className="bg-white p-4 pb-6 rounded-2xl border border-light-brown/40 shadow-lg relative polaroid-shadow"
                    >
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <GoldPushPin size={24} />
                      </div>

                      {mem.photoUrl ? (
                        <div className="aspect-[4/3] rounded-lg overflow-hidden mb-3 bg-parchment/30 border border-light-brown/20">
                          <img src={mem.photoUrl} alt={mem.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="p-6 bg-parchment/30 rounded-lg mb-3 border border-light-brown/20">
                          <p className="font-hand text-base text-brown italic leading-relaxed">
                            "{mem.desc}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-serif font-bold text-dark-brown text-base">{mem.title}</h4>
                          <span className="font-hand text-xs text-brown/70">{new Date(mem.date).toLocaleDateString()}</span>
                        </div>
                        <button
                          onClick={() => onDeleteMemory(mem.id)}
                          className="text-brown/30 hover:text-red-600 p-1 transition-colors"
                          title="Delete memory"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
