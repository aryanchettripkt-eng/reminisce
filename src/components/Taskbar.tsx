import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  BookOpen, 
  Search, 
  Disc, 
  Calendar, 
  FolderHeart,
  Home,
  Folder
} from 'lucide-react';

interface TaskbarProps {
  view: 'landing' | 'vault';
  onViewChange: (view: 'landing' | 'vault') => void;
  activeOverlay: string | null;
  onOverlayChange: (overlay: string | null) => void;
}

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
      label: 'Monthly Folders',
      icon: Calendar,
      action: () => onOverlayChange('monthly-pinboard'),
      isActive: activeOverlay === 'monthly-pinboard' || activeOverlay === 'folders' || activeOverlay === 'calendar',
    },
    {
      id: 'vinyl-vault',
      label: 'Vinyl Vault',
      icon: Disc,
      action: () => onOverlayChange('vinyl-vault'),
      isActive: activeOverlay === 'vinyl-vault' || activeOverlay === 'vinyl' || activeOverlay === 'music',
    },
    {
      id: 'albums',
      label: 'AI Albums',
      icon: FolderHeart,
      action: () => onOverlayChange('albums'),
      isActive: activeOverlay === 'albums',
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
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-full bg-white/90 backdrop-blur-2xl border border-light-brown/30 shadow-[0_15px_35px_rgba(69,49,39,0.15)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = tab.isActive;

          return (
            <button
              key={tab.label}
              onClick={tab.action}
              className={`btn-tactile relative px-3.5 sm:px-4 py-2 rounded-full font-body text-xs font-semibold transition-all duration-300 flex items-center gap-2 ${
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
