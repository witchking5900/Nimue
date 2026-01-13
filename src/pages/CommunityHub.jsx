import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useGameLogic } from '../hooks/useGameLogic';
import { supabase } from '/src/supabaseClient.js';
import { 
  Users, ShieldAlert, Plus, DollarSign, 
  CheckCircle, Lock, Crown, ArrowLeft, Send,
  Ghost, User, ToggleLeft, ToggleRight, Check, X, Sparkles, Pencil, Save, Flag, Trash2, Gavel, AlertTriangle
} from 'lucide-react';

export default function CommunityHub({ onBack }) {
  const { theme, language } = useTheme();
  const { xp, tier } = useGameLogic(); 
  
  const [searchParams, setSearchParams] = useSearchParams();
  const isMagical = theme === 'magical';
  const isArchmage = tier === 'archmage'; 

  // --- 1. SMART INITIALIZATION (FIXED FOR DEEP LINKS) ---
  // We check BOTH the URL (direct link) AND LocalStorage (redirect from App.jsx)
  const getInitialPostId = () => {
      return searchParams.get('community') || localStorage.getItem('pending_community_id');
  };

  const [view, setView] = useState(getInitialPostId() ? 'post' : 'feed'); 
  const [showRules, setShowRules] = useState(!getInitialPostId()); 
  const [posts, setPosts] = useState([]);
  const [activePost, setActivePost] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [bounty, setBounty] = useState(100);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  // EDIT STATE
  const [editingId, setEditingId] = useState(null); 
  const [editContent, setEditContent] = useState(''); 
  const [editTitle, setEditTitle] = useState(''); 
  const [editType, setEditType] = useState(null); 

  // POPUP STATES
  const [rewardPopup, setRewardPopup] = useState({ show: false, amount: 0, success: true });
  const [banModal, setBanModal] = useState({ show: false, userId: null, userName: '', currentStrikes: 0 });

  const t = {
    en: {
      title: isMagical ? "Council of Elders" : "Conference Room",
      rulesTitle: isMagical ? "Sacred Laws of the Council" : "Code of Conduct",
      rulesText: "Cursing, toxicity, or disrespect is STRICTLY FORBIDDEN. Violators will be banished for 24 hours on the first offense. Each subsequent offense adds +24 hours.",
      agree: isMagical ? "I Swear to Uphold the Law" : "I Agree",
      create: "Post Question",
      bounty: "XP Cost (Bounty)",
      postBtn: "Post Question",
      solved: isMagical ? "Bounty Fulfilled" : "Advice Taken", 
      active: "Reward Available",
      accept: isMagical ? "Grant Bounty" : "Take Advice", 
      accepted: isMagical ? "Bounty Fulfilled" : "Advice Taken", 
      cost: "Cost",
      reward: "Reward",
      noPosts: "The hall is silent...",
      back: "Back",
      anon: "Post Anonymously",
      anonCost: "(+50 XP Fee)",
      unknown: isMagical ? "Unknown Mage" : "Anonymous User",
      popTitleMagic: "Bounty Bestowed",
      popTitleStd: "Advice Accepted",
      popDescMagic: "You have rewarded the scholar with knowledge and power.",
      popDescStd: "You have marked this answer as helpful and transferred the reward.",
      close: "Close",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      report: "Report",
      reportConfirm: "Flag this content for the Archmage (Admin)?",
      reported: "Report has been sent to the Archmage.",
      deleteConfirm: "Archmage, are you sure you wish to destroy this inscription?",
      banTitle: "Divine Judgement",
      strikes: "Current Strikes",
      banWarn: "Warning (+1 Strike)",
      ban24: "24 Hour Ban (+1 Strike)",
      ban7: "7 Day Ban (+1 Strike)",
      banPerm: "Permanent Exile"
    },
    ka: {
      title: isMagical ? "უხუცესთა საბჭო" : "საკონფერენციო დარბაზი",
      rulesTitle: isMagical ? "საბჭოს წმინდა კანონები" : "ქცევის კოდექსი",
      rulesText: "უწმაწური სიტყვები და შეურაცხყოფა მკაცრად აკრძალულია. დამრღვევები დაისჯებიან 24 საათიანი ბანით. ყოველი შემდეგი დარღვევა +24 საათი.",
      agree: isMagical ? "ვიცავ საბჭოს წესებს" : "ვეთანხმები",
      create: "კითხვის დასმა",
      bounty: "XP ღირებულება",
      postBtn: "გამოქვეყნება",
      solved: "ჯილდო გაცემულია",
      active: "აქტიური ჯილდო",
      accept: "პასუხის მიღება",
      accepted: "მიღებული პასუხი",
      cost: "ღირებულება",
      reward: "ჯილდო",
      noPosts: "დარბაზში სიჩუმეა...",
      back: "უკან",
      anon: "ანონიმური გამოქვეყნება",
      anonCost: "(+50 XP საკომისიო)",
      unknown: isMagical ? "უცნობი მაგისტრროსი" : "ანონიმური მომხმარებელი",
      popTitleMagic: "ჯილდო გაცემულია",
      popTitleStd: "რჩევა მიღებულია",
      popDescMagic: "თქვენ დააჯილდოვეთ მეცნიერი ცოდნითა და ძალით.",
      popDescStd: "თქვენ მონიშნეთ პასუხი როგორც სასარგებლო და გადაეცით ჯილდო.",
      close: "დახურვა",
      edit: "რედაქტირება",
      save: "შენახვა",
      cancel: "გაუქმება",
      report: "რეპორტი",
      reportConfirm: "გსურთ ამ შინაარსის გასაჩივრება არქიმაგთან (ადმინთან)?",
      reported: "რეპორტი გაგზავნილია არქიმაგთან.",
      deleteConfirm: "არქიმაგო, დარწმუნებული ხართ რომ გსურთ ამ ჩანაწერის განადგურება?",
      banTitle: "ღვთიური განაჩენი",
      strikes: "მიმდინარე სტრაიკები",
      banWarn: "გაფრთხილება (+1 სტრაიკი)",
      ban24: "24 საათიანი ბანი (+1 სტრაიკი)",
      ban7: "7 დღიანი ბანი (+1 სტრაიკი)",
      banPerm: "სამუდამო განდევნა"
    }
  };
  const text = t[language];

  // --- 2. URL LISTENER (FIXED) ---
  useEffect(() => {
    // 1. Check URL first
    let postId = searchParams.get('community');
    
    // 2. Check Handover from App.jsx
    if (!postId) {
        postId = localStorage.getItem('pending_community_id');
    }

    if (postId) {
        console.log("🔗 Community Deep Link Detected:", postId);
        
        const fetchDeepLinkPost = async () => {
            const { data: post, error } = await supabase
                .from('community_posts')
                .select('*')
                .eq('id', postId)
                .single();
            
            if (post && !error) {
                setActivePost(post);
                fetchAnswers(post.id);
                setView('post');
                setShowRules(false);
                // Clean up local storage so it doesn't stick
                localStorage.removeItem('pending_community_id');
            }
        };
        fetchDeepLinkPost();
    } else {
        // Only reset to feed if we are NOT in create mode
        if (view !== 'create' && view !== 'post') setView('feed');
    }
  }, [searchParams]);

  useEffect(() => {
    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
    };
    getUser();
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const fetchAnswers = async (postId) => {
    const { data } = await supabase
      .from('community_answers')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (data) setAnswers(data);
  };

  const getUserIdentity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const name = user.user_metadata.full_name || user.user_metadata.username || user.email.split('@')[0];
      const avatar = user.user_metadata.avatar_url || null;
      return { id: user.id, name, avatar };
  };

  const checkBanStatus = async () => {
      const { data } = await supabase
          .from('profiles')
          .select('banned_until')
          .eq('id', currentUserId)
          .single();
      
      if (data?.banned_until) {
          const banTime = new Date(data.banned_until);
          if (banTime > new Date()) {
              alert(language === 'ka' 
                  ? `თქვენ დაბლოკილი ხართ: ${banTime.toLocaleString()}-მდე.` 
                  : `You are banished until: ${banTime.toLocaleString()}.`);
              return true; 
          }
      }
      return false; 
  };

  // --- ADMIN ACTIONS ---
  const handleDelete = async (itemId, type) => {
      if (!confirm(text.deleteConfirm)) return;
      const table = type === 'post' ? 'community_posts' : 'community_answers';
      await supabase.from(table).delete().eq('id', itemId);
      
      if (type === 'post') {
          setView('feed');
          fetchPosts();
      } else {
          setAnswers(prev => prev.filter(a => a.id !== itemId));
      }
  };

  // 1. OPEN BAN MENU
  const openBanMenu = async (targetUserId, targetName) => {
      const { data: profile } = await supabase
          .from('profiles')
          .select('strikes')
          .eq('id', targetUserId)
          .single();
      
      setBanModal({
          show: true,
          userId: targetUserId,
          userName: targetName,
          currentStrikes: profile?.strikes || 0
      });
  };

  // 2. EXECUTE BAN
  const executeBan = async (hours) => {
      const { userId, currentStrikes } = banModal;
      const newStrikeCount = currentStrikes + 1;
      const until = hours > 0 ? new Date(Date.now() + hours * 3600000).toISOString() : null;
      
      const { error } = await supabase.from('profiles').update({
          strikes: newStrikeCount,
          banned_until: until
      }).eq('id', userId);

      if (error) {
          console.error("Ban Failed:", error);
          alert("Error: Database permission denied.");
      } else {
          let punishmentText = text.banWarn; 
          if (hours === 24) punishmentText = text.ban24;
          if (hours === 168) punishmentText = text.ban7;
          if (hours === 87600) punishmentText = text.banPerm;

          const notifTitle = isMagical ? "Divine Judgement Recieved" : "Administrative Action";
          const notifMsg = isMagical 
            ? `The Archmage has spoken. Penalty: ${punishmentText}. Total Strikes: ${newStrikeCount}.`
            : `You have been penalized: ${punishmentText}. Total Strikes: ${newStrikeCount}.`;

          await supabase.from('notifications').insert({
              user_id: userId,
              type: 'report',
              title: notifTitle,
              message: notifMsg,
              link: null 
          });

          alert(`Judgement delivered. User notified of Strike ${newStrikeCount}.`);
          setBanModal({ show: false, userId: null, userName: '', currentStrikes: 0 });
      }
  };

  // --- EDIT HANDLERS ---
  const startEditing = (item, type) => {
      setEditingId(item.id);
      setEditContent(item.content);
      setEditTitle(item.title || ''); 
      setEditType(type);
  };

  const handleEditFromFeed = (post) => {
      setActivePost(post);
      fetchAnswers(post.id);
      setView('post');
      startEditing(post, 'post');
  };

  const cancelEditing = () => {
      setEditingId(null);
      setEditContent('');
      setEditTitle(''); 
      setEditType(null);
  };

  const saveEdit = async () => {
      if (!editContent.trim()) return;
      if (editType === 'post' && !editTitle.trim()) return alert(language === 'ka' ? "სათაური არ შეიძლება იყოს ცარიელი" : "Title cannot be empty");

      if (editType === 'post') {
          await supabase.from('community_posts').update({ title: editTitle, content: editContent }).eq('id', editingId);
          setPosts(posts.map(p => p.id === editingId ? { ...p, title: editTitle, content: editContent } : p));
          if (activePost && activePost.id === editingId) {
              setActivePost({ ...activePost, title: editTitle, content: editContent });
          }
      } else if (editType === 'answer') {
          await supabase.from('community_answers').update({ content: editContent }).eq('id', editingId);
          setAnswers(answers.map(a => a.id === editingId ? { ...a, content: editContent } : a));
      }

      cancelEditing();
  };

  const handleReport = async (item, type) => {
      if (!confirm(text.reportConfirm)) return;
      // 🛑 REPLACE WITH YOUR REAL ARCHMAGE ID
      const ARCHMAGE_ID = "9177228f-6e97-4ebe-9dcc-f8ee4cce8026"; 

      try {
          await supabase.from('notifications').insert({
              user_id: ARCHMAGE_ID, 
              type: 'report',
              title: isMagical ? "Dark Magic Detected" : "Content Reported",
              message: isMagical 
                ? `A ${type} by ${item.author_name} has been flagged for dark arts.` 
                : `A ${type} by ${item.author_name} was reported.`,
              link: `/?community=${activePost ? activePost.id : item.id}` // <--- FIXED LINK
          });
          alert(text.reported);
      } catch (err) {
          alert("Failed to report.");
      }
  };

  // --- ACTIONS ---
  const handleCreatePost = async () => {
    if (await checkBanStatus()) return;
    if (!newTitle.trim() || !newContent.trim()) return alert("Fill all fields");
    if (bounty < 10) return alert("Minimum bounty is 10 XP");
    
    const anonFee = isAnonymous ? 50 : 0;
    const totalCost = bounty + anonFee;

    // --- ARCHMAGE GOD MODE CHECK ---
    if (!isArchmage && xp < totalCost) {
        return alert(`Not enough XP! You need ${totalCost} XP.`);
    }

    // --- DEDUCT XP (Only if NOT Archmage) ---
    if (!isArchmage) {
        const { error: xpError } = await supabase
            .from('profiles')
            .update({ xp: xp - totalCost })
            .eq('id', currentUserId);
        
        if (xpError) {
            return alert("Transaction failed. Please try again.");
        }
    }

    const user = await getUserIdentity();

    const displayName = isAnonymous ? text.unknown : user.name;
    const displayAvatar = isAnonymous ? null : user.avatar;
    const displayTitle = isAnonymous ? null : tier; 

    const { error } = await supabase.from('community_posts').insert({
      user_id: user.id,
      author_name: displayName,
      author_avatar: displayAvatar,
      author_title: displayTitle, 
      title: newTitle,
      content: newContent,
      bounty: bounty,
      is_solved: false
    });

    if (!error) {
      setNewTitle(''); setNewContent(''); setBounty(100); setIsAnonymous(false);
      setView('feed'); fetchPosts();
    } else {
        alert("Failed to create post: " + error.message);
    }
  };

  const handleOpenPost = (post) => {
    setActivePost(post);
    fetchAnswers(post.id);
    setView('post');
  };

  const handleBack = () => {
      setSearchParams({}); 
      setView('feed');
      if (view === 'feed' && onBack) onBack(); 
  };

  const handlePostReply = async () => {
    if (await checkBanStatus()) return;
    if (!replyContent.trim()) return;
    const user = await getUserIdentity();
    const { error } = await supabase.from('community_answers').insert({
      post_id: activePost.id,
      user_id: user.id,
      author_name: user.name,
      author_avatar: user.avatar,
      author_title: tier, 
      content: replyContent,
      is_accepted: false
    });

    if (!error) { 
        // Notify Author of New Reply
        if (activePost.user_id !== user.id) {
            await supabase.from('notifications').insert({
                user_id: activePost.user_id, 
                type: 'reply',
                title: isMagical ? "A Scholar Has Responded" : "New Reply",
                message: isMagical ? `${user.name} has inscribed a response to your query.` : `${user.name} commented on your question.`,
                link: `/?community=${activePost.id}` // <--- FIXED LINK
            });
        }
        setReplyContent(''); 
        fetchAnswers(activePost.id); 
    }
  };

  const handleAcceptAnswer = async (answer) => {
    const reward = Math.floor(activePost.bounty / 2);
    const msg = language === 'ka' 
        ? `დაადასტურეთ პასუხი? ავტორი მიიღებს ${reward} XP-ს.`
        : `Accept this answer? Author receives ${reward} XP.`;

    if (!confirm(msg)) return;

    try {
        const { data: wasSuccess, error: rpcError } = await supabase.rpc('grant_bounty', { 
            target_user_id: answer.user_id, 
            xp_amount: reward 
        });

        if (rpcError) throw rpcError;
        if (!wasSuccess) throw new Error("User record not found.");

        await supabase.from('community_posts').update({ is_solved: true }).eq('id', activePost.id);
        await supabase.from('community_answers').update({ is_accepted: true }).eq('id', answer.id);

        await supabase.from('notifications').insert({
            user_id: answer.user_id, 
            type: 'bounty',
            title: isMagical ? "Bounty Awarded!" : "Answer Accepted",
            message: isMagical ? `You have earned ${reward} XP for your wisdom.` : `Your answer was marked as correct. +${reward} XP.`,
            link: `/?community=${activePost.id}` // <--- FIXED LINK
        });

        setActivePost(prev => ({ ...prev, is_solved: true }));
        fetchAnswers(activePost.id);
        setRewardPopup({ show: true, amount: reward, success: true });

    } catch (err) {
        setRewardPopup({ show: true, amount: 0, success: false });
    }
  };

  // --- RENDER ---

  return (
    <div className="max-w-7xl mx-auto p-4 pb-20 animate-in fade-in relative">
      
      {/* --- BAN MODAL --- */}
      {banModal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4 animate-in fade-in">
            <div className={`max-w-md w-full p-6 rounded-2xl border-2 text-center shadow-2xl ${isMagical ? 'bg-slate-900 border-red-900 text-red-100' : 'bg-white border-red-500 text-slate-900'}`}>
                <div className="mb-4 flex justify-center">
                    <div className="p-4 rounded-full bg-red-500/20 text-red-500 animate-pulse">
                        <Gavel size={48} />
                    </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">{text.banTitle}</h2>
                <div className="text-lg font-bold mb-1 opacity-90">{banModal.userName}</div>
                <div className="text-sm opacity-60 mb-6 flex items-center justify-center gap-2">
                    <AlertTriangle size={14} /> {text.strikes}: {banModal.currentStrikes}
                </div>

                <div className="grid grid-cols-1 gap-3 mb-6">
                    <button onClick={() => executeBan(0)} className="p-3 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 font-bold border border-yellow-500/30 transition-colors text-left px-4">
                        1. {text.banWarn}
                    </button>
                    <button onClick={() => executeBan(24)} className="p-3 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 font-bold border border-orange-500/30 transition-colors text-left px-4">
                        2. {text.ban24}
                    </button>
                    <button onClick={() => executeBan(168)} className="p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold border border-red-500/30 transition-colors text-left px-4">
                        3. {text.ban7}
                    </button>
                    <button onClick={() => executeBan(87600)} className="p-3 rounded-lg bg-slate-950 hover:bg-black text-slate-400 font-bold border border-slate-800 transition-colors text-left px-4">
                        4. {text.banPerm}
                    </button>
                </div>

                <button onClick={() => setBanModal({ ...banModal, show: false })} className="text-sm opacity-50 hover:opacity-100 underline">
                    {text.cancel}
                </button>
            </div>
        </div>
      )}

      {/* REWARD POPUP */}
      {rewardPopup.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-300">
            <div className={`relative w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300 border-2 ${isMagical ? 'bg-slate-900 border-amber-500 shadow-amber-900/50' : 'bg-white border-green-500 shadow-green-200'}`}>
                <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg ${isMagical ? 'bg-gradient-to-br from-amber-600 to-purple-800 text-amber-100 ring-4 ring-amber-500/30' : 'bg-gradient-to-br from-green-400 to-emerald-600 text-white ring-4 ring-green-100'}`}>
                    {rewardPopup.success ? (isMagical ? <Sparkles size={48} className="animate-pulse" /> : <Check size={48} strokeWidth={4} />) : (<ShieldAlert size={48} />)}
                </div>
                {rewardPopup.success ? (
                    <>
                        <h2 className={`text-2xl font-bold mb-2 ${isMagical ? 'text-amber-100 font-serif' : 'text-slate-800'}`}>{isMagical ? text.popTitleMagic : text.popTitleStd}</h2>
                        <div className={`text-4xl font-black mb-4 tracking-tight ${isMagical ? 'text-amber-400' : 'text-green-600'}`}>+{rewardPopup.amount} XP</div>
                        <p className={`text-sm mb-8 leading-relaxed ${isMagical ? 'text-slate-400' : 'text-slate-500'}`}>{isMagical ? text.popDescMagic : text.popDescStd}</p>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold mb-2 text-red-500">Error</h2>
                        <p className="text-slate-500 mb-8">Transaction failed. Please contact admin.</p>
                    </>
                )}
                <button onClick={() => setRewardPopup({ ...rewardPopup, show: false })} className={`w-full py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-lg ${isMagical ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-500 hover:to-amber-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>{text.close}</button>
            </div>
        </div>
      )}

      {/* RULES POPUP */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in">
          <div className={`max-w-md w-full p-8 rounded-3xl text-center border-2 ${isMagical ? 'bg-slate-900 border-red-900 text-red-100' : 'bg-white border-red-500 text-slate-900'}`}>
            <ShieldAlert size={64} className="mx-auto mb-6 text-red-500" />
            <h2 className="text-2xl font-bold mb-4">{text.rulesTitle}</h2>
            <p className="mb-8 font-medium leading-relaxed opacity-90">{text.rulesText}</p>
            <button onClick={() => setShowRules(false)} className={`w-full py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 ${isMagical ? 'bg-red-900 hover:bg-red-800 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>{text.agree}</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 rounded-xl bg-black/5 hover:bg-black/10"><ArrowLeft /></button>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isMagical ? 'text-amber-100' : 'text-slate-900'}`}>{isMagical ? <Crown className="text-amber-500" /> : <Users className="text-blue-600" />}{text.title}</h1>
        </div>
        {view === 'feed' && (
          <button onClick={() => setView('create')} className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-white shadow-lg ${isMagical ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'}`}><Plus size={18} /> {text.create}</button>
        )}
      </div>

      {/* CREATE VIEW */}
      {view === 'create' && (
        <div className={`p-6 rounded-2xl border ${isMagical ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="mb-4">
            <label className="text-xs font-bold opacity-50 uppercase block mb-1">Question Title</label>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full p-3 rounded-lg bg-black/5 border-2 border-transparent focus:border-blue-500 outline-none" placeholder="e.g. Mechanism of action..." />
          </div>
          <div className="mb-4">
            <label className="text-xs font-bold opacity-50 uppercase block mb-1">Details</label>
            <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={5} className="w-full p-3 rounded-lg bg-black/5 border-2 border-transparent focus:border-blue-500 outline-none" placeholder="Elaborate on your question..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-xs font-bold opacity-50 uppercase block mb-1">{text.bounty}</label>
                <input type="number" value={bounty} onChange={e => setBounty(Number(e.target.value))} className="w-full p-3 rounded-lg bg-black/5 border-2 border-transparent focus:border-amber-500 outline-none font-mono font-bold text-amber-600" />
                <div className="text-xs mt-1 text-slate-500">Winner gets: {Math.floor(bounty / 2)} XP</div>
              </div>
              <div className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer ${isAnonymous ? (isMagical ? 'bg-purple-900/30 border-purple-500' : 'bg-purple-50 border-purple-300') : 'border-transparent bg-black/5'}`} onClick={() => setIsAnonymous(!isAnonymous)}>
                  <div className="flex items-center gap-3">
                      <Ghost size={24} className={isAnonymous ? "text-purple-500" : "opacity-30"} />
                      <div>
                          <div className={`font-bold text-sm ${isAnonymous ? "text-purple-600" : "opacity-50"}`}>{text.anon}</div>
                          <div className="text-xs opacity-50">{text.anonCost}</div>
                      </div>
                  </div>
                  {isAnonymous ? <ToggleRight size={32} className="text-purple-500" /> : <ToggleLeft size={32} className="opacity-30" />}
              </div>
          </div>
          <button onClick={handleCreatePost} className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg flex justify-center items-center gap-2">{text.postBtn} <span className="opacity-80 font-normal">(-{bounty + (isAnonymous ? 50 : 0)} XP)</span></button>
        </div>
      )}

      {/* FEED VIEW */}
      {view === 'feed' && (
        <div className="space-y-3">
          {posts.length === 0 && <div className="text-center py-20 opacity-50 italic">{text.noPosts}</div>}
          {posts.map(post => (
            <div 
              key={post.id} 
              className={`relative w-full text-left p-5 rounded-2xl border-l-4 shadow-sm transition-all hover:scale-[1.01] overflow-hidden group flex flex-col gap-2 ${post.is_solved ? 'border-green-500' : 'border-amber-500'} ${isMagical ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'}`}
            >
              <div className="absolute top-4 right-4 z-10">
                  {post.is_solved ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm ${isMagical ? 'bg-amber-500 text-black shadow-amber-500/50' : 'bg-green-500 text-white'}`}><CheckCircle size={12} fill="currentColor" className="text-current" /> {text.solved}</span>
                  ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${isMagical ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}><DollarSign size={12} /> {Math.floor(post.bounty / 2)} XP</span>
                  )}
              </div>

              <div onClick={() => handleOpenPost(post)} className="cursor-pointer flex-1 pr-32">
                  <div className="flex items-center gap-3 mb-2">
                      {post.author_avatar ? <img src={post.author_avatar} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-slate-500 object-cover" /> : <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMagical ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>{post.author_name === text.unknown ? <Ghost size={20} /> : <User size={20} />}</div>}
                      <div>
                          <div className="font-bold text-sm flex items-center gap-1">{post.author_title && <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${isMagical ? 'bg-amber-900/30 border-amber-500 text-amber-400' : 'bg-blue-100 border-blue-300 text-blue-600'}`}>{post.author_title}</span>}{post.author_name}</div>
                          <div className="text-xs opacity-40 font-mono mt-1">{new Date(post.created_at).toLocaleDateString()}</div>
                      </div>
                  </div>
                  <h3 className="font-bold text-lg line-clamp-1 mb-1">{post.title}</h3>
                  <p className="text-sm opacity-60 line-clamp-2">{post.content}</p>
              </div>

              <div className="flex justify-end gap-2 items-center mt-2 z-20">
                  {currentUserId === post.user_id && (
                      <button onClick={(e) => { e.stopPropagation(); handleEditFromFeed(post); }} className="p-2 rounded-full bg-black/10 hover:bg-black/20 text-slate-500 hover:text-blue-500 transition-colors" title={text.edit}>
                          <Pencil size={16} className="pointer-events-none" />
                      </button>
                  )}

                  {!isArchmage && currentUserId !== post.user_id && (
                      <button onClick={(e) => { e.stopPropagation(); handleReport(post, 'post'); }} className="p-2 rounded-full bg-black/10 hover:bg-red-900/30 text-red-400/50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title={text.report}>
                          <Flag size={16} className="pointer-events-none" />
                      </button>
                  )}

                  {isArchmage && (
                      <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openBanMenu(post.user_id, post.author_name); }} 
                            className="p-2 rounded-full bg-red-900/20 text-red-400 hover:bg-red-900 hover:text-white transition-colors"
                            title="Ban User"
                          >
                              <Gavel size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(post.id, 'post'); }} 
                            className="p-2 rounded-full bg-slate-700/50 text-slate-400 hover:bg-red-600 hover:text-white transition-colors"
                            title="Delete Post"
                          >
                              <Trash2 size={16} />
                          </button>
                      </>
                  )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* SINGLE POST VIEW */}
      {view === 'post' && activePost && (
        <div className="animate-in slide-in-from-right">
          
          <div className={`relative p-6 rounded-2xl border-l-4 mb-6 group ${activePost.is_solved ? 'border-green-500' : 'border-amber-500'} ${isMagical ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="absolute top-4 right-4">
                {activePost.is_solved ? <span className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg ${isMagical ? 'bg-amber-500 text-black shadow-amber-500/20' : 'bg-green-600 text-white shadow-green-200'}`}><Crown size={16} fill="currentColor" />{text.solved}</span> : <span className={`px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center gap-1 ${isMagical ? 'bg-slate-900 text-amber-500 border border-amber-500/30' : 'bg-slate-100 text-blue-600 border border-blue-200'}`}><DollarSign size={14} /> {Math.floor(activePost.bounty / 2)} XP {text.active}</span>}
            </div>

            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4 pr-32">
                {activePost.author_avatar ? <img src={activePost.author_avatar} className="w-12 h-12 rounded-full border-2 border-amber-500/50 object-cover" /> : <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isMagical ? 'bg-slate-700' : 'bg-slate-100'}`}>{activePost.author_name === text.unknown ? <Ghost /> : <User />}</div>}
                <div>
                    <div className={`font-bold flex items-center gap-2 ${isMagical ? 'text-amber-100' : 'text-slate-900'}`}>{activePost.author_title && <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${isMagical ? 'bg-amber-900/30 border-amber-500 text-amber-400' : 'bg-blue-100 border-blue-300 text-blue-600'}`}>{activePost.author_title}</span>}{activePost.author_name}</div>
                    <div className="text-xs opacity-50 flex items-center gap-2 mt-1"><span>{new Date(activePost.created_at).toLocaleString()}</span><span className="text-amber-500 font-bold">• {text.reward}: {Math.floor(activePost.bounty / 2)} XP</span></div>
                </div>
            </div>
            
            {editingId === activePost.id ? (
                <div className="animate-in fade-in mb-4">
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={`w-full p-3 rounded-lg bg-black/10 border border-blue-500 focus:outline-none font-bold text-xl mb-3 ${isMagical ? 'text-white' : 'text-slate-900'}`} placeholder={language === 'ka' ? "კითხვის სათაური" : "Question Title"} />
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className={`w-full p-4 rounded-lg bg-black/10 border border-blue-500 focus:outline-none min-h-[150px] ${isMagical ? 'text-white' : 'text-slate-900'}`} />
                    <div className="flex gap-2 mt-3 justify-end">
                        <button onClick={cancelEditing} className="px-4 py-2 rounded-lg bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 font-bold text-xs">{text.cancel}</button>
                        <button onClick={saveEdit} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2"><Save size={14}/> {text.save}</button>
                    </div>
                </div>
            ) : (
                <>
                    <h2 className={`text-xl font-bold mb-4 ${isMagical ? 'text-white' : 'text-slate-800'}`}>{activePost.title}</h2>
                    <p className="text-lg leading-relaxed opacity-90 whitespace-pre-wrap">{activePost.content}</p>
                </>
            )}

            {isArchmage && (
                <div className="absolute top-4 right-40 flex gap-2">
                    <button onClick={() => openBanMenu(activePost.user_id, activePost.author_name)} className="p-2 rounded-full bg-red-900/20 text-red-400 hover:bg-red-900 hover:text-white"><Gavel size={16}/></button>
                    <button onClick={() => handleDelete(activePost.id, 'post')} className="p-2 rounded-full bg-slate-700/50 text-slate-400 hover:bg-red-600 hover:text-white"><Trash2 size={16}/></button>
                </div>
            )}
          </div>

          <div className="space-y-4 mb-8">
            {answers.map(ans => (
              <div key={ans.id} className={`p-5 rounded-xl border relative group ${ans.is_accepted ? 'border-green-500 bg-green-500/10' : (isMagical ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200')}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                      {ans.author_avatar ? <img src={ans.author_avatar} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-slate-500/20 flex items-center justify-center"><User size={14}/></div>}
                      <div className="text-xs font-bold opacity-70 flex items-center gap-1">{ans.author_title && <span className="text-[9px] uppercase px-1 rounded bg-black/20">{ans.author_title}</span>}{ans.author_name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                      {ans.is_accepted && <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 ${isMagical ? 'bg-amber-500 text-black' : 'bg-green-600 text-white'}`}><CheckCircle size={12} fill="currentColor" /> {text.accepted}</span>}
                      
                      {!activePost.is_solved && currentUserId === activePost.user_id && currentUserId !== ans.user_id && <button onClick={() => handleAcceptAnswer(ans)} className={`text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105 ${isMagical ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}><Check size={16} /> {text.accept}</button>}
                      
                      {currentUserId === ans.user_id && !editingId && (
                          <button onClick={() => startEditing(ans, 'answer')} className="p-2 rounded-full hover:bg-black/10 text-slate-400 hover:text-blue-500 transition-colors" title={text.edit}>
                              <Pencil size={14} className="pointer-events-none" />
                          </button>
                      )}

                      {!isArchmage && currentUserId !== ans.user_id && (
                          <button onClick={() => handleReport(ans, 'answer')} className="p-2 rounded-full hover:bg-red-900/20 text-red-400/50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title={text.report}>
                              <Flag size={14} className="pointer-events-none" />
                          </button>
                      )}

                      {isArchmage && (
                          <div className="flex gap-1">
                              <button onClick={() => openBanMenu(ans.user_id, ans.author_name)} className="p-1.5 rounded bg-red-900/20 text-red-400 hover:bg-red-900 hover:text-white"><Gavel size={14}/></button>
                              <button onClick={() => handleDelete(ans.id, 'answer')} className="p-1.5 rounded bg-slate-700/50 text-slate-400 hover:bg-red-600 hover:text-white"><Trash2 size={14}/></button>
                          </div>
                      )}
                  </div>
                </div>
                
                {editingId === ans.id ? (
                    <div className="animate-in fade-in">
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className={`w-full p-3 rounded-lg bg-black/10 border border-blue-500 focus:outline-none min-h-[100px] ${isMagical ? 'text-white' : 'text-slate-900'}`} />
                        <div className="flex gap-2 mt-2 justify-end">
                            <button onClick={cancelEditing} className="px-3 py-1 rounded bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 font-bold text-xs">{text.cancel}</button>
                            <button onClick={saveEdit} className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1"><Save size={12}/> {text.save}</button>
                        </div>
                    </div>
                ) : (
                    <p className={`mb-4 whitespace-pre-wrap ${isMagical ? 'text-slate-300' : 'text-slate-700'}`}>{ans.content}</p>
                )}
              </div>
            ))}
          </div>

          {!activePost.is_solved && (
            <div className={`p-4 rounded-xl border flex gap-2 ${isMagical ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
              <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} className="flex-1 bg-transparent outline-none resize-none h-12 py-2" placeholder={language === 'ka' ? "დაწერეთ პასუხი..." : "Write your answer..."} />
              <button onClick={handlePostReply} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 self-end"><Send size={20} /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}