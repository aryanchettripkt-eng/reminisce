import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Search, 
  Calendar, 
  Disc, 
  BookOpen, 
  Folder, 
  Layers
} from 'lucide-react';

interface TaskbarProps {
  view: 'landing' | 'vault';
  onViewChange: (view: 'landing' | 'vault') => void;
  activeOverlay: string | null;
  onOverlayChange: (overlay: string | null) => void;
}

export default function Taskbar({ view, onViewChange, activeOverlay, onOverlayChange }: TaskbarProps) {
  const navTabs = [
    { 
      id: null, 
      label: '3D Space', 
      icon: <Layers size={19} />, 
      sublabel: 'Room View'
    },
    { 
      id: 'monthly-pinboard', 
      label: 'Monthly Pinboard', 
      icon: <Calendar size={19} />, 
      sublabel: 'Folders & Dates'
    },
    { 
      id: 'vinyl-vault', 
      label: 'Vinyl Vault', 
      icon: <Disc size={19} />, 
      sublabel: 'Music & Spotify'
    },
    { 
      id: 'scrapbook', 
      label: 'Aesthetic Scrapbook', 
      icon: <BookOpen size={19} />, 
      sublabel: 'Stickers & Journal'
    },
    { 
      id: 'ai-search', 
      label: 'AI Search', 
      icon: <Search size={19} />, 
      sublabel: 'Llama Librarian'
    }
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto max-w-[95vw]">
      <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-warm-white/90 backdrop-blur-2xl border-2 border-[#c4ab91]/50 rounded-full shadow-[0_20px_50px_rgba(69,49,39,0.22)] overflow-x-auto no-scrollbar">
        {navTabs.map((tab) => {
          const isActive = activeOverlay === tab.id;

          return (
            <button
              key={tab.label}
              onClick={() => {
                if (view !== 'vault') onViewChange('vault');
                onOverlayChange(tab.id);
              }}
              className={`relative group flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full transition-all duration-300 flex-shrink-0 ${
                isActive
                  ? 'bg-moss text-white shadow-md font-semibold'
                  : 'text-dark-brown/75 hover:text-dark-brown hover:bg-parchment/60 font-medium'
              }`}
            >
              <div className="scale-100 transition-transform group-hover:scale-110">
                {tab.icon}
              </div>

              <span className="font-serif text-xs tracking-wide whitespace-nowrap">
                {tab.label}
              </span>

              {/* Floating Tooltip Sublabel */}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-dark-brown text-cream text-[10px] font-hand rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md hidden sm:block">
                {tab.sublabel}
              </span>

              {isActive && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-moss rounded-full -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
