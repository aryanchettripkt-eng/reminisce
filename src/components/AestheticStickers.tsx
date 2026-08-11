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
    <path d="M40 64 C50 59 56 62 60 56 C52 54 44 58 40 62" fill="#94A887" />
    <path d="M40 52 C32 47 28 50 24 44 C31 43 37 46 40 50" fill="#94A887" />
    <path d="M40 44 C48 39 52 42 56 36 C49 35 43 38 40 42" fill="#94A887" />
    <ellipse cx="40" cy="14" rx="7" ry="12" fill="#E6AFB9" opacity="0.85" />
    <ellipse cx="40" cy="30" rx="7" ry="12" fill="#E6AFB9" opacity="0.85" />
    <ellipse cx="32" cy="22" rx="12" ry="7" fill="#E6AFB9" opacity="0.85" />
    <ellipse cx="48" cy="22" rx="12" ry="7" fill="#E6AFB9" opacity="0.85" />
    <circle cx="40" cy="22" r="5" fill="#E9C46A" />
  </svg>
);

// 7. Cursive Washi Tape: "remember this"
export const WashiTapeRemember: React.FC<{ className?: string; width?: number }> = ({ className = '', width = 140 }) => (
  <svg width={width} height={width * 0.24} viewBox="0 0 160 38" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 0 L156 0 L160 38 L0 38 Z" fill="#FCEADE" fillOpacity="0.85" />
    <path d="M4 0 L0 8 L4 16 L0 24 L4 32 L0 38 M156 0 L160 8 L156 16 L160 24 L156 32 L160 38" stroke="#DDA7A5" strokeWidth="1" strokeDasharray="2 2" />
    <text x="80" y="24" textAnchor="middle" fill="#583101" fontFamily="'Caveat', cursive" fontSize="18" fontWeight="600">
      remember this ✨
    </text>
  </svg>
);

// 8. Cursive Washi Tape: "golden hour"
export const WashiTapeGoldenHour: React.FC<{ className?: string; width?: number }> = ({ className = '', width = 140 }) => (
  <svg width={width} height={width * 0.24} viewBox="0 0 160 38" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 0 L156 0 L160 38 L0 38 Z" fill="#FFF1BD" fillOpacity="0.85" />
    <path d="M4 0 L0 8 L4 16 L0 24 L4 32 L0 38 M156 0 L160 8 L156 16 L160 24 L156 32 L160 38" stroke="#D4A373" strokeWidth="1" strokeDasharray="2 2" />
    <text x="80" y="24" textAnchor="middle" fill="#7F4F24" fontFamily="'Caveat', cursive" fontSize="18" fontWeight="600">
      golden hour ☀️
    </text>
  </svg>
);

// 9. Cursive Washi Tape: "cherish this"
export const WashiTapeCherish: React.FC<{ className?: string; width?: number }> = ({ className = '', width = 140 }) => (
  <svg width={width} height={width * 0.24} viewBox="0 0 160 38" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 0 L156 0 L160 38 L0 38 Z" fill="#D8E2DC" fillOpacity="0.85" />
    <path d="M4 0 L0 8 L4 16 L0 24 L4 32 L0 38 M156 0 L160 8 L156 16 L160 24 L156 32 L160 38" stroke="#8F9E89" strokeWidth="1" strokeDasharray="2 2" />
    <text x="80" y="24" textAnchor="middle" fill="#2D3A27" fontFamily="'Caveat', cursive" fontSize="18" fontWeight="600">
      cherish this 🍃
    </text>
  </svg>
);

// 10. Push Pin (Brass / Gold)
export const GoldPushPin: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 28 }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <ellipse cx="15" cy="38" rx="6" ry="2" fill="rgba(0,0,0,0.3)" />
    <path d="M15 20 L15 37" stroke="#718096" strokeWidth="2.5" strokeLinecap="round" />
    <ellipse cx="15" cy="20" rx="9" ry="3.5" fill="#B7791F" stroke="#744210" strokeWidth="1" />
    <path d="M6 20 C6 14 10 10 15 10 C20 10 24 14 24 20 Z" fill="#D69E2E" stroke="#975A16" strokeWidth="1" />
    <circle cx="15" cy="9" r="6" fill="#ECC94B" stroke="#B7791F" strokeWidth="1" />
    <ellipse cx="13" cy="7" rx="2" ry="1.5" fill="#FEFCBF" />
  </svg>
);

// 11. Brass Paperclip
export const BrassPaperClip: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 32 }) => (
  <svg width={size * 0.5} height={size} viewBox="0 0 24 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M8 12 L8 36 C8 41 16 41 16 36 L16 8 C16 3 4 3 4 8 L4 38 C4 46 20 46 20 38 L20 14" stroke="#B7791F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 12 L8 36 C8 41 16 41 16 36 L16 8 C16 3 4 3 4 8 L4 38 C4 46 20 46 20 38 L20 14" stroke="#ECC94B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
  </svg>
);

// 12. Vintage Airmail / Cancellation Stamp
export const AirmailStamp: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="76" height="60" rx="3" fill="#FAF0CA" stroke="#C5A880" strokeWidth="2" strokeDasharray="3 3" />
    <circle cx="40" cy="32" r="22" stroke="#A8423F" strokeWidth="1.8" strokeDasharray="4 2" opacity="0.75" />
    <text x="40" y="30" textAnchor="middle" fill="#A8423F" fontFamily="'Lato', sans-serif" fontSize="8" fontWeight="bold" letterSpacing="1">
      AIR MAIL
    </text>
    <text x="40" y="40" textAnchor="middle" fill="#A8423F" fontFamily="'Caveat', cursive" fontSize="12" fontWeight="bold">
      PARIS • 1984
    </text>
  </svg>
);

// 13. Pastel Pink Heart
export const PastelHeartPink: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M25 42 C25 42 5 28 5 16 C5 8 13 4 19 8 C23 11 25 15 25 15 C25 15 27 11 31 8 C37 4 45 8 45 16 C45 28 25 42 25 42 Z" fill="#F4A261" opacity="0.85" stroke="#E76F51" strokeWidth="1.5" />
  </svg>
);

// 14. Retro iPod Mini / MP3 Player
export const RetroIpodMini: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 56 }) => (
  <svg width={size * 0.65} height={size} viewBox="0 0 65 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="61" height="96" rx="8" fill="#4ea8de" stroke="#1d3557" strokeWidth="2.5" />
    {/* Screen */}
    <rect x="8" y="10" width="49" height="34" rx="4" fill="#a8dadc" stroke="#1d3557" strokeWidth="1.5" />
    <text x="32" y="24" textAnchor="middle" fill="#1d3557" fontFamily="'Caveat', cursive" fontSize="9" fontWeight="bold">Now Playing</text>
    <text x="32" y="36" textAnchor="middle" fill="#1d3557" fontFamily="'Lato', sans-serif" fontSize="7">Bill Evans ♫</text>
    {/* Click Wheel */}
    <circle cx="32.5" cy="70" r="19" fill="#f1faee" stroke="#1d3557" strokeWidth="2" />
    <circle cx="32.5" cy="70" r="7" fill="#4ea8de" stroke="#1d3557" strokeWidth="1.5" />
    <text x="32.5" y="58" textAnchor="middle" fill="#1d3557" fontSize="5" fontWeight="bold">MENU</text>
    <text x="47" y="72" textAnchor="middle" fill="#1d3557" fontSize="6">▶▶</text>
    <text x="18" y="72" textAnchor="middle" fill="#1d3557" fontSize="6">◀◀</text>
    <text x="32.5" y="86" textAnchor="middle" fill="#1d3557" fontSize="6">▶||</text>
  </svg>
);

// 15. Circular Lace / Doily Cutout Frame
export const CircularLaceFrame: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 70 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="46" fill="#fffcf2" stroke="#ccc5b9" strokeWidth="1.5" strokeDasharray="4 3" />
    <circle cx="50" cy="50" r="40" fill="none" stroke="#eb5e28" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
    <circle cx="50" cy="50" r="32" fill="#fffcf2" stroke="#403d39" strokeWidth="1.5" />
    {/* Lace scallops */}
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 30 * Math.PI) / 180;
      const x = 50 + Math.cos(angle) * 44;
      const y = 50 + Math.sin(angle) * 44;
      return <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke="#ccc5b9" strokeWidth="1" />;
    })}
  </svg>
);

// 16. Star Border Frame
export const StarBorderFrame: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 60 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="6" y="6" width="88" height="88" rx="6" fill="#fff9db" stroke="#f59f00" strokeWidth="2" strokeDasharray="6 3" />
    <text x="15" y="20" fill="#f59f00" fontSize="12">★</text>
    <text x="80" y="20" fill="#f59f00" fontSize="12">★</text>
    <text x="15" y="88" fill="#f59f00" fontSize="12">★</text>
    <text x="80" y="88" fill="#f59f00" fontSize="12">★</text>
  </svg>
);

// 17. Red Plaid / Gingham Frame
export const RedPlaidFrame: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 60 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="4" width="92" height="92" rx="4" fill="#fee2e2" stroke="#dc2626" strokeWidth="2.5" />
    <line x1="4" y1="25" x2="96" y2="25" stroke="#ef4444" strokeWidth="2" opacity="0.7" />
    <line x1="4" y1="50" x2="96" y2="50" stroke="#ef4444" strokeWidth="2" opacity="0.7" />
    <line x1="4" y1="75" x2="96" y2="75" stroke="#ef4444" strokeWidth="2" opacity="0.7" />
    <line x1="25" y1="4" x2="25" y2="96" stroke="#ef4444" strokeWidth="2" opacity="0.7" />
    <line x1="50" y1="4" x2="50" y2="96" stroke="#ef4444" strokeWidth="2" opacity="0.7" />
    <line x1="75" y1="4" x2="75" y2="96" stroke="#ef4444" strokeWidth="2" opacity="0.7" />
  </svg>
);

// 18. Vintage Yellow Sticky Note
export const YellowStickyNote: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 50 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 4 L96 4 L96 82 L82 96 L4 96 Z" fill="#fff3bf" stroke="#fcc419" strokeWidth="1.5" />
    <path d="M82 96 L82 82 L96 82 Z" fill="#ffe066" stroke="#fcc419" strokeWidth="1.5" />
    <line x1="16" y1="24" x2="84" y2="24" stroke="#e9ecef" strokeWidth="2" />
    <line x1="16" y1="40" x2="84" y2="40" stroke="#e9ecef" strokeWidth="2" />
    <line x1="16" y1="56" x2="84" y2="56" stroke="#e9ecef" strokeWidth="2" />
  </svg>
);

// 19. Vintage Sunflower
export const VintageSunflower: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 50 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {Array.from({ length: 8 }).map((_, i) => {
      const angle = (i * 45 * Math.PI) / 180;
      const x = 50 + Math.cos(angle) * 25;
      const y = 50 + Math.sin(angle) * 25;
      return <circle key={i} cx={x} cy={y} r="14" fill="#fab005" opacity="0.9" />;
    })}
    <circle cx="50" cy="50" r="20" fill="#5c3d2e" stroke="#3e2316" strokeWidth="2" />
  </svg>
);

// 20. Monarch Butterfly
export const MonarchButterfly: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M50 40 C35 15 5 15 10 45 C12 60 35 65 50 45 Z" fill="#fd7e14" stroke="#212529" strokeWidth="2" />
    <path d="M50 40 C65 15 95 15 90 45 C88 60 65 65 50 45 Z" fill="#fd7e14" stroke="#212529" strokeWidth="2" />
    <ellipse cx="50" cy="45" rx="3" ry="18" fill="#212529" />
    <path d="M48 28 C45 20 40 18 38 15 M52 28 C55 20 60 18 62 15" stroke="#212529" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
