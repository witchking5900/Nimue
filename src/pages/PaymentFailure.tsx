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

  // DEBUGGER: Get parameters
  const debugReason = searchParams.get('reason') || 'unknown';
  const debugOrderId = searchParams.get('order_id') || 'N/A';

  // STATE: "Verifying" mode (to catch false failures)
  const [isVerifying, setIsVerifying] = useState(true);
  const checkCount = useRef(0);

  // --- DOUBLE CHECK LOGIC ---
  useEffect(() => {
    if (!user) {
        setIsVerifying(false);
        return;
    }

    const verifyStatus = async () => {
        // We check the database 5 times (once per second)
        // If the webhook arrives during this time, we save the user from the error screen.
        if (checkCount.current >= 5) {
            setIsVerifying(false); // Time's up, it really failed.
            return;
        }

        console.log(`🕵️‍♂️ Double-checking payment status... Attempt ${checkCount.current + 1}`);
        
        const { data } = await supabase
            .from('profiles')
            .select('tier')
            .eq('id', user.id)
            .single();

        // IF WE FIND MAGUS STATUS -> IT WAS A FALSE ALARM!
        if (data && (data.tier === 'magus' || data.tier === 'grand_magus' || data.tier === 'archmage')) {
            console.log("✨ False Alarm! Payment actually succeeded.");
            navigate(`/payment-success?order_id=${debugOrderId}`); // Redirect to Success
        } else {
            // Still apprentice... try again in 1 second
            checkCount.current++;
            setTimeout(verifyStatus, 1000);
        }
    };

    verifyStatus();
  }, [user, navigate, debugOrderId]);


  // --- TEXT CONFIG ---
  const t = {
    en: {
      title: isMagical ? "Spell Fizzled!" : "Payment Failed",
      desc: isMagical 
        ? "The arcane energies could not be channeled. Your gold remains safe." 
        : "The transaction could not be completed. You have not been charged.",
      reason: "Possible causes: Insufficient funds, bank rejection, or connection loss.",
      retry: "Cast Again",
      back: "Retreat to Safety",
      verifying: "The spell is unstable... Consulting the archives..."
    },
    ka: {
      title: isMagical ? "შელოცვა ჩაიშალა!" : "გადახდა ვერ განხორციელდა",
      desc: isMagical 
        ? "ენერგიის არხი გაწყდა. თქვენი ოქრო უსაფრთხოდ არის." 
        : "ტრანზაქცია ვერ დასრულდა. თანხა არ ჩამოგეჭრათ.",
      reason: "მიზეზები: არასაკმარისი თანხა, ბანკის უარყოფა ან კავშირის ხარვეზი.",
      retry: "თავიდან ცდა",
      back: "უკან დაბრუნება",
      verifying: "შელოცვა არასტაბილურია... მოწმდება არქივები..."
    }
  };

  const text = language === 'ka' ? t.ka : t.en;

  // --- RENDER: LOADING STATE (The "False Alarm" Shield) ---
  if (isVerifying) {
      return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 gap-6 ${isMagical ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            <div className="relative">
                <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                <Loader2 className="animate-spin text-red-500 relative z-10" size={64} />
            </div>
            <p className="text-lg font-bold animate-pulse opacity-80">{text.verifying}</p>
        </div>
      );
  }

  // --- RENDER: ACTUAL FAILURE ---
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
            {text.title}
        </h1>
        
        <p className={`text-lg mb-4 ${isMagical ? 'text-slate-400' : 'text-slate-600'}`}>
           {text.desc}
        </p>

        <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-left text-sm ${
            isMagical ? 'bg-red-900/10 border border-red-500/20 text-red-200' : 'bg-red-50 border border-red-100 text-red-800'
        }`}>
            <AlertTriangle className="shrink-0 mt-0.5" size={16} />
            <p>{text.reason}</p>
        </div>

        {/* ▼▼▼ DEBUGGER BOX ▼▼▼ */}
        <div className="mb-6 p-3 bg-black/80 rounded-lg text-xs font-mono text-left border border-slate-700">
             <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Terminal size={12} /> <span>Bank Response Code:</span>
             </div>
             <div className="text-yellow-400 break-all">
                STATUS: "{debugReason}"
             </div>
             <div className="text-slate-500 mt-1">Order ID: {debugOrderId.slice(0, 8)}...</div>
        </div>
        {/* ▲▲▲ DEBUGGER BOX ▲▲▲ */}

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
              <span>{text.back}</span>
            </button>
        </div>

      </div>
    </div>
  );
}