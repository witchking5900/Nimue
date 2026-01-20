import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCcw, ArrowLeft, AlertTriangle, Terminal, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

export default function PaymentFailure() {
  const { theme, language } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMagical = theme === 'magical';

  // DEBUGGER
  const debugReason = searchParams.get('reason') || 'unknown';
  const debugOrderId = searchParams.get('order_id') || 'N/A';

  // VERIFICATION STATE
  const [isVerifying, setIsVerifying] = useState(true);
  const checkCount = useRef(0);

  // --- DOUBLE CHECK LOGIC ---
  useEffect(() => {
    if (!user) {
        setIsVerifying(false);
        return;
    }

    const verifyStatus = async () => {
        if (checkCount.current >= 5) {
            setIsVerifying(false); 
            return;
        }

        console.log(`🕵️‍♂️ Double-checking payment... Attempt ${checkCount.current + 1}`);
        
        const { data } = await supabase.from('profiles').select('tier').eq('id', user.id).single();

        if (data && (data.tier === 'magus' || data.tier === 'grand_magus' || data.tier === 'archmage')) {
            console.log("✨ False Alarm! Payment succeeded.");
            navigate(`/payment-success?order_id=${debugOrderId}`);
        } else {
            checkCount.current++;
            setTimeout(verifyStatus, 1000);
        }
    };

    verifyStatus();
  }, [user, navigate, debugOrderId]);


  // --- TRANSLATIONS ---
  const t = {
    en: {
      titleMag: "Spell Fizzled!",
      titleStd: "Payment Failed",
      descMag: "The arcane energies could not be channeled. Your gold remains safe.",
      descStd: "The transaction could not be completed. You have not been charged.",
      reasonLabel: "Reason:",
      reasonMag: "The ley lines are blocked or your mana (funds) is insufficient.",
      reasonStd: "Possible causes: Insufficient funds, bank rejection, or connection loss.",
      retry: "Try Again",
      backMag: "Retreat to Safety",
      backStd: "Back to Dashboard",
      verifyingMag: "The spell is unstable... Consulting the archives...",
      verifyingStd: "Verifying transaction status with the bank..."
    },
    ka: {
      titleMag: "შელოცვა ჩაიშალა!",
      titleStd: "გადახდა ვერ განხორციელდა",
      descMag: "ენერგიის არხი გაწყდა. თქვენი ოქრო უსაფრთხოდ არის.",
      descStd: "ტრანზაქცია ვერ დასრულდა. თანხა არ ჩამოგეჭრათ.",
      reasonLabel: "მიზეზი:",
      reasonMag: "მაგიური ხაზები დაბლოკილია ან თქვენი მანა (თანხა) არასაკმარისი.",
      reasonStd: "მიზეზები: არასაკმარისი თანხა, ბანკის უარყოფა ან კავშირის ხარვეზი.",
      retry: "თავიდან ცდა",
      backMag: "უკან დაბრუნება",
      backStd: "მთავარ გვერდზე",
      verifyingMag: "შელოცვა არასტაბილურია... მოწმდება არქივები...",
      verifyingStd: "მიმდინარეობს ტრანზაქციის გადამოწმება..."
    }
  };

  const text = language === 'ka' ? t.ka : t.en;

  // --- RENDER: LOADING ---
  if (isVerifying) {
      return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 gap-6 ${isMagical ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            <div className="relative">
                <div className={`absolute inset-0 blur-xl opacity-20 rounded-full animate-pulse ${isMagical ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                <Loader2 className={`animate-spin relative z-10 ${isMagical ? 'text-red-500' : 'text-blue-600'}`} size={64} />
            </div>
            <p className="text-lg font-bold animate-pulse opacity-80">{isMagical ? text.verifyingMag : text.verifyingStd}</p>
        </div>
      );
  }

  // --- RENDER: FAILURE ---
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isMagical ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className={`max-w-md w-full text-center p-8 rounded-2xl border shadow-2xl relative overflow-hidden ${
        isMagical ? 'bg-slate-900 border-red-500/50' : 'bg-white border-red-100'
      }`}>
        
        {/* Background Effects */}
        {isMagical && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse"></div>}
        
        <div className="mb-6 flex justify-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-lg ${
            isMagical ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-red-50 border-red-200 text-red-500'
          }`}>
            <XCircle className="w-10 h-10" strokeWidth={3} />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-red-500">
            {isMagical ? text.titleMag : text.titleStd}
        </h1>
        
        <p className={`text-lg mb-4 ${isMagical ? 'text-slate-400' : 'text-slate-600'}`}>
           {isMagical ? text.descMag : text.descStd}
        </p>

        <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-left text-sm ${
            isMagical ? 'bg-red-900/10 border border-red-500/20 text-red-200' : 'bg-red-50 border border-red-100 text-red-800'
        }`}>
            <AlertTriangle className="shrink-0 mt-0.5" size={16} />
            <div>
                <span className="font-bold block mb-1">{text.reasonLabel}</span>
                <p>{isMagical ? text.reasonMag : text.reasonStd}</p>
            </div>
        </div>

        {/* DEBUGGER BOX */}
        <div className={`mb-6 p-3 rounded-lg text-xs font-mono text-left border ${isMagical ? 'bg-black/80 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
             <div className="flex items-center gap-2 opacity-50 mb-1">
                <Terminal size={12} /> <span>Bank Response Code:</span>
             </div>
             <div className="text-yellow-600 font-bold break-all">
                STATUS: "{debugReason}"
             </div>
             <div className="opacity-50 mt-1">Order ID: {debugOrderId.slice(0, 8)}...</div>
        </div>

        <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate('/pricing')}
              className={`w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105 ${
                isMagical 
                ? 'bg-red-600 hover:bg-red-500 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <RefreshCcw size={18} />
              <span>{text.retry}</span>
            </button>

            <button 
              onClick={() => navigate('/')}
              className={`w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                isMagical 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <ArrowLeft size={18} />
              <span>{isMagical ? text.backMag : text.backStd}</span>
            </button>
        </div>

      </div>
    </div>
  );
}