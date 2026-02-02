import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useGameLogic } from '../hooks/useGameLogic'; 
import { useTheme } from '../context/ThemeContext'; 
import { useToast } from '../context/ToastContext';
import { 
  BookOpen, Trash2, RefreshCw, CheckCircle, RotateCcw, 
  Eye, Lock, XCircle, Check
} from 'lucide-react';

export default function Grimoire({ onBack }) {
  const navigate = useNavigate();
  const { spendXp, xp, tier } = useGameLogic(); 
  const { theme, language } = useTheme(); // 🔥 Added Theme support
  const { addToast } = useToast();
  
  const isMagical = theme === 'magical'; // 🔥 Theme flag
  
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Review State
  const [activeReview, setActiveReview] = useState(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // --- TRANSLATIONS ---
  const t = {
    en: {
        title: isMagical ? "Grimoire of Failures" : "Error Log",
        subtitle: isMagical ? "\"Knowledge is built upon the ruins of failure.\"" : "Review and correct your past mistakes.",
        empty: "No failures recorded.",
        failed: "Mistake count:",
        times: "",
        review: "Review",
        cleanse: "Clear",
        inspection: "Case Review",
        yourAnswer: "Your Answer",
        locked: "Answer Hidden",
        revealBtn: "Reveal Answer",
        correctAnswer: "Correct Answer",
        close: "Close",
        cleanseBtn: "Remove Entry",
        noPreview: "No preview available",
        unknown: "Unknown",
        noExplanation: "No explanation recorded."
    },
    ka: {
        title: isMagical ? "შეცდომების გრიმუარი" : "შეცდომების ისტორია",
        subtitle: isMagical ? "\"ცოდნა შენდება მარცხის ნანგრევებზე.\"" : "გააანალიზეთ და გამოასწორეთ შეცდომები.",
        empty: "შეცდომები არ მოიძებნა.",
        failed: "შეცდომა:",
        times: "-ჯერ",
        review: "განხილვა",
        cleanse: "წაშლა",
        inspection: "განხილვა",
        yourAnswer: "თქვენი პასუხი",
        locked: "სწორი პასუხი დაფარულია.",
        revealBtn: "პასუხის ნახვა",
        correctAnswer: "სწორი პასუხი",
        close: "დახურვა",
        cleanseBtn: "წაშლა",
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
        addToast(isFree ? (language === 'ka' ? "უფასო ნახვა" : "Free Reveal") : (language === 'ka' ? `პასუხი ნანახია (-${COST} XP)` : `Answer Revealed (-${COST} XP)`), "success");

        // 4. 🔥 UPDATE DATABASE PERSISTENTLY 🔥
        if (activeReview) {
            await supabase
                .from('user_mistakes')
                .update({ is_revealed: true })
                .eq('id', activeReview.id);
            
            setMistakes(prev => prev.map(m => 
                m.id === activeReview.id ? { ...m, is_revealed: true } : m
            ));
        }

    } else {
        addToast(language === 'ka' ? `არ გაქვთ საკმარისი XP (${COST})` : `Not enough XP (${COST})`, "error");
    }
  };

  return (
    <div className={`min-h-screen p-6 flex flex-col items-center animate-in fade-in transition-colors duration-300 ${isMagical ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* HEADER */}
      <div className="max-w-2xl w-full mb-8 relative">
        <button 
          onClick={handleExit}
          className={`absolute left-0 top-1 p-2 rounded-lg transition-colors ${isMagical ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-800 hover:bg-black/5'}`}
          title="Return"
        >
          <RotateCcw size={24} />
        </button>

        <div className="text-center">
          <h1 className={`text-3xl font-bold mb-2 flex items-center justify-center gap-3 ${isMagical ? 'font-serif text-amber-500' : 'font-sans text-slate-800'}`}>
            <BookOpen size={32} /> {text.title}
          </h1>
          <p className={isMagical ? 'text-slate-400' : 'text-slate-500'}>
            {text.subtitle}
          </p>
        </div>
      </div>

      {/* MISTAKE LIST */}
      <div className="max-w-2xl w-full space-y-4">
        {loading ? (
          <div className="text-center p-10"><RefreshCw className={`animate-spin mx-auto ${isMagical ? 'text-amber-500' : 'text-blue-500'}`}/></div>
        ) : mistakes.length === 0 ? (
          <div className={`text-center p-12 border-2 border-dashed rounded-xl ${isMagical ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
            <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>{text.empty}</p>
          </div>
        ) : (
          mistakes.map(m => (
            <div key={m.id} className={`p-4 rounded-xl flex justify-between items-center group border transition-all ${isMagical ? 'bg-slate-900 border-slate-800 hover:border-amber-500/30' : 'bg-white border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md'}`}>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    m.game_type === 'clinical' ? (isMagical ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600') : (isMagical ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600')
                  }`}>
                    {m.game_type}
                  </span>
                  <span className={`text-[10px] ${isMagical ? 'text-slate-500' : 'text-slate-400'}`}>
                    {text.failed} {m.mistake_count} {text.times}
                  </span>
                  {m.is_revealed && (
                      <span className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded border ${isMagical ? 'bg-green-900/20 border-green-900/50 text-green-500' : 'bg-green-100 border-green-200 text-green-600'}`}>
                          <Eye size={10} /> {language === 'ka' ? "ნაყიდია" : "Owned"}
                      </span>
                  )}
                </div>
                
                <h3 className={`font-bold ${isMagical ? 'text-slate-200' : 'text-slate-800'}`}>
                  {m.question_snapshot?.title || `Question #${m.question_id}`}
                </h3>
                <p className={`text-xs mt-1 line-clamp-1 ${isMagical ? 'text-slate-500' : 'text-slate-500'}`}>
                    {m.question_snapshot?.question || text.noPreview}
                </p>
                <div className="text-[10px] text-slate-400 mt-1">
                    {new Date(m.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => startReview(m)}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm font-bold border ${isMagical ? 'bg-amber-900/20 text-amber-500 border-amber-900/50 hover:bg-amber-900/40' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}
                >
                  <RefreshCw size={14} /> {text.review}
                </button>
                <button 
                  onClick={() => handleCleanse(m.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in backdrop-blur-sm">
          <div className={`p-6 rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto border-2 ${isMagical ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isMagical ? 'text-amber-500' : 'text-slate-800'}`}>
                <BookOpen size={20} /> {text.inspection}
            </h2>
            
            {/* QUESTION */}
            <div className={`p-4 rounded-xl mb-4 border ${isMagical ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h4 className={`font-bold mb-2 ${isMagical ? 'text-white' : 'text-slate-900'}`}>{activeReview.question_snapshot?.title}</h4>
              <p className={`text-sm whitespace-pre-wrap ${isMagical ? 'text-slate-300' : 'text-slate-600'}`}>
                {activeReview.question_snapshot?.question}
              </p>
            </div>

            {/* YOUR MISTAKE */}
            <div className={`p-4 rounded-xl mb-4 border ${isMagical ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
                <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase mb-1">
                    <XCircle size={14} /> {text.yourAnswer}
                </div>
                <p className={`text-sm font-medium ${isMagical ? 'text-red-200' : 'text-red-800'}`}>
                    {activeReview.question_snapshot?.userAnswer || text.unknown}
                </p>
                {activeReview.question_snapshot?.userFeedback && (
                    <p className={`text-xs mt-2 italic ${isMagical ? 'text-red-300/70' : 'text-red-600/80'}`}>
                        "{activeReview.question_snapshot.userFeedback}"
                    </p>
                )}
            </div>

            {/* 🔥 REVEAL SECTION 🔥 */}
            <div className={`p-4 rounded-xl mb-6 border transition-all ${isAnswerRevealed ? (isMagical ? 'bg-green-900/10 border-green-900/30' : 'bg-green-50 border-green-200') : (isMagical ? 'bg-slate-800/50 border-dashed border-slate-700' : 'bg-slate-50 border-dashed border-slate-200')}`}>
                
                {!isAnswerRevealed ? (
                    <div className="text-center py-2">
                        <div className={`flex justify-center mb-2 ${isMagical ? 'text-slate-500' : 'text-slate-400'}`}><Lock size={24} /></div>
                        <p className={`text-sm mb-3 ${isMagical ? 'text-slate-400' : 'text-slate-500'}`}>{text.locked}</p>
                        <button 
                            onClick={handleReveal}
                            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 mx-auto transition-all ${xp >= 100 ? (isMagical ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md') : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                        >
                            <Eye size={16} /> {text.revealBtn} (100 XP)
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-green-500 font-bold text-xs uppercase mb-1">
                            <Check size={14} /> {text.correctAnswer}
                        </div>
                        <p className={`text-sm font-medium ${isMagical ? 'text-green-200' : 'text-green-800'}`}>
                            {activeReview.question_snapshot?.correctAnswer || "Data lost..."}
                        </p>
                        <p className={`text-xs mt-2 italic border-l-2 pl-3 ${isMagical ? 'text-green-300/70 border-green-500/30' : 'text-green-700/80 border-green-300'}`}>
                            {activeReview.question_snapshot?.correctFeedback || text.noExplanation}
                        </p>
                    </div>
                )}
            </div>

            <div className={`flex gap-3 justify-end pt-4 border-t ${isMagical ? 'border-slate-800' : 'border-slate-100'}`}>
              <button 
                onClick={() => setActiveReview(null)}
                className={`px-4 py-2 hover:underline ${isMagical ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {text.close}
              </button>
              <button 
                onClick={() => {
                  handleCleanse(activeReview.id);
                  setActiveReview(null);
                  addToast(text.cleanse, "success");
                }}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 border ${isMagical ? 'bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-200 border-slate-700 hover:border-red-800' : 'bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border-slate-200 hover:border-red-200'}`}
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