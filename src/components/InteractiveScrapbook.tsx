import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  RotateCw, 
  Palette, 
  Sparkles, 
  Image as ImageIcon, 
  Save, 
  Type, 
  Smile, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  X,
  FileText,
  Maximize2
} from 'lucide-react';
import { Memory } from '../lib/groq';
import { 
  RibbonBowPink, 
  RibbonBowSage, 
  WaxSealBotanical, 
  WaxSealRose, 
  CoffeeLatteCup, 
  DriedPressedFlower, 
  RetroIpodMini, 
  LaceDoilyFrame, 
  StarBorderOliveFrame, 
  StarBorderBrownFrame, 
  GinghamLaceFrame, 
  PurplePaperclip, 
  MetalBinderClip, 
  YellowStickyNote, 
  SunflowerBloom, 
  VintageButterfly, 
  CoffeeRingStain, 
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
  type: 'photo' | 'sticker' | 'note' | 'text';
  content: string;
  stickerKey?: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  zIndex: number;
  // Text styling
  fontFamily?: 'Caveat' | 'Playfair Display' | 'Courier Prime';
  fontSize?: number;
  color?: string;
}

interface ScrapbookPage {
  id: string;
  title: string;
  backgroundId: string;
  items: ScrapbookItem[];
}

const BACKGROUND_OPTIONS = [
  { id: 'starry-blue', name: '🌌 Starry Periwinkle', className: 'bg-[#708db3] text-white', style: { backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' } },
  { id: 'manila', name: '📄 Manila Folder', className: 'bg-[#eadecc] text-[#2c241e]', style: {} },
  { id: 'cork', name: '🪵 Cork Board', className: 'cork-board text-[#2c241e]', style: {} },
  { id: 'linen', name: '🧵 Linen Canvas', className: 'linen-board text-[#2c241e]', style: {} },
  { id: 'kraft', name: '📜 Kraft Paper', className: 'bg-[#d6c2a5] text-[#2c241e]', style: {} },
  { id: 'grid-pink', name: '📏 Pink Graph Paper', className: 'bg-[#fff5f5] text-[#2c241e]', style: { backgroundImage: 'linear-gradient(rgba(244,194,194,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(244,194,194,0.4) 1px, transparent 1px)', backgroundSize: '16px 16px' } },
  { id: 'dot-grid', name: '🔲 Dot Grid', className: 'bg-[#faf6f0] text-[#2c241e]', style: { backgroundImage: 'radial-gradient(rgba(122,94,69,0.2) 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' } },
  { id: 'chalkboard', name: '🪵 Chalkboard', className: 'bg-[#2b3531] text-[#f4efe4]', style: {} }
];

const STICKER_CATALOG = [
  { key: 'ipod-mini', name: 'Retro iPod Mini', Component: RetroIpodMini },
  { key: 'lace-doily', name: 'Lace Doily Cutout', Component: LaceDoilyFrame },
  { key: 'star-olive', name: 'Olive Star Frame', Component: StarBorderOliveFrame },
  { key: 'star-brown', name: 'Espresso Star Frame', Component: StarBorderBrownFrame },
  { key: 'gingham-lace', name: 'Red Gingham Frame', Component: GinghamLaceFrame },
  { key: 'ribbon-pink', name: 'Pink Satin Bow', Component: RibbonBowPink },
  { key: 'ribbon-sage', name: 'Sage Green Bow', Component: RibbonBowSage },
  { key: 'purple-clip', name: 'Purple Paperclip', Component: PurplePaperclip },
  { key: 'metal-binder', name: 'Metal Binder Clip', Component: MetalBinderClip },
  { key: 'yellow-sticky', name: 'Yellow Sticky Note', Component: YellowStickyNote },
  { key: 'wax-botanical', name: 'Botanical Wax Seal', Component: WaxSealBotanical },
  { key: 'wax-rose', name: 'Rose Wax Seal', Component: WaxSealRose },
  { key: 'sunflower', name: 'Golden Sunflower', Component: SunflowerBloom },
  { key: 'butterfly', name: 'Monarch Butterfly', Component: VintageButterfly },
  { key: 'coffee-cup', name: 'Latte Art Cup', Component: CoffeeLatteCup },
  { key: 'coffee-ring', name: 'Coffee Ring Stain', Component: CoffeeRingStain },
  { key: 'pressed-flower', name: 'Dried Wildflower', Component: DriedPressedFlower },
  { key: 'washi-remember', name: 'Remember Washi', Component: WashiTapeRemember },
  { key: 'washi-golden', name: 'Golden Hour Washi', Component: WashiTapeGoldenHour },
  { key: 'washi-cherish', name: 'Cherish Washi', Component: WashiTapeCherish },
  { key: 'gold-pin', name: 'Gold Pushpin', Component: GoldPushPin },
  { key: 'brass-clip', name: 'Brass Clip', Component: BrassPaperClip },
  { key: 'airmail-stamp', name: 'Airmail Stamp', Component: AirmailStamp },
  { key: 'pastel-heart', name: 'Pastel Heart', Component: PastelHeartPink }
];

export default function InteractiveScrapbook({ memories }: { memories: Memory[] }) {
  const [pages, setPages] = useState<ScrapbookPage[]>(() => {
    try {
      const saved = localStorage.getItem('reminiq_scrapbook_pages_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'page-1',
        title: 'Page 1: Summer Memories',
        backgroundId: 'starry-blue',
        items: [
          {
            id: 'init-ipod',
            type: 'sticker',
            content: 'ipod-mini',
            stickerKey: 'ipod-mini',
            x: 80,
            y: 80,
            rotation: -6,
            scale: 1.1,
            zIndex: 3
          },
          {
            id: 'init-photo',
            type: 'photo',
            content: memories.find(m => m.photoUrl)?.photoUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
            x: 220,
            y: 100,
            rotation: 4,
            scale: 1,
            zIndex: 2
          },
          {
            id: 'init-doily',
            type: 'sticker',
            content: 'lace-doily',
            stickerKey: 'lace-doily',
            x: 480,
            y: 90,
            rotation: 12,
            scale: 1.2,
            zIndex: 1
          },
          {
            id: 'init-note',
            type: 'note',
            content: 'golden sunsets & late night tunes 🎵✨',
            x: 430,
            y: 240,
            rotation: -3,
            scale: 1,
            zIndex: 4
          }
        ]
      }
    ];
  });

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Drawers
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
  const [isPhotoDrawerOpen, setIsPhotoDrawerOpen] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);

  // Text Tool State
  const [customText, setCustomText] = useState('');
  const [customFont, setCustomFont] = useState<'Caveat' | 'Playfair Display' | 'Courier Prime'>('Caveat');
  const [customColor, setCustomColor] = useState('#453127');
  const [customFontSize, setCustomFontSize] = useState(20);

  const currentPage = pages[activePageIndex] || pages[0];

  useEffect(() => {
    try {
      localStorage.setItem('reminiq_scrapbook_pages_v2', JSON.stringify(pages));
    } catch {}
  }, [pages]);

  const updateCurrentPageItems = (newItems: ScrapbookItem[]) => {
    setPages(pages.map((p, idx) => idx === activePageIndex ? { ...p, items: newItems } : p));
  };

  const updateCurrentPageBackground = (bgId: string) => {
    setPages(pages.map((p, idx) => idx === activePageIndex ? { ...p, backgroundId: bgId } : p));
  };

  const bringToFront = (id: string) => {
    const maxZ = Math.max(...currentPage.items.map(i => i.zIndex), 0);
    updateCurrentPageItems(currentPage.items.map(i => i.id === id ? { ...i, zIndex: maxZ + 1 } : i));
  };

  const addSticker = (key: string) => {
    const maxZ = Math.max(...currentPage.items.map(i => i.zIndex), 0);
    const newItem: ScrapbookItem = {
      id: `sticker-${Date.now()}`,
      type: 'sticker',
      content: key,
      stickerKey: key,
      x: 180 + Math.random() * 200,
      y: 120 + Math.random() * 150,
      rotation: (Math.random() - 0.5) * 16,
      scale: 1,
      zIndex: maxZ + 1
    };
    updateCurrentPageItems([...currentPage.items, newItem]);
    setSelectedItemId(newItem.id);
    setIsStickerDrawerOpen(false);
  };

  const addPhoto = (photoUrl: string) => {
    const maxZ = Math.max(...currentPage.items.map(i => i.zIndex), 0);
    const newItem: ScrapbookItem = {
      id: `photo-${Date.now()}`,
      type: 'photo',
      content: photoUrl,
      x: 200 + Math.random() * 160,
      y: 100 + Math.random() * 100,
      rotation: (Math.random() - 0.5) * 12,
      scale: 1,
      zIndex: maxZ + 1
    };
    updateCurrentPageItems([...currentPage.items, newItem]);
    setSelectedItemId(newItem.id);
    setIsPhotoDrawerOpen(false);
  };

  const addCustomText = () => {
    if (!customText.trim()) return;
    const maxZ = Math.max(...currentPage.items.map(i => i.zIndex), 0);
    const newItem: ScrapbookItem = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: customText,
      fontFamily: customFont,
      fontSize: customFontSize,
      color: customColor,
      x: 240 + Math.random() * 100,
      y: 140 + Math.random() * 100,
      rotation: (Math.random() - 0.5) * 6,
      scale: 1,
      zIndex: maxZ + 1
    };
    updateCurrentPageItems([...currentPage.items, newItem]);
    setSelectedItemId(newItem.id);
    setCustomText('');
    setIsTextModalOpen(false);
  };

  const addStickyNote = () => {
    const text = prompt('Enter your handwritten note text:') || 'sweet memories ✨';
    const maxZ = Math.max(...currentPage.items.map(i => i.zIndex), 0);
    const newItem: ScrapbookItem = {
      id: `note-${Date.now()}`,
      type: 'note',
      content: text,
      x: 260 + Math.random() * 100,
      y: 180 + Math.random() * 100,
      rotation: (Math.random() - 0.5) * 8,
      scale: 1,
      zIndex: maxZ + 1
    };
    updateCurrentPageItems([...currentPage.items, newItem]);
    setSelectedItemId(newItem.id);
  };

  const deleteItem = (id: string) => {
    updateCurrentPageItems(currentPage.items.filter(i => i.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const rotateItem = (id: string) => {
    updateCurrentPageItems(currentPage.items.map(i => i.id === id ? { ...i, rotation: (i.rotation + 15) % 360 } : i));
  };

  const addNewPage = () => {
    const newPage: ScrapbookPage = {
      id: `page-${Date.now()}`,
      title: `Page ${pages.length + 1}`,
      backgroundId: 'manila',
      items: []
    };
    setPages([...pages, newPage]);
    setActivePageIndex(pages.length);
  };

  const currentBg = BACKGROUND_OPTIONS.find(b => b.id === currentPage.backgroundId) || BACKGROUND_OPTIONS[0];

  return (
    <div className="relative w-full h-full flex flex-col rounded-3xl overflow-hidden border-2 border-[#c4ab91]/40 shadow-2xl bg-[#faf6f0]">
      
      {/* Studio Top Control Toolbar */}
      <div className="p-3.5 bg-white/90 border-b border-[#c4ab91]/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-30 flex-shrink-0">
        
        {/* Left: Creative Add Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStickerDrawerOpen(!isStickerDrawerOpen)}
            className="btn-aesthetic text-xs py-1.5 px-3.5"
          >
            <Smile size={14} className="text-dusty-rose" /> Add Vector Stickers
          </button>
          <button
            onClick={() => setIsPhotoDrawerOpen(!isPhotoDrawerOpen)}
            className="btn-aesthetic text-xs py-1.5 px-3.5"
          >
            <ImageIcon size={14} className="text-moss" /> Add Photos
          </button>
          <button
            onClick={() => setIsTextModalOpen(true)}
            className="btn-aesthetic text-xs py-1.5 px-3.5"
          >
            <Type size={14} className="text-brown" /> Custom Typography
          </button>
          <button
            onClick={addStickyNote}
            className="btn-aesthetic text-xs py-1.5 px-3.5 hidden sm:inline-flex"
          >
            <FileText size={14} className="text-amber-600" /> Sticky Note
          </button>
        </div>

        {/* Center: Background Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="font-hand text-xs text-brown/70 font-bold mr-1">Paper:</span>
          {BACKGROUND_OPTIONS.slice(0, 5).map(bg => (
            <button
              key={bg.id}
              onClick={() => updateCurrentPageBackground(bg.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-hand transition-all ${
                currentPage.backgroundId === bg.id
                  ? 'bg-moss text-white font-bold shadow-xs'
                  : 'bg-[#eae0ce]/60 text-brown hover:bg-[#eae0ce]'
              }`}
            >
              {bg.name.split(' ')[1] || bg.name}
            </button>
          ))}
        </div>

        {/* Right: Multi-Page Nav & Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#eae0ce]/50 p-1 rounded-full border border-[#c4ab91]/30">
            <button
              onClick={() => setActivePageIndex(Math.max(0, activePageIndex - 1))}
              disabled={activePageIndex === 0}
              className="p-1 rounded-full hover:bg-white text-dark-brown disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-hand text-xs text-dark-brown font-bold px-2">
              {activePageIndex + 1} / {pages.length}
            </span>
            <button
              onClick={() => setActivePageIndex(Math.min(pages.length - 1, activePageIndex + 1))}
              disabled={activePageIndex === pages.length - 1}
              className="p-1 rounded-full hover:bg-white text-dark-brown disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={addNewPage}
              className="p-1 rounded-full bg-moss/20 hover:bg-moss hover:text-white text-moss transition-colors"
              title="Add New Page"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-[#eae0ce]/50 px-2 py-1 rounded-full border border-[#c4ab91]/30">
            <button onClick={() => setZoomLevel(Math.max(0.6, zoomLevel - 0.1))} className="p-1 hover:text-dark-brown text-brown">
              <ZoomOut size={13} />
            </button>
            <span className="font-mono text-[10px] text-brown">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.1))} className="p-1 hover:text-dark-brown text-brown">
              <ZoomIn size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Manila Binder Canvas Workspace */}
      <div 
        onClick={() => setSelectedItemId(null)}
        className="flex-1 relative overflow-auto p-4 sm:p-8 flex items-center justify-center bg-[#4a3933]/15"
      >
        {/* Layered Manila Folder Base with Clip and Side Graph Paper Tab (Reference Match) */}
        <div 
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          className="relative transition-transform duration-200"
        >
          {/* Top Metal Binder Clip */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none drop-shadow-md">
            <MetalBinderClip size={52} />
          </div>

          {/* Pink Grid Tab sticking out from right */}
          <div className="absolute top-12 -right-8 w-16 h-28 bg-[#fff0f0] border-2 border-dashed border-[#e8b4b8] rounded-r-2xl shadow-md z-0 flex items-center justify-center -rotate-3 pointer-events-none">
            <span className="font-hand text-xs text-[#b5838d] font-bold rotate-90 whitespace-nowrap">
              VOL. IV • CRAFT
            </span>
          </div>

          {/* Manila Base Binder Frame */}
          <div className="p-4 sm:p-6 bg-[#dcc8ab] rounded-3xl border-4 border-[#bca080] shadow-[0_20px_50px_rgba(69,49,39,0.35)] relative z-10 min-w-[340px] sm:min-w-[760px] min-h-[580px]">
            
            {/* The Actual Scrapbook Page */}
            <div
              className={`w-full h-full min-h-[540px] rounded-2xl border-2 border-[#bca080]/60 relative overflow-hidden shadow-inner ${currentBg.className}`}
              style={currentBg.style}
            >
              {currentPage.items.map((item) => {
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
                      <div className="bg-white p-3 pb-7 rounded-sm shadow-xl polaroid-shadow border border-light-brown/30 max-w-[210px]">
                        <img src={item.content} alt="Memory" className="w-full h-auto object-cover rounded-xs pointer-events-none" />
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none">
                          <PurplePaperclip size={24} />
                        </div>
                      </div>
                    )}

                    {/* Render Vector Sticker */}
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

                    {/* Render Sticky Note */}
                    {item.type === 'note' && (
                      <div className="bg-[#fff9db] p-4 rounded-xs shadow-lg border border-amber-200/60 max-w-[180px] relative">
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-12 h-3 bg-amber-300/40 -rotate-2 rounded-xs" />
                        <p className="font-hand text-base text-dark-brown leading-snug">
                          {item.content}
                        </p>
                      </div>
                    )}

                    {/* Render Custom Typography */}
                    {item.type === 'text' && (
                      <div 
                        style={{ 
                          fontFamily: item.fontFamily || 'Caveat',
                          fontSize: `${item.fontSize || 20}px`,
                          color: item.color || '#453127'
                        }}
                        className="px-2 py-1 font-bold select-none drop-shadow-xs max-w-[300px] leading-tight"
                      >
                        {item.content}
                      </div>
                    )}

                    {/* Floating Item Actions */}
                    {isSelected && (
                      <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#2c241e]/90 text-white rounded-full px-2 py-1 flex items-center gap-2 shadow-lg backdrop-blur-md z-50">
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
        </div>
      </div>

      {/* Vector Sticker Drawer */}
      <AnimatePresence>
        {isStickerDrawerOpen && (
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-[#c4ab91]/40 shadow-2xl z-40"
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#c4ab91]/20">
              <span className="font-serif font-bold text-dark-brown text-sm italic">
                Choose a Vector Craft Sticker to Stamp (20 Designs):
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
                    className="flex-shrink-0 p-3 rounded-2xl bg-[#eae0ce]/40 hover:bg-[#eae0ce] border border-[#c4ab91]/30 flex flex-col items-center gap-1.5 transition-transform hover:scale-110 active:scale-95 shadow-xs"
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

      {/* Photo Vault Drawer */}
      <AnimatePresence>
        {isPhotoDrawerOpen && (
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-[#c4ab91]/40 shadow-2xl z-40"
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#c4ab91]/20">
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
                  className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-[#c4ab91]/40 hover:scale-105 transition-transform active:scale-95 shadow-sm relative group"
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

      {/* Custom Typography Modal */}
      <AnimatePresence>
        {isTextModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl p-6 border-2 border-[#c4ab91]/50 shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#c4ab91]/30">
                <h3 className="font-serif font-bold text-lg text-dark-brown">Add Custom Typography</h3>
                <button onClick={() => setIsTextModalOpen(false)} className="text-brown/60 hover:text-dark-brown">
                  <X size={18} />
                </button>
              </div>

              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type your poem, memory title, or caption..."
                rows={3}
                className="w-full p-3 rounded-xl border border-[#c4ab91]/40 font-body text-base text-dark-brown focus:outline-none focus:border-moss mb-4"
                style={{ fontFamily: customFont }}
              />

              {/* Font Selection */}
              <div className="mb-4">
                <label className="block font-serif text-xs font-bold text-dark-brown mb-1.5">Font Style:</label>
                <div className="flex gap-2">
                  {[
                    { id: 'Caveat', label: 'Handwriting' },
                    { id: 'Playfair Display', label: 'Classic Serif' },
                    { id: 'Courier Prime', label: 'Typewriter' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setCustomFont(f.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        customFont === f.id ? 'bg-moss text-white border-moss shadow-xs' : 'bg-[#eae0ce]/40 border-[#c4ab91]/30 text-dark-brown'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="mb-4">
                <label className="block font-serif text-xs font-bold text-dark-brown mb-1.5">Color:</label>
                <div className="flex gap-2">
                  {['#453127', '#637756', '#d1a5a5', '#1e1b18', '#708db3', '#bc6c25'].map(c => (
                    <button
                      key={c}
                      onClick={() => setCustomColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        customColor === c ? 'scale-125 border-white ring-2 ring-moss' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Size Slider */}
              <div className="mb-6">
                <div className="flex justify-between text-xs font-serif font-bold text-dark-brown mb-1">
                  <span>Font Size:</span>
                  <span>{customFontSize}px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="44"
                  value={customFontSize}
                  onChange={(e) => setCustomFontSize(Number(e.target.value))}
                  className="w-full accent-moss"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setIsTextModalOpen(false)} className="btn-aesthetic py-2 px-4 text-xs">
                  Cancel
                </button>
                <button onClick={addCustomText} className="btn-aesthetic-primary py-2 px-5 text-xs">
                  Place on Scrapbook
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
