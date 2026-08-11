import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  RotateCw, 
  Image as ImageIcon, 
  Type, 
  Smile, 
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Palette,
  X
} from 'lucide-react';
import { Memory } from '../lib/groq';
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
  PastelHeartPink,
  RetroIpodMini,
  CircularLaceFrame,
  StarBorderFrame,
  RedPlaidFrame,
  YellowStickyNote,
  VintageSunflower,
  MonarchButterfly
} from './AestheticStickers';

interface ScrapbookItem {
  id: string;
  type: 'photo' | 'sticker' | 'note';
  content: string;
  stickerKey?: string;
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  zIndex: number;
}

const STICKER_CATALOG = [
  { key: 'ipod-mini', name: 'Retro iPod Mini', Component: RetroIpodMini },
  { key: 'lace-frame', name: 'Circular Lace Frame', Component: CircularLaceFrame },
  { key: 'star-frame', name: 'Star Border Frame', Component: StarBorderFrame },
  { key: 'plaid-frame', name: 'Red Plaid Frame', Component: RedPlaidFrame },
  { key: 'ribbon-pink', name: 'Pink Ribbon', Component: RibbonBowPink },
  { key: 'ribbon-sage', name: 'Sage Ribbon', Component: RibbonBowSage },
  { key: 'wax-rose', name: 'Rose Wax Seal', Component: WaxSealRose },
  { key: 'wax-botanical', name: 'Leaf Wax Seal', Component: WaxSealBotanical },
  { key: 'coffee-cup', name: 'Latte Art Cup', Component: CoffeeLatteCup },
  { key: 'pressed-flower', name: 'Dried Flower', Component: DriedPressedFlower },
  { key: 'sunflower', name: 'Sunflower', Component: VintageSunflower },
  { key: 'butterfly', name: 'Monarch Butterfly', Component: MonarchButterfly },
  { key: 'sticky-note', name: 'Yellow Sticky', Component: YellowStickyNote },
  { key: 'washi-remember', name: 'Remember Tape', Component: WashiTapeRemember },
  { key: 'washi-golden', name: 'Golden Hour Tape', Component: WashiTapeGoldenHour },
  { key: 'washi-cherish', name: 'Cherish Tape', Component: WashiTapeCherish },
  { key: 'gold-pin', name: 'Gold Pushpin', Component: GoldPushPin },
  { key: 'brass-clip', name: 'Brass Clip', Component: BrassPaperClip },
  { key: 'airmail-stamp', name: 'Airmail Stamp', Component: AirmailStamp },
  { key: 'pastel-heart', name: 'Pastel Heart', Component: PastelHeartPink }
];

const CANVAS_BACKGROUNDS = [
  { id: 'starry', name: '🌌 Blue Starry', bgStyle: 'bg-[#708db3] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]' },
  { id: 'linen', name: '🧵 Linen Canvas', bgStyle: 'linen-board' },
  { id: 'cork', name: '🪵 Cork Board', bgStyle: 'cork-board' },
  { id: 'manila', name: '📄 Manila Folder', bgStyle: 'bg-[#e9d8a6]' },
  { id: 'kraft', name: '📜 Kraft Paper', bgStyle: 'bg-[#dcc8ab]' },
  { id: 'dotgrid', name: '🔲 Dot Grid', bgStyle: 'bg-[#f8f9fa] bg-[radial-gradient(#adb5bd_1px,transparent_1px)] [background-size:16px_16px]' },
  { id: 'cream', name: '🌸 Warm Cream', bgStyle: 'bg-warm-white' },
];

export default function InteractiveScrapbook({ memories }: { memories: Memory[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(2);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeBackground, setActiveBackground] = useState('starry');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
  const [isPhotoDrawerOpen, setIsPhotoDrawerOpen] = useState(false);
  const [isTextToolOpen, setIsTextToolOpen] = useState(false);

  // Text tool options
  const [newText, setNewText] = useState('sweet memory ✨');
  const [selectedFont, setSelectedFont] = useState("'Caveat', cursive");
  const [selectedColor, setSelectedColor] = useState('#2b1c14');

  const [itemsByPage, setItemsByPage] = useState<Record<number, ScrapbookItem[]>>(() => {
    try {
      const saved = localStorage.getItem('reminiq_scrapbook_pages_v2');
      if (saved) return JSON.parse(saved);
    } catch {}

    return {
      1: [
        {
          id: 'init-ipod',
          type: 'sticker',
          content: 'ipod-mini',
          stickerKey: 'ipod-mini',
          x: 80,
          y: 90,
          rotation: -8,
          scale: 1.1,
          zIndex: 4
        },
        {
          id: 'init-photo',
          type: 'photo',
          content: memories.find(m => m.photoUrl)?.photoUrl || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=60',
          x: 230,
          y: 110,
          rotation: 3,
          scale: 1,
          zIndex: 2
        },
        {
          id: 'init-ribbon',
          type: 'sticker',
          content: 'ribbon-pink',
          stickerKey: 'ribbon-pink',
          x: 200,
          y: 80,
          rotation: 12,
          scale: 1.2,
          zIndex: 5
        },
        {
          id: 'init-note',
          type: 'note',
          content: 'a quiet afternoon with books & music ✨',
          fontFamily: "'Caveat', cursive",
          fontSize: 18,
          textColor: '#2b1c14',
          x: 480,
          y: 160,
          rotation: -2,
          scale: 1,
          zIndex: 3
        }
      ],
      2: [
        {
          id: 'page2-sunflower',
          type: 'sticker',
          content: 'sunflower',
          stickerKey: 'sunflower',
          x: 120,
          y: 100,
          rotation: 5,
          scale: 1.2,
          zIndex: 2
        }
      ]
    };
  });

  const currentItems = itemsByPage[currentPage] || [];

  useEffect(() => {
    try {
      localStorage.setItem('reminiq_scrapbook_pages_v2', JSON.stringify(itemsByPage));
    } catch {}
  }, [itemsByPage]);

  const updateCurrentItems = (newItems: ScrapbookItem[]) => {
    setItemsByPage(prev => ({
      ...prev,
      [currentPage]: newItems
    }));
  };

  const bringToFront = (id: string) => {
    const maxZ = Math.max(...currentItems.map(i => i.zIndex), 0);
    updateCurrentItems(currentItems.map(i => (i.id === id ? { ...i, zIndex: maxZ + 1 } : i)));
  };

  const addSticker = (key: string) => {
    const maxZ = Math.max(...currentItems.map(i => i.zIndex), 0);
    const newItem: ScrapbookItem = {
      id: `sticker-${Date.now()}`,
      type: 'sticker',
      content: key,
      stickerKey: key,
      x: 180 + Math.random() * 150,
      y: 120 + Math.random() * 120,
      rotation: (Math.random() - 0.5) * 18,
      scale: 1,
      zIndex: maxZ + 1
    };
    updateCurrentItems([...currentItems, newItem]);
    setSelectedItemId(newItem.id);
    setIsStickerDrawerOpen(false);
  };

  const addPhoto = (photoUrl: string) => {
    const maxZ = Math.max(...currentItems.map(i => i.zIndex), 0);
    const newItem: ScrapbookItem = {
      id: `photo-${Date.now()}`,
      type: 'photo',
      content: photoUrl,
      x: 200 + Math.random() * 120,
      y: 130 + Math.random() * 80,
      rotation: (Math.random() - 0.5) * 10,
      scale: 1,
      zIndex: maxZ + 1
    };
    updateCurrentItems([...currentItems, newItem]);
    setSelectedItemId(newItem.id);
    setIsPhotoDrawerOpen(false);
  };

  const addCustomTextNote = () => {
    if (!newText.trim()) return;
    const maxZ = Math.max(...currentItems.map(i => i.zIndex), 0);
    const newItem: ScrapbookItem = {
      id: `note-${Date.now()}`,
      type: 'note',
      content: newText,
      fontFamily: selectedFont,
      fontSize: 18,
      textColor: selectedColor,
      x: 220 + Math.random() * 100,
      y: 160 + Math.random() * 80,
      rotation: (Math.random() - 0.5) * 8,
      scale: 1,
      zIndex: maxZ + 1
    };
    updateCurrentItems([...currentItems, newItem]);
    setSelectedItemId(newItem.id);
    setIsTextToolOpen(false);
  };

  const deleteItem = (id: string) => {
    updateCurrentItems(currentItems.filter(i => i.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const rotateItem = (id: string) => {
    updateCurrentItems(currentItems.map(i => i.id === id ? { ...i, rotation: (i.rotation + 15) % 360 } : i));
  };

  return (
    <div className="relative w-full h-full flex flex-col rounded-3xl overflow-hidden border border-light-brown/40 shadow-2xl bg-[#e8decb]">
      
      {/* Manila Binder Top Bar */}
      <div className="p-3 bg-warm-white/95 border-b border-light-brown/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStickerDrawerOpen(!isStickerDrawerOpen)}
            className="btn-aesthetic text-xs py-1.5 px-3"
          >
            <Smile size={14} className="text-dusty-rose" /> 20 Cute Stickers
          </button>
          <button
            onClick={() => setIsPhotoDrawerOpen(!isPhotoDrawerOpen)}
            className="btn-aesthetic text-xs py-1.5 px-3"
          >
            <ImageIcon size={14} className="text-moss" /> Add Photos
          </button>
          <button
            onClick={() => setIsTextToolOpen(!isTextToolOpen)}
            className="btn-aesthetic text-xs py-1.5 px-3"
          >
            <Type size={14} className="text-brown" /> Custom Text
          </button>
        </div>

        {/* Page Switcher & Zoom */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-parchment/70 px-2 py-1 rounded-full border border-light-brown/30">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 text-brown/60 hover:text-dark-brown disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-hand text-xs text-dark-brown font-bold px-1.5">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => {
                if (currentPage >= totalPages) {
                  setTotalPages(t => t + 1);
                  setCurrentPage(t => t + 1);
                } else {
                  setCurrentPage(p => p + 1);
                }
              }}
              className="p-1 text-brown/60 hover:text-dark-brown"
              title="Next page or add new"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-parchment/70 px-2 py-1 rounded-full border border-light-brown/30 text-xs font-hand">
            <button onClick={() => setZoomLevel(z => Math.max(60, z - 10))} className="p-0.5 text-brown/70 hover:text-dark-brown">
              <ZoomOut size={13} />
            </button>
            <span className="w-8 text-center">{zoomLevel}%</span>
            <button onClick={() => setZoomLevel(z => Math.min(140, z + 10))} className="p-0.5 text-brown/70 hover:text-dark-brown">
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Background Selector */}
          <div className="flex items-center gap-1">
            <select
              value={activeBackground}
              onChange={(e) => setActiveBackground(e.target.value)}
              className="px-2.5 py-1 bg-parchment/80 border border-light-brown/40 rounded-full font-hand text-xs text-dark-brown focus:outline-none"
            >
              {CANVAS_BACKGROUNDS.map(bg => (
                <option key={bg.id} value={bg.id}>{bg.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Binder Canvas */}
      <div
        onClick={() => setSelectedItemId(null)}
        className="flex-1 relative overflow-auto custom-scrollbar p-6 flex items-center justify-center"
      >
        {/* Layered Manila Folder Base with Binder Clip */}
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
          className={`relative w-[900px] h-[620px] rounded-2xl shadow-2xl border-4 border-[#d4b996] transition-all overflow-hidden ${
            CANVAS_BACKGROUNDS.find(b => b.id === activeBackground)?.bgStyle || 'linen-board'
          }`}
        >
          {/* Top Brass Binder Clip Accent */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
            <BrassPaperClip size={42} />
          </div>

          {/* Pink Graph Paper sticking out accent */}
          <div className="absolute -bottom-4 -right-4 w-36 h-36 bg-[#ffeedd] border border-red-200 rotate-6 pointer-events-none opacity-60 shadow-md [background-size:10px_10px] bg-[linear-gradient(to_right,#ffd6d6_1px,transparent_1px),linear-gradient(to_bottom,#ffd6d6_1px,transparent_1px)]" />

          {/* Draggable Items */}
          {currentItems.map(item => {
            const isSelected = selectedItemId === item.id;

            return (
              <motion.div
                key={item.id}
                drag
                dragMomentum={false}
                onDragStart={() => bringToFront(item.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItemId(item.id);
                  bringToFront(item.id);
                }}
                style={{
                  position: 'absolute',
                  left: item.x,
                  top: item.y,
                  zIndex: item.zIndex,
                  rotate: `${item.rotation}deg`,
                  scale: item.scale
                }}
                className={`cursor-grab active:cursor-grabbing select-none relative group ${
                  isSelected ? 'ring-2 ring-moss ring-offset-2 ring-offset-transparent' : ''
                }`}
              >
                {/* Photo Item */}
                {item.type === 'photo' && (
                  <div className="bg-white p-3 pb-8 rounded-sm shadow-xl polaroid-shadow border border-light-brown/30 max-w-[230px]">
                    <img src={item.content} alt="Memory" className="w-full h-auto object-cover rounded-xs pointer-events-none" />
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 pointer-events-none">
                      <BrassPaperClip size={22} />
                    </div>
                  </div>
                )}

                {/* Sticker Item */}
                {item.type === 'sticker' && (
                  <div className="filter drop-shadow-md pointer-events-none">
                    {(() => {
                      const found = STICKER_CATALOG.find(s => s.key === item.stickerKey);
                      if (found) {
                        const Comp = found.Component;
                        return <Comp size={item.stickerKey === 'ipod-mini' ? 70 : 64} />;
                      }
                      return <PastelHeartPink size={54} />;
                    })()}
                  </div>
                )}

                {/* Custom Note Item */}
                {item.type === 'note' && (
                  <div className="bg-[#fff9db] p-4 rounded-xs shadow-lg border border-amber-200/60 max-w-[200px] relative">
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-12 h-3 bg-amber-300/40 -rotate-2 rounded-xs" />
                    <p
                      style={{
                        fontFamily: item.fontFamily || "'Caveat', cursive",
                        fontSize: `${item.fontSize || 18}px`,
                        color: item.textColor || '#2b1c14'
                      }}
                      className="leading-snug"
                    >
                      {item.content}
                    </p>
                  </div>
                )}

                {/* Selected Overlay Actions */}
                {isSelected && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-dark-brown/90 text-white rounded-full px-2 py-1 flex items-center gap-2 shadow-lg backdrop-blur-md z-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rotateItem(item.id);
                      }}
                      className="p-1 hover:text-amber-300"
                      title="Rotate"
                    >
                      <RotateCw size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(item.id);
                      }}
                      className="p-1 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 20 Sticker Drawer */}
      <AnimatePresence>
        {isStickerDrawerOpen && (
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-light-brown/40 shadow-2xl z-40"
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-light-brown/20">
              <span className="font-serif font-bold text-dark-brown text-sm italic">
                Choose from 20 Aesthetic Stickers & Frames:
              </span>
              <button onClick={() => setIsStickerDrawerOpen(false)} className="text-brown/50 hover:text-dark-brown">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto custom-scrollbar py-2">
              {STICKER_CATALOG.map(st => {
                const Comp = st.Component;
                return (
                  <button
                    key={st.key}
                    onClick={() => addSticker(st.key)}
                    className="flex-shrink-0 p-3 rounded-2xl bg-parchment/40 hover:bg-parchment border border-light-brown/30 flex flex-col items-center gap-1.5 transition-transform hover:scale-110 active:scale-95"
                  >
                    <Comp size={48} />
                    <span className="font-hand text-xs text-dark-brown">{st.name}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Picker Drawer */}
      <AnimatePresence>
        {isPhotoDrawerOpen && (
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-light-brown/40 shadow-2xl z-40"
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-light-brown/20">
              <span className="font-serif font-bold text-dark-brown text-sm italic">
                Select Photo from Vault:
              </span>
              <button onClick={() => setIsPhotoDrawerOpen(false)} className="text-brown/50 hover:text-dark-brown">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto custom-scrollbar py-2">
              {memories.filter(m => m.photoUrl).map(mem => (
                <button
                  key={mem.id}
                  onClick={() => addPhoto(mem.photoUrl!)}
                  className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-light-brown/40 hover:scale-105 transition-transform active:scale-95 shadow-sm relative group"
                >
                  <img src={mem.photoUrl!} alt={mem.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-hand">
                    + Add
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Typography Modal Drawer */}
      <AnimatePresence>
        {isTextToolOpen && (
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 p-5 bg-white/95 backdrop-blur-xl border-t border-light-brown/40 shadow-2xl z-40"
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-light-brown/20">
              <span className="font-serif font-bold text-dark-brown text-sm italic">
                Custom Typography & Note Stamp:
              </span>
              <button onClick={() => setIsTextToolOpen(false)} className="text-brown/50 hover:text-dark-brown">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Type your note here..."
                className="flex-1 px-4 py-2 bg-parchment/60 rounded-xl border border-light-brown/40 font-hand text-lg focus:outline-none"
              />

              <div className="flex items-center gap-2">
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="px-3 py-2 bg-parchment/60 rounded-xl border border-light-brown/40 font-hand text-sm focus:outline-none"
                >
                  <option value="'Caveat', cursive">✍️ Handwriting</option>
                  <option value="'Playfair Display', serif">📜 Classic Serif</option>
                  <option value="'Courier New', monospace">⌨️ Typewriter</option>
                </select>

                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-light-brown/40 cursor-pointer p-0.5"
                  title="Text Color"
                />

                <button
                  onClick={addCustomTextNote}
                  className="btn-aesthetic-primary py-2 px-4"
                >
                  Stamp Note
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
