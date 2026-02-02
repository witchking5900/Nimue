import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useGameLogic } from '../hooks/useGameLogic';
import { supabase } from '/src/supabaseClient.js';

import { 
  FlaskConical, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  TestTube, 
  Flame,
  ClipboardList,
  Heart,
  Loader2,
  Crown, 
  Check,
  FastForward,
  Shuffle
} from 'lucide-react';

export default function LabGame({ onBack }) {
  const { theme, language } = useTheme();
  const { hearts, takeDamage, completeActivity, completedIds } = useGameLogic(); 
  const isMagical = theme === 'magical';

  // State
  const [allScenarios, setAllScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCase, setActiveCase] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  // --- TEXT CONFIG ---
  const t = {
    en: {
      title: isMagical ? "The Alchemist's Table" : "Lab Diagnostics",
      select: "Select a Potion to Analyze",
      analyze: "Analyze Composition:",
      normal: "Normal range:",
      correct: "Potion Identified!",
      wrong: "Volatile Reaction!",
      next: isMagical ? "Next Potion" : "Next Case",
      noEnergy: "No energy left! Wait for regeneration.",
      solved: "Solved",
      mastered: "Category Mastered",
      skip: "Skip (Go to Next)"
    },
    ka: {
      title: isMagical ? "ალქიმიკოსის მაგიდა" : "ლაბორატორიული დიაგნოსტიკა",
      select: "აირჩიეთ ელექსირი",
      analyze: "შემადგენლობის ანალიზი:",
      normal: "ნორმა:",
      correct: "ელექსირი ამოცნობილია!",
      wrong: "არასტაბილური რეაქცია!",
      next: isMagical ? "შემდეგი ელექსირი" : "შემდეგი ქეისი",
      noEnergy: "ენერგია არ გაქვთ! დაელოდეთ აღდგენას.",
      solved: "ამოხსნილია",
      mastered: "შესწავლილია",
      skip: "გამოტოვება (შემდეგი)"
    }
  };
  const text = t[language];

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchCases = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('lab_cases')
            .select('*');
        
        if (error) {
            console.error("Error fetching lab cases:", error);
        }

        const dbCases = data || [];
        setAllScenarios(dbCases);
        setLoading(false);
    };
    fetchCases();
  }, []);

  // --- GROUPING & MASTERY ---
  const uniqueCategories = useMemo(() => {
      const cats = [...new Set(allScenarios.map(s => s.category || 'Uncategorized'))].sort();
      return cats;
  }, [allScenarios]);

  const categoryStatus = useMemo(() => {
      const stats = {};
      allScenarios.forEach(scenario => {
          const cat = scenario.category || 'Uncategorized';
          if (!stats[cat]) stats[cat] = { total: 0, completed: 0 };
          
          stats[cat].total += 1;
          if (completedIds.has(scenario.id)) {
              stats[cat].completed += 1;
          }
      });
      return stats;
  }, [allScenarios, completedIds]);

  // --- HELPER TEXT FUNCTIONS (Moved up so handleAnswer can use them) ---
  const getCaseTitle = (scenario) => {
      if (scenario.title && scenario.title[language] && scenario.title[language].trim() !== "") {
          return scenario.title[language];
      }
      if (scenario.title && scenario.title['en'] && scenario.title['en'].trim() !== "") {
          return scenario.title['en'];
      }
      if (scenario.category) return scenario.category;
      return "Unknown Potion";
  };

  const getOptionText = (option) => {
      if (!option) return "Unknown";
      if (typeof option.text === 'string') return option.text;
      return option.text[language] || option.text['en'];
  };

  const getFeedbackText = (scenario, option) => {
      // 1. Try Specific Option Feedback
      if (option && option.feedback) {
          const fb = typeof option.feedback === 'string' 
              ? option.feedback 
              : (option.feedback[language] || option.feedback['en']);
          
          if (fb && fb.trim() !== "") return fb;
      }

      // 2. Fallback to General Case Explanation
      if (scenario.explanation) {
          return typeof scenario.explanation === 'string'
              ? scenario.explanation
              : (scenario.explanation[language] || scenario.explanation['en']);
      }

      return "";
  };

  // --- HANDLERS ---

  // 1. Start from Menu
  const handleCategoryClick = (category) => {
    if (hearts <= 0) {
        alert(text.noEnergy);
        return;
    }
    loadRandomCase(category);
  };

  // 2. The Logic to Pick a Case
  const loadRandomCase = (category, currentCaseId = null) => {
    const catCases = allScenarios.filter(s => (s.category || 'Uncategorized') === category);
    const availableCases = currentCaseId 
        ? catCases.filter(s => s.id !== currentCaseId) 
        : catCases;

    if (availableCases.length === 0) {
        if (catCases.length > 0 && currentCaseId) {
             setActiveCase(catCases[0]);
             setSelectedOption(null);
             return;
        }
        return;
    }

    const unfinished = availableCases.filter(s => !completedIds.has(s.id));
    const pool = unfinished.length > 0 ? unfinished : availableCases;
    const randomScenario = pool[Math.floor(Math.random() * pool.length)];

    setActiveCase(randomScenario);
    setSelectedOption(null);
  };

  // 3. Next / Skip Handler
  const handleNextCase = () => {
      if (!activeCase) return;
      loadRandomCase(activeCase.category || 'Uncategorized', activeCase.id);
  };

  // 🔥 UPDATED: HANDLE ANSWER WITH DB SAVE 🔥
  const handleAnswer = async (option) => {
    if (selectedOption) return;
    if (hearts <= 0) {
       alert(text.noEnergy);
       return;
    }

    setSelectedOption(option);
    
    if (option.correct) {
      // --- SUCCESS LOGIC ---
      const isFirstTime = !completedIds.has(activeCase.id);
      if (isFirstTime) {
          completeActivity(activeCase.id, 5);
      } else {
          completeActivity(activeCase.id, 0); 
      }
    } else {
      // --- FAILURE LOGIC ---
      takeDamage();

      // 🛑 SAVE MISTAKE TO DB 🛑
      const { data: { user } } = await supabase.auth.getUser();
      if (user && activeCase) {
          try {
              // 1. Find Correct Option for the snapshot
              const correctOpt = activeCase.options.find(o => o.correct);

              // 2. Format the Lab Values into a readable string for "Question"
              const valuesList = activeCase.values
                  .map(v => `${v.name}: ${v.value} (${v.status})`)
                  .join('\n');

              // 3. Create Snapshot
              const snapshot = {
                  title: getCaseTitle(activeCase),
                  question: `Analyze Results:\n${valuesList}`, // Shows the lab values
                  userAnswer: getOptionText(option),
                  userFeedback: getFeedbackText(activeCase, option),
                  correctAnswer: getOptionText(correctOpt),
                  correctFeedback: getFeedbackText(activeCase, correctOpt)
              };

              // 4. Check for existing mistake
              const { data: existing } = await supabase
                  .from('user_mistakes')
                  .select('id, mistake_count')
                  .eq('user_id', user.id)
                  .eq('question_id', activeCase.id) 
                  .single();

              if (existing) {
                  // Update Count
                  await supabase
                      .from('user_mistakes')
                      .update({ 
                          mistake_count: existing.mistake_count + 1,
                          created_at: new Date().toISOString()
                      })
                      .eq('id', existing.id);
              } else {
                  // Insert New
                  await supabase
                      .from('user_mistakes')
                      .insert({
                          user_id: user.id,
                          question_id: activeCase.id,
                          game_type: 'clinical', // Tagged as Clinical/Lab
                          mistake_count: 1,
                          question_snapshot: snapshot
                      });
              }
          } catch (err) {
              console.error("Error saving lab mistake:", err);
          }
      }
    }
  };

  // --- MENU VIEW ---
  if (!activeCase) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 gap-4">
                <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
                <p>Brewing potions...</p>
            </div>
        );
    }

    return (
      <div className="max-w-4xl mx-auto animate-in fade-in">
        <div className="flex justify-between items-center mb-6">
            <button onClick={onBack} className="px-4 py-2 rounded bg-black/5 hover:bg-black/10 flex items-center gap-2">
                <ArrowLeft size={18} /> {language === 'ka' ? 'უკან' : 'Back'}
            </button>
            <div className="flex items-center gap-1 bg-black/5 px-3 py-1 rounded-full">
                <Heart size={16} className={hearts > 0 ? "text-red-500 fill-red-500" : "text-slate-400"} />
                <span className="font-bold">{hearts}</span>
            </div>
        </div>
        
        <h1 className={`text-4xl font-bold mb-8 flex items-center gap-3 ${isMagical ? 'text-purple-500 font-serif' : 'text-slate-800'}`}>
            {isMagical ? <Flame size={40} className="text-orange-500" /> : <ClipboardList size={40} />}
            {text.title}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uniqueCategories.length === 0 ? (
                <div className="col-span-full text-center py-10 opacity-50">
                    No potions found in the archive.
                </div>
            ) : (
                uniqueCategories.map(cat => {
                    const stats = categoryStatus[cat];
                    const isMastered = stats && stats.total > 0 && stats.total === stats.completed;
                    
                    return (
                        <button 
                            key={cat}
                            onClick={() => handleCategoryClick(cat)}
                            className={`p-6 rounded-xl border text-left transition-all hover:scale-[1.02] relative overflow-hidden group flex items-center gap-4 ${
                                isMagical 
                                    ? 'bg-[#1a0b2e] border-purple-900/50 hover:border-purple-500' 
                                    : 'bg-white border-slate-200 hover:border-blue-500 shadow-sm'
                            }`}
                        >
                            <div className={`p-3 rounded-full flex-shrink-0 relative ${isMagical ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-50 text-blue-600'}`}>
                                {isMagical ? <FlaskConical size={24} /> : <TestTube size={24} />}
                                {isMastered && (
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                                        <Check size={10} strokeWidth={4} />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1">
                                <h3 className={`font-bold text-lg flex items-center gap-2 ${isMagical ? 'text-purple-100' : 'text-slate-800'}`}>
                                    {cat}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs ${isMagical ? 'text-purple-400/60' : 'text-slate-500'}`}>
                                        {stats ? `${stats.completed}/${stats.total}` : '0/0'}
                                    </span>
                                    {isMastered && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded border border-yellow-500/30 animate-in fade-in">
                                            <Crown size={12} fill="currentColor" /> {text.mastered}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="opacity-20 group-hover:opacity-100 transition-opacity">
                                <Shuffle size={20} className={isMagical ? "text-purple-400" : "text-blue-400"} />
                            </div>

                            {isMagical && <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all" />}
                        </button>
                    );
                })
            )}
        </div>
      </div>
    );
  }

  // --- GAME VIEW ---
  const isSolved = completedIds.has(activeCase.id);

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setActiveCase(null)} className="opacity-60 hover:opacity-100 font-bold flex items-center gap-2">
            <ArrowLeft size={16} /> {language === 'ka' ? 'სია' : 'List'}
        </button>
        <div className="flex items-center gap-1 bg-black/5 px-3 py-1 rounded-full">
            {[...Array(3)].map((_, i) => (
                <Heart key={i} size={16} className={i < hearts ? "text-red-500 fill-red-500" : "text-slate-300 fill-slate-200 opacity-20"} />
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT: THE LAB RESULTS */}
        <div className={`p-6 rounded-2xl border-2 ${
            isMagical 
                ? 'bg-[#0f172a] border-slate-700 shadow-[0_0_30px_rgba(124,58,237,0.1)]' 
                : 'bg-white border-slate-200 shadow-lg'
        }`}>
            <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isMagical ? 'text-purple-300' : 'text-slate-700'}`}>
                {text.analyze}
            </h2>

            <div className="space-y-4">
                {activeCase.values.map((val, idx) => (
                    <div key={idx} className={`p-4 rounded-xl flex justify-between items-center border ${
                        isMagical ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'
                    }`}>
                        <div>
                            <span className={`font-bold block ${isMagical ? 'text-slate-200' : 'text-slate-800'}`}>{val.name}</span>
                            <span className="text-xs opacity-50">{text.normal} {val.normal}</span>
                        </div>
                        <div className="text-right">
                            <span className={`text-xl font-mono font-bold ${
                                val.status === 'low' ? 'text-blue-500' : 
                                val.status === 'high' ? 'text-red-500' : 'text-green-500'
                            }`}>
                                {val.value}
                            </span>
                            <div className={`text-[10px] font-bold uppercase tracking-wider ${
                                val.status === 'low' ? 'text-blue-500' : 
                                val.status === 'high' ? 'text-red-500' : 'text-green-500'
                            }`}>
                                {val.status}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* RIGHT: THE OPTIONS */}
        <div className="flex flex-col justify-center space-y-4">
            
            {/* SKIP BUTTON (Triggers NEXT, not EXIT) */}
            {isSolved && !selectedOption && (
                <button 
                    onClick={handleNextCase} 
                    className={`w-full py-3 mb-2 rounded-xl border-2 border-dashed font-bold flex items-center justify-center gap-2 transition-all ${
                        isMagical 
                            ? 'border-purple-500/30 text-purple-400 hover:bg-purple-900/20 hover:border-purple-500' 
                            : 'border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-400'
                    }`}
                >
                    <FastForward size={18} /> {text.skip}
                </button>
            )}

            {activeCase.options.map(option => (
                <button
                    key={option.id}
                    onClick={() => handleAnswer(option)}
                    disabled={selectedOption !== null || hearts <= 0}
                    className={`w-full p-6 text-left border-2 rounded-xl transition-all relative overflow-hidden ${
                        selectedOption?.id === option.id
                            ? option.correct 
                                ? 'bg-green-500/10 border-green-500 text-green-700'
                                : 'bg-red-500/10 border-red-500 text-red-700'
                            : isMagical 
                                ? 'bg-slate-800 border-slate-700 text-purple-100 hover:border-purple-500 hover:bg-slate-700'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:shadow-md'
                    }`}
                >
                    <span className="font-bold text-lg">{getOptionText(option)}</span>
                    {selectedOption?.id === option.id && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                             {option.correct ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                        </div>
                    )}
                </button>
            ))}

            {/* FEEDBACK & NEXT BUTTON */}
            {selectedOption && (
                <div className={`mt-6 p-4 rounded-xl border animate-in slide-in-from-bottom fade-in ${
                    selectedOption.correct 
                        ? (isMagical ? 'bg-green-900/30 border-green-500/50 text-green-300' : 'bg-green-50 border-green-200 text-green-800')
                        : (isMagical ? 'bg-red-900/30 border-red-500/50 text-red-300' : 'bg-red-50 border-red-200 text-red-800')
                }`}>
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold">
                            {selectedOption.correct ? text.correct : text.wrong}
                        </h3>
                        {selectedOption.correct && !completedIds.has(activeCase.id) && (
                            <span className="text-xs font-bold bg-yellow-400 text-black px-2 py-1 rounded-full animate-bounce">
                                +5 XP
                            </span>
                        )}
                    </div>
                    
                    <p className="text-sm opacity-90">
                        {getFeedbackText(activeCase, selectedOption)}
                    </p>
                    
                    <button 
                        onClick={handleNextCase}
                        className="mt-4 w-full py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition"
                    >
                        {text.next}
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}