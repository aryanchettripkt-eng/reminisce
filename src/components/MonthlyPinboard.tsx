import React, { useState, useMemo, useRef } from 'react';
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
  Folder, 
  Edit3, 
  Camera, 
  Upload, 
  PenTool, 
  Check, 
  Palette, 
  Type, 
  Layers, 
  Download 
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
  onAddMemory?: (memory: Memory) => void;
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

const PEN_COLORS = [
  { name: 'Espresso Ink', value: '#453127', class: 'text-[#453127]' },
  { name: 'Golden Gel', value: '#d4a337', class: 'text-[#d4a337]' },
  { name: 'Rose Blush', value: '#b56d6d', class: 'text-[#b56d6d]' },
  { name: 'Chalk White', value: '#ffffff', class: 'text-[#ffffff]' },
  { name: 'Sage Green', value: '#556b4f', class: 'text-[#556b4f]' },
  { name: 'Deep Indigo', value: '#243452', class: 'text-[#243452]' },
];

const QUICK_EMOJIS = ['🌸', '☕', '🌅', '✨', '🌧️', '🍂', '🌙', '📖', '🍰', '💌', '🌿', '🎨'];

export default function MonthlyPinboard({
  memories,
  dayReactions,
  onUpdateDayReaction,
  onClose,
  onAddMemoryAtDate,
  onAddMemory,
  onDeleteMemory,
}: MonthlyPinboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeFolderIndex, setActiveFolderIndex] = useState(new Date().getMonth());
  const [viewMode, setViewMode] = useState<'pinboard' | 'gallery'>('pinboard');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Day Detail / Photo Studio Modal State
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoOverlayText, setPhotoOverlayText] = useState('');
  const [selectedPenColor, setSelectedPenColor] = useState(PEN_COLORS[0].value);
  const [overlayPosition, setOverlayPosition] = useState<'top' | 'middle' | 'bottom'>('bottom');
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const selectedDateStr = selectedDay 
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : '';

  const selectedDayMemories = selectedDay ? getMemoriesForDay(selectedDay) : [];
  const selectedDayReaction = selectedDay ? getDayReaction(selectedDay) : undefined;
  const selectedDayPhotos = selectedDayMemories.filter(m => m.photoUrl);

  // Handle uploading multiple pictures for the selected day
  const handleMultipleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedDay || !onAddMemory) return;

    const files = Array.from(e.target.files);
    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const newMemory: Memory = {
            id: `mem-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
            type: 'photo',
            title: file.name.replace(/\.[^/.]+$/, "") || `Memory from ${selectedDateStr}`,
            desc: photoCaption || `Attached photo on ${selectedDateStr}`,
            mood: 'nostalgic',
            date: selectedDateStr,
            photoUrl: dataUrl,
          };
          onAddMemory(newMemory);
        }
      };
      reader.readAsDataURL(file);
    });

    setIsAddingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle adding photo via direct URL
  const handleAddPhotoUrl = () => {
    if (!newPhotoUrlInput.trim() || !selectedDay || !onAddMemory) return;

    const newMemory: Memory = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'photo',
      title: photoCaption || `Photo from ${selectedDateStr}`,
      desc: photoCaption || `Pinned memory on ${selectedDateStr}`,
      mood: 'joy',
      date: selectedDateStr,
      photoUrl: newPhotoUrlInput.trim(),
    };

    onAddMemory(newMemory);
    setNewPhotoUrlInput('');
    setPhotoCaption('');
    setIsAddingPhoto(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-cream/95 backdrop-blur-xl flex flex-col overflow-hidden font-body"
    >
      <div className="film-grain" />

      {/* Hidden File Input for Multiple Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleMultipleFilesUpload}
        multiple
        accept="image/*"
        className="hidden"
      />

      {/* Top Navigation Header */}
      <header className="px-6 py-4 border-b border-light-brown/30 bg-warm-white/90 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-moss" size={24} />
            <h1 className="font-serif text-2xl sm:text-3xl text-dark-brown font-bold italic tracking-tight">
              {MONTH_NAMES[month]} {year}
            </h1>
          </div>
          <span className="hidden sm:inline-block font-hand text-base text-brown/80 bg-parchment/70 px-3.5 py-1 rounded-full border border-light-brown/30">
            {MONTH_SUBTITLES[month]}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-parchment/60 p-1 rounded-full border border-light-brown/30">
            <button
              onClick={() => setViewMode('pinboard')}
              className={`px-4 py-1.5 rounded-full font-body text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'pinboard' ? 'bg-brown text-cream shadow-xs' : 'text-brown hover:bg-brown/10'
              }`}
            >
              <Grid size={13} /> Pinboard
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-4 py-1.5 rounded-full font-body text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'gallery' ? 'bg-brown text-cream shadow-xs' : 'text-brown hover:bg-brown/10'
              }`}
            >
              <ImageIcon size={13} /> Photo Reel ({monthMemories.length})
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

      {/* Connected 12-Month Folders Tabs Bar */}
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
              className={`flex-shrink-0 px-4 py-1.5 rounded-t-xl font-body text-xs font-semibold transition-all relative flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#f6efe2] text-dark-brown font-bold border-t-2 border-x-2 border-light-brown shadow-sm -mb-2.5 pb-3.5 z-10'
                  : 'bg-parchment/60 text-brown/80 hover:bg-parchment border-t border-x border-transparent hover:border-light-brown/30'
              }`}
            >
              <Folder size={13} className={isActive ? 'text-moss' : 'text-brown/50'} />
              <span>{name.slice(0, 3)}</span>
              {monthCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-moss/20 text-moss text-[10px] flex items-center justify-center font-bold">
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
              <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-2.5 text-center font-serif text-xs font-bold text-dark-brown/70 tracking-wider uppercase">
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
                {/* Filler cells */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[105px] sm:min-h-[135px] rounded-2xl bg-black/[0.02] border border-dashed border-light-brown/20 opacity-40"
                  />
                ))}

                {/* Days of Month */}
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

                      {/* Attached Polaroid with Handwritten Note */}
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

                          {/* Handwritten caption on photo bottom border */}
                          {firstPhotoMem.title && (
                            <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-xs px-1 py-0.5 text-center font-hand text-[10px] text-dark-brown truncate border-t border-black/5">
                              {firstPhotoMem.title}
                            </div>
                          )}

                          {dayMems.length > 1 && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/60 backdrop-blur-xs text-white text-[9px] font-body font-bold">
                              +{dayMems.length - 1} photos
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
                              setSelectedDay(dayNum);
                              setIsAddingPhoto(true);
                            }}
                            className="w-6 h-6 rounded-full bg-moss/10 text-moss flex items-center justify-center hover:bg-moss hover:text-cream transition-colors"
                            title="Attach photos or write note"
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
                    Switch to the Pinboard view to attach photos and handwritten memories to any date in this month!
                  </p>
                  <button
                    onClick={() => {
                      setViewMode('pinboard');
                      setSelectedDay(1);
                    }}
                    className="btn-aesthetic"
                  >
                    <Plus size={16} /> Open Day Pinboard
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
                        <div className="aspect-[4/3] rounded-lg overflow-hidden mb-3 bg-parchment/30 border border-light-brown/20 relative">
                          <img src={mem.photoUrl} alt={mem.title} className="w-full h-full object-cover" />
                          <div className="absolute bottom-2 left-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-white font-hand text-sm truncate">
                            {mem.title}
                          </div>
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

      {/* DAY DETAIL & PHOTO WRITING STUDIO MODAL */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#faf6f0] rounded-3xl border-2 border-[#453127]/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative"
            >
              {/* Modal Top Header */}
              <div className="px-6 py-4 bg-[#f4ede2] border-b border-light-brown/30 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-moss/20 text-moss flex items-center justify-center font-serif text-lg font-bold">
                    {selectedDay}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-dark-brown">
                      {MONTH_NAMES[month]} {selectedDay}, {year}
                    </h3>
                    <p className="font-hand text-xs text-brown/70">
                      Write on photos, attach pictures & pen your daily memory
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-aesthetic text-xs font-semibold"
                    title="Upload more photos from computer"
                  >
                    <Upload size={14} /> + Attach Pictures
                  </button>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="w-8 h-8 rounded-full bg-white/80 border border-light-brown/30 flex items-center justify-center text-dark-brown hover:bg-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left Column: Photo Carousel & On-Photo Writing Studio (7 cols) */}
                <div className="md:col-span-7 flex flex-col space-y-4">
                  
                  {/* Photo Display Frame with On-Photo Handwriting */}
                  {selectedDayPhotos.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDayPhotos.map((photoMem, idx) => (
                        <div
                          key={photoMem.id}
                          className="bg-white p-4 pb-6 rounded-2xl border-2 border-[#453127]/20 shadow-lg relative group polaroid-shadow"
                        >
                          {/* Photo Container with Live Handwriting Layer */}
                          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black/5 border border-black/10">
                            <img
                              src={photoMem.photoUrl}
                              alt={photoMem.title}
                              className="w-full h-full object-cover"
                            />

                            {/* Washi tape sticker */}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 pointer-events-none">
                              <WashiTapeCherish size={75} />
                            </div>

                            {/* Live Handwritten Text Overlay on the Photo */}
                            {photoOverlayText && (
                              <div
                                className={`absolute inset-x-4 p-2 pointer-events-none font-hand text-xl font-bold tracking-wide transition-all ${
                                  overlayPosition === 'top' ? 'top-6' : overlayPosition === 'middle' ? 'top-1/2 -translate-y-1/2' : 'bottom-4'
                                }`}
                                style={{ color: selectedPenColor, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
                              >
                                "{photoOverlayText}"
                              </div>
                            )}

                            <button
                              onClick={() => onDeleteMemory(photoMem.id)}
                              className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete this picture"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Editable Handwritten Caption at Bottom of Polaroid */}
                          <div className="mt-3 px-1">
                            <input
                              type="text"
                              defaultValue={photoMem.title}
                              onBlur={(e) => {
                                photoMem.title = e.target.value;
                              }}
                              placeholder="Write a handwritten title on this Polaroid..."
                              className="w-full font-hand text-lg text-dark-brown bg-transparent border-b border-dashed border-light-brown/40 focus:border-moss outline-none pb-0.5 placeholder-brown/40"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty Photo State with Upload Prompt */
                    <div className="border-2 border-dashed border-light-brown/40 rounded-2xl p-8 text-center bg-warm-white/60 flex flex-col items-center justify-center">
                      <Camera size={44} className="text-moss/40 mb-3" />
                      <h4 className="font-serif text-lg font-bold text-dark-brown">No Pictures Attached Yet</h4>
                      <p className="font-hand text-sm text-brown/70 mt-1 mb-4 max-w-xs">
                        Attach multiple snapshots from your day or paste an image link to write on your Polaroid!
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="btn-aesthetic text-xs font-semibold"
                        >
                          <Upload size={14} /> Upload from Device
                        </button>
                        <button
                          onClick={() => setIsAddingPhoto(true)}
                          className="btn-aesthetic text-xs font-semibold"
                        >
                          <ImageIcon size={14} /> Add Image Link
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Add Picture Drawer by URL */}
                  {isAddingPhoto && (
                    <div className="bg-white p-4 rounded-xl border border-light-brown/30 shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-xs font-serif font-bold text-dark-brown">
                        <span>Attach Picture via URL:</span>
                        <button onClick={() => setIsAddingPhoto(false)} className="text-brown/50 hover:text-dark-brown">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPhotoUrlInput}
                          onChange={(e) => setNewPhotoUrlInput(e.target.value)}
                          placeholder="Paste image URL (https://...)"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-light-brown/30 font-body text-xs focus:outline-none focus:border-moss"
                        />
                        <button
                          onClick={handleAddPhotoUrl}
                          className="btn-aesthetic text-xs px-3"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* On-Photo Writing & Ink Studio Tools */}
                  {selectedDayPhotos.length > 0 && (
                    <div className="bg-white/80 p-4 rounded-2xl border border-light-brown/30 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-serif font-bold text-dark-brown">
                        <PenTool size={14} className="text-moss" />
                        <span>Handwriting & Ink Studio</span>
                      </div>

                      {/* Text overlay input */}
                      <input
                        type="text"
                        value={photoOverlayText}
                        onChange={(e) => setPhotoOverlayText(e.target.value)}
                        placeholder="Type text to stamp directly onto the photo..."
                        className="w-full px-3 py-2 rounded-xl bg-parchment/30 border border-light-brown/30 font-hand text-base text-dark-brown outline-none focus:border-moss placeholder-brown/40"
                      />

                      {/* Pen ink colors & position pills */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-hand text-xs text-brown/70 mr-1">Ink:</span>
                          {PEN_COLORS.map(c => (
                            <button
                              key={c.name}
                              onClick={() => setSelectedPenColor(c.value)}
                              className={`w-6 h-6 rounded-full border border-black/10 transition-transform ${
                                selectedPenColor === c.value ? 'scale-125 ring-2 ring-moss' : 'hover:scale-110'
                              }`}
                              style={{ backgroundColor: c.value }}
                              title={c.name}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-1 bg-parchment/40 p-0.5 rounded-lg border border-light-brown/20 text-[10px] font-body font-semibold">
                          {(['top', 'middle', 'bottom'] as const).map(pos => (
                            <button
                              key={pos}
                              onClick={() => setOverlayPosition(pos)}
                              className={`px-2 py-0.5 rounded capitalize ${
                                overlayPosition === pos ? 'bg-brown text-cream' : 'text-brown'
                              }`}
                            >
                              {pos}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Daily Reaction, Journal Note & Emojis (5 cols) */}
                <div className="md:col-span-5 flex flex-col space-y-4">
                  
                  {/* Daily Mood Emoji Stamp */}
                  <div className="bg-white/80 p-4 rounded-2xl border border-light-brown/30 space-y-2">
                    <label className="font-serif text-xs font-bold text-dark-brown flex items-center justify-between">
                      <span>Day Mood Stamp:</span>
                      <span className="text-base">{selectedDayReaction?.emoji || '✨'}</span>
                    </label>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {QUICK_EMOJIS.map(em => (
                        <button
                          key={em}
                          onClick={() => {
                            onUpdateDayReaction(selectedDateStr, { emoji: em });
                          }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-base hover:bg-parchment/60 transition-transform ${
                            selectedDayReaction?.emoji === em ? 'bg-moss/20 ring-1 ring-moss scale-110' : 'bg-parchment/20'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Daily Script Note / Journal */}
                  <div className="bg-white/80 p-4 rounded-2xl border border-light-brown/30 space-y-2">
                    <label className="font-serif text-xs font-bold text-dark-brown">
                      Handwritten Journal Note:
                    </label>
                    <textarea
                      rows={5}
                      defaultValue={selectedDayReaction?.note || selectedDayReaction?.journal || ''}
                      onBlur={(e) => {
                        onUpdateDayReaction(selectedDateStr, { note: e.target.value, journal: e.target.value });
                      }}
                      placeholder="Write your thoughts for this day... (e.g. 'A quiet walk by the lake with warm coffee.')"
                      className="w-full p-3 rounded-xl bg-[#faf6f0] border border-light-brown/30 font-hand text-base text-dark-brown outline-none focus:border-moss leading-relaxed placeholder-brown/40 resize-none"
                    />
                  </div>

                  {/* Quick Action: Attach More Photos */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 rounded-xl bg-[#dfb141] hover:bg-[#dab044] text-[#1e1b18] font-body text-xs font-bold uppercase tracking-wider transition-transform active:scale-95 shadow-sm flex items-center justify-center gap-2"
                  >
                    <Upload size={14} /> Attach More Pictures to this Day
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
