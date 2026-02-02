import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useGameLogic } from '../context/GameContext'; 
import { useTheme } from '../context/ThemeContext'; // Import Theme Context for Language
import { useToast } from '../context/ToastContext';
import { 
  BookOpen, Trash2, RefreshCw, CheckCircle, RotateCcw, 
  Eye, Lock, XCircle, Check
} from 'lucide-react';

export default function Grimoire({ onBack }) {
  const navigate = useNavigate();
  const { spendXp, xp, tier } = useGameLogic(); 
  const { language } = useTheme(); // Get Language
  const { addToast } = useToast();
  
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Review State
  const [activeReview, setActiveReview] = useState(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // --- TRANSLATIONS ---
  const t = {
    en: {
        title: "Grimoire of Failures",
        subtitle: "\"Knowledge is built upon the ruins of failure.\"",
        empty: "Your soul is pure. No failures recorded.",
        failed: "Failed",
        times: "times",
        review: "Review",
        cleanse: "Cleanse",
        inspection: "Inspection",
        yourAnswer: "Your Answer",
        locked: "The correct path is hidden.",
        revealBtn: "Reveal Answer",
        correctAnswer: "Correct Answer",
        close: "Close",
        cleanseBtn: "Cleanse (Delete)",
        noPreview: "No preview available",
        unknown: "Unknown",
        noExplanation: "No explanation recorded."
    },
    ka: {
        title: "შეცდომების გრიმუარი",
        subtitle: "\"ცოდნა შენდება მარცხის ნანგრევებზე.\"",
        empty: "თქვენი სული სუფთაა. შეცდომები არ მოიძებნა.",
        failed: "შეცდომა",
        times: "-ჯერ",
        review: "განხილვა",
        cleanse: "წაშლა",
        inspection: "ინსპექცია",
        yourAnswer: "თქვენი პასუხი",
        locked: "სწორი გზა დაფარულია.",
        revealBtn: "პასუხის ნახვა",
        correctAnswer: "სწორი პასუხი",
        close: "დახურვა",
        cleanseBtn: "გწმენდა (წაშლა)",
        noPreview: "წინასწარი ნახვა შეუძლებელია",
        unknown: "უცნობი",
        noExplanation: "ახსნა არ არის ჩაწერილი."
    }
  };
  const text = t[language];

  useEffect(() => {
    fetchMistakes();
  }, []);

  const fetchMistakes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_mistakes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setMistakes(data);
    setLoading(false);
  };

  const handleCleanse = async (id) => {
    setMistakes(prev => prev.filter(m => m.id !== id));
    await supabase.from('user_mistakes').delete().eq('id', id);
  };

  const startReview = (mistake) => {
    setActiveReview(mistake);
    // 🔥 LOAD REVEAL STATE FROM DB 🔥
    setIsAnswerRevealed(mistake.is_revealed || false); 
  };

  const handleExit = () => {
    if (onBack) onBack();
    else navigate('/');
  };

  // 🔥 UPDATED: Persistent Reveal Logic
  const handleReveal = async () => {
    if (isAnswerRevealed) return;

    const COST = 100;
    const isFree = ['archmage', 'insubstantial'].includes(tier);

    // 1. Check if user has enough XP (or is Archmage)
    if (xp >= COST || isFree) {
        
        // 2. Deduct XP
        if (!isFree) {
            spendXp(COST); 
        }

        // 3. Update Local State (Instant Feedback)
        setIsAnswerRevealed(true);
        addToast(isFree ? "Arcane Sight (Free)" : `Knowledge Revealed (-${COST} XP)`, "success");

        // 4. 🔥 UPDATE DATABASE PERSISTENTLY 🔥
        if (activeReview) {
            // Update DB
            await supabase
                .from('user_mistakes')
                .update({ is_revealed: true })
                .eq('id', activeReview.id);
            
            // Update local list so it stays revealed if we close/reopen without fetching
            setMistakes(prev => prev.map(m => 
                m.id === activeReview.id ? { ...m, is_revealed: true } : m
            ));
        }

    } else {
        addToast(`Not enough XP. Requires ${COST} XP.`, "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 flex flex-col items-center animate-in fade-in">
      
      {/* HEADER */}
      <div className="max-w-2xl w-full mb-8 relative">
        <button 
          onClick={handleExit}
          className="absolute left-0 top-1 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
          title="Return"
        >
          <RotateCcw size={24} />
        </button>

        <div className="text-center">
          <h1 className="text-3xl font-serif text-amber-500 mb-2 flex items-center justify-center gap-3">
            <BookOpen size={32} /> {text.title}
          </h1>
          <p className="text-slate-400">
            {text.subtitle}
          </p>
        </div>
      </div>

      {/* MISTAKE LIST */}
      <div className="max-w-2xl w-full space-y-4">
        {loading ? (
          <div className="text-center p-10"><RefreshCw className="animate-spin mx-auto text-amber-500"/></div>
        ) : mistakes.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
            <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500/50" />
            <p>{text.empty}</p>
          </div>
        ) : (
          mistakes.map(m => (
            <div key={m.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center group hover:border-amber-500/30 transition-all">
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    m.game_type === 'clinical' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'
                  }`}>
                    {m.game_type}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {text.failed} {m.mistake_count} {text.times}
                  </span>
                  {/* Show eye icon if already revealed */}
                  {m.is_revealed && (
                      <span className="text-[10px] text-green-500 flex items-center gap-1 bg-green-900/20 px-1.5 py-0.5 rounded border border-green-900/50">
                          <Eye size={10} /> {language === 'ka' ? "ნაყიდია" : "Owned"}
                      </span>
                  )}
                </div>
                
                <h3 className="font-bold text-slate-200">
                  {m.question_snapshot?.title || `Mystery Question #${m.question_id}`}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {m.question_snapshot?.question || text.noPreview}
                </p>
                <div className="text-[10px] text-slate-600 mt-1">
                    {new Date(m.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => startReview(m)}
                  className="px-4 py-2 bg-amber-900/20 text-amber-500 border border-amber-900/50 rounded-lg hover:bg-amber-900/40 transition flex items-center gap-2 text-sm font-bold"
                >
                  <RefreshCw size={14} /> {text.review}
                </button>
                <button 
                  onClick={() => handleCleanse(m.id)}
                  className="p-2 text-slate-600 hover:text-red-500 transition"
                  title={text.cleanse}
                >
                  <Trash2 size={16} />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* REVIEW MODAL */}
      {activeReview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-amber-500 mb-4 flex items-center gap-2">
                <BookOpen size={20} /> {text.inspection}
            </h2>
            
            {/* QUESTION */}
            <div className="bg-slate-950 p-4 rounded-xl mb-4 border border-slate-800">
              <h4 className="text-white font-bold mb-2">{activeReview.question_snapshot?.title}</h4>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">
                {activeReview.question_snapshot?.question}
              </p>
            </div>

            {/* YOUR MISTAKE */}
            <div className="bg-red-900/10 p-4 rounded-xl mb-4 border border-red-900/30">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase mb-1">
                    <XCircle size={14} /> {text.yourAnswer}
                </div>
                <p className="text-red-200 text-sm font-medium">
                    {activeReview.question_snapshot?.userAnswer || text.unknown}
                </p>
                {activeReview.question_snapshot?.userFeedback && (
                    <p className="text-red-300/70 text-xs mt-2 italic">
                        "{activeReview.question_snapshot.userFeedback}"
                    </p>
                )}
            </div>

            {/* 🔥 REVEAL SECTION 🔥 */}
            <div className={`p-4 rounded-xl mb-6 border transition-all ${isAnswerRevealed ? 'bg-green-900/10 border-green-900/30' : 'bg-slate-800/50 border-dashed border-slate-700'}`}>
                
                {!isAnswerRevealed ? (
                    <div className="text-center py-2">
                        <div className="flex justify-center mb-2 text-slate-500"><Lock size={24} /></div>
                        <p className="text-slate-400 text-sm mb-3">{text.locked}</p>
                        <button 
                            onClick={handleReveal}
                            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 mx-auto transition-all ${xp >= 100 ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                        >
                            <Eye size={16} /> {text.revealBtn} (100 XP)
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase mb-1">
                            <Check size={14} /> {text.correctAnswer}
                        </div>
                        <p className="text-green-200 text-sm font-medium">
                            {activeReview.question_snapshot?.correctAnswer || "Data lost..."}
                        </p>
                        <p className="text-green-300/70 text-xs mt-2 italic border-l-2 border-green-500/30 pl-3">
                            {activeReview.question_snapshot?.correctFeedback || text.noExplanation}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
              <button 
                onClick={() => setActiveReview(null)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                {text.close}
              </button>
              <button 
                onClick={() => {
                  handleCleanse(activeReview.id);
                  setActiveReview(null);
                  addToast(text.cleanse, "success");
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-200 border border-slate-700 hover:border-red-800 rounded-lg font-bold text-sm flex items-center gap-2"
              >
                <Trash2 size={14} /> {text.cleanseBtn}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}