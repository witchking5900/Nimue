import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useGameLogic } from '../hooks/useGameLogic'; 
import { AlertTriangle, X, Crown, Sparkles } from 'lucide-react';

export default function ExpirationBanner() {
  const { theme, language } = useTheme();
  
  // 1. Get the signal from GameContext
  const { subscriptionStatus } = useGameLogic(); 
  
  const [isVisible, setIsVisible] = useState(false);
  const isMagical = theme === 'magical';
  
  // Track previous status to detect "Live" changes
  const prevStatusRef = useRef(subscriptionStatus);

  useEffect(() => {
    // Debug Log: Check if the signal is reaching here
    console.log("🔔 BANNER SIGNAL RECEIVED:", subscriptionStatus);

    if (subscriptionStatus === 'expired') {
        // DETECT LIVE EXPIRATION (Status went from Active/Null -> Expired)
        // If this happens while looking at the screen, we FORCE show it.
        if (prevStatusRef.current !== 'expired') {
            console.log("⚡ LIVE EXPIRATION DETECTED - FORCING BANNER");
            sessionStorage.removeItem('nimue_banner_dismissed'); // Reset memory
            setIsVisible(true);
        } 
        // STANDARD CHECK (Page Refresh)
        // If just refreshing, respect the "Dismissed" choice
        else {
            const dismissed = sessionStorage.getItem('nimue_banner_dismissed');
            if (!dismissed) setIsVisible(true);
        }
    } else {
        setIsVisible(false);
    }

    // Update ref for next render
    prevStatusRef.current = subscriptionStatus;
    
  }, [subscriptionStatus]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('nimue_banner_dismissed', 'true');
  };

  if (!isVisible) return null;

  // --- TEXT CONFIG ---
  const t = {
    en: {
      title: isMagical ? "Magical Essence Faded" : "Subscription Expired",
      desc: isMagical 
        ? "Your connection to the Arcane Source has been severed. Restore your status to regain power." 
        : "Your resident plan has ended. Renew now to unlock premium features.",
      btn: isMagical ? "Restore Power" : "Renew Plan"
    },
    ka: {
      title: isMagical ? "ჯადოსნური ენერგია ამოიწურა" : "გამოწერა დასრულდა",
      desc: isMagical 
        ? "თქვენი კავშირი საიდუმლო წყაროსთან გაწყდა. აღადგინეთ სტატუსი ძალების დასაბრუნებლად." 
        : "თქვენი რეზიდენტის გეგმა დასრულდა. განაახლეთ პრემიუმ ფუნქციების მისაღებად.",
      btn: isMagical ? "ძალის აღდგენა" : "განახლება"
    }
  };

  const text = t[language] || t.en;

  // --- STYLES ---
  const standardStyle = "bg-orange-50 border-orange-200 text-orange-900";
  const magicalStyle = "bg-slate-900/90 border-red-500/50 text-red-100 shadow-[0_0_30px_rgba(220,38,38,0.2)] relative overflow-hidden";

  return (
    <div className={`w-full p-4 mb-6 rounded-xl border-l-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500 ${isMagical ? magicalStyle : standardStyle}`}>
      
      {isMagical && (
        <>
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[80px] rounded-full pointer-events-none"></div>
          <Sparkles className="absolute top-2 right-10 text-red-500/20 animate-pulse pointer-events-none" size={48} />
        </>
      )}

      <div className="flex gap-4 relative z-10">
        <div className={`p-2 rounded-lg h-fit ${isMagical ? 'bg-red-900/30 text-red-500' : 'bg-orange-100 text-orange-600'}`}>
          <AlertTriangle size={24} />
        </div>
        <div>
          <h3 className="font-bold text-lg leading-tight mb-1">{text.title}</h3>
          <p className={`text-sm ${isMagical ? 'opacity-70 text-red-200' : 'opacity-80'}`}>{text.desc}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto relative z-10 pl-12 md:pl-0">
        <a 
          href="/pricing" 
          className={`flex-1 md:flex-none whitespace-nowrap px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 ${isMagical ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
        >
          <Crown size={16} /> {text.btn}
        </a>
        <button 
          onClick={handleDismiss} 
          className={`p-2 rounded-lg transition-colors ${isMagical ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-orange-200/50 text-orange-400'}`}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}