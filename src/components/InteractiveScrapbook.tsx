import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Memory } from '../lib/groq';
import { 
  Heart, 
  Sparkles, 
  Image as ImageIcon, 
  Trash2, 
  RotateCw, 
  Layers, 
  Plus, 
  Type, 
  Palette, 
  Download, 
  RefreshCw,
  Move,
  X
} from 'lucide-react';
import { 
  ALL_STICKERS, 
  BrassPaperClip, 
  GoldPushPin, 
  WashiTapeRemember, 
  WashiTapeGoldenHour, 
  WashiTapeCherish 
} from './AestheticStickers';

interface PlacedScrapbookItem {
  id: string;
  type: 'photo' | 'sticker' | 'note';
  dataId: string; // memory ID or sticker ID or note text
  extraText?: string;
  noteColor?: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  zIndex: number;
}

const CANVAS_THEMES = [
  { id: 'linen', name: 'Linen Journal', class: 'linen-board' },
  { id: 'cream', name: 'Warm Cream', class: 'bg-[#faf6f0]' },
  { id: 'cork', name: 'Vintage Cork', class: 'cork-board' },
  { id: 'kraft', name: 'Kraft Paper', class: 'bg-[#dfc8ab]' }
];

export default function InteractiveScrapbook({ memories }: { memories: Memory[] }) {
  const [placedItems, setPlacedItems] = useState<PlacedScrapbookItem[]>([]);
  const [activeDrawer, setActiveDrawer] = useState<'stickers' | 'photos' | 'notes' | 'themes'>('stickers');
  const [canvasTheme, setCanvasTheme] = useState('linen');
  const [maxZ, setMaxZ] = useState(10);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteColor, setNewNoteColor] = useState('#fff8db');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('reminiq_aesthetic_scrapbook');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPlacedItems(parsed);
        const highestZ = parsed.reduce((max: number, item: PlacedScrapbookItem) => Math.max(max, item.zIndex), 10);
        setMaxZ(highestZ);
      } catch (e) {
        console.error("Failed to parse scrapbook layout", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (placedItems.length > 0) {
      localStorage.setItem('reminiq_aesthetic_scrapbook', JSON.stringify(placedItems));
    } else {
      localStorage.removeItem('reminiq_aesthetic_scrapbook');
    }
  }, [placedItems]);

  const handleAddItem = (type: 'photo' | 'sticker' | 'note', dataId: string, extra?: { text?: string; color?: string }) => {
    const newZ = maxZ + 1;
    setMaxZ(newZ);

    const offsetX = (Math.random() - 0.5) * 140;
    const offsetY = (Math.random() - 0.5) * 120;
    const rotation = (Math.random() - 0.5) * 16;

    const newItem: PlacedScrapbookItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      dataId,
      extraText: extra?.text,
      noteColor: extra?.color || '#fff8db',
      x: offsetX,
      y: offsetY,
      rotation,
      scale: 1,
      zIndex: newZ
    };

    setPlacedItems(prev => [...prev, newItem]);
    setSelectedItemId(newItem.id);
  };

  const handleRemoveItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPlacedItems(prev => prev.filter(i => i.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const handleRotateItem = (id: string, deltaDeg: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPlacedItems(prev => prev.map(item => item.id === id ? { ...item, rotation: item.rotation + deltaDeg } : item));
  };

  const handleScaleItem = (id: string, deltaScale: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPlacedItems(prev => prev.map(item => item.id === id ? { ...item, scale: Math.max(0.6, Math.min(2.0, item.scale + deltaScale)) } : item));
  };

  const bringToFront = (id: string) => {
    const newZ = maxZ + 1;
    setMaxZ(newZ);
    setPlacedItems(prev => prev.map(item => item.id === id ? { ...item, zIndex: newZ } : item));
    setSelectedItemId(id);
  };

  const handleClearAll = () => {
    if (window.confirm("Clear this entire scrapbook canvas?")) {
      setPlacedItems([]);
      setSelectedItemId(null);
    }
  };

  const renderItemContent = (item: PlacedScrapbookItem) => {
    if (item.type === 'sticker') {
      const stickerDef = ALL_STICKERS.find(s => s.id === item.dataId);
      if (!stickerDef) return null;
      const Comp = stickerDef.component;
      return <Comp size={68} />;
    }

    if (item.type === 'photo') {
      const memory = memories.find(m => m.id === item.dataId);
      if (!memory) return null;

      return (
        <div className="bg-white p-3 pb-8 rounded-sm shadow-xl border border-light-brown/40 w-52 pointer-events-auto">
          {/* Paperclip decoration on top */}
          <div className="absolute -top-4 left-6 pointer-events-none">
            <BrassPaperClip size={28} />
          </div>

          <div className="aspect-[4/3] bg-zinc-900 overflow-hidden mb-2 rounded-xs">
            {memory.photoUrl ? (
              <img src={memory.photoUrl} alt={memory.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 font-hand">
                {memory.title}
              </div>
            )}
          </div>
          <p className="font-hand text-sm text-dark-brown font-bold truncate">{memory.title}</p>
          <span className="text-[10px] font-serif text-film-orange italic block">
            {new Date(memory.date).toLocaleDateString()}
          </span>
        </div>
      );
    }

    if (item.type === 'note') {
      return (
        <div
          className="p-4 rounded-sm shadow-lg border border-black/10 w-48 pointer-events-auto"
          style={{ backgroundColor: item.noteColor || '#fff8db' }}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <GoldPushPin size={24} />
          </div>
          <p className="font-hand text-lg text-dark-brown font-bold leading-snug whitespace-pre-wrap">
            {item.extraText || item.dataId}
          </p>
        </div>
      );
    }

    return null;
  };

  const currentThemeClass = CANVAS_THEMES.find(t => t.id === canvasTheme)?.class || 'linen-board';

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[750px] rounded-3xl overflow-hidden border-4 border-[#c4ab91]/60 shadow-2xl bg-warm-white">
      
      {/* Left / Bottom Control Drawer */}
      <div className="w-full lg:w-80 bg-warm-white/95 border-b lg:border-b-0 lg:border-r border-light-brown/30 p-5 flex flex-col z-20 flex-shrink-0">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-light-brown/20">
          <div>
            <h3 className="font-serif text-xl font-bold text-dark-brown italic">Scrapbook Studio</h3>
            <p className="font-hand text-xs text-brown">Customize stickers, photos & notes</p>
          </div>
          <button
            onClick={handleClearAll}
            className="text-xs font-hand text-red-700 hover:text-red-900 p-1.5 rounded hover:bg-red-50"
            title="Clear canvas"
          >
            Clear All
          </button>
        </div>

        {/* Drawer Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-parchment/60 rounded-xl mb-4 border border-light-brown/30">
          <button
            onClick={() => setActiveDrawer('stickers')}
            className={`py-1.5 rounded-lg text-xs font-body font-bold transition-all ${
              activeDrawer === 'stickers' ? 'bg-white shadow-xs text-dark-brown' : 'text-brown/70 hover:text-dark-brown'
            }`}
          >
            🎀 Stickers
          </button>
          <button
            onClick={() => setActiveDrawer('photos')}
            className={`py-1.5 rounded-lg text-xs font-body font-bold transition-all ${
              activeDrawer === 'photos' ? 'bg-white shadow-xs text-dark-brown' : 'text-brown/70 hover:text-dark-brown'
            }`}
          >
            📷 Photos
          </button>
          <button
            onClick={() => setActiveDrawer('notes')}
            className={`py-1.5 rounded-lg text-xs font-body font-bold transition-all ${
              activeDrawer === 'notes' ? 'bg-white shadow-xs text-dark-brown' : 'text-brown/70 hover:text-dark-brown'
            }`}
          >
            📝 Notes
          </button>
          <button
            onClick={() => setActiveDrawer('themes')}
            className={`py-1.5 rounded-lg text-xs font-body font-bold transition-all ${
              activeDrawer === 'themes' ? 'bg-white shadow-xs text-dark-brown' : 'text-brown/70 hover:text-dark-brown'
            }`}
          >
            🎨 Paper
          </button>
        </div>

        {/* Drawer Panel Contents */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeDrawer === 'stickers' && (
            <div className="grid grid-cols-3 gap-3">
              {ALL_STICKERS.map(sticker => {
                const Comp = sticker.component;
                return (
                  <motion.button
                    key={sticker.id}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddItem('sticker', sticker.id)}
                    className="p-3 rounded-2xl bg-cream/70 hover:bg-cream border border-light-brown/30 flex flex-col items-center justify-center shadow-xs transition-all"
                  >
                    <Comp size={44} />
                    <span className="text-[10px] font-hand text-dark-brown font-bold mt-1 truncate max-w-full">
                      {sticker.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {activeDrawer === 'photos' && (
            <div className="space-y-3">
              {memories.map(mem => (
                <div
                  key={mem.id}
                  onClick={() => handleAddItem('photo', mem.id)}
                  className="flex items-center gap-3 p-2 rounded-xl bg-cream/60 hover:bg-cream border border-light-brown/30 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  {mem.photoUrl ? (
                    <img src={mem.photoUrl} alt={mem.title} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-parchment/60 flex items-center justify-center text-brown">
                      <ImageIcon size={18} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-serif text-sm font-bold text-dark-brown truncate">{mem.title}</p>
                    <span className="text-[11px] font-hand text-brown/70">{mem.mood}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeDrawer === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="font-serif text-xs font-semibold text-dark-brown uppercase tracking-wider block mb-1">
                  Handwritten Note Text:
                </label>
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Write a sweet memory, quote, or reminder..."
                  rows={3}
                  className="w-full p-3 bg-white border border-light-brown/40 rounded-xl font-hand text-lg text-dark-brown placeholder-brown/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-serif text-xs font-semibold text-dark-brown uppercase tracking-wider block mb-1">
                  Sticky Note Color:
                </label>
                <div className="flex items-center gap-2">
                  {['#fff8db', '#fce1e4', '#e2ece9', '#e8e8f8', '#faebd7'].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewNoteColor(color)}
                      className={`w-7 h-7 rounded-full border transition-transform ${
                        newNoteColor === color ? 'scale-125 border-dark-brown shadow-sm' : 'border-black/20'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (newNoteText.trim()) {
                    handleAddItem('note', newNoteText, { text: newNoteText, color: newNoteColor });
                    setNewNoteText('');
                  }
                }}
                disabled={!newNoteText.trim()}
                className="w-full btn-aesthetic-primary text-xs"
              >
                <Plus size={14} /> Pin Sticky Note
              </button>
            </div>
          )}

          {activeDrawer === 'themes' && (
            <div className="space-y-3">
              {CANVAS_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setCanvasTheme(theme.id)}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    canvasTheme === theme.id
                      ? 'border-moss bg-moss/10 font-bold text-moss'
                      : 'border-light-brown/30 bg-white/70 text-dark-brown hover:bg-white'
                  }`}
                >
                  <span className="font-serif text-sm">{theme.name}</span>
                  {canvasTheme === theme.id && <span className="text-xs">✓ Active</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Scrapbook Canvas */}
      <div
        ref={containerRef}
        className={`flex-1 relative min-h-[500px] overflow-hidden ${currentThemeClass} p-8 flex items-center justify-center`}
      >
        {/* Subtle Decorative Desk Elements */}
        <div className="absolute top-6 left-6 pointer-events-none opacity-40">
          <WashiTapeRemember size={140} />
        </div>
        <div className="absolute top-6 right-6 pointer-events-none opacity-40">
          <WashiTapeGoldenHour size={140} />
        </div>

        {placedItems.length === 0 && (
          <div className="text-center p-8 border-2 border-dashed border-[#c4ab91]/60 rounded-3xl bg-white/40 max-w-md pointer-events-none">
            <Sparkles size={36} className="mx-auto text-moss mb-2 animate-pulse" />
            <h4 className="font-serif text-xl font-bold text-dark-brown italic">Your Creative Canvas</h4>
            <p className="font-hand text-base text-brown mt-1">
              Select cute ribbon bows, wax seals, photos, or handwritten notes from the left panel to pin them here.
            </p>
          </div>
        )}

        {/* Render Placed Items */}
        {placedItems.map(item => {
          const isSelected = selectedItemId === item.id;

          return (
            <motion.div
              key={item.id}
              drag
              dragConstraints={containerRef}
              dragElastic={0.05}
              whileDrag={{ scale: 1.06, cursor: 'grabbing' }}
              onClick={() => bringToFront(item.id)}
              style={{
                position: 'absolute',
                left: `calc(50% + ${item.x}px)`,
                top: `calc(50% + ${item.y}px)`,
                transform: `rotate(${item.rotation}deg) scale(${item.scale})`,
                zIndex: item.zIndex
              }}
              className={`cursor-grab select-none transition-shadow ${
                isSelected ? 'ring-2 ring-moss ring-offset-2 rounded-sm shadow-2xl' : ''
              }`}
            >
              {renderItemContent(item)}

              {/* Item Action Floating Tooltip when Selected */}
              {isSelected && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full shadow-xl border border-light-brown/40 flex items-center gap-1.5 z-50 pointer-events-auto"
                >
                  <button
                    onClick={(e) => handleRotateItem(item.id, -15, e)}
                    className="p-1 hover:bg-parchment/60 rounded text-dark-brown text-xs font-bold"
                    title="Rotate Counter-Clockwise"
                  >
                    ↺
                  </button>
                  <button
                    onClick={(e) => handleRotateItem(item.id, 15, e)}
                    className="p-1 hover:bg-parchment/60 rounded text-dark-brown text-xs font-bold"
                    title="Rotate Clockwise"
                  >
                    ↻
                  </button>
                  <button
                    onClick={(e) => handleScaleItem(item.id, -0.1, e)}
                    className="p-1 hover:bg-parchment/60 rounded text-dark-brown text-xs font-bold"
                    title="Smaller"
                  >
                    -
                  </button>
                  <button
                    onClick={(e) => handleScaleItem(item.id, 0.1, e)}
                    className="p-1 hover:bg-parchment/60 rounded text-dark-brown text-xs font-bold"
                    title="Larger"
                  >
                    +
                  </button>
                  <button
                    onClick={(e) => handleRemoveItem(item.id, e)}
                    className="p-1 hover:bg-red-50 text-red-700 rounded text-xs"
                    title="Remove item"
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
  );
}
