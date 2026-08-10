import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Search, 
  Calendar, 
  FolderHeart, 
  Music, 
  History,
  Home,
  BookOpen,
  Disc,
  Folder
} from 'lucide-react';

interface TaskbarProps {
  view: 'landing' | 'vault';
  onViewChange: (view: 'landing' | 'vault') => void;
  activeOverlay: string | null;
  onOverlayChange: (overlay: string | null) => void;
}

export default function Taskbar({ view, onViewChange, activeOverlay, onOverlayChange }: TaskbarProps) {
  const items = [
    { id: 'home', icon: <Home size={20} />, label: 'Home', type: 'view' },
    { id: 'folders', icon: <Folder size={20} />, label: 'Monthly Folders', type: 'overlay' },
    { id: 'vinyl', icon: <Disc size={20} />, label: 'Vinyl Vault', type: 'overlay' },
    { id: 'albums', icon: <FolderHeart size={20} />, label: 'Albums', type: 'overlay' },
    { id: 'calendar', icon: <Calendar size={20} />, label: 'Calendar', type: 'overlay' },
    { id: 'timeline', icon: <History size={20} />, label: 'Timeline', type: 'overlay' },
    { id: 'try-it', icon: <Search size={20} />, label: 'Search', type: 'overlay' },
    { id: 'scrapbook', icon: <BookOpen size={20} />, label: 'Scrapbook', type: 'overlay' }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 sm:gap-4 px-5 sm:px-7 py-3 bg-white/90 backdrop-blur-2xl border border-light-brown/25 rounded-full shadow-2xl pointer-events-auto max-w-[95vw] overflow-x-auto no-scrollbar">
      {items.map((item) => {
        const isActive = activeOverlay === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'home') {
                onViewChange('landing');
                onOverlayChange(null);
              } else {
                onOverlayChange(activeOverlay === item.id ? null : item.id);
              }
            }}
            className={`btn-tactile relative group flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all flex-shrink-0 ${
              isActive 
                ? 'bg-moss text-cream shadow-inner scale-105' 
                : 'text-brown hover:bg-black/5'
            }`}
          >
            <div className="scale-100 sm:scale-110 transition-transform group-hover:scale-120">
              {item.icon}
            </div>
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-dark-brown text-cream text-[11px] font-hand rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap hidden sm:block shadow-lg border border-white/10 z-50">
              {item.label}
            </span>
            {isActive && (
              <motion.div 
                layoutId="active-pill"
                className="absolute inset-0 bg-moss rounded-full -z-10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
