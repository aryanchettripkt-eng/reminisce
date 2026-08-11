import React from 'react';

// 1. Cute aesthetic pastel pink satin ribbon bow
export const RibbonBowPink: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size * 0.75} viewBox="0 0 100 75" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M50 35 C38 10 10 15 15 38 C18 52 40 42 50 37 Z" fill="#F4C2C2" stroke="#DDA7A5" strokeWidth="1.5" />
    <path d="M48 35 C38 18 20 22 22 36 C24 45 40 40 48 36 Z" fill="#FCE4EC" opacity="0.6" />
    <path d="M50 35 C62 10 90 15 85 38 C82 52 60 42 50 37 Z" fill="#F4C2C2" stroke="#DDA7A5" strokeWidth="1.5" />
    <path d="M52 35 C62 18 80 22 78 36 C76 45 60 40 52 36 Z" fill="#FCE4EC" opacity="0.6" />
    <path d="M46 38 C40 50 30 65 20 72 C28 68 36 68 40 70 C44 58 48 45 48 38 Z" fill="#E8B4B8" stroke="#DDA7A5" strokeWidth="1.5" />
    <path d="M54 38 C60 50 70 65 80 72 C72 68 64 68 60 70 C56 58 52 45 52 38 Z" fill="#E8B4B8" stroke="#DDA7A5" strokeWidth="1.5" />
    <ellipse cx="50" cy="36" rx="7" ry="6" fill="#E5989B" stroke="#B5838D" strokeWidth="1.5" />
    <ellipse cx="50" cy="35" rx="4" ry="3" fill="#FCE4EC" opacity="0.8" />
  </svg>
);

// 2. Sage green satin ribbon bow
export const RibbonBowSage: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size * 0.75} viewBox="0 0 100 75" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M50 35 C38 10 10 15 15 38 C18 52 40 42 50 37 Z" fill="#B7C9B1" stroke="#8F9E89" strokeWidth="1.5" />
    <path d="M48 35 C38 18 20 22 22 36 C24 45 40 40 48 36 Z" fill="#D8E2DC" opacity="0.6" />
    <path d="M50 35 C62 10 90 15 85 38 C82 52 60 42 50 37 Z" fill="#B7C9B1" stroke="#8F9E89" strokeWidth="1.5" />
    <path d="M52 35 C62 18 80 22 78 36 C76 45 60 40 52 36 Z" fill="#D8E2DC" opacity="0.6" />
    <path d="M46 38 C40 50 30 65 20 72 C28 68 36 68 40 70 C44 58 48 45 48 38 Z" fill="#A5B89F" stroke="#8F9E89" strokeWidth="1.5" />
    <path d="M54 38 C60 50 70 65 80 72 C72 68 64 68 60 70 C56 58 52 45 52 38 Z" fill="#A5B89F" stroke="#8F9E89" strokeWidth="1.5" />
    <ellipse cx="50" cy="36" rx="7" ry="6" fill="#8F9E89" stroke="#6B705C" strokeWidth="1.5" />
    <ellipse cx="50" cy="35" rx="4" ry="3" fill="#D8E2DC" opacity="0.8" />
  </svg>
);

// 3. Botanical embossed wax seal
export const WaxSealBotanical: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M50 8 C68 6 88 18 92 36 C96 54 86 82 68 90 C50 98 22 92 12 76 C2 60 6 32 20 18 C34 4 42 9 50 8 Z" fill="#A85751" filter="drop-shadow(0px 3px 4px rgba(0,0,0,0.25))" />
    <circle cx="50" cy="50" r="34" fill="#93433D" stroke="#7A2E29" strokeWidth="2" />
    <circle cx="50" cy="50" r="30" fill="none" stroke="#C2716B" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
    <path d="M50 68 C50 50 50 32 50 32" stroke="#E39691" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M50 55 C42 50 38 42 42 36 C48 38 50 48 50 55 Z" fill="#E39691" opacity="0.9" />
    <path d="M50 46 C58 41 62 33 58 27 C52 29 50 39 50 46 Z" fill="#E39691" opacity="0.9" />
    <path d="M50 36 C45 30 46 22 50 20 C54 22 55 30 50 36 Z" fill="#E39691" opacity="0.9" />
  </svg>
);

// 4. Rose embossed wax seal
export const WaxSealRose: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M50 7 C70 5 90 20 93 40 C96 60 84 85 65 92 C46 99 18 90 10 72 C2 54 8 28 22 15 C36 2 44 8 50 7 Z" fill="#B07D62" filter="drop-shadow(0px 3px 4px rgba(0,0,0,0.25))" />
    <circle cx="50" cy="50" r="34" fill="#9C6644" stroke="#7F4F24" strokeWidth="2" />
    <circle cx="50" cy="50" r="30" fill="none" stroke="#DDB892" strokeWidth="1.5" opacity="0.7" />
    <path d="M50 40 C46 38 43 42 44 46 C45 52 56 50 58 44 C60 36 48 32 40 37 C30 43 34 60 48 64 C62 68 70 52 66 40" stroke="#EDE0D4" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 5. Cozy Latte Art Cup
export const CoffeeLatteCup: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <ellipse cx="50" cy="52" rx="38" ry="38" fill="#EAE2B7" stroke="#D4A373" strokeWidth="3" />
    <circle cx="50" cy="52" r="30" fill="#9C6644" stroke="#7F4F24" strokeWidth="2" />
    <path d="M50 42 C46 34 36 34 36 44 C36 54 50 64 50 64 C50 64 64 54 64 44 C64 34 54 34 50 42 Z" fill="#FAEDCD" opacity="0.95" />
    <path d="M42 16 C40 10 44 6 42 2" stroke="#CCD5AE" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <path d="M54 18 C52 12 56 8 54 4" stroke="#CCD5AE" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
  </svg>
);

// 6. Dried pressed wildflower & fern
export const DriedPressedFlower: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 52 }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M40 92 C40 60 40 30 40 22" stroke="#8C9A7D" strokeWidth="2" strokeLinecap="round" />
    <path d="M40 70 C30 65 24 68 20 62 C28 60 36 64 40 68" fill="#94A887" />
    <path d="M40 55 C50 50 56 53 60 47 C52 45 44 49 40 53" fill="#94A887" />
    <path d="M40 40 C32 36 26 39 22 34 C30 32 37 36 40 38" fill="#94A887" />
    <circle cx="40" cy="18" r="14" fill="#E9D8A6" stroke="#DDA15E" strokeWidth="1.5" />
    <circle cx="40" cy="18" r="6" fill="#BC6C25" />
  </svg>
);

// 7. Retro iPod Mini / MP3 Player (Reference Design Match)
export const RetroIpodMini: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 56 }) => (
  <svg width={size} height={size * 1.5} viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Body */}
    <rect x="8" y="6" width="64" height="108" rx="14" fill="url(#ipodGrad)" stroke="#4A6572" strokeWidth="2" filter="drop-shadow(0 6px 8px rgba(0,0,0,0.25))" />
    {/* LCD Screen */}
    <rect x="16" y="16" width="48" height="34" rx="4" fill="#C5D3C1" stroke="#334E68" strokeWidth="1.5" />
    <rect x="20" y="22" width="28" height="4" rx="1" fill="#486581" opacity="0.8" />
    <rect x="20" y="28" width="40" height="3" rx="1" fill="#627D98" opacity="0.6" />
    <rect x="20" y="38" width="40" height="2" rx="1" fill="#829AB1" opacity="0.5" />
    <rect x="20" y="38" width="18" height="2" rx="1" fill="#243B53" />
    {/* Click Wheel */}
    <circle cx="40" cy="80" r="22" fill="#F0F4F8" stroke="#BCCCDC" strokeWidth="1.5" />
    <circle cx="40" cy="80" r="8" fill="#D9E2EC" stroke="#9FB3C8" strokeWidth="1" />
    {/* Wheel labels */}
    <text x="40" y="66" textAnchor="middle" fontSize="6" fill="#627D98" fontFamily="sans-serif" fontWeight="bold">MENU</text>
    <path d="M24 80 L28 77 L28 83 Z" fill="#627D98" />
    <path d="M56 80 L52 77 L52 83 Z" fill="#627D98" />
    <path d="M38 94 L42 94 M40 91 L40 97" stroke="#627D98" strokeWidth="1.5" strokeLinecap="round" />
    <defs>
      <linearGradient id="ipodGrad" x1="8" y1="6" x2="72" y2="114" gradientUnits="userSpaceOnUse">
        <stop stopColor="#708DB3" />
        <stop offset="1" stopColor="#486581" />
      </linearGradient>
    </defs>
  </svg>
);

// 8. Circular Lace / Doily Cutout Frame (Reference Design Match)
export const LaceDoilyFrame: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 68 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="60" cy="60" r="54" fill="#FFFDF9" stroke="#E2D9C8" strokeWidth="1.5" />
    {Array.from({ length: 16 }).map((_, i) => {
      const angle = (i * 360) / 16;
      return (
        <circle
          key={i}
          cx={60 + 52 * Math.cos((angle * Math.PI) / 180)}
          cy={60 + 52 * Math.sin((angle * Math.PI) / 180)}
          r="6"
          fill="#FFFDF9"
          stroke="#D8CEBC"
          strokeWidth="1.2"
        />
      );
    })}
    <circle cx="60" cy="60" r="42" fill="none" stroke="#D8CEBC" strokeWidth="1" strokeDasharray="3 3" />
    <circle cx="60" cy="60" r="34" fill="#F7F2E7" stroke="#C4AB91" strokeWidth="1" />
  </svg>
);

// 9. Star Border Frame - Olive Green (Reference Design Match)
export const StarBorderOliveFrame: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 64 }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="6" y="6" width="88" height="108" rx="6" fill="#F6F7F2" stroke="#6B7A5D" strokeWidth="3" />
    <rect x="14" y="14" width="72" height="74" rx="3" fill="#E8ECE1" stroke="#8FA07E" strokeWidth="1.5" />
    {/* Small decorative stars around border */}
    {[
      { x: 10, y: 10 }, { x: 50, y: 8 }, { x: 90, y: 10 },
      { x: 10, y: 50 }, { x: 90, y: 50 },
      { x: 10, y: 110 }, { x: 50, y: 112 }, { x: 90, y: 110 },
    ].map((pt, i) => (
      <polygon key={i} points={`${pt.x},${pt.y-3} ${pt.x+2},${pt.y-1} ${pt.x+4},${pt.y-1} ${pt.x+2},${pt.y+1} ${pt.x+3},${pt.y+3} ${pt.x},${pt.y+2} ${pt.x-3},${pt.y+3} ${pt.x-2},${pt.y+1} ${pt.x-4},${pt.y-1} ${pt.x-2},${pt.y-1}`} fill="#6B7A5D" />
    ))}
  </svg>
);

// 10. Star Border Frame - Espresso Brown
export const StarBorderBrownFrame: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 64 }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="6" y="6" width="88" height="108" rx="6" fill="#FAF6EE" stroke="#5D4037" strokeWidth="3" />
    <rect x="14" y="14" width="72" height="74" rx="3" fill="#EFEBE4" stroke="#8D6E63" strokeWidth="1.5" />
    {[
      { x: 10, y: 10 }, { x: 50, y: 8 }, { x: 90, y: 10 },
      { x: 10, y: 110 }, { x: 50, y: 112 }, { x: 90, y: 110 },
    ].map((pt, i) => (
      <polygon key={i} points={`${pt.x},${pt.y-3} ${pt.x+2},${pt.y-1} ${pt.x+4},${pt.y-1} ${pt.x+2},${pt.y+1} ${pt.x+3},${pt.y+3} ${pt.x},${pt.y+2} ${pt.x-3},${pt.y+3} ${pt.x-2},${pt.y+1} ${pt.x-4},${pt.y-1} ${pt.x-2},${pt.y-1}`} fill="#5D4037" />
    ))}
  </svg>
);

// 11. Red Gingham & Lace Frame (Reference Design Match)
export const GinghamLaceFrame: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 64 }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="6" y="6" width="88" height="108" rx="4" fill="#C53030" stroke="#9B2C2C" strokeWidth="2" />
    {/* Gingham grid overlays */}
    <rect x="6" y="6" width="88" height="108" rx="4" fill="url(#ginghamPat)" opacity="0.75" />
    <rect x="16" y="16" width="68" height="72" rx="2" fill="#FFFDF9" stroke="#E2E8F0" strokeWidth="1.5" />
    <defs>
      <pattern id="ginghamPat" width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#FEB2B2" />
        <rect x="6" y="6" width="6" height="6" fill="#FEB2B2" />
      </pattern>
    </defs>
  </svg>
);

// 12. Purple Paperclip
export const PurplePaperclip: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 32 }) => (
  <svg width={size} height={size * 1.6} viewBox="0 0 40 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 24 L12 50 C12 56 28 56 28 50 L28 14 C28 6 18 6 18 14 L18 44 C18 48 24 48 24 44 L24 22" stroke="#805AD5" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

// 13. Metallic Foldback Binder Clip
export const MetalBinderClip: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 38 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Body */}
    <path d="M12 28 L48 28 L44 52 L16 52 Z" fill="#1A202C" stroke="#171923" strokeWidth="2" />
    {/* Wire Arms */}
    <path d="M22 28 L22 12 C22 8 30 8 30 12 L30 28" fill="none" stroke="#CBD5E0" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M38 28 L38 12 C38 8 30 8 30 12 L30 28" fill="none" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 14. Yellow Sticky Note
export const YellowStickyNote: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6 6 L74 6 L74 62 L60 74 L6 74 Z" fill="#FEFCBF" stroke="#ECC94B" strokeWidth="1.5" filter="drop-shadow(0 3px 4px rgba(0,0,0,0.15))" />
    <path d="M60 62 L74 62 L60 74 Z" fill="#D69E2E" opacity="0.7" />
    <line x1="16" y1="22" x2="56" y2="22" stroke="#D69E2E" strokeWidth="1.5" opacity="0.6" />
    <line x1="16" y1="34" x2="64" y2="34" stroke="#D69E2E" strokeWidth="1.5" opacity="0.6" />
    <line x1="16" y1="46" x2="48" y2="46" stroke="#D69E2E" strokeWidth="1.5" opacity="0.6" />
  </svg>
);

// 15. Golden Sunflower
export const SunflowerBloom: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 360) / 12;
      return (
        <ellipse
          key={i}
          cx={40 + 20 * Math.cos((angle * Math.PI) / 180)}
          cy={40 + 20 * Math.sin((angle * Math.PI) / 180)}
          rx="10"
          ry="5"
          transform={`rotate(${angle + 90} ${40 + 20 * Math.cos((angle * Math.PI) / 180)} ${40 + 20 * Math.sin((angle * Math.PI) / 180)})`}
          fill="#D69E2E"
          stroke="#B7791F"
          strokeWidth="1"
        />
      );
    })}
    <circle cx="40" cy="40" r="14" fill="#744210" stroke="#521B41" strokeWidth="1.5" />
    <circle cx="40" cy="40" r="10" fill="#521B41" opacity="0.7" />
  </svg>
);

// 16. Vintage Monarch Butterfly
export const VintageButterfly: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size * 0.75} viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M40 30 C30 10 10 12 12 32 C14 42 28 44 40 35 Z" fill="#DD6B20" stroke="#7B341E" strokeWidth="1.5" />
    <path d="M40 30 C50 10 70 12 68 32 C66 42 52 44 40 35 Z" fill="#DD6B20" stroke="#7B341E" strokeWidth="1.5" />
    <path d="M40 35 C32 40 24 50 30 56 C38 56 40 45 40 35 Z" fill="#C05621" stroke="#7B341E" strokeWidth="1.5" />
    <path d="M40 35 C48 40 56 50 50 56 C42 56 40 45 40 35 Z" fill="#C05621" stroke="#7B341E" strokeWidth="1.5" />
    <ellipse cx="40" cy="34" rx="2.5" ry="12" fill="#2D3748" />
  </svg>
);

// 17. Coffee Ring Stain
export const CoffeeRingStain: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="38" stroke="#9C6644" strokeWidth="4" opacity="0.35" strokeDasharray="18 4 32 6 8 3" />
    <circle cx="50" cy="50" r="40" stroke="#7F4F24" strokeWidth="1.5" opacity="0.25" />
  </svg>
);

// 18. Washi Tape Remember
export const WashiTapeRemember: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 80 }) => (
  <svg width={size} height={size * 0.3} viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2 4 L118 4 L116 32 L4 32 Z" fill="#E9D8A6" stroke="#D4A373" strokeWidth="1" strokeDasharray="4 2" opacity="0.88" />
    <text x="60" y="22" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="14" fill="#7A5E45" fontWeight="bold">remember this ✨</text>
  </svg>
);

// 19. Washi Tape Golden Hour
export const WashiTapeGoldenHour: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 80 }) => (
  <svg width={size} height={size * 0.3} viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 2 L116 2 L118 34 L2 34 Z" fill="#F4A261" stroke="#E76F51" strokeWidth="1" opacity="0.85" />
    <text x="60" y="23" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="14" fill="#FFFFFF" fontWeight="bold">golden hour 🌅</text>
  </svg>
);

// 20. Washi Tape Cherish
export const WashiTapeCherish: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 80 }) => (
  <svg width={size} height={size * 0.3} viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2 6 L118 2 L116 30 L4 34 Z" fill="#E8B4B8" stroke="#DDA7A5" strokeWidth="1" opacity="0.88" />
    <text x="60" y="22" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="14" fill="#6D597A" fontWeight="bold">cherish forever 🌸</text>
  </svg>
);

// Push Pins & Clips
export const GoldPushPin: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="16" cy="14" r="8" fill="#DDA15E" stroke="#BC6C25" strokeWidth="1.5" />
    <circle cx="14" cy="12" r="3" fill="#FEFAE0" opacity="0.7" />
    <path d="M16 22 L16 30" stroke="#7F4F24" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const BrassPaperClip: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 28 }) => (
  <svg width={size} height={size * 1.5} viewBox="0 0 30 45" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M8 18 L8 34 C8 38 20 38 20 34 L20 10 C20 4 12 4 12 10 L12 30 C12 33 16 33 16 30 L16 15" stroke="#DDA15E" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const AirmailStamp: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 60 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="56" height="44" rx="2" fill="#F6F4EB" stroke="#C4AB91" strokeWidth="1.5" strokeDasharray="3 3" />
    <rect x="6" y="6" width="48" height="36" fill="#94D2BD" opacity="0.3" />
    <circle cx="30" cy="24" r="10" fill="#E76F51" opacity="0.6" />
    <text x="30" y="27" textAnchor="middle" fontFamily="sans-serif" fontSize="8" fill="#264653" fontWeight="bold">AIR MAIL</text>
  </svg>
);

export const PastelHeartPink: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M20 12 C16 4 6 4 6 14 C6 24 20 34 20 34 C20 34 34 24 34 14 C34 4 24 4 20 12 Z" fill="#F4A261" stroke="#E76F51" strokeWidth="1.5" />
  </svg>
);
