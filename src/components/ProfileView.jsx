import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useGameLogic } from '../hooks/useGameLogic';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient'; 
import { 
  User, Mail, Award, Heart, Clock, Shield, LogOut,
  Infinity as InfinityIcon, Ghost, Crown, Star, Camera, Loader2,
  CreditCard, PlusCircle, Lock, Smartphone, Send, AlertTriangle
} from 'lucide-react';

export default function ProfileView() {
  const { user, signOut } = useAuth();
  const { theme, language } = useTheme();
  const { addToast } = useToast();
  
  const { 
      hearts, maxHearts, xp, tier, isInfiniteHearts, regenTarget, regenSpeed,
      buyHeartWithXp, buyFullRestore 
  } = useGameLogic();
  
  const isMagical = theme === 'magical';
  const [timeLeft, setTimeLeft] = useState('');
  const [progress, setProgress] = useState(0); 
  
  // --- AVATAR STATE ---
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || null);
  const [uploading, setUploading] = useState(false);

  // --- SECURITY STATE ---
  const [devices, setDevices] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // --- LOAD DEVICES ---
  useEffect(() => {
    const loadSecurityData = async () => {
        // 1. Get Current Fingerprint
        const myId = localStorage.getItem('nimue_device_id');
        setCurrentDeviceId(myId);

        // 2. Fetch Trusted List
        const { data } = await supabase
            .from('trusted_devices')
            .select('*')
            .eq('user_id', user.id)
            .order('added_at', { ascending: true }); // Oldest = Device 1
        
        if (data) setDevices(data);
    };
    loadSecurityData();
  }, [user]);

  // --- REGEN TIMER LOGIC ---
  useEffect(() => {
    if (!regenTarget || hearts >= maxHearts || isInfiniteHearts) {
        setTimeLeft(null);
        setProgress(0);
        return;
    }

    const interval = setInterval(() => {
        const now = Date.now();
        const target = new Date(regenTarget).getTime(); 
        const diff = target - now;

        if (diff <= 0) {
            setTimeLeft('00:00');
            setProgress(100);
        } else {
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${m}:${s < 10 ? '0' : ''}${s}`);

            const duration = regenSpeed || 3600000; 
            const elapsed = duration - diff;
            const pct = Math.min(100, Math.max(0, (elapsed / duration) * 100));
            setProgress(pct);
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [regenTarget, hearts, maxHearts, isInfiniteHearts, regenSpeed]);

  // --- HANDLERS ---
  const handleHeal = () => {
      const result = buyHeartWithXp();
      if (result.success) {
          addToast(result.message, "success");
      } else {
          addToast(result.message, "error");
      }
  };

  const handleFullRestore = () => {
      if(confirm(language === 'en' ? "Pay 1 GEL for full health?" : "გადაიხადე 1 ლარი სრული აღდგენისთვის?")) {
          const result = buyFullRestore();
          if (result.success) {
              addToast(result.message, "success");
          } else {
              addToast(result.message, "error");
          }
      }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Select an image!');
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } });
      if (updateError) throw updateError;
      setAvatarUrl(data.publicUrl);
      addToast("Avatar Updated!", "success");
    } catch (error) { 
        addToast(error.message, "error"); 
    } finally { 
        setUploading(false); 
    }
  };

  // --- FIXED: CONTACT SUBMIT VIA SECURE RPC ---
  const handleContactSubmit = async (e) => {
      e.preventDefault();
      setSendingMsg(true);
      
      console.log("🚀 Starting Petition Process via RPC..."); 

      try {
          // YOUR REAL ARCHMAGE ID
          const ARCHMAGE_ID = '69a13b7d-53c3-40e0-8ad2-8b93440e7aad';

          // 1. Call the Secure Database Function (The Magical Backdoor)
          // This ignores RLS policies because the function is 'SECURITY DEFINER'
          const { error } = await supabase.rpc('send_petition', {
              target_user_id: ARCHMAGE_ID,
              topic: `Device Removal Request: ${user.email}`,
              content: contactMessage,
              sender: user.email
          });

          // 2. Handle Result
          if (error) {
              console.error("❌ RPC ERROR:", error);
              throw error;
          }

          console.log("✅ Success: Petition delivered.");
          addToast(language === 'ka' ? "მოთხოვნა გაგზავნილია!" : "Request Sent!", "success");
          setShowContactModal(false);
          setContactMessage("");

      } catch (err) {
          console.error("🔥 ERROR:", err.message);
          addToast(`Failed: ${err.message}`, "error");
          // alert("DEBUG ERROR: " + err.message); // Uncomment if you really need to see the alert
      } finally {
          setSendingMsg(false);
      }
  };

  // --- TRANSLATION CONFIG ---
  const t = {
    en: {
      profileMagical: "Wizard's Profile", profileStandard: "Student Profile",
      xpMagical: "Arcane Knowledge", xpStandard: "Experience Points",
      heartsMagical: "Life Essence", heartsStandard: "Lives",
      regen: "Regenerating in:", full: "Fully Restored", infinite: "Infinite Energy", signOut: "Sign Out",
      actions: "Emergency Aid",
      healBtn: "Restore 1 Heart",
      healCost: "50 XP",
      fullBtn: "Full Recovery",
      fullCost: "1 GEL",
      need: "Need",
      more: "more",
      // SECURITY
      secTitle: "Authorized Artifacts",
      secDesc: "These devices hold the keys to your grimoire.",
      current: "Active Session",
      contact: "Revoke a Device",
      contactTitle: "Petition the Archmage",
      contactDesc: "Removing a trusted device requires higher authorization. Describe which device to remove.",
      send: "Send Petition",
      cancel: "Cancel"
    },
    ka: {
      profileMagical: "ჯადოქრის პროფილი", profileStandard: "სტუდენტის პროფილი",
      xpMagical: "საიდუმლო ცოდნა", xpStandard: "გამოცდილება",
      heartsMagical: "სასიცოცხლო ესენცია", heartsStandard: "სიცოცხლეები",
      regen: "აღდგენა:", full: "სრულად აღდგენილია", infinite: "უსასრულო ენერგია", signOut: "გასვლა",
      actions: "გადაუდებელი დახმარება",
      healBtn: "1 გულის აღდგენა",
      healCost: "50 XP",
      fullBtn: "სრული აღდგენა",
      fullCost: "1 ლარი",
      need: "გაკლია",
      more: "",
      // SECURITY
      secTitle: "ავტორიზებული მოწყობილობები",
      secDesc: "მოწყობილობები რომლებსაც აქვთ წვდომა თქვენს პროფილზე.",
      current: "მიმდინარე სესია",
      contact: "მოწყობილობის წაშლა",
      contactTitle: "მიმართვა არქიმაგს",
      contactDesc: "მოწყობილობის წასაშლელად საჭიროა ადმინისტრატორის დასტური. მიუთითეთ რომელი მოწყობილობა წავშალოთ.",
      send: "გაგზავნა",
      cancel: "გაუქმება"
    }
  };
  const text = t[language] || t.en;

  const getRankDisplay = () => {
    const titles = {
        archmage: { magical: { en: "Archmage", ka: "არქიმაგი" }, standard: { en: "Dept. Chair", ka: "დეპ. ხელმძღვანელი" }, color: 'text-purple-500', icon: InfinityIcon },
        insubstantial: { magical: { en: "Insubstantial", ka: "ილუზორული" }, standard: { en: "Honorary Fellow", ka: "საპატიო წევრი" }, color: 'text-fuchsia-400', icon: Ghost },
        grand_magus: { magical: { en: "Grand Magus", ka: "დიდი ჯადოქარი" }, standard: { en: "Attending", ka: "მკურნალი ექიმი" }, color: 'text-amber-500', icon: Crown },
        magus: { magical: { en: "Magus", ka: "ჯადოქარი" }, standard: { en: "Resident", ka: "რეზიდენტი" }, color: 'text-emerald-500', icon: Star },
        apprentice: { magical: { en: "Apprentice", ka: "შეგირდი" }, standard: { en: "Student", ka: "სტუდენტი" }, color: 'text-blue-500', icon: Shield }
    };
    const config = titles[tier] || titles.apprentice;
    const modeKey = isMagical ? 'magical' : 'standard';
    return { label: config[modeKey][language], color: config.color, icon: config.icon };
  };
  const rankInfo = getRankDisplay();

  const HEAL_COST = 50;
  const canAffordHeal = xp >= HEAL_COST;
  const missingXp = HEAL_COST - xp;

  return (
    <div className={`max-w-2xl mx-auto p-6 animate-in fade-in zoom-in duration-300`}>
      
      {/* CONTACT MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border-2 ${isMagical ? 'bg-slate-900 border-amber-600 text-amber-50' : 'bg-white border-blue-500 text-slate-900'}`}>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Mail size={20} className={isMagical ? "text-amber-500" : "text-blue-600"} />
                    {text.contactTitle}
                </h3>
                <p className="text-sm opacity-70 mb-4">{text.contactDesc}</p>
                
                <form onSubmit={handleContactSubmit}>
                    <textarea 
                        className={`w-full p-3 rounded-xl border mb-4 focus:outline-none focus:ring-2 h-32 resize-none ${isMagical ? 'bg-slate-800 border-slate-700 focus:ring-amber-500 placeholder-slate-500' : 'bg-slate-50 border-slate-200 focus:ring-blue-500'}`}
                        placeholder={language === 'ka' ? "მაგ: გთხოვთ წაშალოთ მოწყობილობა 1 (Chrome)..." : "e.g. Please remove Device 1 (Chrome)..."}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        required
                    />
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowContactModal(false)} className="flex-1 py-3 rounded-xl font-bold border border-transparent hover:bg-black/5 transition-all opacity-70">
                            {text.cancel}
                        </button>
                        <button type="submit" disabled={sendingMsg} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isMagical ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                            {sendingMsg ? <Loader2 className="animate-spin" size={18}/> : <Send size={18} />} {text.send}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* HEADER CARD */}
      <div className={`relative overflow-hidden rounded-3xl p-8 mb-6 border-2 shadow-2xl ${isMagical ? 'bg-slate-900 border-amber-500/30 text-amber-50' : 'bg-white border-slate-200 text-slate-800'}`}>
        {isMagical && <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>}
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="relative group">
            <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center shadow-lg overflow-hidden relative ${isMagical ? 'border-amber-500 bg-slate-800 text-amber-500' : 'border-blue-500 bg-blue-50 text-blue-600'}`}>
              {uploading ? <Loader2 className="animate-spin" /> : avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={48} />}
            </div>
            <label className="absolute bottom-0 right-0 p-2 rounded-full cursor-pointer transition-all hover:scale-110 shadow-lg bg-white text-slate-900 border border-slate-200">
               <Camera size={16} />
               <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden"/>
            </label>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-1">{isMagical ? text.profileMagical : text.profileStandard}</h2>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold border ${isMagical ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <rankInfo.icon size={14} className={rankInfo.color} />
              <span className={rankInfo.color}>{rankInfo.label}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-4 opacity-70 text-sm"><Mail size={14} />{user?.email}</div>
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className={`p-6 rounded-2xl border-2 flex items-center gap-4 ${isMagical ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className={`p-3 rounded-xl ${isMagical ? 'bg-cyan-900/30 text-cyan-400' : 'bg-blue-50 text-blue-600'}`}><Award size={32} /></div>
          <div><div className="text-sm opacity-60 uppercase tracking-wider font-bold">{isMagical ? text.xpMagical : text.xpStandard}</div><div className="text-3xl font-bold">{xp}</div></div>
        </div>
        
        <div className={`p-6 rounded-2xl border-2 flex items-center gap-4 relative overflow-hidden ${isMagical ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className={`p-3 rounded-xl relative z-10 ${isMagical ? 'bg-rose-900/30 text-rose-400' : 'bg-red-50 text-red-600'}`}>
              {isInfiniteHearts ? <InfinityIcon size={32} /> : <Heart size={32} className="fill-current" />}
          </div>
          <div className="relative z-10">
             <div className="text-sm opacity-60 uppercase tracking-wider font-bold">{isMagical ? text.heartsMagical : text.heartsStandard}</div>
             <div className="flex flex-col">
                <span className="text-3xl font-bold">{isInfiniteHearts ? "∞" : `${hearts} / ${maxHearts}`}</span>
                {!isInfiniteHearts && hearts < maxHearts && timeLeft && (
                    <div className="mt-1">
                        <div className={`flex items-center gap-1.5 text-xs font-bold mb-1 ${isMagical ? 'text-amber-500' : 'text-blue-600'}`}>
                            <Clock size={12} /><span>{text.regen} {timeLeft}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200/20 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
                {!isInfiniteHearts && hearts >= maxHearts && <div className="text-xs font-bold mt-1 text-green-500 opacity-80">{text.full}</div>}
                {isInfiniteHearts && <div className="text-xs font-bold mt-1 text-purple-500 opacity-80">{text.infinite}</div>}
             </div>
          </div>
        </div>
      </div>

      {/* --- NEW SECURITY SECTION --- */}
      <div className={`mb-6 p-6 rounded-2xl border-2 ${isMagical ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
         <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm uppercase tracking-wider font-bold opacity-60 flex items-center gap-2"><Lock size={14}/> {text.secTitle}</h3>
             <span className={`text-xs px-2 py-1 rounded font-bold ${isMagical ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{devices.length} / 2</span>
         </div>
         
         <div className="space-y-3 mb-6">
             {devices.map((dev, index) => {
                 const isCurrent = dev.device_id === currentDeviceId;
                 return (
                     <div key={dev.id} className={`p-4 rounded-xl border flex items-center justify-between ${isCurrent ? (isMagical ? 'bg-amber-900/10 border-amber-800/50' : 'bg-blue-50 border-blue-200') : (isMagical ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200')}`}>
                         <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-lg ${isCurrent ? (isMagical ? 'bg-amber-900/30 text-amber-500' : 'bg-blue-100 text-blue-600') : (isMagical ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400')}`}>
                                 {isCurrent ? <Shield size={18} /> : <Smartphone size={18} />}
                             </div>
                             <div>
                                 <div className="font-bold text-sm flex items-center gap-2">
                                     {language === 'ka' ? `მოწყობილობა ${index + 1}` : `Device ${index + 1}`}
                                     {isCurrent && <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${isMagical ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'}`}>{language === 'ka' ? 'აქტიური' : 'Current'}</span>}
                                 </div>
                                 <div className="text-xs opacity-50 truncate max-w-[150px] md:max-w-[200px]">{dev.device_name || "Unknown Browser"}</div>
                             </div>
                         </div>
                         <div className="text-xs opacity-50 font-mono">
                             {new Date(dev.added_at).toLocaleDateString()}
                         </div>
                     </div>
                 );
             })}
         </div>

         {/* Contact Archmage Button (Only show if not Archmage) */}
         {tier !== 'archmage' && (
             <button onClick={() => setShowContactModal(true)} className={`w-full py-3 rounded-xl font-bold border-2 border-dashed flex items-center justify-center gap-2 transition-all ${isMagical ? 'border-slate-700 text-slate-400 hover:border-amber-500 hover:text-amber-500' : 'border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-500'}`}>
                 <Mail size={16} /> {text.contact}
             </button>
         )}
      </div>

      {/* EMERGENCY AID ACTIONS (ONLY SHOW IF DAMAGED) */}
      {!isInfiniteHearts && hearts < maxHearts && (
        <div className={`mb-6 p-6 rounded-2xl border-2 ${isMagical ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className="text-sm uppercase tracking-wider font-bold opacity-60 mb-4">{text.actions}</h3>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={handleHeal} disabled={!canAffordHeal} className={`min-h-[140px] flex flex-col justify-between p-4 rounded-xl border-2 transition-all group ${canAffordHeal ? (isMagical ? 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400' : 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700') : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'}`}>
                    <div className="w-full flex justify-center"><PlusCircle size={32} className={!canAffordHeal ? "opacity-50" : ""} /></div>
                    <div className="font-bold text-sm text-center">{text.healBtn}</div>
                    <div className="w-full flex justify-center">
                        {canAffordHeal ? <span className="text-xs opacity-70 font-bold">{text.healCost}</span> : <div className="bg-slate-900/80 text-white text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1 shadow-sm"><Lock size={10} /><span>{text.need} {missingXp} {text.more}</span></div>}
                    </div>
                </button>
                <button onClick={handleFullRestore} className={`min-h-[140px] flex flex-col justify-between p-4 rounded-xl border-2 transition-all ${isMagical ? 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400' : 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700'}`}>
                    <div className="w-full flex justify-center"><CreditCard size={32} /></div>
                    <div className="font-bold text-sm text-center">{text.fullBtn}</div>
                    <div className="w-full flex justify-center"><span className="text-xs opacity-70 font-bold">{text.fullCost}</span></div>
                </button>
            </div>
        </div>
      )}

      <button onClick={signOut} className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
        <LogOut size={20} />{text.signOut}
      </button>
    </div>
  );
}