import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { CreditCard } from 'lucide-react';

export default function Footer() {
  const { theme, language } = useTheme();
  const isMagical = theme === 'magical';

  const t = {
    about: { en: "About Us", ka: "ჩვენს შესახებ" },
    terms: { en: "Terms & Conditions", ka: "წესები და პირობები" },
    privacy: { en: "Privacy Policy", ka: "კონფიდენციალურობა" },
    refund: { en: "Refund Policy", ka: "დაბრუნების პოლიტიკა" }, // Added explicit Refund link
    pricing: { en: "Pricing", ka: "ტარიფები" } // Added Pricing link
  };

  return (
    <footer className={`w-full py-10 mt-12 border-t ${isMagical ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* LEFT: Copyright & Identity */}
        <div className="flex flex-col items-center md:items-start gap-2">
            <div className="text-sm font-bold opacity-80">
            © {new Date().getFullYear()} Nimue Med LLC
            </div>
            <div className="text-xs opacity-50">
                Tbilisi, Georgia
            </div>
        </div>

        {/* CENTER: Payment Methods (Auditors Look for This!) */}
        <div className="flex items-center gap-4 opacity-70 grayscale hover:grayscale-0 transition-all">
            {/* If you have real SVG logos, use <img src="/visa.svg" /> here. For now, we use text/icons which is usually enough for dev. */}
            <div className="flex items-center gap-1 border px-2 py-1 rounded bg-white/5">
                <CreditCard size={16} /> <span className="text-xs font-bold">VISA</span>
            </div>
            <div className="flex items-center gap-1 border px-2 py-1 rounded bg-white/5">
                <CreditCard size={16} /> <span className="text-xs font-bold">Mastercard</span>
            </div>
        </div>

        {/* RIGHT: Compliance Links */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium">
          <Link to="/about" className="hover:text-amber-500 transition-colors">{t.about[language]}</Link>
          <Link to="/pricing" className="hover:text-amber-500 transition-colors">{t.pricing[language]}</Link>
          <Link to="/legal" className="hover:text-amber-500 transition-colors">{t.terms[language]}</Link>
          <Link to="/legal" className="hover:text-amber-500 transition-colors">{t.privacy[language]}</Link>
          <Link to="/legal" className="hover:text-amber-500 transition-colors">{t.refund[language]}</Link>
        </div>

      </div>
    </footer>
  );
}