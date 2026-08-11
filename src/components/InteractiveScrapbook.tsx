import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  RotateCw, 
  Layers, 
  Palette, 
  Sparkles, 
  Image as ImageIcon, 
  Save, 
  Undo, 
  Type, 
  Smile, 
  Maximize2 
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
  PastelHeartPink 
} from './AestheticStickers';

interface ScrapbookItem {
  id: string;
  type: 'photo' | 'sticker' | 'note';
  content: string;
  stickerKey?: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  zIndex: number;
}

const STICKER_CATALOG = [
  { key: 'ribbon-pink', name: 'Pink Ribbon', Component: RibbonBowPink },
  { key: 'ribbon-sage', name: 'Sage Ribbon', Component: RibbonBowSage },
  { key: 'wax-rose', name: 'Rose Wax Seal', Component: WaxSealRose },
  { key: 'wax-botanical', name: 'Leaf Wax Seal', Component: WaxSealBotanical },
  { key: 'coffee-cup', name: 'Latte Art Cup', Component: CoffeeLatteCup },
  { key: 'pressed-flower', name: 'Dried Flower', Component: DriedPressedFlower },
  { key: 'washi-remember', name: 'Remember Tape', Component: WashiTapeRemember },
  { key: 'washi-golden', name: 'Golden Hour Tape', Component: WashiTapeGoldenHour },
  { key: 'washi-cherish', name: 'Cherish Tape', Component: WashiTapeCherish },
  { key: 'gold-pin', name: 'Gold Pushpin', Component: GoldPushPin },
  { key: 'brass-clip', name: 'Brass Clip', Component: BrassPaperClip },
  { key: 'airmail-stamp', name: 'Airmail Stamp', Component: AirmailStamp },
  { key: 'pastel-heart', name: 'Pastel Heart', Component: PastelHeartPink }
];

const PAPER_TEXTURES = [
  { id: 'linen', name: 'Linen Board', className: 'linen-board' },
  { id: 'cream', name: 'Warm Cream', className: 'bg-warm-white' },
  { id: 'cork', name: 'Vintage Cork', className: 'cork-board' },
  { id: 'kraft', name: 'Kraft Paper', className: 'bg-[#dcc8ab]' }
];

export default function InteractiveScrapbook({ memories }: { memories: Memory[] }) {
  const [items, setItems] = useState<ScrapbookItem[]>(() => {
    try {
      const saved = localStorage.getItem('reminiq_scrapbook_items');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'init-photo',
        type: 'photo',
        content: memories.find(m => m.photoUrl)?.photoUrl || 'https://picsum.photos/seed/vintage1/400/400',
        x: 180,
        y: 120,
        rotation: -4,
        scale: 1,
        zIndex: 2
      },
      {
        id: 'init-sticker',
        type: 'sticker',
        content: 'ribbon-pink',
        stickerKey: 'ribbon-pink',
        x: 140,
        y: 90,
        rotation: 8,
        scale: 1.1,
        zIndex: 5
      },
      {
        id: 'init-note',
        type: 'note',
        content: 'a quiet afternoon in October ✨',
        x: 440,
        y: 180,
        rotation: 3,
        scale: 1,
        zIndex: 3
      }
    ];
  });

  const [activeTexture, setActiveTexture] = useState('linen');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
  const [isPhotoDrawerOpen, setIsPhotoDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('reminiq_scrapbook_items', JSON.stringify(items));
    } catch {}
  }, [items]);

  const bringToFront = (id: string) => {
    const maxZ = Math.max(...items.map(i => i.zIndex), 0);
    setItems(items.map(i => (i.id === id ? { ...i, zIndex: maxZ + 1 } : i)));
  };

  const addSticker = (key: string) => {
    const maxZ = Math.max(...items.map(i => i.zIndex), 0);
    const newItem: ScrapbookItem = {
      id: `sticker-${Date.now()}`,
      type: 'sticker',
      content: key,
      stickerKey: key,
      x: 200 + Math.random() * 200,
      y: 150 + Math.random() * 150,
      rotation: (Math.random() - 0.5) * 20,
      scale: 1,
      zIndex: maxZ + 1
    };
    setItems([...items, newItem]);
    setSelectedItemId(newItem.id);
    setIsStickerDrawerOpen(false);
  };

  const addPhoto = (photoUrl: string) => {
    const maxZ = Math.max(...items.map(i => i.zIndex), 0);
    const newItem: ScrapbookItem = {
      id: `photo-${Date.now()}`,
      type: 'photo',
      content: photoUrl,
      x: 220 + Math.random() * 150,
      y: 140 + Math.random() * 100,
      rotation: (Math.random() - 0.5) * 12,
      scale: 1,
      zIndex: maxZ + 1
    };
    setItems([...items, newItem]);
    setSelectedItemId(newItem.id);
    setIsPhotoDrawerOpen(false);
  };

  const addStickyNote = () => {
    const text = prompt('Enter your handwritten note text:') || 'sweet memories ✨';
    const maxZ = Math.max(...items.map(i => i.zIndex), 0);
    const newItem: ScrapbookItem = {
      id: `note-${Date.now()}`,
      type: 'note',
      content: text,
      x: 260 + Math.random() * 100,
      y: 180 + Math.random() * 100,
      rotation: (Math.random() - 0.5) * 10,
      scale: 1,
      zIndex: maxZ + 1
    };
    setItems([...items, newItem]);
    setSelectedItemId(newItem.id);
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const rotateItem = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, rotation: (i.rotation + 15) % 360 } : i));
  };

  return (
    <div className="relative w-full h-full flex flex-col rounded-3xl overflow-hidden border border-light-brown/40 shadow-2xl bg-warm-white">
      {/* Studio Toolbar */}
      <div className="p-3 bg-warm-white/90 border-b border-light-brown/30 backdrop-blur-md flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStickerDrawerOpen(!isStickerDrawerOpen)}
            className="btn-aesthetic text-xs py-1.5 px-3"
          >
            <Smile size={14} className="text-dusty-rose" /> Add Cute Stickers
          </button>
          <button
            onClick={() => setIsPhotoDrawerOpen(!isPhotoDrawerOpen)}
            className="btn-aesthetic text-xs py-1.5 px-3"
          >
            <ImageIcon size={14} className="text-moss" /> Add Photos
          </button>
          <button
            onClick={addStickyNote}
            className="btn-aesthetic text-xs py-1.5 px-3"
          >
            <Type size={14} className="text-brown" /> Handwritten Note
          </button>
        </div>

        {/* Paper Canvas Texture Selector */}
        <div className="flex items-center gap-1.5">
          <span className="font-hand text-xs text-brown/60 mr-1">Paper:</span>
          {PAPER_TEXTURES.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTexture(t.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-hand transition-all ${
                activeTexture === t.id
                  ? 'bg-moss text-cream font-bold shadow-xs'
                  : 'bg-parchment/60 text-brown hover:bg-parchment'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Freeform Scrapbook Canvas */}
      <div
        onClick={() => setSelectedItemId(null)}
        className={`flex-1 relative overflow-hidden custom-scrollbar ${
          PAPER_TEXTURES.find(t => t.id === activeTexture)?.className || 'linen-board'
        }`}
        style={{ minHeight: 600 }}
      >
        {items.map(item => {
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
              {/* Render Photo */}
              {item.type === 'photo' && (
                <div className="bg-white p-3 pb-8 rounded-sm shadow-xl polaroid-shadow border border-light-brown/30 max-w-[220px]">
                  <img src={item.content} alt="Memory" className="w-full h-auto object-cover rounded-xs pointer-events-none" />
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 pointer-events-none">
                    <BrassPaperClip size={22} />
                  </div>
                </div>
              )}

              {/* Render Sticker */}
              {item.type === 'sticker' && (
                <div className="filter drop-shadow-md pointer-events-none">
                  {(() => {
                    const found = STICKER_CATALOG.find(s => s.key === item.stickerKey);
                    if (found) {
                      const Comp = found.Component;
                      return <Comp size={64} />;
                    }
                    return <PastelHeartPink size={54} />;
                  })()}
                </div>
              )}

              {/* Render Handwritten Note */}
              {item.type === 'note' && (
                <div className="bg-[#fff9db] p-4 rounded-xs shadow-lg border border-amber-200/60 max-w-[180px] relative">
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-12 h-3 bg-amber-300/40 -rotate-2 rounded-xs" />
                  <p className="font-hand text-base text-dark-brown leading-snug">
                    {item.content}
                  </p>
                </div>
              )}

              {/* Item Action Overlay */}
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

      {/* Sticker Drawer */}
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
                Choose an Aesthetic Sticker to Stamp:
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

      {/* Photo Drawer */}
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
                Select Photo from Your Vault:
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
    </div>
  );
}
