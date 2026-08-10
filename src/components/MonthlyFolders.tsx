import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, 
  ChevronLeft, 
  Pin, 
  Music, 
  Camera, 
  Plus, 
  Sparkles, 
  X, 
  FileText, 
  Calendar,
  Heart,
  Share2
} from 'lucide-react';
import { Memory } from '../lib/groq';

interface MonthlyFoldersProps {
  memories: Memory[];
  onAddMemoryAtDate: (date: string) => void;
  onDeleteMemory: (id: string) => void;
}

const MONTHS = [
  { id: '01', name: 'January', color: 'bg-rose-200/90 border-rose-300 text-rose-950', headerBg: 'bg-rose-300' },
  { id: '02', name: 'February', color: 'bg-emerald-200/90 border-emerald-300 text-emerald-950', headerBg: 'bg-emerald-300' },
  { id: '03', name: 'March', color: 'bg-amber-200/90 border-amber-300 text-amber-950', headerBg: 'bg-amber-300' },
  { id: '04', name: 'April', color: 'bg-yellow-200/90 border-yellow-300 text-yellow-950', headerBg: 'bg-yellow-300' },
  { id: '05', name: 'May', color: 'bg-purple-200/90 border-purple-300 text-purple-950', headerBg: 'bg-purple-300' },
  { id: '06', name: 'June', color: 'bg-sky-200/90 border-sky-300 text-sky-950', headerBg: 'bg-sky-300' },
  { id: '07', name: 'July', color: 'bg-orange-200/90 border-orange-300 text-orange-950', headerBg: 'bg-orange-300' },
  { id: '08', name: 'August', color: 'bg-teal-200/90 border-teal-300 text-teal-950', headerBg: 'bg-teal-300' },
  { id: '09', name: 'September', color: 'bg-indigo-200/90 border-indigo-300 text-indigo-950', headerBg: 'bg-indigo-300' },
  { id: '10', name: 'October', color: 'bg-stone-200/90 border-stone-300 text-stone-950', headerBg: 'bg-stone-300' },
  { id: '11', name: 'November', color: 'bg-lime-200/90 border-lime-300 text-lime-950', headerBg: 'bg-lime-300' },
  { id: '12', name: 'December', color: 'bg-blue-200/90 border-blue-300 text-blue-950', headerBg: 'bg-blue-300' },
];

export default function MonthlyFolders({ memories, onAddMemoryAtDate }: MonthlyFoldersProps) {
  const [selectedMonth, setSelectedMonth] = useState<typeof MONTHS[0] | null>(null);
  const [activeMemoryDetail, setActiveMemoryDetail] = useState<Memory | null>(null);

  // Group memories by month
  const getMemoriesForMonth = (monthId: string) => {
    return memories.filter(m => {
      const d = new Date(m.date);
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      return mStr === monthId;
    });
  };

  return (
    <div className="min-h-screen bg-warm-white py-12 px-4 sm:px-8 relative">
      <div className="film-grain" />

      {!selectedMonth ? (
        /* MONTHLY FOLDER POCKETS SELECTION GRID ("Half-Year Tucked Inside My Folder") */
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="font-hand text-sm text-moss tracking-[0.2em] uppercase mb-2">✦ Organized Memory Vault ✦</div>
            <h1 className="font-serif text-4xl sm:text-6xl text-dark-brown font-bold tracking-tight mb-3">
              Memories <span className="font-serif italic font-normal text-brown">Tucked Inside Folders</span>
            </h1>
            <p className="font-classic italic text-lg text-brown/70 max-w-xl mx-auto">
              Select a monthly folder to open its interactive pinboard & scrapbook canvas.
            </p>
          </div>

          {/* Folders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {MONTHS.map((m) => {
              const monthMemories = getMemoriesForMonth(m.id);
              const previewPhotos = monthMemories.filter(m => m.photoUrl).slice(0, 3);

              return (
                <motion.div
                  key={m.id}
                  whileHover={{ y: -8 }}
                  onClick={() => setSelectedMonth(m)}
                  className="group cursor-pointer relative pt-16"
                >
                  {/* PHOTOS & POLAROIDS TUCKED INSIDE FOLDER TOP */}
                  <div className="absolute top-0 left-6 right-6 h-24 z-0 flex items-end justify-center gap-1">
                    {previewPhotos.length > 0 ? (
                      previewPhotos.map((mem, i) => (
                        <div
                          key={mem.id}
                          className="bg-white p-1 pb-4 rounded shadow-md border border-black/10 w-20 h-24 transform transition-all group-hover:-translate-y-4"
                          style={{
                            transform: `rotate(${(i - 1) * 12}deg) translateY(${i * 2}px)`,
                            zIndex: i + 1
                          }}
                        >
                          <img src={mem.photoUrl} className="w-full h-16 object-cover rounded-[1px]" />
                        </div>
                      ))
                    ) : (
                      <div className="bg-white/80 p-2 rounded shadow border border-brown/10 font-hand text-[10px] text-brown/50 italic rotate-[-4deg]">
                        Empty folder…
                      </div>
                    )}
                  </div>

                  {/* FOLDER BODY POCKET */}
                  <div className={`folder-pocket relative z-10 p-6 ${m.color} border-2 min-h-[160px] flex flex-col justify-between`}>
                    <div className="flex items-center justify-between">
                      <span className="font-hand text-xs uppercase tracking-widest opacity-70">Folder No. {m.id}</span>
                      <span className="font-hand text-xs font-semibold px-2.5 py-1 rounded-full bg-white/60 backdrop-blur-sm shadow-sm">
                        {monthMemories.length} items
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif text-3xl font-bold italic tracking-tight">{m.name}</h3>
                      <p className="font-hand text-xs opacity-75 mt-1">Click to launch month's pinboard canvas →</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* INTERACTIVE MONTHLY PINBOARD CANVAS */
        <div className="max-w-6xl mx-auto">
          
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedMonth(null)}
              className="btn-tactile px-5 py-2.5 rounded-full bg-white border border-light-brown/30 text-dark-brown font-hand text-sm shadow-sm hover:bg-cream"
            >
              <ChevronLeft size={18} className="mr-1" /> Back to Monthly Folders
            </button>

            <div className="flex items-center gap-3">
              <span className="font-hand text-sm text-moss bg-moss/10 px-4 py-1.5 rounded-full border border-moss/20 font-semibold">
                ✦ {selectedMonth.name} Pinboard Canvas ✦
              </span>
              <button
                onClick={() => onAddMemoryAtDate(`2024-${selectedMonth.id}-15`)}
                className="btn-tactile px-5 py-2.5 rounded-full bg-dark-brown text-cream font-hand text-sm shadow-md hover:bg-black"
              >
                <Plus size={16} className="mr-1" /> Add Entry to {selectedMonth.name}
              </button>
            </div>
          </div>

          {/* PINBOARD WORKSPACE CANVAS (Ref image 3 style: paperclips, color swatches, polaroids, notes) */}
          <div className="bg-[#e2dacb] border-4 border-[#b59e82] rounded-3xl p-8 sm:p-12 shadow-2xl relative min-h-[680px] overflow-hidden">
            {/* Canvas Texture overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(74,52,42,0.15)_100%)] pointer-events-none" />
            
            {/* Header / Title Card pinned on top left */}
            <div className="absolute top-6 left-6 z-20 bg-white p-6 shadow-xl rounded-sm border border-brown/10 rotate-[-2deg] max-w-xs">
              {/* Paperclip */}
              <div className="absolute -top-3 left-8 w-4 h-10 border-2 border-amber-600/80 rounded-full z-30 pointer-events-none" />
              <h2 className="font-serif text-3xl text-dark-brown font-bold italic mb-1">{selectedMonth.name} Memories</h2>
              <p className="font-hand text-xs text-brown/60">Pinned photographs, thoughts, color palettes & pressed memories.</p>
            </div>

            {/* Color Swatch Card pinned on right (like image 3) */}
            <div className="absolute top-6 right-6 z-20 bg-white p-4 shadow-xl rounded-sm border border-brown/10 rotate-[3deg] w-48 hidden md:block">
              <div className="font-hand text-xs font-semibold text-dark-brown mb-2 border-b border-brown/10 pb-1">Month Palette</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="h-12 bg-[#8a9e7b] rounded p-1 font-hand text-[9px] text-white">Sage green</div>
                <div className="h-12 bg-[#c9a0a0] rounded p-1 font-hand text-[9px] text-white">Dusty Rose</div>
              </div>
              <div className="font-hand text-[10px] text-brown/50 italic">Seasonal mood & tones</div>
            </div>

            {/* PINNED POLAROIDS & MEMORIES ON CANVAS */}
            <div className="pt-32 pb-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 relative z-10">
              {getMemoriesForMonth(selectedMonth.id).map((mem, idx) => (
                <motion.div
                  key={mem.id}
                  drag
                  dragConstraints={{ left: -20, right: 20, top: -20, bottom: 20 }}
                  whileHover={{ scale: 1.05, zIndex: 30 }}
                  onClick={() => setActiveMemoryDetail(mem)}
                  className="bg-white p-4 pb-8 shadow-2xl rounded-sm border border-brown/10 cursor-grab active:cursor-grabbing relative"
                  style={{
                    transform: `rotate(${(idx % 5 - 2) * 4}deg)`
                  }}
                >
                  {/* Push pin or washi tape */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-red-500 shadow-md border-2 border-red-300 z-30 flex items-center justify-center text-[10px] text-white">
                    📍
                  </div>

                  {mem.photoUrl ? (
                    <img src={mem.photoUrl} className="w-full h-48 object-cover rounded-[1px] mb-3 shadow-inner" />
                  ) : (
                    <div className="w-full h-48 bg-amber-50 flex items-center justify-center p-4 border border-dashed border-amber-200 mb-3">
                      <FileText size={32} className="text-amber-800/30" />
                    </div>
                  )}

                  <h4 className="font-serif text-xl text-dark-brown font-semibold mb-1">{mem.title}</h4>
                  <p className="font-hand text-xs text-brown/70 line-clamp-2">{mem.desc}</p>
                  
                  <div className="mt-3 pt-2 border-t border-brown/10 flex items-center justify-between text-[10px] font-hand text-brown/50">
                    <span>{new Date(mem.date).toLocaleDateString()}</span>
                    <span className="text-moss font-semibold">✦ {mem.mood}</span>
                  </div>
                </motion.div>
              ))}

              {getMemoriesForMonth(selectedMonth.id).length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <Camera size={48} className="mx-auto text-brown/20 mb-3" />
                  <p className="font-hand text-xl text-brown/60 italic">No pinned memories for {selectedMonth.name} yet.</p>
                  <button
                    onClick={() => onAddMemoryAtDate(`2024-${selectedMonth.id}-15`)}
                    className="btn-tactile mt-4 px-6 py-2 bg-moss text-cream font-hand text-sm rounded-full shadow-md"
                  >
                    + Pin First Memory
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MEMORY DETAIL MODAL */}
      <AnimatePresence>
        {activeMemoryDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-cream p-8 rounded-2xl max-w-lg w-full shadow-2xl border border-light-brown/30 relative"
            >
              <button
                onClick={() => setActiveMemoryDetail(null)}
                className="absolute top-4 right-4 text-brown/40 hover:text-brown"
              >
                <X size={20} />
              </button>

              {activeMemoryDetail.photoUrl && (
                <img src={activeMemoryDetail.photoUrl} className="w-full h-64 object-cover rounded-xl shadow-md mb-4" />
              )}

              <h3 className="font-serif text-2xl text-dark-brown font-bold mb-2">{activeMemoryDetail.title}</h3>
              <p className="font-hand text-sm text-brown/80 leading-relaxed mb-4">{activeMemoryDetail.desc}</p>
              
              <div className="flex items-center justify-between text-xs font-hand text-brown/60 pt-4 border-t border-brown/10">
                <span>{new Date(activeMemoryDetail.date).toLocaleDateString()}</span>
                <span>Mood: {activeMemoryDetail.mood}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
