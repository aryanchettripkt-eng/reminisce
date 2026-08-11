import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  BookOpen, 
  Search, 
  Disc, 
  Calendar, 
  FolderHeart, 
  Music, 
  History,
  Home,
  BookOpen,
  Disc,
  Folder
  FolderHeart,
  Home
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
export default function Taskbar({
  view,
  onViewChange,
  activeOverlay,
  onOverlayChange,
}: TaskbarProps) {
  if (view === 'landing') return null;

  const TABS = [
    {
      id: null,
      label: '3D Space',
      icon: Home,
      action: () => onOverlayChange(null),
      isActive: activeOverlay === null,
    },
    {
      id: 'monthly-pinboard',
      label: 'Monthly Pinboard',
      icon: Calendar,
      action: () => onOverlayChange('monthly-pinboard'),
      isActive: activeOverlay === 'monthly-pinboard' || activeOverlay === 'calendar',
    },
    {
      id: 'vinyl-vault',
      label: 'Vinyl Vault',
      icon: Disc,
      action: () => onOverlayChange('vinyl-vault'),
      isActive: activeOverlay === 'vinyl-vault' || activeOverlay === 'music',
    },
    {
      id: 'scrapbook',
      label: 'Scrapbook',
      icon: BookOpen,
      action: () => onOverlayChange('scrapbook'),
      isActive: activeOverlay === 'scrapbook',
    },
    {
      id: 'ai-search',
      label: 'AI Search',
      icon: Search,
      action: () => onOverlayChange('ai-search'),
      isActive: activeOverlay === 'ai-search' || activeOverlay === 'try-it',
    },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto">
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white/80 backdrop-blur-xl border border-light-brown/30 shadow-[0_15px_35px_rgba(69,49,39,0.15)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = tab.isActive;

          return (
            <button
              key={tab.label}
              onClick={tab.action}
              className={`relative px-4 py-2 rounded-full font-body text-xs font-semibold transition-all duration-300 flex items-center gap-2 ${
                isSelected
                  ? 'text-white shadow-md'
                  : 'text-dark-brown/70 hover:text-dark-brown hover:bg-black/5'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-moss to-[#7a946b] z-0"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon size={15} />
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
