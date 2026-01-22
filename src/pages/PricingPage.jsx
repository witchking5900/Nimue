import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Sparkles, Crown, Loader2, Zap, ChevronLeft, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabaseClient';

// ▼▼▼ CONTROL PANEL ▼▼▼
// ⚠️ SET TO FALSE FOR LAUNCH (Enable later for promotions)
const IS_LIFETIME_DEAL_ACTIVE = false; 

export default function PricingPage() {
  const { theme, language } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMagical = theme === 'magical';
  
  const [currentTier, setCurrentTier] = useState('apprentice');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false); 
  const [verifying, setVerifying] = useState(false);
  
  // FIX: Prevent double-firing in Strict Mode
  const hasVerified = useRef(false);
  
  const [selectedPeriod, setSelectedPeriod] = useState('1_month');

  // --- 1. SMART INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        const query = new URLSearchParams(location.search);
        const paymentStatus = query.get('payment');

        // IF COMING BACK FROM BANK (Success OR Fail):
        if (paymentStatus) {
            // Prevent double run
            if (hasVerified.current) return;
            hasVerified.current = true;

            console.log("🔹 Payment Return Detected. Starting Verification Loop...");
            setVerifying(true);
            
            // WE ALWAYS RUN THE LOOP, even if paymentStatus is 'fail'
            // This fixes the Race Condition where web loads before webhook.
            await verifyPaymentLoop(paymentStatus);
        } else {
            // NORMAL LOAD
            await checkStatus();
        }
    };

    init();
  }, [user, location.search]);

  // Standard check
  const checkStatus = async () => {
    const { data } = await supabase.from('profiles').select('tier').eq('id', user.id).single();
    if (data) setCurrentTier(data.tier || 'apprentice');
    setLoading(false);
  };

  // --- 2. VERIFICATION LOOP (POLLING) ---
  const verifyPaymentLoop = async (statusFromUrl) => {
    // Clear URL to prevent re-running on refresh
    window.history.replaceState({}, document.title, window.location.pathname);

    let attempts = 0;
    const maxAttempts = 30; // 30 Seconds

    const pollDatabase = async () => {
        console.log(`Checking Database... Attempt ${attempts + 1}/${maxAttempts}`);
        
        const { data } = await supabase.from('profiles').select('tier').eq('id', user.id).single();
        const freshTier = data?.tier || 'apprentice';

        // SUCCESS: Database says we are Magus!
        if (freshTier === 'magus' || freshTier === 'grand_magus' || freshTier === 'archmage') {
            setCurrentTier(freshTier);
            setVerifying(false);
            setLoading(false);
            alert(language === 'ka' ? "გადახდა წარმატებულია!" : "Payment Successful!");
            return;
        }

        // RETRY: Still apprentice...
        attempts++;
        if (attempts < maxAttempts) {
            // Wait 1 second and try again
            setTimeout(pollDatabase, 1000); 
        } else {
            // TIMEOUT: We waited 30 seconds and still nothing.
            setVerifying(false);
            setLoading(false);
            setCurrentTier(freshTier);
            
            // NOW we decide what message to show
            if (statusFromUrl === 'success') {
                // URL said success, DB says no -> Likely slow DB
                alert(language === 'ka' 
                    ? "გადახდა მიღებულია, მაგრამ ბაზა აგვიანებს. განაახლეთ გვერდი 1 წუთში." 
                    : "Payment received, but database is slow. Please refresh in 1 minute."
                );
            } else {
                // URL said fail AND DB says no -> Actual failure
                alert(language === 'ka' ? "გადახდა ვერ განხორციელდა." : "Payment Failed.");
            }
        }
    };

    // Start the loop immediately
    pollDatabase();
  };

  // --- 3. PAYMENT TRIGGER ---
  const handleSubscribe = async (price, period) => {
    if (!user) {
        alert(language === 'ka' ? "გთხოვთ გაიაროთ ავტორიზაცია" : "You must log in to subscribe.");
        navigate('/login');
        return;
    }

    try {
        setProcessing(true);

        const { data, error } = await supabase.functions.invoke('bog-payment', {
            body: { 
                action: 'create_order', 
                amount: price, 
                user_id: user.id, 
                period: period 
            }
        });

        if (error) throw error;

        if (data?.payment_url) {
            window.location.href = data.payment_url;
        } else {
            throw new Error("No payment URL received.");
        }

    } catch (error) {
        console.error("Payment error:", error);
        alert(`⚠️ PAYMENT ERROR: ${error.message}`);
        setProcessing(false);
    }
  };

  // --- UI RENDERERS ---
  if (verifying) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
            <Loader2 className="animate-spin text-amber-500 relative z-10" size={64} />
          </div>
          <div className="text-center">
            <h2 className="text-white text-2xl font-bold mb-2 animate-pulse">
                {language === 'ka' ? "მოწმდება გადახდა..." : "Verifying Payment..."}
            </h2>
            <p className="text-slate-400 text-sm">
                {language === 'ka' ? "გთხოვთ დაელოდოთ ბანკის დასტურს..." : "Waiting for bank confirmation..."}
            </p>
          </div>
      </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;

  const t = {
    en: {
        backMag: "Return to Realm", backStd: "Back to Dashboard",
        titleMag: "Unlock Your True Potential", titleStd: "Upgrade Your Plan",
        descMag: "Choose the duration of your power. Cancel anytime.", descStd: "Flexible plans for your medical journey. Cancel anytime.",
        gmBadge: "Limited Offer", gmTitleMag: "Grand Magus Status", gmTitleStd: "Lifetime Access",
        gmDescMag: "Pay once. Rule forever.", gmDescStd: "One-time payment. No monthly fees.",
        gmBtnMag: "Claim Destiny", gmBtnStd: "Get Lifetime", oneTime: "One-time payment",
        magTitleMag: "Magus Privileges", magTitleStd: "Pro Features",
        duration: "Select Duration", savings: "Save", bestValue: "Best Value",
        btnMag: "Seal the Pact", btnStd: "Subscribe Now",
        processing: "Processing...", verifying: "Verifying Payment...",
        feat1Mag: "2x Life Essence Regeneration Speed", feat1Std: "2x Faster Heart Restore",
        feat2Mag: "Access to Grimoire of Failures", feat2Std: "Mistake Review System",
        feat3Mag: "Full Access to All Grimoires", feat3Std: "Full Access to Clinical Apps",
        gmFeat1Mag: "Max Life Essence 5 & 4x Regen Speed", gmFeat1Std: "Max Hearts 5 & 4x Regen Speed",
        gmFeat2Mag: "Access to all future Spells", gmFeat2Std: "Access to all future Updates",
    },
    ka: {
        backMag: "სამყაროში დაბრუნება", backStd: "უკან დაბრუნება",
        titleMag: "გახსენით თქვენი პოტენციალი", titleStd: "აირჩიეთ სასურველი გეგმა",
        descMag: "აირჩიეთ ძალაუფლების ხანგრძლივობა. გააუქმეთ ნებისმიერ დროს.", descStd: "მოქნილი პირობები. გააუქმეთ ნებისმიერ დროს.",
        gmBadge: "ლიმიტირებული", gmTitleMag: "დიდი ჯადოქარი", gmTitleStd: "სამუდამო წვდომა",
        gmDescMag: "გადაიხადეთ ერთხელ. იმეფეთ მარად.", gmDescStd: "ერთჯერადი გადახდა. ყოველთვიური გადასახადის გარეშე.",
        gmBtnMag: "ბედისწერის მიღება", gmBtnStd: "ყიდვა", oneTime: "ერთჯერადი გადახდა",
        magTitleMag: "ჯადოქრის პრივილეგიები", magTitleStd: "Pro შესაძლებლობები",
        duration: "აირჩიეთ ხანგრძლივობა", savings: "დაზოგე", bestValue: "საუკეთესო",
        btnMag: "ფიცის დადება", btnStd: "გამოწერა", processing: "მუშავდება...", verifying: "გადახდის შემოწმება...",
        feat1Mag: "სასიცოცხლო ესენციის აღდგენა 2x სისწრაფით", feat1Std: "სიცოცხლის 2x სწრაფი აღდგენა",
        feat2Mag: "წვდომა მარცხის გრიმუარზე", feat2Std: "შეცდომების განხილვის სისტემა",
        feat3Mag: "სრული წვდომა ყველა გრიმუარზე", feat3Std: "სრული წვდომა კლინიკურ აპლიკაციებზე",
        gmFeat1Mag: "მაქსიმალური სასიცოცხლო ესენცია 5 & 4x აღდგენა", gmFeat1Std: "5 სიცოცხლე & 4x სწრაფი აღდგენა",
        gmFeat2Mag: "წვდომა ყველა მომავალ შელოცვაზე", gmFeat2Std: "წვდომა ყველა მომავალ განახლებაზე",
    }
  };

  const text = t[language] || t.en;

  const magusOptions = [
    { id: '1_week', label: language === 'ka' ? '1 კვირა' : '1 Week', price: 2.99, savings: null },
    { id: '1_month', label: language === 'ka' ? '1 თვე' : '1 Month', price: 9.99, savings: null },
    { id: '6_month', label: language === 'ka' ? '6 თვე' : '6 Months', price: 49.99, savings: language === 'ka' ? 'დაზოგე 15%' : 'Save 15%' },
    { id: '12_month', label: language === 'ka' ? '1 წელი' : '1 Year', price: 89.99, savings: text.bestValue },
  ];

  const magusFeatures = [
    isMagical ? text.feat1Mag : text.feat1Std,
    isMagical ? text.feat2Mag : text.feat2Std,
    isMagical ? text.feat3Mag : text.feat3Std,
  ];

  const grandMagusFeatures = [
    isMagical ? text.gmFeat1Mag : text.gmFeat1Std,
    isMagical ? text.gmFeat2Mag : text.gmFeat2Std,
    ...magusFeatures
  ];

  return (
    <div className={`min-h-screen py-20 px-4 relative overflow-hidden transition-colors duration-500 ${isMagical ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {isMagical && <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none"></div>}
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="absolute -top-10 left-0">
            <button onClick={() => navigate('/')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all transform hover:-translate-x-1 ${isMagical ? 'text-amber-500 hover:text-amber-400 hover:bg-amber-900/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}><ChevronLeft size={20} />{isMagical ? text.backMag : text.backStd}</button>
        </div>
        <div className="text-center mb-12 animate-in slide-in-from-top-4">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isMagical ? 'text-amber-50 font-serif' : 'text-slate-900 font-sans'}`}>{isMagical ? text.titleMag : text.titleStd}</h1>
          <p className={`text-lg ${isMagical ? 'text-slate-400' : 'text-slate-600'}`}>{isMagical ? text.descMag : text.descStd}</p>
        </div>

        {/* ===========================================
           ADMIN TEST ZONE (HIDDEN FOR LAUNCH)
           Uncomment this div to test with 1 GEL
        ===========================================
        
        <div className="max-w-md mx-auto mb-10 p-4 bg-red-100/10 border border-red-500 rounded-xl text-center backdrop-blur-md">
            <h3 className="text-red-500 font-bold mb-2 flex items-center justify-center gap-2"><AlertTriangle size={18}/> ADMIN TEST ZONE</h3>
            <button onClick={() => handleSubscribe(1.00, '1_minute')} disabled={processing} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">{processing ? <Loader2 className="animate-spin" /> : "TEST: Buy 1 Minute Plan (₾1.00)"}</button>
            <p className="text-xs text-red-400 mt-2">Use this to test expiration. Expires in 60 seconds.</p>
        </div>
        */}

        {IS_LIFETIME_DEAL_ACTIVE && (
            <div className="mb-12 relative group animate-in zoom-in duration-500">
                {isMagical && <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-amber-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 animate-pulse"></div>}
                <div className={`relative rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden border shadow-xl ${isMagical ? 'bg-slate-900 border-amber-500/50' : 'bg-white border-blue-200'}`}>
                    <div className={`absolute top-0 right-0 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider ${isMagical ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'}`}>{text.gmBadge}</div>
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${isMagical ? 'bg-purple-900/30 text-amber-400 border-purple-500/30' : 'bg-blue-50 text-blue-600 border-blue-100'}`}><Crown size={32} /></div>
                        <div>
                            <h3 className={`text-2xl font-bold flex items-center gap-2 ${isMagical ? 'text-white' : 'text-slate-900'}`}>{isMagical ? text.gmTitleMag : text.gmTitleStd}</h3>
                            <p className={`text-sm ${isMagical ? 'text-purple-300' : 'text-slate-500'}`}>{isMagical ? text.gmDescMag : text.gmDescStd}</p>
                            <div className="flex flex-wrap gap-2 mt-2">{grandMagusFeatures.slice(0, 2).map((f, i) => (<span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${isMagical ? 'bg-purple-900/40 border-purple-500/40 text-purple-200' : 'bg-blue-50 border-blue-200 text-blue-700'}`}><Zap className="inline mr-1 mb-0.5" size={10} />{f}</span>))}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block"><div className={`text-3xl font-bold ${isMagical ? 'text-white' : 'text-slate-900'}`}>₾150.00</div><div className="text-xs text-slate-500 uppercase">{text.oneTime}</div></div>
                        <button onClick={() => handleSubscribe(150.00, 'lifetime')} disabled={processing} className={`font-bold py-3 px-8 rounded-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-wait ${isMagical ? 'bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>{processing ? text.processing : (isMagical ? text.gmBtnMag : text.gmBtnStd)}</button>
                    </div>
                </div>
            </div>
        )}

        <div className={`border rounded-2xl p-6 md:p-10 ${isMagical ? 'bg-slate-900/50 border-slate-800 backdrop-blur-sm' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="grid md:grid-cols-2 gap-10">
                <div>
                    <div className="flex items-center gap-3 mb-6">{isMagical ? <Sparkles className="text-amber-500" size={28} /> : <Shield className="text-blue-600" size={28} />}<h2 className={`text-2xl font-bold ${isMagical ? 'text-slate-100' : 'text-slate-900'}`}>{isMagical ? text.magTitleMag : text.magTitleStd}</h2></div>
                    <ul className="space-y-4 mb-8">{magusFeatures.map((feat, i) => (<li key={i} className={`flex items-start gap-3 ${isMagical ? 'text-slate-300' : 'text-slate-700'}`}><Check className={`shrink-0 mt-0.5 ${isMagical ? 'text-amber-500' : 'text-green-500'}`} size={18} /><span>{feat}</span></li>))}</ul>
                </div>
                <div className="flex flex-col h-full">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{text.duration}</h3>
                    <div className="space-y-3 flex-1">
                        {magusOptions.map((opt) => (
                            <div key={opt.id} onClick={() => !processing && setSelectedPeriod(opt.id)} className={`relative flex justify-between items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selectedPeriod === opt.id ? (isMagical ? 'bg-amber-900/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-blue-50 border-blue-500 ring-1 ring-blue-500') : (isMagical ? 'bg-slate-950 border-slate-800 hover:border-slate-600 hover:bg-slate-900' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50')} ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <div className="flex items-center gap-3"><div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPeriod === opt.id ? (isMagical ? 'border-amber-500' : 'border-blue-600') : (isMagical ? 'border-slate-600' : 'border-slate-300')}`}>{selectedPeriod === opt.id && <div className={`w-2.5 h-2.5 rounded-full ${isMagical ? 'bg-amber-500' : 'bg-blue-600'}`} />}</div><span className={`font-medium ${selectedPeriod === opt.id ? (isMagical ? 'text-white' : 'text-blue-900') : (isMagical ? 'text-slate-300' : 'text-slate-700')}`}>{opt.label}</span></div>
                                <div className="text-right"><div className={`font-bold ${selectedPeriod === opt.id ? (isMagical ? 'text-amber-400' : 'text-blue-700') : (isMagical ? 'text-slate-200' : 'text-slate-900')}`}>₾{opt.price}</div>{opt.savings && (<div className={`text-[10px] font-bold ${isMagical ? 'text-emerald-400' : 'text-green-600'}`}>{opt.savings}</div>)}</div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => { const selected = magusOptions.find(o => o.id === selectedPeriod); handleSubscribe(selected.price, selected.id); }} disabled={processing} className={`w-full mt-8 font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait ${isMagical ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>{processing ? <Loader2 className="animate-spin" /> : null}{processing ? text.processing : (isMagical ? text.btnMag : text.btnStd)}</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}