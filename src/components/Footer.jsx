import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { CreditCard, Globe } from 'lucide-react';

export default function Footer() {
  const { theme, language } = useTheme();
  const isMagical = theme === 'magical';

  const t = {
    about: { en: "About Us", ka: "ჩვენს შესახებ" },
    terms: { en: "Terms & Conditions", ka: "წესები და პირობები" },
    privacy: { en: "Privacy Policy", ka: "კონფიდენციალურობა" },
    refund: { en: "Refund Policy", ka: "დაბრუნების პოლიტიკა" }, 
    pricing: { en: "Pricing", ka: "ტარიფები" },
    rights: { en: "All Rights Reserved", ka: "ყველა უფლება დაცულია" }
  };

  // Dynamic Styles
  const badgeClass = isMagical 
    ? "bg-white/5 border-white/10 text-slate-400" 
    : "bg-slate-100 border-slate-200 text-slate-600";

  return (
    <footer className={`w-full py-10 mt-12 border-t transition-colors duration-300 ${isMagical ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        
        {/* LEFT: Copyright & Identity */}
        <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
            <div className={`text-sm font-bold ${isMagical ? 'text-amber-500' : 'text-blue-600'}`}>
               Nimue Med LLC
            </div>
            <div className="text-xs opacity-60">
                © {new Date().getFullYear()} • {t.rights[language]}
            </div>
            <div className="text-[10px] opacity-40 flex items-center gap-1">
                <Globe size={10} /> Tbilisi, Georgia
            </div>
        </div>

        {/* CENTER: Payment Methods (Auditors Look for This!) */}
        <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Supported Payments</span>
            <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                {/* 🔥 FIXED: Styling for Light/Dark modes */}
                <div className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-lg select-none ${badgeClass}`}>
                    <CreditCard size={16} /> <span className="text-xs font-bold font-mono">VISA</span>
                </div>
                <div className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-lg select-none ${badgeClass}`}>
                    <CreditCard size={16} /> <span className="text-xs font-bold font-mono">Mastercard</span>
                </div>
            </div>
        </div>

        {/* RIGHT: Compliance Links */}
        <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-3 text-sm font-medium max-w-xs md:max-w-none text-center md:text-right">
          <Link to="/about" className="hover:text-amber-500 transition-colors">{t.about[language]}</Link>
          <Link to="/pricing" className="hover:text-amber-500 transition-colors">{t.pricing[language]}</Link>
          <div className="w-full h-0 md:hidden"></div> {/* Break line on mobile */}
          <Link to="/legal" className="hover:text-amber-500 transition-colors opacity-80 hover:opacity-100">{t.terms[language]}</Link>
          <Link to="/legal" className="hover:text-amber-500 transition-colors opacity-80 hover:opacity-100">{t.privacy[language]}</Link>
          <Link to="/legal" className="hover:text-amber-500 transition-colors opacity-80 hover:opacity-100">{t.refund[language]}</Link>
        </div>

      </div>
    </footer>
  );
}