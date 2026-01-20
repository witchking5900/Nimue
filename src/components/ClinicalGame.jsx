import React, { useState, useEffect } from "react";
import { useTheme } from '../context/ThemeContext';
import { useGameLogic } from '../hooks/useGameLogic'; 
import { useToast } from '../context/ToastContext'; 
import { useSound } from '../hooks/useSound'; 
import { supabase } from '../supabaseClient'; 
import { clinicalCases as staticCases } from '../data/cases'; 

import { useAuth } from '../context/AuthContext';
import { saveMistake } from '../utils/gameHelpers';

import {
  Heart, Activity, AlertCircle, CheckCircle, XCircle, 
  Skull, RotateCcw, ArrowRight, List, Thermometer, Zap,
  Filter, Lock, Scale, FlaskConical, Crown, Gem, Ghost, Loader2, Clock, Plus, AlertTriangle, Home
} from "lucide-react";

const GRIMOIRES = [
    {
      id: 'trial_of_souls',
      title: { en: "Trial of Souls", ka: "სულების გამოცდა" },
      desc: { en: "A grueling test of diagnostics.", ka: "დიაგნოსტიკის მძიმე გამოცდა." },
      xpReward: 100, 
      icon: Skull,
      color: "text-purple-600",
      bg: "bg-purple-600/10",
      isFree: false
    }
];

export default function ClinicalGame({ onBack }) {
  const { theme, language } = useTheme();
  const { user } = useAuth(); 
  
  const { 
    hearts, xp, spendXp, takeDamage, 
    tier, completeActivity, completedIds,
    buyHeartWithXp
  } = useGameLogic(); 
  
  const { addToast } = useToast();
  const { playSound } = useSound(); 
  const isMagical = theme === 'magical';

  // --- STATE ---
  const [activeGrimoire, setActiveGrimoire] = useState(GRIMOIRES[0]); 
  const [allCases, setAllCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState(null); 
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isFinished, setIsFinished] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false); 
  const [isCaseFailed, setIsCaseFailed] = useState(false); 
  const [mistakeCount, setMistakeCount] = useState(0); 
  const [shake, setShake] = useState(false);
  const [hasMadeMistake, setHasMadeMistake] = useState(false);
  const [showPerfectModal, setShowPerfectModal] = useState(false);

  // --- HINT STATE ---
  const [freeHintsLeft, setFreeHintsLeft] = useState(0);
  const [hintRegenTarget, setHintRegenTarget] = useState(null);
  const [revealedHints, setRevealedHints] = useState({});
  const [showHintModal, setShowHintModal] = useState(false);
  const [pendingHintStepId, setPendingHintStepId] = useState(null);
  const [uiTicker, setUiTicker] = useState(0);

  // --- NEW STATES ---
  const [showHeartModal, setShowHeartModal] = useState(false);

  const isUnlimitedUser = ['archmage', 'insubstantial'].includes(tier);

  useEffect(() => {
    const fetchAndMergeCases = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('clinical_cases').select('*');
      let dbCases = [];
      if (!error && data) {
        dbCases = data.map(c => ({ ...c, patient: c.patient_data }));
      }
      setAllCases([...staticCases, ...dbCases]);
      setIsLoading(false);
    };
    fetchAndMergeCases();
  }, []);

  useEffect(() => {
    if (isUnlimitedUser) return;
    const storedCount = parseInt(localStorage.getItem('daily_hints') || '2', 10);
    const storedTarget = parseInt(localStorage.getItem('hint_regen_target') || '0', 10);
    const now = Date.now();
    if (storedTarget && now > storedTarget) {
        updateHintState(2, null); 
    } else {
        setFreeHintsLeft(storedCount);
        setHintRegenTarget(storedTarget || null);
    }
  }, [tier, isUnlimitedUser]);

  useEffect(() => {
    if (!hintRegenTarget || freeHintsLeft >= 2) return;
    const timer = setInterval(() => {
        const now = Date.now();
        if (now > hintRegenTarget) {
            updateHintState(2, null); 
        } else {
            setUiTicker(prev => prev + 1); 
        }
    }, 10000); 
    return () => clearInterval(timer);
  }, [hintRegenTarget, freeHintsLeft]);

  const updateHintState = (count, target) => {
      setFreeHintsLeft(count);
      setHintRegenTarget(target);
      localStorage.setItem('daily_hints', count.toString());
      if (target) localStorage.setItem('hint_regen_target', target.toString());
      else localStorage.removeItem('hint_regen_target');
  };

  const getHintTimeLeft = () => {
      if (!hintRegenTarget) return "";
      const diff = hintRegenTarget - Date.now();
      if (diff <= 0) return "0m";
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.ceil((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
  };

  const getText = (content) => {
    if (!content) return "";
    if (typeof content === 'string') return content;
    return content[language] || content['en'];
  };

  useEffect(() => {
    if (hearts <= 0) setIsGameOver(true);
  }, [hearts]);

  const startScenario = (scenario) => {
    if (hearts <= 0) {
      playSound('wrong');
      setShowHeartModal(true);
      return;
    }
    setActiveScenario(scenario);
    setCurrentStep(0);
    setSelectedOption(null);
    setIsFinished(false);
    setIsGameOver(false);
    setIsCaseFailed(false); 
    setMistakeCount(0); 
    setRevealedHints({});
    setHasMadeMistake(false); 
    setShowPerfectModal(false);
  };

  const handleSelect = (option) => {
    if (isGameOver || isCaseFailed || selectedOption?.correct) return;
    if (hearts <= 0) {
        setShowHeartModal(true);
        return;
    }
    setSelectedOption(option);
    if (option.correct) {
        playSound('correct'); 
    } else {
        playSound('wrong'); 
        setShake(true);
        setHasMadeMistake(true);
        if (user) {
            const currentQuestion = activeScenario.steps[currentStep];
            const correctOption = currentQuestion.options.find(opt => opt.correct);
            saveMistake(
                user.id, 
                activeScenario.id, 
                'clinical', 
                { 
                    title: getText(activeScenario.title), 
                    question: getText(currentQuestion.question),
                    userAnswer: getText(option.text),
                    userFeedback: getText(option.feedback),
                    correctAnswer: getText(correctOption?.text || "Unknown"),
                    correctFeedback: getText(correctOption?.feedback || "No explanation available.")
                }
            );
        }
        takeDamage(1); 
        const newMistakeCount = mistakeCount + 1;
        setMistakeCount(newMistakeCount);
        if (newMistakeCount >= 2) {
            setTimeout(() => { setIsCaseFailed(true); }, 500); 
        }
        setTimeout(() => setShake(false), 500);
    } 
  };

  const nextStep = () => {
    if (currentStep + 1 < activeScenario.steps.length) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
    } else {
      handleCaseFinish();
    }
  };

  const handleCaseFinish = () => {
      setIsFinished(true);
      const caseId = activeScenario.id;
      const masteryId = `${caseId}_mastered`;
      if (!hasMadeMistake) {
          setShowPerfectModal(true);
          playSound('correct'); 
          const isMastered = completedIds.has(masteryId);
          let xpToGrant = 0;
          if (!isMastered && activeGrimoire.xpReward > 0) xpToGrant = activeGrimoire.xpReward;
          if (xpToGrant > 0) {
              completeActivity(masteryId, xpToGrant); 
              addToast(language === 'en' ? `Case Mastered! +${xpToGrant} XP` : `ქეისი შესწავლილია! +${xpToGrant} XP`, 'success');
          } else {
              completeActivity(masteryId, 0);
          }
      } else {
          completeActivity(caseId, 0);
      }
  };

  const handleRevealClick = (stepId) => {
    if (revealedHints[stepId]) return;
    if (isUnlimitedUser) {
        setRevealedHints(prev => ({ ...prev, [stepId]: true }));
        return;
    }
    if (freeHintsLeft > 0) {
        const newCount = freeHintsLeft - 1;
        let newTarget = hintRegenTarget;
        if (freeHintsLeft === 2) newTarget = Date.now() + (24 * 60 * 60 * 1000);
        updateHintState(newCount, newTarget);
        setRevealedHints(prev => ({ ...prev, [stepId]: true }));
    } else {
        setPendingHintStepId(stepId);
        setShowHintModal(true);
    }
  };

  // --- UPDATED: HINT REFILL VIA XP ---
  const buyRefill = () => {
      if (xp >= 100) {
          if (confirm(language === 'ka' ? "დახარჯოთ 100 XP სრული აღდგენისთვის (2 მინიშნება)?" : "Spend 100 XP for Full Hint Restore (2)?")) {
              
              if (spendXp) spendXp(100);
              
              // Refill to 2
              updateHintState(2, null);
              
              // Reveal the hint they were trying to unlock
              setRevealedHints(prev => ({ ...prev, [pendingHintStepId]: true }));
              
              addToast(language === 'ka' ? "მინიშნებები აღდგენილია!" : "Hints fully restored!", 'success');
              setShowHintModal(false);
              setPendingHintStepId(null);
          }
      } else {
          addToast(language === 'ka' ? "არ გაქვთ საკმარისი XP!" : "Not enough XP!", 'error');
      }
  };

  // --- HEART PURCHASE HANDLER (XP ONLY) ---
  const handleBuyHeart = () => {
      const result = buyHeartWithXp();
      if (result.success) {
          playSound('correct');
          setShowHeartModal(false);
          addToast(result.message, "success");
      } else {
          addToast(result.message, "error");
      }
  };

  const restart = () => {
    setActiveScenario(null); 
    setCurrentStep(0);
    setSelectedOption(null);
    setIsFinished(false);
    setIsGameOver(false);
    setIsCaseFailed(false);
    setRevealedHints({});
    setShowPerfectModal(false);
  };

  // --- RENDER 1: CASE LIST ---
  if (!activeScenario) {
    if (isLoading) return <div className="w-full min-h-[50vh] flex flex-col items-center justify-center text-slate-500 gap-4"><Loader2 className="animate-spin w-8 h-8 text-purple-500" /><p>Summoning Souls from the Archive...</p></div>;
    const categories = ["All", ...new Set(allCases.map(c => c.category))];
    const filteredCases = selectedCategory === "All" ? allCases : allCases.filter(c => c.category === selectedCategory);
    return (
      <div className={`w-full max-w-4xl mx-auto animate-in fade-in zoom-in duration-300 p-4 pb-20`}>
        {showHeartModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                <div className={`relative w-full max-w-sm p-8 rounded-3xl border-2 shadow-2xl text-center ${isMagical ? 'bg-slate-900 border-red-900 text-red-100' : 'bg-white border-red-200 text-slate-900'}`}>
                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isMagical ? 'bg-red-900/30 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-red-100 text-red-500'}`}>{isMagical ? <Ghost size={40} /> : <Heart size={40} fill="currentColor" />}</div>
                    <h3 className={`text-2xl font-bold mb-2 ${isMagical ? 'font-serif text-red-400' : 'text-slate-900'}`}>{isMagical ? (language === 'ka' ? "არასაკმარისი სასიცოცხლო ესენცია" : "Not enough life essence") : (language === 'ka' ? "არასაკმარისი სიცოცხლეები" : "Not enough lives")}</h3>
                    <div className="space-y-3 mb-6 mt-6">
                        <button onClick={handleBuyHeart} className={`w-full p-4 rounded-xl border flex justify-between items-center transition-all group ${xp >= 50 ? (isMagical ? 'bg-slate-800 border-slate-700 hover:border-amber-500' : 'bg-slate-50 border-slate-200 hover:border-blue-400') : 'opacity-50 cursor-not-allowed'}`} disabled={xp < 50}>
                            <div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${isMagical ? 'bg-slate-900 text-amber-500' : 'bg-white text-blue-500'}`}><Heart size={18} /></div><div className="text-left"><div className="font-bold text-sm">{language === 'ka' ? "+1 სიცოცხლე" : "+1 Life"}</div></div></div>
                            <div className={`font-bold ${isMagical ? 'text-amber-500' : 'text-blue-600'}`}>50 XP</div>
                        </button>
                    </div>
                    <button onClick={() => setShowHeartModal(false)} className="w-full py-3 rounded-xl font-bold opacity-50 hover:opacity-100">{language === 'ka' ? 'დახურვა' : 'Close'}</button>
                </div>
            </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="px-4 py-2 rounded-xl bg-black/5 hover:bg-black/10 flex items-center gap-2 transition-colors"><RotateCcw size={18} /> {language === 'ka' ? 'მთავარი' : 'Home'}</button>
            <div><h1 className={`text-2xl font-bold flex items-center gap-2 ${isMagical ? 'text-amber-100' : 'text-slate-900'}`}><activeGrimoire.icon className={activeGrimoire.color} />{activeGrimoire.title[language]}</h1><div className="text-xs opacity-50 font-bold uppercase tracking-wider mt-1">Ranked Mode (100 XP)</div></div>
          </div>
          <div className="flex items-center gap-1 bg-black/5 px-4 py-2 rounded-full self-start md:self-auto border border-black/5"><Heart size={20} className="text-red-500 fill-red-500" /><span className="font-bold text-lg">{hearts}</span></div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
            {categories.map(cat => ( <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${selectedCategory === cat ? (isMagical ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-900/50' : 'bg-blue-600 border-blue-600 text-white shadow-md') : (isMagical ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-500' : 'bg-white border-slate-200 text-slate-600 hover:text-blue-600')}`}>{cat === "All" ? (language === 'ka' ? "ყველა" : "All") : cat}</button> ))}
        </div>
        <div className="space-y-4">
          {filteredCases.length > 0 ? (
            filteredCases.map((scenario) => {
                const masteryId = `${scenario.id}_mastered`;
                const isMastered = completedIds.has(masteryId);
                const isCompleted = completedIds.has(scenario.id);
                const Icon = scenario.icon || Activity; 
                return (
                    <button key={scenario.id} onClick={() => startScenario(scenario)} className={`w-full p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border-l-4 text-left flex items-start gap-4 group ${isMagical ? 'bg-slate-800 border-amber-600 hover:bg-slate-700' : 'bg-white border-blue-500 hover:bg-slate-50'}`}>
                        <div className={`mt-1 p-3 rounded-xl ${isMagical ? 'bg-slate-900' : 'bg-slate-100'}`}><Icon className="text-purple-500" size={24} /></div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className={`font-bold text-lg ${isMagical ? 'text-amber-100' : 'text-slate-800'}`}>{getText(scenario.title)}</h3>
                                {isMastered ? <span className="bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><Crown size={10} /> {language === 'en' ? "MASTERED" : "ოსტატი"}</span> : isCompleted ? <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded">{language === 'en' ? "COMPLETED" : "დასრულებული"}</span> : null}
                            </div>
                            <p className={`text-sm mt-1 line-clamp-2 ${isMagical ? 'text-slate-400' : 'text-slate-500'}`}>{getText(scenario.patient.details)}</p>
                            <div className="mt-3 flex gap-2"><span className={`text-xs px-2 py-1 rounded font-medium ${isMagical ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{scenario.steps.length} {language === 'ka' ? 'ნაბიჯი' : 'Steps'}</span><span className={`text-xs px-2 py-1 rounded font-medium ${isMagical ? 'bg-slate-900 text-amber-500' : 'bg-blue-50 text-blue-600'}`}>{scenario.category}</span></div>
                        </div>
                    </button>
                );
            })
          ) : ( <div className="text-center py-12 opacity-50"><Filter className="mx-auto mb-2 w-12 h-12" /><p>{language === 'ka' ? "ამ კატეგორიაში ქეისები არ არის" : "No cases found in this category"}</p></div> )}
        </div>
      </div>
    );
  }

  if (isCaseFailed) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-in zoom-in min-h-[50vh]">
            <div className={`max-w-md w-full p-8 rounded-3xl shadow-xl border-t-8 ${isMagical ? 'bg-slate-900 border-red-700' : 'bg-white border-red-600'}`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isMagical ? 'bg-red-900/30' : 'bg-red-100'}`}><AlertTriangle className="text-red-500 w-12 h-12" /></div>
                <h2 className={`text-3xl font-extrabold mb-4 ${isMagical ? 'text-red-500 font-serif' : 'text-red-700'}`}>{isMagical ? (language === 'ka' ? 'სულის გადარჩენა ვერ მოხერხდა' : 'You failed to save this soul.') : (language === 'ka' ? 'პაციენტი დაიკარგა' : 'Patient Lost')}</h2>
                <p className={`opacity-70 mb-8 ${isMagical ? 'text-slate-400' : 'text-slate-600'}`}>{language === 'ka' ? 'დაშვებულია 2-ზე მეტი შეცდომა. ქეისი შეწყვეტილია.' : 'Too many critical errors. The case has been terminated.'}</p>
                <button onClick={() => setActiveScenario(null)} className={`w-full py-4 rounded-xl font-bold transition shadow-lg text-white ${isMagical ? 'bg-slate-800 hover:bg-slate-700 border border-slate-600' : 'bg-slate-900 hover:bg-slate-800'}`}>{language === 'ka' ? 'სიაში დაბრუნება' : 'Return to List'}</button>
            </div>
        </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center animate-in zoom-in min-h-[50vh]">
        {showHeartModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                <div className={`relative w-full max-w-sm p-8 rounded-3xl border-2 shadow-2xl text-center ${isMagical ? 'bg-slate-900 border-red-900 text-red-100' : 'bg-white border-red-200 text-slate-900'}`}>
                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isMagical ? 'bg-red-900/30 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-red-100 text-red-500'}`}>{isMagical ? <Ghost size={40} /> : <Heart size={40} fill="currentColor" />}</div>
                    <h3 className={`text-2xl font-bold mb-2 ${isMagical ? 'font-serif text-red-400' : 'text-slate-900'}`}>{isMagical ? (language === 'ka' ? "არასაკმარისი სასიცოცხლო ესენცია" : "Not enough life essence") : (language === 'ka' ? "არასაკმარისი სიცოცხლეები" : "Not enough lives")}</h3>
                    <div className="space-y-3 mb-6 mt-6">
                        <button onClick={handleBuyHeart} className={`w-full p-4 rounded-xl border flex justify-between items-center transition-all group ${xp >= 50 ? (isMagical ? 'bg-slate-800 border-slate-700 hover:border-amber-500' : 'bg-slate-50 border-slate-200 hover:border-blue-400') : 'opacity-50 cursor-not-allowed'}`} disabled={xp < 50}>
                            <div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${isMagical ? 'bg-slate-900 text-amber-500' : 'bg-white text-blue-500'}`}><Heart size={18} /></div><div className="text-left"><div className="font-bold text-sm">{language === 'ka' ? "+1 სიცოცხლე" : "+1 Life"}</div></div></div>
                            <div className={`font-bold ${isMagical ? 'text-amber-500' : 'text-blue-600'}`}>50 XP</div>
                        </button>
                    </div>
                    <button onClick={() => setShowHeartModal(false)} className="w-full py-3 rounded-xl font-bold opacity-50 hover:opacity-100">{language === 'ka' ? 'დახურვა' : 'Close'}</button>
                </div>
            </div>
        )}
        <div className={`max-w-sm w-full p-8 rounded-2xl shadow-2xl bg-white border-slate-200`}>
          <Skull className="w-20 h-20 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Game Over!</h2>
          <p className="mb-6 opacity-70">{language === 'ka' ? 'სიცოცხლეები ამოგეწურათ.' : 'You have run out of lives.'}</p>
          <button onClick={() => setShowHeartModal(true)} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 mb-3"><Plus size={18} /> {language === 'ka' ? 'სიცოცხლის ყიდვა' : 'Buy Life'}
          </button>
          <button onClick={() => setActiveScenario(null)} className="w-full py-3 rounded-xl font-bold border-2 border-slate-200 text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 mt-2"><Home size={18} /> {language === 'ka' ? 'მთავარი' : 'Home'}</button>
        </div>
      </div>
    );
  }

  // --- RENDER 4: VICTORY SCREEN ---
  if (isFinished && !showPerfectModal) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center animate-in zoom-in min-h-[50vh]">
        <div className={`max-w-md w-full p-8 rounded-3xl shadow-xl border-t-8 ${isMagical ? 'bg-slate-800 border-green-600' : 'bg-white border-green-500'}`}>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isMagical ? 'bg-green-900/30' : 'bg-green-100'}`}><CheckCircle className="text-green-500 w-12 h-12" /></div>
          <h2 className={`text-3xl font-extrabold mb-2 ${isMagical ? 'text-white' : 'text-slate-900'}`}>{language === 'ka' ? 'გილოცავთ!' : 'Victory!'}</h2>
          <p className={`opacity-70 mb-8 ${isMagical ? 'text-slate-300' : 'text-slate-600'}`}>{language === 'ka' ? 'თქვენ წარმატებით დაასრულეთ ქეისი:' : 'You completed the case:'} <br /><strong>{getText(activeScenario.title)}</strong></p>
          <button onClick={() => setActiveScenario(null)} className={`w-full py-4 rounded-xl font-bold transition shadow-lg text-white ${isMagical ? 'bg-amber-700 hover:bg-amber-600' : 'bg-slate-900 hover:bg-slate-800'}`}>{language === 'ka' ? 'სხვა ქეისის არჩევა' : 'Choose Another Case'}</button>
        </div>
      </div>
    );
  }

  const step = activeScenario.steps[currentStep];
  const isHintRevealed = revealedHints[step.id];
  const cardClass = isMagical ? "bg-slate-800 border-amber-900/50 text-white" : "bg-white border-slate-200 text-slate-900";

  return (
    <div className={`w-full max-w-2xl mx-auto transition-colors duration-300 p-4 pb-20 ${shake ? "translate-x-2" : ""}`}>
      {showPerfectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in duration-500">
            <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl border-4 text-center relative overflow-hidden ${isMagical ? 'bg-slate-900 border-amber-500' : 'bg-white border-blue-500'}`}>
                {isMagical && <div className="absolute inset-0 bg-amber-500/10 animate-pulse pointer-events-none"></div>}
                <div className="relative z-10">
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ${isMagical ? 'bg-amber-500/20 text-amber-400 border-2 border-amber-500' : 'bg-blue-100 text-blue-600 border-2 border-blue-200'}`}>{isMagical ? <Ghost size={64} /> : <Heart size={64} fill="currentColor" />}</div>
                    <h2 className={`text-4xl font-extrabold mb-4 tracking-tight ${isMagical ? 'text-amber-400 font-serif' : 'text-slate-900'}`}>{isMagical ? (language === 'ka' ? 'სული ხსნილია!' : 'Soul Saved!') : (language === 'ka' ? 'პაციენტი გადარჩენილია!' : 'Patient Saved!')}</h2>
                    <p className={`text-lg mb-8 font-medium leading-relaxed ${isMagical ? 'text-amber-100/80' : 'text-slate-600'}`}>{isMagical ? (language === 'ka' ? 'თქვენ ეს სული იხსენით.' : 'You successfully saved this soul.') : (language === 'ka' ? 'თქვენ გადაარჩინეთ პაციენტი.' : 'You successfully saved this patient.')}</p>
                    <button onClick={() => setActiveScenario(null)} className={`w-full py-4 rounded-2xl font-bold text-lg transition-transform hover:scale-105 active:scale-95 shadow-xl ${isMagical ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'}`}>{language === 'ka' ? 'გაგრძელება' : 'Continue'}</button>
                </div>
            </div>
        </div>
      )}
      {showHintModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl border-2 ${isMagical ? 'bg-slate-900 border-amber-500 text-amber-50' : 'bg-white border-blue-500 text-slate-900'}`}>
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2"><AlertCircle className="text-red-500" />{language === 'ka' ? 'მინიშნებები ამოგეწურათ!' : 'Out of Hints!'}</h3>
                <p className="opacity-80 mb-6 text-sm">{language === 'ka' ? 'დღიური ლიმიტი ამოწურულია. გსურთ დამატება?' : 'You have used your daily allowance. Purchase more?'}</p>
                <div className="space-y-3">
                    {/* TOP BUTTON REMOVED AS REQUESTED */}
                    <button onClick={buyRefill} className={`w-full p-4 rounded-xl border flex justify-between items-center transition-all ${isMagical ? 'bg-amber-900/20 border-amber-500 hover:bg-amber-900/40' : 'bg-green-50 border-green-500 hover:bg-green-100'}`}>
                        <div className="text-left"><div className="font-bold flex items-center gap-2"><Zap size={16} className={isMagical ? "text-amber-500" : "text-green-600"} />{language === 'ka' ? 'სრული აღდგენა' : 'Full Restore'}</div><div className="text-xs opacity-60">{language === 'ka' ? 'აღადგენს 2 მინიშნებას' : 'Restores daily limit (2)'}</div></div>
                        <div className={isMagical ? "font-bold text-amber-500" : "font-bold text-green-600"}>100 XP</div>
                    </button>
                </div>
                <button onClick={() => { setShowHintModal(false); setPendingHintStepId(null); }} className="mt-6 text-sm opacity-50 hover:opacity-100 w-full text-center">{language === 'ka' ? 'გაუქმება' : 'Cancel'}</button>
            </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setActiveScenario(null)} className="opacity-50 hover:opacity-100 flex items-center gap-1 text-sm font-bold"><List size={16} /> {language === 'ka' ? 'სია' : 'List'}</button>
        <div className="flex gap-2">{[...Array(3)].map((_, i) => ( <Heart key={i} className={`w-8 h-8 transition-all ${i < hearts ? "text-red-500 fill-red-500" : "text-slate-300 fill-slate-200 opacity-20"}`} /> ))}</div>
      </div>
      <div className={`rounded-3xl shadow-2xl overflow-hidden border-2 transition-all ${cardClass} ${shake ? 'border-red-500' : ''}`}>
        <div className={`h-2 w-full ${isMagical ? 'bg-slate-900' : 'bg-slate-100'}`}><div className={`h-full transition-all duration-700 ease-out ${isMagical ? 'bg-purple-500' : 'bg-blue-500'}`} style={{ width: `${(currentStep / activeScenario.steps.length) * 100}%` }}></div></div>
        <div className="p-6 md:p-8">
          <div className={`flex flex-wrap gap-4 mb-8 p-4 rounded-xl border text-sm ${isMagical ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
             <div className="w-full font-bold mb-1 border-b pb-2 flex justify-between opacity-80"><span>{language === 'ka' ? 'პაციენტის პროფილი' : 'Patient Profile'}</span></div>
            <p className="w-full italic opacity-90">{getText(activeScenario.patient.details)} {getText(activeScenario.patient.complaint)}</p>
            <div className={`flex items-center gap-2 px-2 py-1 rounded border ${isMagical ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}><Activity size={16} className={isMagical ? "text-purple-400" : "text-blue-500"} /><span>{getText(activeScenario.patient.ecg)}</span></div>
            <div className={`flex items-center gap-2 px-2 py-1 rounded border ${isMagical ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}><Thermometer size={16} className="text-orange-500" />{activeScenario.patient.vitals.bp}, {activeScenario.patient.vitals.hr}</div>
          </div>
          <h2 className="text-xl font-bold mb-4">{language === 'ka' ? 'კითხვა' : 'Question'} {currentStep + 1}: <br/><span className="font-normal opacity-90 text-lg">{getText(step.question)}</span></h2>
          {step.hint && (
            <div className="mb-6">
              {!isHintRevealed ? (
                <button onClick={() => handleRevealClick(step.id)} className={`w-full py-3 px-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all hover:scale-[1.02] ${isMagical ? 'border-amber-700 bg-amber-900/20 text-amber-200 hover:bg-amber-900/40' : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                    {isMagical ? <Zap size={18} /> : <AlertCircle size={18} />}{isMagical ? (language === 'ka' ? 'უზენაესი ჯადოქრის დახმარება' : 'Consult with Archmage') : (language === 'ka' ? 'მინიშნების ნახვა' : 'Reveal Hint')}<span className="text-xs opacity-70 ml-1">({isUnlimitedUser ? 'Unlimited' : (freeHintsLeft > 0 ? `${freeHintsLeft} left` : `Refills in ${getHintTimeLeft()}`)})</span>
                </button>
              ) : (
                <div className={`text-sm px-4 py-3 rounded-lg flex gap-2 animate-in fade-in zoom-in duration-300 border ${isMagical ? 'bg-amber-900/20 border-amber-700 text-amber-100' : 'bg-blue-100 border-blue-200 text-blue-800'}`}><AlertCircle size={18} className="shrink-0 mt-0.5" /><span><strong>{language === 'ka' ? 'მინიშნება:' : 'Hint:'}</strong> {getText(step.hint)}</span></div>
              )}
            </div>
          )}
          <div className="space-y-3">
            {step.options.map((option) => (
              <button key={option.id} onClick={() => handleSelect(option)} disabled={selectedOption?.correct || isGameOver} className={`w-full p-5 text-left border-2 rounded-xl transition-all duration-200 flex justify-between items-center ${selectedOption?.id === option.id ? option.correct ? "border-green-500 bg-green-500/10 text-green-600" : "border-red-500 bg-red-500/10 text-red-600" : isMagical ? "border-slate-700 hover:border-amber-500 hover:bg-slate-800" : "border-slate-100 hover:border-blue-300 hover:bg-slate-50"}`}><span className="font-medium">{getText(option.text)}</span>{selectedOption?.id === option.id && (option.correct ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />)}</button>
            ))}
          </div>
          {selectedOption && (
            <div className="mt-8 animate-in slide-in-from-bottom-2 fade-in">
              <div className={`p-5 rounded-xl mb-4 border-l-4 shadow-sm ${selectedOption.correct ? (isMagical ? "bg-green-900/20 border-green-500" : "bg-green-50 border-green-500") : (isMagical ? "bg-red-900/20 border-red-500" : "bg-red-50 border-red-500")}`}><h4 className={`font-bold mb-2 ${selectedOption.correct ? "text-green-500" : "text-red-500"}`}>{selectedOption.correct ? (language === 'ka' ? "სწორია!" : "Correct!") : (language === 'ka' ? "შეცდომა!" : "Incorrect!")}</h4><p className="opacity-90 text-sm leading-relaxed mb-3">{getText(selectedOption.feedback)}</p></div>
              {selectedOption.correct && (
                <button onClick={nextStep} className={`w-full text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg ${isMagical ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{currentStep + 1 === activeScenario.steps.length ? (language === 'ka' ? "დასრულება" : "Finish") : (language === 'ka' ? "შემდეგი" : "Next")} <ArrowRight size={20} /></button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}