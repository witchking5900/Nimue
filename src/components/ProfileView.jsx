import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useGameLogic } from '../hooks/useGameLogic';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient'; 
import { 
  User, Mail, Award, Heart, Clock, Shield, LogOut,
  Infinity as InfinityIcon, Ghost, Crown, Star, Camera, Loader2,
  CreditCard, PlusCircle, Lock, Smartphone, Send, Edit2, Save, X, Calendar,
  Sparkles, Stethoscope
} from 'lucide-react';

export default function ProfileView() {
  const { user, signOut } = useAuth();
  const { theme, language, toggleTheme } = useTheme(); 
  const { addToast } = useToast();
  
  // We use useGameLogic for shared state, but we also listen locally for instant updates
  const { 
      hearts, maxHearts, xp, tier, isInfiniteHearts, regenTarget, regenSpeed,
      buyHeartWithXp 
  } = useGameLogic();
  
  const isMagical = theme === 'magical';
  const [timeLeft, setTimeLeft] = useState('');
  const [progress, setProgress] = useState(0); 
  
  // --- USER DATA STATE ---
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || null);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || '');
  const [nickname, setNickname] = useState(user?.user_metadata?.nickname || ''); 
  const [uploading, setUploading] = useState(false);

  // --- SUBSCRIPTION STATE ---
  const [subscription, setSubscription] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [subCountdown, setSubCountdown] = useState(null);

  // --- EDIT MODAL STATE ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [newName, setNewName] = useState(displayName);
  const [newNickname, setNewNickname] = useState(nickname); 
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // --- SECURITY STATE ---
  const [devices, setDevices] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // --- PAYMENT STATE ---
  const [processingPayment, setProcessingPayment] = useState(false);

  // --- 1. LOAD INITIAL DATA ---
  useEffect(() => {
    const loadData = async () => {
        // A. Load Devices
        const myId = localStorage.getItem('nimue_device_id');
        setCurrentDeviceId(myId);
        const { data: deviceData } = await supabase
            .from('trusted_devices')
            .select('*')
            .eq('user_id', user.id)
            .order('added_at', { ascending: true });
        if (deviceData) setDevices(deviceData);

        // B. Load Subscription (Prioritize Active)
        // We fetch active first. If null, we fetch the latest (which might be expired/cancelled)
        let { data: subData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        if (!subData) {
             // Fallback: Get whatever the latest one was
             const { data: anySub } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
             subData = anySub;
        }

        if (subData) setSubscription(subData);
        setLoadingSub(false);
    };
    loadData();
  }, [user]);

  // --- 2. REAL-TIME LISTENER (THE FIX) ---
  useEffect(() => {
      const channel = supabase
        .channel('profile-updates')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` },
            (payload) => {
                console.log("🔔 Subscription Updated Real-time:", payload);
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    setSubscription(payload.new);
                }
            }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  // --- TIMERS ---
  useEffect(() => {
    if (!regenTarget || hearts >= maxHearts || isInfiniteHearts) {
        setTimeLeft(null); setProgress(0); return;
    }
    const interval = setInterval(() => {
        const now = Date.now();
        const target = new Date(regenTarget).getTime(); 
        const diff = target - now;
        if (diff <= 0) { setTimeLeft('00:00'); setProgress(100); } 
        else {
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${m}:${s < 10 ? '0' : ''}${s}`);
            const duration = regenSpeed || 3600000; 
            const elapsed = duration - diff;
            setProgress(Math.min(100, Math.max(0, (elapsed / duration) * 100)));
        }
    }, 1000);
    return () => clearInterval(interval);
  }, [regenTarget, hearts, maxHearts, isInfiniteHearts, regenSpeed]);

  useEffect(() => {
      if (!subscription) return;
      if (!subscription.current_period_end) { setSubCountdown("LIFETIME"); return; }
      const updateCountdown = () => {
          const now = new Date().getTime();
          const target = new Date(subscription.current_period_end).getTime();
          const diff = target - now;
          if (diff <= 0) { setSubCountdown("EXPIRED"); return; }
          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
          const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setSubCountdown(`${d}:${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`);
      };
      updateCountdown(); 
      const timer = setInterval(updateCountdown, 1000);
      return () => clearInterval(timer);
  }, [subscription]);

  // --- HANDLERS ---
  const handleHeal = () => {
      const result = buyHeartWithXp();
      addToast(result.message, result.success ? "success" : "error");
  };

  // ▼▼▼ NEW: HEART REFILL PAYMENT ▼▼▼
  const handleFullRestore = async () => {
      if(!confirm(language === 'en' ? "Pay 1 GEL to fully restore hearts?" : "გადაიხადე 1 ლარი სრული აღდგენისთვის?")) return;
      
      try {
          setProcessingPayment(true);

          const { data, error } = await supabase.functions.invoke('bog-payment', {
            body: {
                action: 'create_order',
                user_id: user.id,
                type: 'hearts' // Triggers the heart refill logic
            }
          });

          if (error) throw error;

          if (data?.payment_url) {
              window.location.href = data.payment_url;
          } else {
              throw new Error("No payment URL received.");
          }

      } catch (error) {
          console.error("Payment Error:", error);
          addToast(language === 'ka' ? "გადახდა ვერ განხორციელდა" : "Payment Failed", "error");
      } finally {
          setProcessingPayment(false);
      }
  };
  // ▲▲▲ END NEW CODE ▲▲▲

  const handleCancelSubscription = async () => {
      if(!confirm(language === 'ka' ? "ნამდვილად გსურთ გაუქმება?" : "Are you sure you want to cancel?")) return;
      const { error } = await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', subscription.id);
      if (error) addToast("Error: " + error.message, "error");
      else {
          // Optimistic update, but the real-time listener will also confirm it
          setSubscription(prev => ({ ...prev, status: 'cancelled' }));
          addToast(language === 'ka' ? "გამოწერა გაუქმებულია" : "Subscription cancelled", "success");
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
      await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } });
      setAvatarUrl(data.publicUrl);
      addToast("Avatar Updated!", "success");
    } catch (error) { addToast(error.message, "error"); } 
    finally { setUploading(false); }
  };

  const handleUpdateProfile = async (e) => {
      e.preventDefault();
      setSavingProfile(true);
      let messages = [];
      try {
          const updates = {};
          if (newName !== displayName) updates.full_name = newName;
          if (newNickname !== nickname) updates.nickname = newNickname;

          if (Object.keys(updates).length > 0) {
              const { error } = await supabase.auth.updateUser({ data: updates });
              if (error) throw error;
              if (updates.full_name) setDisplayName(updates.full_name);
              if (updates.nickname) setNickname(updates.nickname);
              messages.push(language === 'ka' ? "პროფილი განახლდა" : "Profile updated");
          }

          if (newPassword) {
              if (newPassword.length < 6) throw new Error("Password too short");
              if (newPassword !== confirmPassword) throw new Error("Passwords mismatch");
              const { error } = await supabase.auth.updateUser({ password: newPassword });
              if (error) throw error;
              messages.push(language === 'ka' ? "პაროლი შეიცვალა" : "Password changed");
          }
          if (messages.length > 0) {
              addToast(messages.join('. '), "success");
              setShowEditModal(false);
              setNewPassword(''); setConfirmPassword('');
          } else setShowEditModal(false);
      } catch (err) { addToast(err.message, "error"); } 
      finally { setSavingProfile(false); }
  };

  const handleContactSubmit = async (e) => {
      e.preventDefault();
      setSendingMsg(true);
      try {
          const ARCHMAGE_ID = '1279a5ed-bd3d-48e6-8338-a5a36c19cdff';
          await supabase.rpc('send_petition', {
              target_user_id: ARCHMAGE_ID,
              topic: `Device Removal Request: ${user.email}`,
              content: contactMessage,
              sender: user.email
          });
          addToast(language === 'ka' ? "მოთხოვნა გაგზავნილია!" : "Request Sent!", "success");
          setShowContactModal(false); setContactMessage("");
      } catch (err) { addToast(`Failed: ${err.message}`, "error"); } 
      finally { setSendingMsg(false); }
  };

  // --- TEXT & RANKS ---
  const t = {
    en: {
      profileMagical: "Wizard's Profile", profileStandard: "Medical Profile",
      xpMagical: "Arcane Knowledge", xpStandard: "Experience Points",
      heartsMagical: "Life Essence", heartsStandard: "Lives",
      regen: "Regenerating in:", full: "Fully Restored", infinite: "Infinite Energy", signOut: "Sign Out",
      editProfile: "Edit Profile", displayName: "Full Name", nickname: "Magus Name (Nickname)", changePass: "Change Password",
      newPass: "New Password", confPass: "Confirm Password", save: "Save Changes", cancel: "Cancel",
      billTitle: "Subscription Status", billActive: "Active Plan", billNext: "Next Billing", billCancel: "Cancel Subscription",
      billNoSub: "No Active Subscription", billUp: "Upgrade Now",
      secTitle: "Authorized Artifacts", contact: "Revoke a Device", contactTitle: "Petition Archmage", contactDesc: "Request device removal", send: "Send",
      actions: "Emergency Aid", healBtn: "Restore 1 Heart", healCost: "50 XP", fullBtn: "Full Recovery", fullCost: "1 GEL", need: "Need", more: "more"
    },
    ka: {
      profileMagical: "ჯადოქრის პროფილი", profileStandard: "სამედიცინო პროფილი",
      xpMagical: "საიდუმლო ცოდნა", xpStandard: "გამოცდილება",
      heartsMagical: "სასიცოცხლო ესენცია", heartsStandard: "სიცოცხლეები",
      regen: "აღდგენა:", full: "სრულად აღდგენილია", infinite: "უსასრულო ენერგია", signOut: "გასვლა",
      editProfile: "რედაქტირება", displayName: "სრული სახელი", nickname: "მაგუსის სახელი (მეტსახელი)", changePass: "პაროლის შეცვლა",
      newPass: "ახალი პაროლი", confPass: "გაიმეორეთ პაროლი", save: "შენახვა", cancel: "გაუქმება",
      billTitle: "გამოწერის სტატუსი", billActive: "მიმდინარე გეგმა", billNext: "შემდეგი გადახდა", billCancel: "გაუქმება",
      billNoSub: "გამოწერა არ გაქვთ", billUp: "გააქტიურება",
      secTitle: "უსაფრთხოება", contact: "მოწყობილობის წაშლა", contactTitle: "მიმართვა არქიმაგს", contactDesc: "მოწყობილობის წაშლის მოთხოვნა", send: "გაგზავნა",
      actions: "დახმარება", healBtn: "1 გული", healCost: "50 XP", fullBtn: "სრული აღდგენა", fullCost: "1 ლარი", need: "გაკლია", more: ""
    }
  };
  const text = t[language] || t.en;

  const getRankDisplay = () => {
    const titles = {
        archmage: { 
            magical: { label: language==='ka'?"არქიმაგი":"Archmage" },
            standard: { label: language==='ka'?"ადმინისტრატორი":"Administrator" },
            color: 'text-purple-500', icon: InfinityIcon 
        },
        insubstantial: { 
            magical: { label: language==='ka'?"ილუზორული":"Insubstantial" },
            standard: { label: language==='ka'?"დამკვირვებელი":"Observer" },
            color: 'text-fuchsia-400', icon: Ghost 
        },
        grand_magus: { 
            magical: { label: language==='ka'?"დიდი ჯადოქარი":"Grand Magus" },
            standard: { label: language==='ka'?"მკურნალი ექიმი":"Attending Physician" },
            color: 'text-amber-500', icon: Crown 
        },
        magus: { 
            magical: { label: language==='ka'?"ჯადოქარი":"Magus" },
            standard: { label: language==='ka'?"რეზიდენტი":"Resident" },
            color: 'text-emerald-500', icon: Star 
        },
        apprentice: { 
            magical: { label: language==='ka'?"შეგირდი":"Apprentice" },
            standard: { label: language==='ka'?"სტუდენტი":"Student" },
            color: 'text-blue-500', icon: Shield 
        }
    };
    const rank = titles[tier] || titles.apprentice;
    return {
        label: isMagical ? rank.magical.label : rank.standard.label,
        color: rank.color,
        icon: rank.icon
    };
  };
  const rankInfo = getRankDisplay();
  
  const HEAL_COST = 50;
  const canAffordHeal = xp >= HEAL_COST;
  const missingXp = HEAL_COST - xp;

  const getPlanName = (planId) => {
    if(!planId) return isMagical ? (language === 'ka' ? "ჯადოქარი" : "Magus") : (language === 'ka' ? "რეზიდენტი" : "Resident");
    if(planId === 'lifetime') return language === 'ka' ? "სამუდამო წვდომა" : "Lifetime Access";
    if(planId === '1_minute') return "Test: 1 Minute";
    if(planId === '1_week') return language === 'ka' ? "1 კვირა" : "1 Week";
    if(planId === '1_month') return language === 'ka' ? "1 თვე" : "1 Month";
    if(planId === '6_month') return language === 'ka' ? "6 თვე" : "6 Months";
    if(planId === '12_month') return language === 'ka' ? "1 წელი" : "1 Year";
    return planId;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 animate-in fade-in zoom-in duration-300">
      
      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border-2 ${isMagical ? 'bg-slate-900 border-amber-600 text-amber-50' : 'bg-white border-blue-500 text-slate-900'}`}>
                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold flex items-center gap-2"><Edit2 size={20}/>{text.editProfile}</h3><button onClick={()=>setShowEditModal(false)}><X/></button></div>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase opacity-70 mb-1 block">{text.displayName}</label>
                        <input type="text" value={newName} onChange={(e)=>setNewName(e.target.value)} className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 ${isMagical?'bg-slate-800 border-slate-700 focus:ring-amber-500':'bg-slate-50 border-slate-200 focus:ring-blue-500'}`}/>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase opacity-70 mb-1 block">{text.nickname}</label>
                        <input type="text" value={newNickname} onChange={(e)=>setNewNickname(e.target.value)} className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 ${isMagical?'bg-slate-800 border-slate-700 focus:ring-amber-500':'bg-slate-50 border-slate-200 focus:ring-blue-500'}`}/>
                    </div>
                    <div className="pt-2 border-t border-dashed border-gray-500/30">
                        <label className="text-xs font-bold uppercase opacity-70 mb-1 block">{text.changePass}</label>
                        <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className={`w-full p-3 rounded-xl border mb-2 focus:outline-none focus:ring-2 ${isMagical?'bg-slate-800 border-slate-700 focus:ring-amber-500':'bg-slate-50 border-slate-200 focus:ring-blue-500'}`} placeholder={text.newPass}/>
                        <input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 ${isMagical?'bg-slate-800 border-slate-700 focus:ring-amber-500':'bg-slate-50 border-slate-200 focus:ring-blue-500'}`} placeholder={text.confPass}/>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={()=>setShowEditModal(false)} className="flex-1 py-3 rounded-xl font-bold border border-transparent hover:bg-black/5 opacity-70">{text.cancel}</button>
                        <button type="submit" disabled={savingProfile} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isMagical?'bg-amber-600 text-white':'bg-blue-600 text-white'}`}>{savingProfile?<Loader2 className="animate-spin"/>:<Save size={18}/>}{text.save}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* CONTACT MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border-2 ${isMagical?'bg-slate-900 border-amber-600 text-amber-50':'bg-white border-blue-500 text-slate-900'}`}>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Mail size={20}/>{text.contactTitle}</h3>
                <form onSubmit={handleContactSubmit}>
                    <textarea className={`w-full p-3 rounded-xl border mb-4 h-32 resize-none ${isMagical?'bg-slate-800 border-slate-700':'bg-slate-50 border-slate-200'}`} placeholder={text.contactDesc} value={contactMessage} onChange={(e)=>setContactMessage(e.target.value)} required/>
                    <div className="flex gap-3"><button type="button" onClick={()=>setShowContactModal(false)} className="flex-1 py-3 rounded-xl font-bold opacity-70">{text.cancel}</button><button type="submit" disabled={sendingMsg} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isMagical?'bg-amber-600 text-white':'bg-blue-600 text-white'}`}>{sendingMsg?<Loader2 className="animate-spin"/>:<Send size={18}/>}{text.send}</button></div>
                </form>
            </div>
        </div>
      )}

      {/* HEADER */}
      <div className={`relative overflow-hidden rounded-3xl p-8 mb-6 border-2 shadow-2xl ${isMagical ? 'bg-slate-900 border-amber-500/30 text-amber-50' : 'bg-white border-slate-200 text-slate-800'}`}>
        {isMagical && <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>}
        <div className="absolute top-4 right-4 z-20">
            <button onClick={toggleTheme} className={`p-2 rounded-full border transition-all ${isMagical ? 'bg-slate-800 border-amber-500/50 text-amber-400 hover:bg-slate-700' : 'bg-white border-slate-300 text-blue-600 hover:bg-slate-50'}`} title={isMagical ? "Switch to Standard View" : "Switch to Magical View"}>{isMagical ? <Stethoscope size={20} /> : <Sparkles size={20} />}</button>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="relative group">
            <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center shadow-lg overflow-hidden relative ${isMagical ? 'border-amber-500 bg-slate-800 text-amber-500' : 'border-blue-500 bg-blue-50 text-blue-600'}`}>
              {uploading ? <Loader2 className="animate-spin" /> : avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={48} />}
            </div>
            <label className="absolute bottom-0 right-0 p-2 rounded-full cursor-pointer hover:scale-110 shadow-lg bg-white text-slate-900 border border-slate-200"><Camera size={16} /><input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden"/></label>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-1">{isMagical ? text.profileMagical : text.profileStandard}</h2>
            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap mt-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold border ${isMagical ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}><rankInfo.icon size={14} className={rankInfo.color} /><span className={rankInfo.color}>{rankInfo.label}</span></div>
                <div className="flex flex-col text-left">{displayName && <span className="text-xl font-bold leading-none">{displayName}</span>}{nickname && <span className={`text-sm font-mono opacity-60 ${isMagical ? 'text-amber-400' : 'text-slate-500'}`}>@{nickname}</span>}</div>
                <button onClick={() => setShowEditModal(true)} className={`p-1.5 rounded-full transition-colors ${isMagical ? 'hover:bg-amber-900/30 text-amber-500' : 'hover:bg-blue-100 text-blue-600'}`} title="Edit"><Edit2 size={16} /></button>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-4 opacity-70 text-sm"><Mail size={14} />{user?.email}</div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className={`p-6 rounded-2xl border-2 flex items-center gap-4 ${isMagical ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className={`p-3 rounded-xl ${isMagical ? 'bg-cyan-900/30 text-cyan-400' : 'bg-blue-50 text-blue-600'}`}><Award size={32} /></div>
          <div><div className="text-sm opacity-60 uppercase tracking-wider font-bold">{isMagical ? text.xpMagical : text.xpStandard}</div><div className="text-3xl font-bold">{xp}</div></div>
        </div>
        <div className={`p-6 rounded-2xl border-2 flex items-center gap-4 relative overflow-hidden ${isMagical ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className={`p-3 rounded-xl relative z-10 ${isMagical ? 'bg-rose-900/30 text-rose-400' : 'bg-red-50 text-red-600'}`}>{isInfiniteHearts ? <InfinityIcon size={32} /> : <Heart size={32} className="fill-current" />}</div>
          <div className="relative z-10">
              <div className="text-sm opacity-60 uppercase tracking-wider font-bold">{isMagical ? text.heartsMagical : text.heartsStandard}</div>
              <div className="flex flex-col"><span className="text-3xl font-bold">{isInfiniteHearts ? "∞" : `${hearts} / ${maxHearts}`}</span>
                 {!isInfiniteHearts && hearts < maxHearts && timeLeft && (<div className="mt-1"><div className={`flex items-center gap-1.5 text-xs font-bold mb-1 ${isMagical ? 'text-amber-500' : 'text-blue-600'}`}><Clock size={12} /><span>{text.regen} {timeLeft}</span></div><div className="w-full h-1.5 bg-gray-200/20 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }}></div></div></div>)}
                 {!isInfiniteHearts && hearts >= maxHearts && <div className="text-xs font-bold mt-1 text-green-500 opacity-80">{text.full}</div>}
              </div>
          </div>
        </div>
      </div>

      {/* SUBSCRIPTION / BILLING */}
      <div className={`mb-6 p-6 rounded-2xl border-2 ${isMagical ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
         <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm uppercase tracking-wider font-bold opacity-60 flex items-center gap-2"><CreditCard size={14}/> {text.billTitle}</h3>
             {subscription && (<span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${subscription.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{subscription.status}</span>)}
         </div>
         
         {!subscription || subscription.status === 'expired' ? (
             <div className="text-center py-4">
                 <p className="opacity-60 mb-3 text-sm">{text.billNoSub}</p>
                 <a href="/pricing" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${isMagical ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'}`}><Crown size={16} /> {text.billUp}</a>
             </div>
         ) : (
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div>
                    <div className="text-xl font-bold flex items-center gap-2">{getPlanName(subscription.plan_id)}</div>
                    <div className="text-xs opacity-70 flex flex-col gap-1 mt-1">
                        <div className="flex items-center gap-1"><Calendar size={12}/> {subscription.status === 'cancelled' ? (language === 'ka' ? "წვდომა სანამ:" : "Access until:") : text.billNext}: <span className="font-bold text-slate-300 ml-1">{subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleString() : (language === 'ka' ? "უვადო" : "Never")}</span></div>
                        {subCountdown && (<div className={`flex items-center gap-1 font-mono font-bold ${subCountdown === 'EXPIRED' ? 'text-red-500' : 'text-amber-500'}`}>{subCountdown === 'LIFETIME' ? (<><InfinityIcon size={14} /> {language === 'ka' ? 'სამუდამო' : 'Lifetime Access'}</>) : (<><Clock size={12} /> {subCountdown === 'EXPIRED' ? (language === 'ka' ? 'ვადა ამოიწურა' : 'Plan Expired') : `${subCountdown} left`}</>)}</div>)}
                    </div>
                 </div>
                 {subscription.status === 'active' && (<button onClick={handleCancelSubscription} className="text-xs text-red-500 hover:text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition self-start md:self-center">{text.billCancel}</button>)}
             </div>
         )}
      </div>

      {/* SECURITY */}
      <div className={`mb-6 p-6 rounded-2xl border-2 ${isMagical ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
         <div className="flex items-center justify-between mb-4"><h3 className="text-sm uppercase tracking-wider font-bold opacity-60 flex items-center gap-2"><Lock size={14}/> {text.secTitle}</h3><span className={`text-xs px-2 py-1 rounded font-bold ${isMagical ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{devices.length} / 2</span></div>
         <div className="space-y-3 mb-6">
             {devices.map((dev, i) => {
                 const isCurrent = dev.device_id === currentDeviceId;
                 return (
                     <div key={dev.id} className={`p-4 rounded-xl border flex items-center justify-between ${isCurrent ? (isMagical ? 'bg-amber-900/10 border-amber-800/50' : 'bg-blue-50 border-blue-200') : (isMagical ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200')}`}>
                         <div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${isCurrent ? (isMagical ? 'bg-amber-900/30 text-amber-500' : 'bg-blue-100 text-blue-600') : (isMagical ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400')}`}>{isCurrent ? <Shield size={18} /> : <Smartphone size={18} />}</div><div><div className="font-bold text-sm flex items-center gap-2">{language === 'ka' ? `მოწყობილობა ${i + 1}` : `Device ${i + 1}`}{isCurrent && <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${isMagical ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'}`}>{language === 'ka' ? 'აქტიური' : 'Current'}</span>}</div><div className="text-xs opacity-50 truncate max-w-[150px]">{dev.device_name || "Unknown Browser"}</div></div></div>
                         <div className="text-xs opacity-50 font-mono">{new Date(dev.added_at).toLocaleDateString()}</div>
                     </div>
                 );
             })}
         </div>
         {tier !== 'archmage' && <button onClick={() => setShowContactModal(true)} className={`w-full py-3 rounded-xl font-bold border-2 border-dashed flex items-center justify-center gap-2 transition-all ${isMagical ? 'border-slate-700 text-slate-400 hover:border-amber-500 hover:text-amber-500' : 'border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-500'}`}><Mail size={16} /> {text.contact}</button>}
      </div>

      {/* ACTIONS */}
      {!isInfiniteHearts && hearts < maxHearts && (
        <div className={`mb-6 p-6 rounded-2xl border-2 ${isMagical ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className="text-sm uppercase tracking-wider font-bold opacity-60 mb-4">{text.actions}</h3>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={handleHeal} disabled={!canAffordHeal} className={`min-h-[140px] flex flex-col justify-between p-4 rounded-xl border-2 transition-all group ${canAffordHeal ? (isMagical ? 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400' : 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700') : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'}`}><div className="w-full flex justify-center"><PlusCircle size={32} className={!canAffordHeal ? "opacity-50" : ""} /></div><div className="font-bold text-sm text-center">{text.healBtn}</div><div className="w-full flex justify-center">{canAffordHeal ? <span className="text-xs opacity-70 font-bold">{text.healCost}</span> : <div className="bg-slate-900/80 text-white text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1 shadow-sm"><Lock size={10} /><span>{text.need} {missingXp} {text.more}</span></div>}</div></button>
                <button onClick={handleFullRestore} disabled={processingPayment} className={`min-h-[140px] flex flex-col justify-between p-4 rounded-xl border-2 transition-all ${isMagical ? 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400' : 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700'}`}><div className="w-full flex justify-center">{processingPayment ? <Loader2 className="animate-spin" size={32}/> : <CreditCard size={32} />}</div><div className="font-bold text-sm text-center">{text.fullBtn}</div><div className="w-full flex justify-center"><span className="text-xs opacity-70 font-bold">{text.fullCost}</span></div></button>
            </div>
        </div>
      )}

      <button onClick={signOut} className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><LogOut size={20} />{text.signOut}</button>
    </div>
  );
}