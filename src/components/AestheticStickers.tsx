import React from 'react';

export interface StickerDef {
  id: string;
  name: string;
  category: 'ribbons' | 'seals' | 'botanicals' | 'tapes' | 'cozy' | 'pins';
  component: React.FC<{ className?: string; size?: number }>;
}

export const RibbonBowPink: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 56 }) => (
  <svg width={size} height={size * 0.85} viewBox="0 0 100 85" fill="none" xmlns="http://www.w3.org/2000/svg" className={`filter drop-shadow-md ${className}`}>
    {/* Ribbon Tails */}
    <path d="M42 45 C35 60 20 75 15 82 C22 75 32 72 38 75 C42 66 45 52 46 45 Z" fill="#e8a5a5" stroke="#c98a8a" strokeWidth="1" />
    <path d="M58 45 C65 60 80 75 85 82 C78 75 68 72 62 75 C58 66 55 52 54 45 Z" fill="#e8a5a5" stroke="#c98a8a" strokeWidth="1" />
    <path d="M42 45 C35 60 20 75 15 82" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
    {/* Left Loop */}
    <path d="M48 38 C35 15 10 18 12 36 C14 50 38 45 48 40 Z" fill="#f4b8b8" stroke="#d69292" strokeWidth="1.5" />
    <path d="M44 38 C32 25 18 25 18 35 C18 43 36 42 44 39 Z" fill="#e09999" opacity="0.6" />
    {/* Right Loop */}
    <path d="M52 38 C65 15 90 18 88 36 C86 50 62 45 52 40 Z" fill="#f4b8b8" stroke="#d69292" strokeWidth="1.5" />
    <path d="M56 38 C68 25 82 25 82 35 C82 43 64 42 56 39 Z" fill="#e09999" opacity="0.6" />
    {/* Center Knot */}
    <ellipse cx="50" cy="38" rx="7" ry="8" fill="#d98989" stroke="#b86b6b" strokeWidth="1.5" />
    <ellipse cx="49" cy="36" rx="4" ry="5" fill="#f8c6c6" opacity="0.6" />
  </svg>
);

export const RibbonBowSage: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 56 }) => (
  <svg width={size} height={size * 0.85} viewBox="0 0 100 85" fill="none" xmlns="http://www.w3.org/2000/svg" className={`filter drop-shadow-md ${className}`}>
    <path d="M42 45 C35 60 20 75 15 82 C22 75 32 72 38 75 C42 66 45 52 46 45 Z" fill="#8fa580" stroke="#718663" strokeWidth="1" />
    <path d="M58 45 C65 60 80 75 85 82 C78 75 68 72 62 75 C58 66 55 52 54 45 Z" fill="#8fa580" stroke="#718663" strokeWidth="1" />
    <path d="M48 38 C35 15 10 18 12 36 C14 50 38 45 48 40 Z" fill="#a4ba96" stroke="#7e966f" strokeWidth="1.5" />
    <path d="M52 38 C65 15 90 18 88 36 C86 50 62 45 52 40 Z" fill="#a4ba96" stroke="#7e966f" strokeWidth="1.5" />
    <ellipse cx="50" cy="38" rx="7" ry="8" fill="#718663" stroke="#56694b" strokeWidth="1.5" />
    <ellipse cx="49" cy="36" rx="4" ry="5" fill="#c2d5b6" opacity="0.6" />
  </svg>
);

export const WaxSealRose: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`filter drop-shadow-lg ${className}`}>
    {/* Uneven organic wax edge */}
    <path d="M50 8 C65 6 78 12 86 24 C94 36 96 52 90 66 C84 80 72 90 56 93 C40 96 22 90 14 78 C6 66 4 48 10 34 C16 20 35 10 50 8 Z" fill="#8b3a3a" />
    <path d="M48 12 C62 10 74 15 81 26 C88 37 89 50 84 62 C79 74 68 83 54 85 C40 87 25 82 18 71 C11 60 10 45 15 33 C20 21 35 13 48 12 Z" fill="#a84343" />
    {/* Inner ring impression */}
    <circle cx="50" cy="50" r="30" stroke="#732b2b" strokeWidth="3" fill="#9e3c3c" opacity="0.9" />
    <circle cx="50" cy="50" r="28" stroke="#d46a6a" strokeWidth="1" fill="none" opacity="0.5" />
    {/* Rose Botanical Seal Impression */}
    <path d="M50 35 C44 35 40 40 43 45 C40 45 37 49 39 53 C41 57 45 59 49 59 C50 63 53 66 57 65 C61 64 63 60 62 56 C65 54 67 50 65 46 C63 42 59 41 57 43 C56 38 53 35 50 35 Z" fill="#732b2b" />
    <path d="M50 37 C46 37 42 41 44 45 C47 42 53 42 56 44 C55 40 53 37 50 37 Z" fill="#c25858" />
    <path d="M50 58 L50 68 M47 62 C43 60 41 57 41 57 M53 64 C57 62 59 60 59 60" stroke="#732b2b" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const WaxSealBotanical: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`filter drop-shadow-lg ${className}`}>
    <path d="M50 7 C68 5 82 14 89 28 C96 42 93 58 86 71 C79 84 65 94 49 93 C33 92 18 83 11 69 C4 55 5 38 13 25 C21 12 32 9 50 7 Z" fill="#586c4f" />
    <path d="M48 11 C64 9 76 17 83 29 C90 41 87 55 81 66 C75 77 62 86 48 85 C34 84 21 76 15 64 C9 52 10 37 17 26 C24 15 34 12 48 11 Z" fill="#6d8462" />
    <circle cx="50" cy="50" r="30" stroke="#46573e" strokeWidth="3" fill="#637959" />
    {/* Olive / Fern Branch */}
    <path d="M50 30 Q48 50 50 70" stroke="#3b4b34" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M50 36 Q42 32 38 36 Q44 40 50 40" fill="#46573e" />
    <path d="M50 38 Q58 34 62 38 Q56 42 50 42" fill="#46573e" />
    <path d="M50 46 Q40 43 36 48 Q43 51 50 49" fill="#46573e" />
    <path d="M50 48 Q60 45 64 50 Q57 53 50 51" fill="#46573e" />
    <path d="M50 56 Q42 54 39 59 Q45 61 50 58" fill="#46573e" />
    <path d="M50 58 Q58 56 61 61 Q55 63 50 60" fill="#46573e" />
  </svg>
);

export const CoffeeLatteCup: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 50 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`filter drop-shadow-md ${className}`}>
    {/* Saucer */}
    <ellipse cx="50" cy="80" rx="42" ry="10" fill="#eae0ce" stroke="#c4ab91" strokeWidth="2" />
    <ellipse cx="50" cy="78" rx="34" ry="7" fill="#f4ede2" />
    {/* Cup Body */}
    <path d="M22 36 L28 72 C29 76 34 80 40 80 L60 80 C66 80 71 76 72 72 L78 36 Z" fill="#ffffff" stroke="#c4ab91" strokeWidth="2" />
    {/* Cup Handle */}
    <path d="M76 42 C86 42 90 52 88 62 C86 68 80 70 74 68" stroke="#c4ab91" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    {/* Coffee Liquid */}
    <ellipse cx="50" cy="38" rx="27" ry="9" fill="#7a5438" />
    {/* Latte Foam Art Heart */}
    <path d="M50 36 C47 32 40 33 42 38 C44 42 50 44 50 44 C50 44 56 42 58 38 C60 33 53 32 50 36 Z" fill="#fdfbf7" opacity="0.9" />
    <path d="M50 33 L50 44" stroke="#7a5438" strokeWidth="1" opacity="0.6" />
    {/* Steam lines */}
    <path d="M42 22 Q40 16 44 10" stroke="#c4ab91" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M50 20 Q48 14 52 8" stroke="#c4ab91" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M58 22 Q56 16 60 10" stroke="#c4ab91" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

export const DriedPressedFlower: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 54 }) => (
  <svg width={size} height={size * 1.1} viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={`filter drop-shadow-sm ${className}`}>
    {/* Stem */}
    <path d="M40 35 Q38 60 42 85" stroke="#7a8c6a" strokeWidth="2" strokeLinecap="round" />
    {/* Leaves */}
    <path d="M40 55 Q30 50 26 56 Q34 60 40 58" fill="#8fa580" opacity="0.85" />
    <path d="M41 68 Q52 64 56 70 Q48 73 41 71" fill="#8fa580" opacity="0.85" />
    {/* Pressed Petals */}
    <ellipse cx="40" cy="20" rx="8" ry="16" fill="#f0c2c2" stroke="#d89b9b" strokeWidth="0.8" opacity="0.9" />
    <ellipse cx="27" cy="27" rx="8" ry="15" transform="rotate(-45 27 27)" fill="#f4cece" stroke="#d89b9b" strokeWidth="0.8" opacity="0.85" />
    <ellipse cx="53" cy="27" rx="8" ry="15" transform="rotate(45 53 27)" fill="#f4cece" stroke="#d89b9b" strokeWidth="0.8" opacity="0.85" />
    <ellipse cx="30" cy="40" rx="7" ry="14" transform="rotate(-80 30 40)" fill="#e8b4b4" stroke="#d89b9b" strokeWidth="0.8" opacity="0.85" />
    <ellipse cx="50" cy="40" rx="7" ry="14" transform="rotate(80 50 40)" fill="#e8b4b4" stroke="#d89b9b" strokeWidth="0.8" opacity="0.85" />
    {/* Flower Center */}
    <circle cx="40" cy="32" r="6" fill="#d49b4b" stroke="#aa762d" strokeWidth="1" />
    <circle cx="40" cy="32" r="3" fill="#8c5818" opacity="0.8" />
  </svg>
);

export const WashiTapeRemember: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 110 }) => (
  <svg width={size} height={size * 0.3} viewBox="0 0 140 42" fill="none" xmlns="http://www.w3.org/2000/svg" className={`filter drop-shadow-sm ${className}`}>
    {/* Jagged Tape Ends */}
    <path d="M4 4 L136 4 L134 10 L137 16 L133 22 L138 28 L134 34 L137 38 L3 38 L6 32 L2 26 L5 20 L1 14 L5 8 Z" fill="#edd899" fillOpacity="0.85" stroke="#cbb36c" strokeWidth="1" strokeDasharray="3 3" />
    <text x="70" y="25" textAnchor="middle" fill="#54402d" fontFamily="Caveat, cursive" fontSize="16" fontWeight="bold">remember this ✨</text>
  </svg>
);

export const WashiTapeGoldenHour: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 110 }) => (
  <svg width={size} height={size * 0.3} viewBox="0 0 140 42" fill="none" xmlns="http://www.w3.org/2000/svg" className={`filter drop-shadow-sm ${className}`}>
    <path d="M4 4 L136 4 L134 10 L137 16 L133 22 L138 28 L134 34 L137 38 L3 38 L6 32 L2 26 L5 20 L1 14 L5 8 Z" fill="#d1a5a5" fillOpacity="0.85" stroke="#b07d7d" strokeWidth="1" strokeDasharray="3 3" />
    <text x="70" y="25" textAnchor="middle" fill="#452727" fontFamily="Caveat, cursive" fontSize="16" fontWeight="bold">golden hour ☀️</text>
  </svg>
);

export const WashiTapeCherish: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 110 }) => (
  <svg width={size} height={size * 0.3} viewBox="0 0 140 42" fill="none" xmlns="http://www.w3.org/2000/svg" className={`filter drop-shadow-sm ${className}`}>
    <path d="M4 4 L136 4 L134 10 L137 16 L133 22 L138 28 L134 34 L137 38 L3 38 L6 32 L2 26 L5 20 L1 14 L5 8 Z" fill="#a4ba96" fillOpacity="0.85" stroke="#7e966f" strokeWidth="1" strokeDasharray="3 3" />
    <text x="70" y="25" textAnchor="middle" fill="#2d3d27" fontFamily="Caveat, cursive" fontSize="16" fontWeight="bold">cherish this 🍃</text>
  </svg>
);

export const GoldPushPin: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={`filter drop-shadow-md ${className}`}>
    <ellipse cx="25" cy="20" rx="14" ry="14" fill="#e5b84c" stroke="#aa7e1e" strokeWidth="1.5" />
    <ellipse cx="22" cy="17" rx="7" ry="7" fill="#f9e08b" />
    <ellipse cx="25" cy="20" rx="5" ry="5" fill="#c49326" />
    <path d="M25 34 L25 46" stroke="#6b5830" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const BrassPaperClip: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 38 }) => (
  <svg width={size * 0.55} height={size} viewBox="0 0 35 70" fill="none" xmlns="http://www.w3.org/2000/svg" className={`filter drop-shadow-sm ${className}`}>
    <path d="M12 60 L12 18 C12 10 24 10 24 18 L24 52 C24 58 16 58 16 52 L16 24 C16 20 20 20 20 24 L20 48" stroke="#bfa668" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M12 60 L12 18 C12 10 24 10 24 18 L24 52 C24 58 16 58 16 52 L16 24 C16 20 20 20 20 24 L20 48" stroke="#ffe094" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
  </svg>
);

export const AirmailStamp: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={`filter drop-shadow-sm ${className}`}>
    <circle cx="40" cy="40" r="36" stroke="#8a4b38" strokeWidth="2" strokeDasharray="4 2" fill="none" />
    <circle cx="40" cy="40" r="28" stroke="#8a4b38" strokeWidth="1.5" fill="none" />
    <text x="40" y="26" textAnchor="middle" fill="#8a4b38" fontFamily="Lato, sans-serif" fontSize="8" fontWeight="bold" letterSpacing="2">PAR AVION</text>
    <text x="40" y="44" textAnchor="middle" fill="#8a4b38" fontFamily="Playfair Display, serif" fontSize="13" fontStyle="italic" fontWeight="bold">Reminiq</text>
    <text x="40" y="58" textAnchor="middle" fill="#8a4b38" fontFamily="Lato, sans-serif" fontSize="7" letterSpacing="1">MEMORIES</text>
    <path d="M16 40 L64 40 M18 43 L62 43" stroke="#8a4b38" strokeWidth="1" opacity="0.5" />
  </svg>
);

export const PastelHeartPink: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={`filter drop-shadow-sm ${className}`}>
    <path d="M25 42 C16 33 6 25 6 16 C6 9 12 5 18 5 C22 5 24 8 25 10 C26 8 28 5 32 5 C38 5 44 9 44 16 C44 25 34 33 25 42 Z" fill="#f4a8a8" stroke="#d48080" strokeWidth="1.5" />
    <path d="M14 12 C16 10 19 10 20 12" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
  </svg>
);

export const ALL_STICKERS: StickerDef[] = [
  { id: 'ribbon-pink', name: 'Pink Ribbon Bow', category: 'ribbons', component: RibbonBowPink },
  { id: 'ribbon-sage', name: 'Sage Ribbon Bow', category: 'ribbons', component: RibbonBowSage },
  { id: 'wax-rose', name: 'Rose Wax Seal', category: 'seals', component: WaxSealRose },
  { id: 'wax-botanical', name: 'Botanical Wax Seal', category: 'seals', component: WaxSealBotanical },
  { id: 'coffee-cup', name: 'Latte Art Cup', category: 'cozy', component: CoffeeLatteCup },
  { id: 'pressed-flower', name: 'Pressed Wildflower', category: 'botanicals', component: DriedPressedFlower },
  { id: 'tape-remember', name: '"Remember this" Tape', category: 'tapes', component: WashiTapeRemember },
  { id: 'tape-golden', name: '"Golden Hour" Tape', category: 'tapes', component: WashiTapeGoldenHour },
  { id: 'tape-cherish', name: '"Cherish this" Tape', category: 'tapes', component: WashiTapeCherish },
  { id: 'gold-pin', name: 'Gold Pushpin', category: 'pins', component: GoldPushPin },
  { id: 'paper-clip', name: 'Brass Paperclip', category: 'pins', component: BrassPaperClip },
  { id: 'airmail-stamp', name: 'Airmail Stamp', category: 'seals', component: AirmailStamp },
  { id: 'heart-pink', name: 'Pastel Heart', category: 'cozy', component: PastelHeartPink },
];
