import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTheme } from '../context/ThemeContext';
import { useGameLogic } from '../context/GameContext';
import { useToast } from '../context/ToastContext';

// Game Imports
import ClinicalGame from './ClinicalGame'; 
import ECGGame from './ECGGame'; 
import LabGame from './LabGame'; 
import HemaRangesGame from './HemaRangesGame'; 
import Grimoire from '../pages/Grimoire';

import { 
  Scale, Skull, Zap, FlaskConical, ArrowRight, ChevronLeft, Activity, FileText, 
  Lock, Unlock, AlertTriangle, Feather, Bell, BellRing, Clock, BookOpen, Crown
} from 'lucide-react';

export default function AppsMenu({ onBack }) {
  const { theme, language } = useTheme();
  const { tier, xp, hasAccess, profile } = useGameLogic(); // Removed rentApp
  const { addToast } = useToast();
  
  const isMagical = theme === 'magical';
  const [selectedApp, setSelectedApp] = useState(null);
  const [subscribedApps, setSubscribedApps] = useState([]);

  // --- LOCKDOWN STATE (Kept for Admins) ---
  const [appBlocked, setAppBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState(null);

  const getText = (content) => {
    if (!content) return "";
    if (typeof content === 'string') return content;
    return content[language] || content['en'];
  };

  // --- 0. SECURITY CHECK (Admin Ban Logic) ---
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('apps_blocked_until')
        .eq('id', user.id)
        .single();
      
      if (data?.apps_blocked_until) {
        const blockedUntil = new Date(data.apps_blocked_until);
        if (blockedUntil > new Date()) {
          setAppBlocked(true);
          setBlockTime(blockedUntil);
        }
      }
    };
    checkAccess();
  }, []);

  // --- 1. AUTO-OPEN FROM NOTIFICATIONS ---
  useEffect(() => {
      const pendingGame = localStorage.getItem('pending_game_id');
      if (pendingGame) {
          setSelectedApp(pendingGame);
          localStorage.removeItem('pending_game_id');
      }
  }, []);

  // --- 2. FETCH SUBSCRIPTIONS ---
  useEffect(() => {
      const fetchSubs = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const { data } = await supabase.from('subscriptions').select('category').eq('user_id', user.id);
              if (data) setSubscribedApps(data.map(s => s.category));
          }
      };
      fetchSubs();
  }, []);

  const toggleSubscription = async (e, appCategory) => {
      e.stopPropagation(); 
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (subscribedApps.includes(appCategory)) {
          await supabase.from('subscriptions').delete().match({ user_id: user.id, category: appCategory });
          setSubscribedApps(prev => prev.filter(c => c !== appCategory));
          
          const msg = isMagical 
            ? (language === 'ka' ? "კავშირი გაწყვეტილია." : "Link severed.")
            : (language === 'ka' ? "გამოწერა გაუქმებულია." : "Unsubscribed.");
          addToast(msg);
      } else {
          await supabase.from('subscriptions').insert({ user_id: user.id, category: appCategory });
          setSubscribedApps(prev => [...prev, appCategory]);
          
          const msg = isMagical 
            ? (language === 'ka' ? "ბედი შეკრულია." : "Fate bound.")
            : (language === 'ka' ? "გამოწერილია!" : "Subscribed!");
          addToast(msg);
      }
  };

  // --- APP DEFINITIONS ---
  const APP_CONFIG = [
    {
      id: 'ranges',
      categoryKey: 'Hematology',
      component: <HemaRangesGame onBack={() => setSelectedApp(null)} />,
      icon: Scale, 
      badgeText: { en: "Training", ka: "სავარჯიშო" },
      stdTitle: { en: "Reference Ranges", ka: "ნორმის მაჩვენებლები" },
      stdDesc: { en: "Master hematological values and physiology.", ka: "შეისწავლეთ ჰემატოლოგიური მაჩვენებლები." },
      stdColor: "text-blue-500",
      stdBg: "bg-blue-50",
      magTitle: { en: "Scrolls of Balance", ka: "წონასწორობის გრაგნილები" },
      magDesc: { en: "Fundamental principles of life essence.", ka: "სიცოცხლის ფუნდამენტური პრინციპები." },
      magColor: "text-cyan-400",
      magBg: "bg-cyan-400/10",
    },
    {
      id: 'clinical',
      categoryKey: 'Clinical',
      component: <ClinicalGame onBack={() => setSelectedApp(null)} />,
      icon: isMagical ? Skull : FileText, 
      badgeText: "100 XP", 
      stdTitle: { en: "Clinical Cases", ka: "კლინიკური ქეისები" },
      stdDesc: { en: "Diagnose patients based on real scenarios.", ka: "დასვით დიაგნოზი რეალური ქეისების მიხედვით." },
      stdColor: "text-indigo-500",
      stdBg: "bg-indigo-50",
      magTitle: { en: "Trial of Souls", ka: "სულების გამოცდა" },
      magDesc: { en: "A grueling test of diagnostics. Perfection required.", ka: "დიაგნოსტიკის მძიმე გამოცდა. საჭიროა სრულყოფილება." },
      magColor: "text-purple-400",
      magBg: "bg-purple-400/10",
    },
    {
      id: 'ecg',
      categoryKey: 'ECG',
      component: <ECGGame onBack={() => setSelectedApp(null)} />,
      icon: isMagical ? Zap : Activity, 
      badgeText: "2 XP", 
      stdTitle: { en: "ECG Interpretation", ka: "ეკგ ინტერპრეტაცია" },
      stdDesc: { en: "Rapid rhythm identification training.", ka: "რიტმის სწრაფი ამოცნობის სავარჯიშო." },
      stdColor: "text-red-500",
      stdBg: "bg-red-50",
      magTitle: { en: "Lightning Scrolls", ka: "ელვის გრაგნილები" },
      magDesc: { en: "Quick recognition cases. Fast and simple.", ka: "სწრაფი ამოცნობის ქეისები. მარტივი და სწრაფი." },
      magColor: "text-amber-400",
      magBg: "bg-amber-400/10",
    },
    {
      id: 'labs',
      categoryKey: 'Biochemistry',
      component: <LabGame onBack={() => setSelectedApp(null)} />,
      icon: FlaskConical,
      badgeText: "5 XP", 
      stdTitle: { en: "Lab Analysis", ka: "ლაბორატორიული ანალიზი" },
      stdDesc: { en: "Solve complex biochemical interactions.", ka: "ბიოქიმიური კავშირების ანალიზი." },
      stdColor: "text-emerald-600",
      stdBg: "bg-emerald-50",
      magTitle: { en: "The Alchemist Table", ka: "ალქიმიკოსის მაგიდა" },
      magDesc: { en: "Solve complex potions and interactions.", ka: "ურთულესი ნარევების ამოხსნა." },
      magColor: "text-emerald-400",
      magBg: "bg-emerald-400/10",
    },
    // 🔥 GRIMOIRE OF FAILURES (Kept Tier Lock as Progression, not Restriction) 🔥
    {
      id: 'failures',
      categoryKey: 'Grimoire',
      component: <Grimoire onBack={() => setSelectedApp(null)} />,
      icon: BookOpen,
      badgeText: { en: "Review", ka: "განხილვა" },
      stdTitle: { en: "Grimoire of Failures", ka: "შეცდომების რეესტრი" },
      stdDesc: { en: "Review and cleanse your past mistakes.", ka: "განიხილეთ და გამოასწორეთ შეცდომები." },
      stdColor: "text-rose-500",
      stdBg: "bg-rose-50",
      magTitle: { en: "Grimoire of Failures", ka: "წარუმატებლობის გრიმუარი" },
      magDesc: { en: "The souls you failed to save wait here.", ka: "აქ იმყოფებიან სულები, რომლებიც ვერ გადაარჩინეთ." },
      magColor: "text-rose-500",
      magBg: "bg-rose-900/10",
    }
  ];

  const handleAppClick = (appId) => {
    // 1. Identify Special Conditions
    const isGrimoire = appId === 'failures';
    const isMagusPlus = ['magus', 'grand_magus', 'insubstantial', 'archmage'].includes(tier);

    // 2. Grimoire Progression Check (Kept as game mechanic)
    if (isGrimoire) {
        if (isMagusPlus) {
            setSelectedApp(appId);
        } else {
            addToast(language === 'ka' ? "საჭიროა მაგუსის სტატუსი" : "Requires Magus Rank or higher", "error");
        }
        return;
    }

    // 3. ALL OTHER APPS ARE NOW FREE (Restrictions Removed)
    setSelectedApp(appId);
  };

  // --- RENDER JAIL SCREEN IF BANNED (Kept for Admins) ---
  if (appBlocked) {
    return (
      <div className={`min-h-[80vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in ${isMagical ? 'text-amber-50' : 'text-slate-900'}`}>
        <div className={`p-6 rounded-full mb-6 border-4 animate-pulse ${isMagical ? 'bg-purple-900/20 text-purple-500 border-purple-900/50' : 'bg-red-100 text-red-600 border-red-200'}`}>
          <Lock size={64} />
        </div>
        <h1 className="text-4xl font-bold mb-4 font-serif">
            {isMagical 
                ? (language === 'ka' ? "გრიმუარი დალუქულია" : "Grimoire Sealed")
                : (language === 'ka' ? "წვდომა შეზღუდულია" : "Access Denied")
            }
        </h1>
        <p className="text-xl mb-2 opacity-80">
            {isMagical 
                ? (language === 'ka' ? "არქიმაგმა შეგიჩერათ ბიბლიოთეკით სარგებლობის უფლება." : "The Archmage has revoked your library privileges.")
                : (language === 'ka' ? "ადმინისტრატორმა დაგიბლოკათ აპლიკაციები." : "Administrator has blocked app access.")
            }
        </p>
        <div className={`text-sm px-6 py-3 rounded-xl font-mono mb-8 border ${isMagical ? 'bg-purple-900/20 border-purple-800 text-purple-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {language === 'ka' ? "ბეჭედი აიხსნება:" : "Seals lift on:"} {blockTime?.toLocaleString()}
        </div>
        <button 
          onClick={onBack}
          className={`px-8 py-3 rounded-xl font-bold transition-all border ${isMagical ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'}`}
        >
          {language === 'ka' ? "მთავარი მენიუ" : "Return to Menu"}
        </button>
      </div>
    );
  }

  // --- RENDER NORMAL MENU ---
  const activeApp = APP_CONFIG.find(app => app.id === selectedApp);
  if (activeApp) return activeApp.component;

  return (
    <div className={`w-full max-w-5xl mx-auto animate-in fade-in zoom-in duration-300 p-4 md:p-8 ${isMagical ? 'text-white' : 'text-slate-900'}`}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
         <div className="flex items-center gap-4">
             <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${isMagical ? 'bg-slate-800 border-slate-700 text-amber-100 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                <ChevronLeft size={18} /> {language === 'ka' ? 'მენიუ' : 'Menu'}
             </button>
             <h1 className={`text-3xl font-bold ${isMagical ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500' : 'text-slate-900'}`}>
                {isMagical ? (language === 'ka' ? 'გრიმუარები' : 'Grimoires') : (language === 'ka' ? 'აპლიკაციები' : 'Clinical Apps')}
             </h1>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {APP_CONFIG.map((app) => {
          const Icon = app.icon;
          const isGrimoire = app.id === 'failures';
          const isMagusPlus = ['magus', 'grand_magus', 'insubstantial', 'archmage'].includes(tier);

          // All apps are unlocked except Grimoire (which depends on Tier)
          let unlocked = true;
          if (isGrimoire) unlocked = isMagusPlus;

          const isLocked = !unlocked;
          const isSubscribed = subscribedApps.includes(app.categoryKey);
          
          let cardClasses = isMagical ? 'bg-slate-900 border-slate-800 hover:border-amber-500/50 shadow-lg shadow-black/20' : 'bg-white border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md';
          if (isLocked) cardClasses += " opacity-90 grayscale-[0.3]";

          const badgeClasses = isMagical ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200';
          const titleColor = isMagical ? 'text-white font-serif tracking-wide' : 'text-slate-900 font-sans tracking-tight';
          const descColor = isMagical ? 'text-slate-400' : 'text-slate-500';
          
          // Determine Button Text
          let btnText = "";
          let IconComponent = ArrowRight;

          if (isLocked) {
              if (isGrimoire) {
                  btnText = language === 'ka' ? "საჭიროა მაგუსის რანგი" : "MAGUS & ABOVE";
                  IconComponent = Crown;
              } else {
                  // Should not happen for others anymore, but fallback just in case
                  btnText = language === 'ka' ? "დაბლოკილია" : "LOCKED";
                  IconComponent = Lock;
              }
          } else {
              btnText = isMagical ? (language === 'ka' ? 'წიგნის გახსნა' : 'Open Tome') : (language === 'ka' ? 'გახსნა' : 'Open App');
          }
            
          const btnColor = isLocked
            ? (isMagical ? 'text-slate-500' : 'text-slate-400')
            : (isMagical ? 'text-amber-500 hover:text-amber-400' : 'text-blue-600 hover:text-blue-700');

          return (
            <div key={app.id} onClick={() => handleAppClick(app.id)} className={`relative rounded-[2rem] border-2 transition-all duration-300 group scale-100 hover:scale-[1.02] cursor-pointer ${cardClasses}`}>
              
              <button onClick={(e) => toggleSubscription(e, app.categoryKey)} className={`absolute top-8 right-8 z-30 p-3 rounded-full transition-all border-2 ${isSubscribed ? (isMagical ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/50' : 'bg-blue-500 text-white border-blue-500 shadow-lg') : (isMagical ? 'bg-slate-800 text-slate-500 border-slate-700 hover:text-amber-500 hover:border-amber-500' : 'bg-white text-slate-400 border-slate-200 hover:text-blue-500 hover:border-blue-500')}`} title="Toggle Notifications">
                {isSubscribed ? <BellRing size={20} fill="currentColor" /> : <Bell size={20} />}
              </button>

              <div className="w-full h-full text-left p-8">
                {/* Badge Text */}
                <div className={`absolute bottom-8 right-8 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${badgeClasses} ${isLocked ? (isMagical ? "border-red-900 text-red-400" : "border-red-200 text-red-500") : ""}`}>
                    {isLocked && <Lock size={12} />}
                    {isLocked 
                        ? (isGrimoire 
                            ? (language === 'ka' ? "მხოლოდ მაგუსებისთვის" : "MAGUS ONLY") 
                            : (language === 'ka' ? "დაბლოკილია" : "LOCKED"))
                        : getText(app.badgeText)}
                </div>

                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${isLocked ? 'bg-slate-800 text-slate-500' : `${isMagical ? app.magBg : app.stdBg} ${isMagical ? app.magColor : app.stdColor}`}`}>
                    <Icon size={28} />
                </div>

                <h3 className={`text-2xl font-bold mb-3 flex items-center gap-2 ${isLocked ? 'text-slate-500' : titleColor}`}>
                    {getText(isMagical ? app.magTitle : app.stdTitle)}
                </h3>
                <p className={`text-sm leading-relaxed mb-8 pr-10 ${descColor}`}>
                    {getText(isMagical ? app.magDesc : app.stdDesc)}
                </p>

                <div className={`flex items-center gap-4 font-bold text-sm transition-all group-hover:gap-5 ${btnColor}`}>
                    <div className="flex items-center gap-2">
                        {isLocked && <Unlock size={18} />}
                        {btnText} 
                        {!isLocked && <IconComponent size={18} />}
                    </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}