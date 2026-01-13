import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useGameLogic } from '../context/GameContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient'; 
import { 
  User, Mail, Award, Heart, Clock, LogOut,
  Infinity as InfinityIcon, Ghost, Crown, Star, Loader2,
  PlusCircle, Lock, Send, Gift, Copy, MessageSquareHeart,
  Grid, Eraser, Save, X, Edit2
} from 'lucide-react';

// --- PIXEL AVATAR EDITOR COMPONENT ---
const PixelEditor = ({ initialData, onSave, onCancel, isMagical }) => {
    const GRID_SIZE = 8; // 8x8 Grid for "Low Quality" look
    const [pixels, setPixels] = useState(initialData || Array(GRID_SIZE * GRID_SIZE).fill('#ffffff'));
    const [color, setColor] = useState('#000000');
    
    // Simple Palette
    const colors = ['#000000', '#ffffff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#78350f', '#9ca3af'];

    const handlePixelClick = (index) => {
        const newPixels = [...pixels];
        newPixels[index] = color;
        setPixels(newPixels);
    };

    const handleSave = () => {
        // Convert grid to SVG data URL for storage
        const svgString = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID_SIZE} ${GRID_SIZE}" shape-rendering="crispEdges">
                ${pixels.map((c, i) => {
                    const x = i % GRID_SIZE;
                    const y = Math.floor(i / GRID_SIZE);
                    return `<rect x="${x}" y="${y}" width="1" height="1" fill="${c}" />`;
                }).join('')}
            </svg>
        `;
        const base64 = btoa(svgString);
        const dataUrl = `data:image/svg+xml;base64,${base64}`;
        onSave(dataUrl, pixels); // Save both image and raw data
    };

    return (
        <div className={`fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in`}>
            <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl border-2 relative ${isMagical ? 'bg-slate-900 border-amber-600 text-amber-50' : 'bg-white border-blue-500 text-slate-900'}`}>
                <button onClick={onCancel} className="absolute top-4 right-4 opacity-50 hover:opacity-100"><X size={24} /></button>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Grid size={20}/> Design Pixel Avatar</h3>
                
                {/* GRID */}
                <div className="aspect-square bg-slate-200 mb-6 grid grid-cols-8 gap-px border-2 border-slate-300 rounded-lg overflow-hidden shadow-inner cursor-pointer" 
                     onMouseLeave={() => { /* Stop drawing if drag implemented */ }}>
                    {pixels.map((fill, i) => (
                        <div 
                            key={i} 
                            onClick={() => handlePixelClick(i)}
                            className="w-full h-full"
                            style={{ backgroundColor: fill }}
                        />
                    ))}
                </div>

                {/* PALETTE */}
                <div className="flex justify-center gap-2 mb-6 flex-wrap">
                    {colors.map(c => (
                        <button 
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-slate-900 scale-110 shadow-lg' : 'border-slate-300'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setPixels(Array(GRID_SIZE * GRID_SIZE).fill('#ffffff'))} className="flex-1 py-3 rounded-xl font-bold border border-slate-300 hover:bg-slate-100 text-slate-600 flex items-center justify-center gap-2">
                        <Eraser size={18} /> Clear
                    </button>
                    <button onClick={handleSave} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white ${isMagical ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        <Save size={18} /> Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function ProfileView() {
  const { user, signOut } = useAuth();
  const { theme, language } = useTheme();
  const { addToast } = useToast();
  
  const { 
      hearts, maxHearts, xp, tier, isInfiniteHearts, regenTarget, regenSpeed,
      buyHeartWithXp 
  } = useGameLogic();
  
  const isMagical = theme === 'magical';
  const [timeLeft, setTimeLeft] = useState('');
  const [progress, setProgress] = useState(0); 
  
  // --- AVATAR STATE ---
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || null);
  // We store the raw pixel array in metadata too, so they can edit it later
  const [pixelData, setPixelData] = useState(user?.user_metadata?.pixel_data || null); 
  const [showEditor, setShowEditor] = useState(false);

  // --- CONTACT STATE ---
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

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

  const handleDonate = () => {
      const iban = "GE39BG0000000609365554";
      navigator.clipboard.writeText(iban);
      addToast(language === 'ka' ? "ანგარიშის ნომერი დაკოპირდა!" : "IBAN copied to clipboard!", "success");
  };

  // --- SAVE AVATAR (NO FILE UPLOAD) ---
  const handleSaveAvatar = async (dataUrl, rawPixels) => {
      try {
          const { error } = await supabase.auth.updateUser({
              data: { 
                  avatar_url: dataUrl,
                  pixel_data: rawPixels 
              }
          });

          if (error) throw error;

          setAvatarUrl(dataUrl);
          setPixelData(rawPixels);
          setShowEditor(false);
          addToast(language === 'ka' ? "ავატარი შენახულია!" : "Avatar Saved!", "success");
      } catch (err) {
          addToast("Error saving: " + err.message, "error");
      }
  };

  // --- CONTACT SUBMIT VIA SECURE RPC ---
  const handleContactSubmit = async (e) => {
      e.preventDefault();
      setSendingMsg(true);
      
      try {
          const ARCHMAGE_ID = '69a13b7d-53c3-40e0-8ad2-8b93440e7aad';
          const { error } = await supabase.rpc('send_petition', {
              target_user_id: ARCHMAGE_ID,
              topic: `Feedback / Good Wishes`, 
              content: contactMessage,
              sender: user.email
          });

          if (error) throw error;

          addToast(language === 'ka' ? "შეტყობინება გაგზავნილია!" : "Message Sent!", "success");
          setShowContactModal(false);
          setContactMessage("");

      } catch (err) {
          console.error("🔥 ERROR:", err.message);
          addToast(`Failed: ${err.message}`, "error");
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
      need: "Need",
      more: "more",
      contactTitle: "Direct Connection",
      contactDesc: "Send recommendations, feedback, or simply good wishes to the Archmage.",
      contactBtn: "Write Message",
      modalTitle: "Message to Archmage",
      modalPlaceholder: "Your thoughts, ideas, or wishes...",
      send: "Send",
      cancel: "Cancel",
      donateTitle: "Support the Archmage",
      donateDesc: "If you wish, you can support the platform. Click to copy IBAN.",
      donateBtn: "Copy Account Number",
      editAvatar: "Design Pixel Avatar"
    },
    ka: {
      profileMagical: "ჯადოქრის პროფილი", profileStandard: "სტუდენტის პროფილი",
      xpMagical: "საიდუმლო ცოდნა", xpStandard: "გამოცდილება",
      heartsMagical: "სასიცოცხლო ესენცია", heartsStandard: "სიცოცხლეები",
      regen: "აღდგენა:", full: "სრულად აღდგენილია", infinite: "უსასრულო ენერგია", signOut: "გასვლა",
      actions: "გადაუდებელი დახმარება",
      healBtn: "1 გულის აღდგენა",
      healCost: "50 XP",
      need: "გაკლია",
      more: "",
      contactTitle: "პირდაპირი კავშირი",
      contactDesc: "გაუგზავნეთ რეკომენდაციები, იდეები ან უბრალოდ კეთილი სურვილები არქიმაგს.",
      contactBtn: "მიწერა",
      modalTitle: "წერილი არქიმაგს",
      modalPlaceholder: "თქვენი იდეები, სურვილები...",
      send: "გაგზავნა",
      cancel: "გაუქმება",
      donateTitle: "მხარდაჭერა",
      donateDesc: "თუ სურვილი გაქვთ, შეგიძლიათ მხარი დაუჭიროთ პლატფორმას. დააწკაპუნეთ ანგარიშის ნომრის დასაკოპირებლად.",
      donateBtn: "ანგარიშის ნომრის კოპირება",
      editAvatar: "პიქსელ ავატარის შექმნა"
    }
  };
  const text = t[language] || t.en;

  const getRankDisplay = () => {
    const titles = {
        archmage: { magical: { en: "Archmage", ka: "არქიმაგი" }, standard: { en: "Dept. Chair", ka: "დეპ. ხელმძღვანელი" }, color: 'text-purple-500', icon: InfinityIcon },
        insubstantial: { magical: { en: "Insubstantial", ka: "ილუზორული" }, standard: { en: "Honorary Fellow", ka: "საპატიო წევრი" }, color: 'text-fuchsia-400', icon: Ghost },
        grand_magus: { magical: { en: "Grand Magus", ka: "დიდი ჯადოქარი" }, standard: { en: "Attending", ka: "მკურნალი ექიმი" }, color: 'text-amber-500', icon: Crown },
        magus: { magical: { en: "Magus", ka: "ჯადოქარი" }, standard: { en: "Resident", ka: "რეზიდენტი" }, color: 'text-emerald-500', icon: Star },
        apprentice: { magical: { en: "Apprentice", ka: "შეგირდი" }, standard: { en: "Student", ka: "სტუდენტი" }, color: 'text-blue-500', icon: User }
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
      
      {/* EDITOR MODAL */}
      {showEditor && (
          <PixelEditor 
            initialData={pixelData} 
            onSave={handleSaveAvatar} 
            onCancel={() => setShowEditor(false)} 
            isMagical={isMagical}
          />
      )}

      {/* CONTACT MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border-2 ${isMagical ? 'bg-slate-900 border-amber-600 text-amber-50' : 'bg-white border-blue-500 text-slate-900'}`}>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <MessageSquareHeart size={20} className={isMagical ? "text-amber-500" : "text-blue-600"} />
                    {text.modalTitle}
                </h3>
                
                <form onSubmit={handleContactSubmit}>
                    <textarea 
                        className={`w-full p-3 rounded-xl border mb-4 focus:outline-none focus:ring-2 h-32 resize-none ${isMagical ? 'bg-slate-800 border-slate-700 focus:ring-amber-500 placeholder-slate-500' : 'bg-slate-50 border-slate-200 focus:ring-blue-500'}`}
                        placeholder={text.modalPlaceholder}
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
          
          {/* AVATAR DISPLAY & EDIT BUTTON */}
          <div className="relative group">
            <div className={`w-24 h-24 rounded-lg border-4 flex items-center justify-center shadow-lg overflow-hidden relative bg-white ${isMagical ? 'border-amber-500' : 'border-blue-500'}`}>
              {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover pixelated rendering-pixelated" style={{imageRendering: 'pixelated'}} />
              ) : (
                  <User size={48} className="text-slate-400" />
              )}
            </div>
            <button 
                onClick={() => setShowEditor(true)}
                className="absolute -bottom-2 -right-2 p-2 rounded-full cursor-pointer transition-all hover:scale-110 shadow-lg bg-slate-900 text-white border border-slate-700 z-10"
                title={text.editAvatar}
            >
               <Edit2 size={14} />
            </button>
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

      {/* --- CONTACT SECTION --- */}
      <div className={`mb-6 p-6 rounded-2xl border-2 ${isMagical ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
         <div className="flex items-start justify-between">
             <div>
                 <h3 className="text-sm uppercase tracking-wider font-bold opacity-60 mb-1 flex items-center gap-2">
                     <MessageSquareHeart size={14}/> {text.contactTitle}
                 </h3>
                 <p className="text-sm opacity-70 max-w-sm mb-4">{text.contactDesc}</p>
             </div>
             <button onClick={() => setShowContactModal(true)} className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 border transition-all ${isMagical ? 'bg-amber-900/20 border-amber-700 text-amber-200 hover:bg-amber-900/40' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'}`}>
                 <Mail size={16} /> {text.contactBtn}
             </button>
         </div>
      </div>

      {/* EMERGENCY AID ACTIONS (ONLY SHOW IF DAMAGED) */}
      {!isInfiniteHearts && hearts < maxHearts && (
        <div className={`mb-6 p-6 rounded-2xl border-2 ${isMagical ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className="text-sm uppercase tracking-wider font-bold opacity-60 mb-4">{text.actions}</h3>
            {/* REMOVED GRID, NOW SINGLE FULL WIDTH ITEM */}
            <div className="w-full">
                <button onClick={handleHeal} disabled={!canAffordHeal} className={`w-full min-h-[100px] flex items-center justify-between p-6 rounded-xl border-2 transition-all group ${canAffordHeal ? (isMagical ? 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400' : 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700') : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full border-2 border-current"><PlusCircle size={28} className={!canAffordHeal ? "opacity-50" : ""} /></div>
                        <div className="text-left">
                             <div className="font-bold text-lg">{text.healBtn}</div>
                             {!canAffordHeal && <div className="text-xs opacity-70 mt-1">{text.need} {missingXp} {text.more} XP</div>}
                        </div>
                    </div>
                    <div className="text-right">
                         <span className={`text-xl font-bold ${!canAffordHeal ? "opacity-50" : ""}`}>{text.healCost}</span>
                    </div>
                </button>
            </div>
        </div>
      )}

      {/* --- DONATION SECTION --- */}
      <button onClick={handleDonate} className={`w-full mb-4 py-4 rounded-xl font-bold flex items-center justify-between px-6 border-2 transition-all group ${isMagical ? 'border-amber-500/30 bg-amber-900/10 hover:bg-amber-900/20 text-amber-200' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}>
          <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isMagical ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-100 text-slate-500'}`}>
                  <Gift size={20} />
              </div>
              <div className="text-left">
                  <div className="font-bold text-sm">{text.donateTitle}</div>
                  <div className="text-xs opacity-60 font-normal">{text.donateDesc}</div>
              </div>
          </div>
          <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border ${isMagical ? 'bg-slate-800 border-slate-700 group-hover:border-amber-500/50' : 'bg-slate-100 border-slate-200'}`}>
              <Copy size={12} /> {text.donateBtn}
          </div>
      </button>

      <button onClick={signOut} className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
        <LogOut size={20} />{text.signOut}
      </button>
    </div>
  );
}