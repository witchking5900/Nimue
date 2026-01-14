import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Eye, ShieldAlert, Lock } from 'lucide-react';

export default function SecurityOverlay({ children }) {
  const { theme, language } = useTheme();
  const [isBlurry, setIsBlurry] = useState(false);
  const isMagical = theme === 'magical';

  // --- TRANSLATIONS ---
  const t = {
    magical: {
      en: { title: "The Grimoire is Closed", desc: "The arcane script fades when unobserved to protect its secrets." },
      ka: { title: "გრიმუარი დახურულია", desc: "საიდუმლო ცოდნა იმალება, როდესაც მას არ უყურებთ." }
    },
    standard: {
      en: { title: "Security Protocol Active", desc: "Display hidden to protect patient confidentiality (HIPAA/GDPR)." },
      ka: { title: "უსაფრთხოების რეჟიმი", desc: "ეკრანი დაბურულია პაციენტის კონფიდენციალობის დასაცავად." }
    }
  };

  const text = isMagical 
    ? (t.magical[language] || t.magical.en) 
    : (t.standard[language] || t.standard.en);

  useEffect(() => {
    // --- 1. DISABLE CONTEXT MENU (Right Click) ---
    const handleContextMenu = (e) => e.preventDefault();
    
    // --- 2. DISABLE SHORTCUTS ---
    const handleKeyDown = (e) => {
      // Block: Ctrl+C, Ctrl+S, Ctrl+P, Ctrl+U, PrintScreen, F12
      if (
        (e.ctrlKey || e.metaKey) && ['c', 's', 'p', 'u', 'a'].includes(e.key.toLowerCase()) ||
        e.key === 'PrintScreen' || 
        e.key === 'F12'
      ) {
        e.preventDefault();
        // We don't alert anymore to avoid spamming the user, we just block it silently
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // --- 3. FOCUS LOSS DETECTION (The "Blur") ---
    const handleVisibilityChange = () => {
      if (document.hidden) setIsBlurry(true);
      else setIsBlurry(false);
    };

    // When clicking out of the browser window (e.g. to Snip & Sketch)
    const handleBlur = () => setIsBlurry(true);
    
    // When clicking back in
    const handleFocus = () => setIsBlurry(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <div 
      className="relative w-full h-full select-none" // CSS: Disable Text Selection
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
    >
      {/* BLACKOUT CURTAIN */}
      {isBlurry && (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200 ${isMagical ? 'bg-slate-950 text-amber-500' : 'bg-slate-900 text-white'}`}>
          
          <div className={`mb-6 p-6 rounded-full ${isMagical ? 'bg-amber-900/20' : 'bg-blue-900/30'}`}>
            {isMagical ? <Eye size={64} /> : <Lock size={64} />}
          </div>

          <h2 className={`text-3xl font-bold mb-4 ${isMagical ? 'font-serif tracking-wide' : 'font-sans'}`}>
            {text.title}
          </h2>
          
          <p className={`max-w-md text-lg ${isMagical ? 'text-amber-500/60' : 'text-slate-400'}`}>
            {text.desc}
          </p>

          {/* Fake "Resume" button to encourage clicking back */}
          <div className={`mt-12 px-6 py-2 rounded-full border text-sm opacity-50 ${isMagical ? 'border-amber-900 text-amber-700' : 'border-slate-700 text-slate-500'}`}>
            {language === 'ka' ? 'დააწკაპუნეთ გასაგრძელებლად' : 'Click anywhere to resume'}
          </div>
        </div>
      )}
      
      {/* APP CONTENT */}
      <div className={isBlurry ? 'blur-sm grayscale opacity-0' : ''}>
        {children}
      </div>
    </div>
  );
}