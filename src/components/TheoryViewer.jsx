import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from '../context/ThemeContext';
import { supabase } from '/src/supabaseClient.js';
import { useGameLogic } from '../hooks/useGameLogic';
import { useToast } from '../context/ToastContext';
import { 
  Book, ArrowRight, Brain, Loader2, CheckCircle, Crown, RotateCcw, 
  ChevronLeft, FileText, Sparkles, Scroll, Bell, BellRing, FolderOpen, Search 
} from "lucide-react";

export default function TheoryViewer({ onBack }) {
  const { theme, language } = useTheme();
  const { completeActivity, completedIds, gainXp } = useGameLogic(); 
  const { addToast } = useToast();
  const isMagical = theme === 'magical';

  // --- STATE ---
  const [categories, setCategories] = useState([]); 
  const [allInscriptions, setAllInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [selectedCategory, setSelectedCategory] = useState(null); 
  const [selectedTopic, setSelectedTopic] = useState(null);       

  // Subscription State
  const [subscribedCategories, setSubscribedCategories] = useState([]);

  // Quiz State
  const [quizState, setQuizState] = useState({
    active: false,
    currentQuestionIndex: 0,
    score: 0,
    showResults: false,
    selectedAnswer: null
  });

  const [showMasteryModal, setShowMasteryModal] = useState(false);

  // --- HELPER 1: GET CATEGORY DISPLAY NAME ---
  const getCategoryDisplay = (catObj) => {
    if (!catObj) return { title: '', subtitle: '' };

    const langKey = language === 'ka' ? 'ka' : 'en';
    const titleObj = catObj.title?.[langKey] || catObj.title?.['en']; 
    if (!titleObj) return { title: catObj.slug || 'Unknown', subtitle: '' };

    if (isMagical) {
        return {
            title: titleObj.magical || titleObj.standard || catObj.slug,
            subtitle: titleObj.magicalSubtitle || ''
        };
    } else {
        return {
            title: titleObj.standard || catObj.slug,
            subtitle: ''
        };
    }
  };

  // --- HELPER 2: SAFE TEXT EXTRACTOR ---
  const getContent = (contentObj) => {
    if (!contentObj) return "";
    
    // 1. Get Language Layer
    const langKey = language === 'ka' ? 'ka' : 'en';
    const langData = contentObj[langKey] || contentObj['en'];
    
    if (!langData) return "";

    // 2. Check if it's a string (Old Data or Quiz Options)
    if (typeof langData === 'string') return langData;

    // 3. Handle Standard vs Magical Object (New Inscription Data)
    if (isMagical) {
        return langData.magical || langData.standard || "";
    } else {
        return langData.standard || "";
    }
  };

  const getText = (obj) => getContent(obj); 

  const awardXp = (amount) => {
    if (amount === 0) return;
    if (gainXp) gainXp(amount);
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: catData } = await supabase.from('categories').select('*').order('slug');
      if (catData) setCategories(catData);

      const { data: dbData, error } = await supabase
        .from('inscriptions') 
        .select(`
            *,
            categories ( title, slug )
        `); 

      if (error) console.error("Error fetching inscriptions:", error);

      if (dbData) {
        const formattedData = dbData.map(item => {
            const catName = item.categories?.title?.en?.standard || item.categories?.slug || 'General';
            return {
                id: item.id, 
                category: catName, 
                title: item.title,
                content: item.content,
                quiz: item.test_data || []
            };
        });
        setAllInscriptions(formattedData);
        
        const pendingId = localStorage.getItem('pending_inscription_id');
        if (pendingId) {
            const foundTopic = formattedData.find(t => t.id === pendingId);
            if (foundTopic) {
                setSelectedCategory(foundTopic.category);
                setSelectedTopic(foundTopic);
            }
            localStorage.removeItem('pending_inscription_id');
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: subData } = await supabase
            .from('subscriptions')
            .select('category')
            .eq('user_id', user.id);
        if (subData) {
            setSubscribedCategories(subData.map(item => item.category));
        }
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const currentCategoryInscriptions = useMemo(() => {
      if (!selectedCategory) return [];
      return allInscriptions.filter(i => i.category === selectedCategory);
  }, [selectedCategory, allInscriptions]);

  const toggleSubscription = async (e, categoryKey) => {
      e.stopPropagation(); 
      if (!categoryKey) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { addToast("Please sign in to subscribe."); return; }

      try {
          if (subscribedCategories.includes(categoryKey)) {
              const { error } = await supabase.from('subscriptions').delete().match({ user_id: user.id, category: categoryKey });
              if (error) throw error;
              setSubscribedCategories(prev => prev.filter(c => c !== categoryKey));
              addToast(isMagical ? "Link severed." : "Unsubscribed.");
          } else {
              const { error } = await supabase.from('subscriptions').insert({ user_id: user.id, category: categoryKey });
              if (error) throw error;
              setSubscribedCategories(prev => [...prev, categoryKey]);
              addToast(isMagical ? "Fate bound." : "Subscribed!");
          }
      } catch (err) { addToast("Error: " + err.message); }
  };

  // --- QUIZ LOGIC (FIXED XP GRANTING) ---
  const finishQuiz = async () => {
    const masteryId = `${selectedTopic.id}_mastered`;
    const scorePercent = Math.round((quizState.score / selectedTopic.quiz.length) * 100);
    
    // Only grant XP if 100% score AND hasn't been mastered before
    if (scorePercent === 100 && !completedIds.has(masteryId)) {
        // FIX: Pass the XP amount directly to completeActivity so DB records it
        await completeActivity(masteryId, 10); 
        setShowMasteryModal(true); 
    }
    setQuizState(prev => ({ ...prev, showResults: true }));
  };

  const handleAnswer = (optionId, correctId) => {
    if (quizState.selectedAnswer) return;
    const isCorrect = optionId === correctId;
    setQuizState(prev => ({ ...prev, selectedAnswer: optionId, score: isCorrect ? prev.score + 1 : prev.score }));
  };

  const nextQuestion = () => {
    const nextIdx = quizState.currentQuestionIndex + 1;
    if (nextIdx < selectedTopic.quiz.length) {
      setQuizState(prev => ({ ...prev, currentQuestionIndex: nextIdx, selectedAnswer: null }));
    } else {
      finishQuiz();
    }
  };

  // --- VIEW RENDERING ---

  if (loading) return <div className="p-12 text-center opacity-50"><Loader2 className="animate-spin inline" /></div>;

  // VIEW 1: CATEGORY LIST
  if (!selectedCategory) {
      return (
        <div className="w-full animate-in fade-in">
            <div className="flex items-center gap-4 mb-8">
                 <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${isMagical ? 'bg-slate-800 border-slate-700 text-amber-100 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                    <ChevronLeft size={18} /> {language === 'ka' ? 'მენიუ' : 'Menu'}
                 </button>
                 <h1 className={`text-3xl font-bold ${isMagical ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 font-serif' : 'text-slate-900'}`}>
                    {isMagical ? (language === 'ka' ? "ცოდნის არქივები" : "Archives of Knowledge") : (language === 'ka' ? "კლინიკური თეორია" : "Clinical Theory")}
                 </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.length === 0 ? (
                    <div className="col-span-2 text-center opacity-50 p-8">No archives found.</div>
                ) : (
                    categories.map(cat => {
                        const standardKey = cat.title?.en?.standard || cat.slug;
                        const isSubscribed = subscribedCategories.includes(standardKey);
                        const { title, subtitle } = getCategoryDisplay(cat);

                        return (
                            <div 
                                key={cat.id}
                                onClick={() => setSelectedCategory(standardKey)}
                                className={`p-6 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] group ${
                                    isMagical 
                                    ? 'bg-slate-900 border-slate-700 hover:border-amber-500/50' 
                                    : 'bg-white border-slate-200 hover:border-blue-400 shadow-sm'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${isMagical ? 'bg-amber-900/20 text-amber-500' : 'bg-blue-100 text-blue-600'}`}>
                                        {isMagical ? <Scroll size={24} /> : <FolderOpen size={24} />}
                                    </div>
                                    <div>
                                        <div className={`font-bold text-lg ${isMagical ? 'text-slate-200' : 'text-slate-800'}`}>
                                            {title}
                                        </div>
                                        {subtitle && (
                                            <div className={`text-xs italic ${isMagical ? 'text-amber-500/70' : 'text-slate-400'}`}>
                                                {subtitle}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => toggleSubscription(e, standardKey)}
                                    className={`p-3 rounded-full transition-all relative z-10 ${
                                        isSubscribed 
                                        ? (isMagical ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/50' : 'bg-blue-500 text-white shadow-lg')
                                        : (isMagical ? 'bg-slate-800 text-slate-500 hover:text-amber-500' : 'bg-slate-100 text-slate-400 hover:text-blue-500')
                                    }`}
                                    title={isSubscribed ? "Unsubscribe" : "Subscribe"}
                                >
                                    {isSubscribed ? <BellRing size={20} fill="currentColor" /> : <Bell size={20} />}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
      );
  }

  // VIEW 2: INSCRIPTIONS LIST
  if (selectedCategory && !selectedTopic) {
      const currentCatObj = categories.find(c => (c.title?.en?.standard === selectedCategory) || (c.slug === selectedCategory));
      const { title } = getCategoryDisplay(currentCatObj);

      return (
        <div className="w-full animate-in slide-in-from-right">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedCategory(null)} className={`p-2 rounded-xl border transition-all ${isMagical ? 'bg-slate-800 border-slate-700 text-amber-100 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className={`text-2xl font-bold ${isMagical ? 'text-amber-100 font-serif' : 'text-slate-900'}`}>
                        {title || selectedCategory}
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCategoryInscriptions.length === 0 ? (
                    <div className="col-span-2 text-center opacity-50 p-12 italic">
                        {isMagical ? "No scrolls found in this archive..." : "No cases found in this category."}
                    </div>
                ) : (
                    currentCategoryInscriptions.map((topic) => {
                        const isMastered = completedIds.has(`${topic.id}_mastered`);
                        const isRead = completedIds.has(`${topic.id}_read`);
                        
                        return (
                            <button 
                                key={topic.id} 
                                onClick={() => {
                                    setQuizState({ active: false, currentQuestionIndex: 0, score: 0, showResults: false, selectedAnswer: null });
                                    setShowMasteryModal(false);
                                    setSelectedTopic(topic);
                                }} 
                                className={`p-6 rounded-xl text-left border-2 transition-all hover:scale-[1.02] flex flex-col gap-2 relative ${isMagical ? 'bg-slate-900 border-amber-900/50 hover:border-amber-500' : 'bg-white border-slate-200 hover:border-blue-400 shadow-sm'}`}
                            >
                                <div className="w-full flex justify-between items-start">
                                    <h3 className={`font-bold text-lg ${isMagical ? 'text-amber-100' : 'text-slate-800'}`}>{getContent(topic.title)}</h3>
                                    <div className="flex gap-1">
                                        {isMastered && <Crown size={16} className="text-yellow-500 fill-yellow-500" />}
                                        {isRead && <CheckCircle size={16} className="text-emerald-500 fill-emerald-100" />}
                                    </div>
                                </div>
                                <p className={`text-sm line-clamp-3 w-full opacity-80 ${isMagical ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {getContent(topic.content).replace(/<[^>]+>/g, '')}
                                </p>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
      );
  }

  // VIEW 3: READING & QUIZ
  if (quizState.active && !quizState.showResults) {
    const question = selectedTopic.quiz[quizState.currentQuestionIndex];
    return (
      <div className={`p-6 rounded-2xl border-2 ${isMagical ? 'bg-slate-900 border-purple-500' : 'bg-white border-blue-500'}`}>
        <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl">Quiz: {quizState.currentQuestionIndex + 1} / {selectedTopic.quiz.length}</h3><Brain className={isMagical ? "text-purple-400" : "text-blue-500"} /></div>
        
        <p className="text-lg mb-6 font-medium">{getContent(question.question)}</p>
        
        <div className="space-y-3">
          {question.options.map((opt) => {
            const isSelected = quizState.selectedAnswer === opt.id;
            const isCorrect = opt.id === question.correctId;
            let btnClass = isMagical ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-slate-50 border-slate-200 hover:bg-blue-50";

            if (quizState.selectedAnswer) {
                if (isSelected) btnClass = isCorrect ? "border-green-500 bg-green-500/10 text-green-500" : "border-red-500 bg-red-500/10 text-red-500";
                else btnClass += " opacity-50";
            }

            return (
                <button key={opt.id} onClick={() => handleAnswer(opt.id, question.correctId)} disabled={!!quizState.selectedAnswer} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${btnClass}`}>
                    {getContent(opt.text)}
                </button>
            );
          })}
        </div>
        
        {quizState.selectedAnswer && (
           <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
               {(() => {
                   const selectedOpt = question.options.find(o => o.id === quizState.selectedAnswer);
                   const isCorrect = selectedOpt.id === question.correctId;
                   return (
                       <div className={`p-4 rounded-lg border-l-4 ${isCorrect ? 'bg-green-500/10 border-green-500 text-green-600' : 'bg-red-500/10 border-red-500 text-red-600'}`}>
                           <p className="font-bold mb-1">{isCorrect ? (language === 'ka' ? "სწორია!" : "Correct!") : (language === 'ka' ? "შეცდომა!" : "Incorrect!")}</p>
                           <p className="text-sm opacity-90">{getContent(selectedOpt.feedback)}</p>
                       </div>
                   );
               })()}
               
               <div className="flex justify-end mt-4">
                   <button onClick={nextQuestion} className={`px-6 py-2 rounded-lg font-bold text-white ${isMagical ? 'bg-purple-600' : 'bg-blue-600'}`}>
                       {quizState.currentQuestionIndex + 1 === selectedTopic.quiz.length ? "Finish" : "Next"} <ArrowRight size={18} className="inline ml-1" />
                   </button>
               </div>
          </div>
        )}
      </div>
    );
  }

  // VIEW 4: RESULTS (Mastery)
  if (quizState.showResults) {
    const percentage = Math.round((quizState.score / selectedTopic.quiz.length) * 100);
    const isPerfect = percentage === 100;

    const MasteryModal = () => (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
            <div className={`relative w-full max-w-sm p-8 rounded-3xl text-center border-4 shadow-2xl overflow-hidden ${isMagical ? 'bg-slate-900 border-amber-500 text-amber-100' : 'bg-white border-blue-500 text-slate-900'}`}>
                {isMagical && <div className="absolute inset-0 bg-amber-500/10 animate-pulse pointer-events-none"></div>}
                <div className={`relative mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl ${isMagical ? 'bg-amber-900/50 text-amber-400 border-2 border-amber-500' : 'bg-blue-100 text-blue-600 border-2 border-blue-200'}`}>
                    <Crown size={48} /><Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-spin-slow" size={32} />
                </div>
                <h2 className={`relative text-2xl font-black mb-2 uppercase tracking-wide ${isMagical ? 'text-amber-400' : 'text-blue-600'}`}>{language === 'ka' ? "ჩანაწერი შესწავლილია" : "Inscription Mastered"}</h2>
                <div className={`relative inline-block px-4 py-1 rounded-full text-sm font-bold mb-8 ${isMagical ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>+10 XP</div>
                <button onClick={() => setShowMasteryModal(false)} className={`relative w-full py-3 rounded-xl font-bold transition-transform active:scale-95 ${isMagical ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>{language === 'ka' ? "გაგრძელება" : "Continue"}</button>
            </div>
        </div>
    );

    return (
        <div className={`p-8 rounded-2xl text-center border-2 ${isMagical ? 'bg-slate-900 border-purple-500' : 'bg-white border-blue-500'}`}>
            {showMasteryModal && <MasteryModal />}
            <h2 className="text-3xl font-bold mb-4">{isPerfect ? (language === 'ka' ? "ოსტატი!" : "Mastery Achieved!") : (language === 'ka' ? "სცადეთ თავიდან" : "Keep Studying")}</h2>
            <div className={`text-6xl font-black mb-2 ${isPerfect ? 'text-green-500' : 'text-red-500'}`}>{percentage}%</div>
            <div className="flex flex-col gap-3 mt-8">
                {!isPerfect && <button onClick={() => setQuizState({ active: true, currentQuestionIndex: 0, score: 0, showResults: false, selectedAnswer: null })} className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${isMagical ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}><RotateCcw size={20} /> {language === 'ka' ? "თავიდან დაწყება" : "Retake Quiz"}</button>}
                <button onClick={() => setQuizState({ active: false, currentQuestionIndex: 0, score: 0, showResults: false, selectedAnswer: null })} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isMagical ? 'bg-slate-800 text-amber-500 border border-slate-700' : 'bg-white text-blue-600 border border-slate-200'}`}><FileText size={20} /> {language === 'ka' ? "ტექსტზე დაბრუნება" : "Return to Text"}</button>
                <button onClick={() => setSelectedTopic(null)} className={`w-full py-3 rounded-xl font-bold opacity-70 hover:opacity-100 ${isMagical ? 'bg-slate-800' : 'bg-slate-100 text-slate-600'}`}>{language === 'ka' ? "სიაში დაბრუნება" : "Back to List"}</button>
            </div>
        </div>
    );
  }

  // VIEW 5: READING CONTENT
  const isRead = completedIds.has(`${selectedTopic.id}_read`);
  const isMastered = completedIds.has(`${selectedTopic.id}_mastered`);
  
  const handleMarkAsRead = async () => {
    const activityId = `${selectedTopic.id}_read`; 
    if (!completedIds.has(activityId)) await completeActivity(activityId, 0); 
  };

  return (
    <div className={`p-6 md:p-10 rounded-3xl border relative flex flex-col min-h-[60vh] ${isMagical ? 'bg-slate-900/80 border-amber-900/30' : 'bg-white border-slate-200 shadow-xl'}`}>
      <div className="mb-8 pb-4 border-b border-opacity-10 border-slate-500">
        <button onClick={() => setSelectedTopic(null)} className="mb-4 text-xs opacity-50 hover:opacity-100 flex items-center gap-1 uppercase tracking-widest font-bold"><ChevronLeft size={14} /> {language === 'ka' ? "უკან" : "Back"}</button>
        <h2 className={`text-4xl font-bold ${isMagical ? 'text-amber-100 font-serif' : 'text-slate-900'}`}>{getContent(selectedTopic.title)}</h2>
        <div className={`mt-2 text-sm font-bold uppercase tracking-wider ${isMagical ? 'text-amber-600' : 'text-blue-500'}`}>{selectedTopic.category}</div>
      </div>
      
      {/* HTML Content Render */}
      <div 
        className={`prose max-w-none leading-relaxed whitespace-pre-wrap flex-grow mb-12 ${isMagical ? 'prose-invert text-slate-300' : 'text-slate-700'}`}
        dangerouslySetInnerHTML={{ __html: getContent(selectedTopic.content) }}
      />

      <div className={`mt-auto pt-8 border-t border-opacity-10 border-slate-500 flex flex-col md:flex-row gap-4`}>
        <button onClick={handleMarkAsRead} disabled={isRead} className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isRead ? (isMagical ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'bg-slate-100 text-slate-400 cursor-not-allowed') : (isMagical ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/20' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20')}`}>
            {isMagical ? <Scroll size={20} /> : <CheckCircle size={20} />} {isRead ? (language === 'ka' ? "წაკითხულია" : "Read") : (language === 'ka' ? "წაკითხვა" : "Mark as Read")}
        </button>
        {selectedTopic.quiz && selectedTopic.quiz.length > 0 && (
            <button onClick={() => setQuizState({ active: true, currentQuestionIndex: 0, score: 0, showResults: false, selectedAnswer: null })} disabled={isMastered} className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isMastered ? (isMagical ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 border border-slate-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200') : (isMagical ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20')}`}>
                {isMastered 
                    ? <><Crown size={20} /> {(language === 'ka' ? "ჩაბარებულია" : "Passed")}</>
                    : <><Brain size={20} /> {isMagical ? (language === 'ka' ? "არქიმაგის გამოცდა (+10 XP)" : "Face Archmage's Challenge (+10 XP)") : (language === 'ka' ? "ქვიზის დაწყება (+10 XP)" : "Take Quiz (+10 XP)")}</>
                }
            </button>
        )}
      </div>
    </div>
  );
}