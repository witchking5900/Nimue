import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, ArrowRight, Shield, Star, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

export default function PaymentSuccess() {
  const { theme, language } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMagical = theme === 'magical';

  const [purchasedTier, setPurchasedTier] = useState<string | null>(null);

  // 1. Fetch the actual tier to decide what text to show
  useEffect(() => {
    if (!user) return;
    const fetchTier = async () => {
        const { data } = await supabase.from('profiles').select('tier').eq('id', user.id).single();
        if (data) setPurchasedTier(data.tier);
    };
    fetchTier();
  }, [user]);

  // 2. Auto-redirect after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 6000);
    return () => clearTimeout(timer);
  }, [navigate]);

  // --- TRANSLATIONS ---
  const t = {
    en: {
      titleMag: "Oath Sworn!",
      titleStd: "Payment Successful!",
      descMag: "Your powers have awakened. The realm awaits your command.",
      descStd: "Your subscription is now active. Welcome aboard.",
      statusLabel: "New Status",
      
      // Magus (Standard)
      rankMag_M: "Magus",
      rankStd_M: "Resident",
      
      // Grand Magus (Lifetime)
      rankMag_GM: "Grand Magus",
      rankStd_GM: "Attending Physician",

      btnMag: "Return to Realm",
      btnStd: "Back to Dashboard"
    },
    ka: {
      titleMag: "ფიცი დადებულია!",
      titleStd: "გადახდა წარმატებულია!",
      descMag: "თქვენი ძალები გააქტიურდა. სამყარო გელოდებათ.",
      descStd: "თქვენი გამოწერა გააქტიურებულია. კეთილი იყოს თქვენი მობრძანება.",
      statusLabel: "ახალი სტატუსი",
      
      // Magus (Standard)
      rankMag_M: "ჯადოქარი",
      rankStd_M: "რეზიდენტი",

      // Grand Magus (Lifetime)
      rankMag_GM: "დიდი ჯადოქარი",
      rankStd_GM: "მკურნალი ექიმი",

      btnMag: "სამყაროში დაბრუნება",
      btnStd: "დაბრუნება"
    }
  };

  const text = language === 'ka' ? t.ka : t.en;

  // Helper to determine the display title based on tier + theme
  const getRankTitle = () => {
      if (purchasedTier === 'grand_magus') {
          return isMagical ? text.rankMag_GM : text.rankStd_GM;
      }
      // Default to Magus if still loading or regular Magus
      return isMagical ? text.rankMag_M : text.rankStd_M;
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isMagical ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className={`max-w-md w-full text-center p-8 rounded-2xl border shadow-2xl relative overflow-hidden ${
        isMagical ? 'bg-slate-900 border-amber-500/50' : 'bg-white border-blue-100'
      }`}>
        
        {/* Animated Top Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>
        
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-500 shadow-lg animate-bounce">
            <Check className="text-green-600 w-10 h-10" strokeWidth={3} />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">
            {isMagical ? text.titleMag : text.titleStd}
        </h1>
        
        <p className={`text-lg mb-8 ${isMagical ? 'text-slate-400' : 'text-slate-600'}`}>
           {isMagical ? text.descMag : text.descStd}
        </p>

        {/* Status Box */}
        <div className={`p-4 rounded-xl mb-8 flex items-center gap-4 text-left ${
            isMagical ? 'bg-amber-900/20 border border-amber-500/30' : 'bg-blue-50 border border-blue-100'
        }`}>
            <div className={`p-2 rounded-full ${isMagical ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'}`}>
                {/* Icon Logic: Crown for Grand Magus, Star/Shield for others */}
                {purchasedTier === 'grand_magus' 
                    ? <Crown size={24} /> 
                    : (isMagical ? <Star size={24} /> : <Shield size={24} />)
                }
            </div>
            <div>
                <p className="text-xs opacity-70 uppercase tracking-wider">{text.statusLabel}</p>
                <p className="font-bold text-lg flex items-center gap-2">
                    {purchasedTier ? getRankTitle() : <Loader2 className="animate-spin" size={16}/>}
                </p>
            </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className={`w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105 ${
            isMagical 
            ? 'bg-amber-600 hover:bg-amber-500 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <span>{isMagical ? text.btnMag : text.btnStd}</span>
          <ArrowRight size={18} />
        </button>

      </div>
    </div>
  );
}