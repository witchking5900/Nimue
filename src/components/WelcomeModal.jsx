import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Activity, Globe } from 'lucide-react';

export default function WelcomeModal() {
  const { setTheme, language, setLanguage } = useTheme(); 
  const [isOpen, setIsOpen] = useState(false);
  const [remember, setRemember] = useState(false);

  const content = {
    en: {
      title: "Choose Your Path",
      magicBtn: "Magical Approach",
      standardBtn: "Standard Approach",
      remember: "Remember my choice",
      desc: "How do you wish to experience the content?"
    },
    ka: {
      title: "აირჩიე შენი გზა",
      magicBtn: "მაგიური მიდგომა",
      standardBtn: "სტანდარტული მიდგომა",
      remember: "დაიმახსოვრე ჩემი არჩევანი",
      desc: "როგორ გსურთ მასალის განხილვა?"
    }
  };

  const t = content[language];

  useEffect(() => {
    // 1. Check Permanent Storage (Remember Me)
    const savedTheme = localStorage.getItem('nimue-theme-pref');
    
    // 2. Check Session Storage (Just for right now)
    const sessionTheme = sessionStorage.getItem('nimue-theme-session');

    if (savedTheme) {
      setTheme(savedTheme);
      setIsOpen(false);
    } else if (sessionTheme) {
      // If they chose a theme this session (even without 'remember me'), use it
      setTheme(sessionTheme);
      setIsOpen(false);
    } else {
      // Only open if BOTH are empty
      setIsOpen(true); 
    }
  }, [setTheme]);

  const handleChoice = (choice) => {
    setTheme(choice);
    
    // Always save to Session Storage (So it doesn't ask again until they close the tab)
    sessionStorage.setItem('nimue-theme-session', choice);

    // Only save to Local Storage if they checked the box
    if (remember) {
      localStorage.setItem('nimue-theme-pref', choice);
    }
    
    setIsOpen(false);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ka' : 'en');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-700 animate-in zoom-in duration-300 relative">
        
        <button 
          onClick={toggleLanguage}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors flex items-center gap-2 text-xs font-bold shadow-lg border border-slate-600"
        >
          <Globe size={16} />
          <span>{language === 'en' ? 'EN' : 'GE'}</span>
        </button>

        <div className="p-8 text-center bg-slate-900 text-white border-b border-slate-700">
          <h2 className="text-3xl font-bold mb-2">{t.title}</h2>
          <p className="text-slate-400">{t.desc}</p>
        </div>

        <div className="flex flex-col md:flex-row h-64">
          <button 
            onClick={() => handleChoice('standard')}
            className="flex-1 p-6 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-4 group border-b md:border-b-0 md:border-r border-slate-200"
          >
            <div className="p-4 bg-blue-100 rounded-full group-hover:scale-110 transition-transform">
              <Activity size={48} className="text-blue-600" />
            </div>
            <span className="text-xl font-bold text-slate-800">{t.standardBtn}</span>
          </button>

          <button 
            onClick={() => handleChoice('magical')}
            className="flex-1 p-6 hover:bg-amber-50 transition-colors flex flex-col items-center justify-center gap-4 group bg-slate-50"
          >
            <div className="p-4 bg-amber-100 rounded-full group-hover:scale-110 transition-transform">
              <Sparkles size={48} className="text-amber-600" />
            </div>
            <span className="text-xl font-serif font-bold text-amber-900">{t.magicBtn}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-100 flex justify-center border-t border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
            <input 
              type="checkbox" 
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>{t.remember}</span>
          </label>
        </div>

      </div>
    </div>
  );
}