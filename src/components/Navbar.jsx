import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useGameLogic } from '../hooks/useGameLogic'; 
import NotificationBell from './NotificationBell'; 
import { useNavigate } from 'react-router-dom'; // ✅ ADDED: Navigation
import { 
  User, Wand2, Stethoscope, Sparkles, Heart, Shield,
  Infinity as InfinityIcon, Crown // Crown is used for the button
} from 'lucide-react';

export default function Navbar({ onOpenProfile }) {
  const { user } = useAuth();
  const { theme, toggleTheme, language, setLanguage } = useTheme();
  const { hearts, username, tier, isInfiniteHearts, maxHearts } = useGameLogic(); 
  const navigate = useNavigate(); // ✅ ADDED: Hook
  
  const isMagical = theme === 'magical';

  // --- GET PROFILE PICTURE ---
  const avatarUrl = user?.user_metadata?.avatar_url;

  // --- CHECK IF USER IS ALREADY PRO ---
  // We hide the button if they are Magus, Grand Magus, Archmage, or Insubstantial
  const isPro = ['magus', 'grand_magus', 'insubstantial', 'archmage'].includes(tier);

  // --- HIERARCHY OF SOULS CONFIG (Standard vs Magical) ---
  const getRankConfig = () => {
    switch(tier) {
        case 'archmage':
            return { 
                title: { 
                    en: isMagical ? "ARCHMAGE" : "DEPT. CHAIR", 
                    ka: isMagical ? "არქიმაგი" : "დეპარტამენტის ხელმძღვანელი" 
                }, 
                color: "text-purple-500", 
                glow: "text-purple-300" 
            };
        case 'insubstantial':
            return { 
                title: { 
                    en: isMagical ? "INSUBSTANTIAL" : "HONORARY FELLOW", 
                    ka: isMagical ? "ილუზორული" : "საპატიო წევრი" 
                }, 
                color: "text-fuchsia-400", 
                glow: "text-fuchsia-200" 
            };
        case 'grand_magus':
            return { 
                title: { 
                    en: isMagical ? "GRAND MAGUS" : "ATTENDING", 
                    ka: isMagical ? "დიდი ჯადოქარი" : "მკურნალი ექიმი" 
                }, 
                color: "text-amber-500", 
                glow: "text-amber-200" 
            };
        case 'magus':
            return { 
                title: { 
                    en: isMagical ? "MAGUS" : "RESIDENT", 
                    ka: isMagical ? "ჯადოქარი" : "რეზიდენტი" 
                }, 
                color: "text-emerald-500", 
                glow: "text-emerald-300" 
            };
        case 'apprentice':
        default:
            return { 
                title: { 
                    en: isMagical ? "APPRENTICE" : "STUDENT", 
                    ka: isMagical ? "შეგირდი" : "სტუდენტი" 
                }, 
                color: isMagical ? "text-amber-600/70" : "text-slate-500", 
                glow: isMagical ? "text-amber-100" : "text-slate-900" 
            };
    }
  };

  const rankConfig = getRankConfig();
  const rankTitle = rankConfig.title[language] || rankConfig.title.en;

  const t = {
    en: { titleMagical: "Grimoire of Medicine", titleStandard: "Medical Dashboard" },
    ka: { titleMagical: "მედიცინის გრიმუარი", titleStandard: "სამედიცინო დაფა" }
  };
  const text = t[language] || t.en;

  return (
    <nav className={`w-full px-4 py-3 border-b sticky top-0 z-50 transition-colors duration-500 ${
      isMagical ? 'bg-slate-950/90 border-amber-900/50 backdrop-blur-md' : 'bg-white/90 border-slate-200 backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center relative">
        {/* LEFT: BRANDING */}
        <div className="flex items-center gap-4 relative z-10">
          <div className={`p-2 rounded-xl hidden md:block ${isMagical ? 'bg-amber-500/10' : 'bg-blue-600/10'}`}>
            {isMagical ? <Sparkles className="text-amber-500" size={24} /> : <Shield className="text-blue-600" size={24} />}
          </div>
          <button onClick={onOpenProfile} className="flex flex-col text-left group transition-transform active:scale-95">
            <h1 className={`text-xl md:text-2xl font-bold leading-tight group-hover:opacity-80 transition-opacity ${isMagical ? 'font-serif text-amber-100' : 'font-sans text-slate-900'}`}>
               {isMagical ? text.titleMagical : text.titleStandard}
            </h1>
            <div className="flex items-center gap-3 text-xs md:text-sm font-medium mt-0.5">
              <span className={`tracking-wider uppercase flex items-center gap-1 ${rankConfig.color}`}>
                {rankTitle}
                <span className={`${rankConfig.glow} font-bold normal-case ml-1 group-hover:underline`}>{username || "..."}</span>
              </span>
              <span className="opacity-30">•</span>
              <div className={`flex items-center gap-1.5 ${isMagical ? 'text-red-400' : 'text-red-600'}`}>
                {isInfiniteHearts ? (
                    <div className="flex items-center gap-1 text-purple-400 animate-pulse">
                        <InfinityIcon size={18} /><span className="font-bold">∞</span>
                    </div>
                ) : (
                    <>
                        <div className="flex gap-0.5">
                        {[...Array(maxHearts || 3)].map((_, i) => (
                            <Heart key={i} size={12} className={i < (hearts || 0) ? "fill-current" : "opacity-30"} />
                        ))}
                        </div>
                        <span className="font-bold">{hearts || 0} / {maxHearts || 3}</span>
                    </>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* CENTER: WATERMARK */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden lg:block">
            <span className={`text-2xl font-black tracking-[0.4em] transition-all duration-500 ${isMagical ? 'font-serif text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)] opacity-90' : 'font-sans text-slate-900 opacity-20' }`}>
                NIMUE
            </span>
        </div>

        {/* RIGHT: CONTROLS */}
        <div className="flex items-center gap-3 relative z-10">
          
          {/* 🔥 NEW UPGRADE BUTTON (Hidden if already Pro) 🔥 */}
          {!isPro && (
             <button 
                onClick={() => navigate('/pricing')}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-xs transition-all transform hover:scale-105 ${
                    isMagical 
                    ? 'bg-gradient-to-r from-amber-700 to-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_20px_rgba(245,158,11,0.6)]' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                }`}
             >
                <Crown size={14} />
                {isMagical ? (language === 'ka' ? 'აღზევება' : 'Ascend') : (language === 'ka' ? 'განახლება' : 'Upgrade')}
             </button>
          )}

          <button onClick={() => setLanguage(language === 'en' ? 'ka' : 'en')} className={`font-bold text-xs px-2 py-1 rounded border transition-all ${isMagical ? 'border-amber-500/30 text-amber-500 hover:bg-amber-900/20' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
            {language.toUpperCase()}
          </button>
          
          <button onClick={() => toggleTheme && toggleTheme()} className={`p-2 rounded-full transition-all ${isMagical ? 'text-amber-400 hover:bg-white/5' : 'text-blue-600 hover:bg-slate-100'}`}>
            {isMagical ? <Stethoscope size={20} /> : <Wand2 size={20} />}
          </button>

          {/* NOTIFICATION BELL (Preserved) */}
          <NotificationBell />
          
          {/* PROFILE BUTTON */}
          <button onClick={onOpenProfile} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-95 ${isMagical ? 'border-amber-500 bg-slate-900 text-amber-200' : 'border-blue-500 bg-blue-50 text-blue-600'}`}>
            {avatarUrl ? (
                <img 
                    src={`${avatarUrl}?t=${Date.now()}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                />
            ) : (
                <User size={20} />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}