import React, { useState, useEffect } from "react";
import { useTheme } from '../context/ThemeContext';
import { supabase } from '/src/supabaseClient.js'; 
import { Book, ArrowRight, Brain, Loader2, Scroll } from "lucide-react";

// IMPORT STATIC DATA
// If you get an error here, try removing the { } braces!
import { theoryData as staticData } from '../data/theoryData'; 

export default function TheoryViewer() {
  const { theme, language } = useTheme();
  const isMagical = theme === 'magical';

  // Initialize with Static Data immediately so "Old" ones work instantly
  const [allInscriptions, setAllInscriptions] = useState(staticData || []);
  
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quiz State
  const [quizState, setQuizState] = useState({
    active: false,
    currentQuestionIndex: 0,
    score: 0,
    showResults: false,
    selectedAnswer: null
  });

  // --- FETCH & MERGE NEW DATA ---
  useEffect(() => {
    const fetchNewInscriptions = async () => {
      // 1. Fetch from Database
      const { data: dbData, error } = await supabase
        .from('inscriptions')
        .select(`*, categories (title)`);

      if (error) {
        console.error("Error loading inscriptions:", error);
      } else if (dbData && dbData.length > 0) {
        
        // 2. Format DB data to match your Static Data structure
        const formattedNewData = dbData.map(item => ({
            id: item.id, // Keep UUID for DB items
            // Map the Category Title from the relation
            category: item.categories?.title?.en?.standard || 'General', 
            title: item.title,
            content: item.content,
            quiz: item.test_data 
        }));

        // 3. Merge: Static (Old) + DB (New)
        // We use a Set or Check to prevent duplicates if needed, but simple spread works here
        setAllInscriptions(prev => [...staticData, ...formattedNewData]);
      }
      setLoading(false);
    };

    fetchNewInscriptions();
  }, []);

  // --- HELPER: Get Text based on Language/Mode ---
  const getText = (obj) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;

    const langObj = obj[language] || obj['en'];
    if (!langObj) return "";
    
    // Fallback logic: if magical text is missing, show standard
    if (isMagical) {
        return langObj.magical || langObj.standard;
    }
    return langObj.standard;
  };

  // --- QUIZ LOGIC ---
  const startQuiz = () => {
    setQuizState({ active: true, currentQuestionIndex: 0, score: 0, showResults: false, selectedAnswer: null });
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
      setQuizState(prev => ({ ...prev, showResults: true }));
    }
  };

  // --- RENDER ---
  
  // VIEW 1: TOPIC LIST
  if (!selectedTopic) {
    return (
      <div className="w-full">
         {/* Show simple loader only if we have 0 items (rare) */}
         {loading && allInscriptions.length === 0 && (
             <div className="p-4 text-center opacity-50"><Loader2 className="animate-spin inline" /> Loading...</div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allInscriptions.map((topic, idx) => (
            <button
                key={topic.id || idx}
                onClick={() => setSelectedTopic(topic)}
                className={`p-6 rounded-xl text-left border-2 transition-all hover:scale-[1.02] flex flex-col gap-2 ${
                isMagical 
                    ? 'bg-slate-900 border-amber-900/50 hover:border-amber-500' 
                    : 'bg-white border-slate-200 hover:border-blue-400 shadow-sm'
                }`}
            >
                <div className="w-full flex justify-between items-start">
                    <h3 className={`font-bold text-lg ${isMagical ? 'text-amber-100' : 'text-slate-800'}`}>
                       {getText(topic.title)}
                    </h3>
                    {topic.category && (
                        <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${isMagical ? 'bg-slate-800 text-amber-500' : 'bg-slate-100 text-slate-500'}`}>
                            {typeof topic.category === 'object' ? topic.category?.en?.standard : topic.category}
                        </span>
                    )}
                </div>
                
                <p className={`text-sm line-clamp-3 w-full opacity-80 ${isMagical ? 'text-slate-400' : 'text-slate-500'}`}>
                   {getText(topic.content)}
                </p>
                
                {/* Visual Indicator for Quiz Availability */}
                {topic.quiz && topic.quiz.length > 0 && (
                    <div className={`mt-2 text-xs flex items-center gap-1 ${isMagical ? 'text-purple-400' : 'text-blue-500'}`}>
                        <Brain size={12} /> {topic.quiz.length} Questions
                    </div>
                )}
            </button>
            ))}
        </div>
      </div>
    );
  }

  // VIEW 2: QUIZ ACTIVE
  if (quizState.active && !quizState.showResults) {
    const question = selectedTopic.quiz[quizState.currentQuestionIndex];
    
    return (
      <div className={`p-6 rounded-2xl border-2 ${isMagical ? 'bg-slate-900 border-purple-500' : 'bg-white border-blue-500'}`}>
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl">Quiz: {quizState.currentQuestionIndex + 1} / {selectedTopic.quiz.length}</h3>
            <Brain className={isMagical ? "text-purple-400" : "text-blue-500"} />
        </div>
        
        <p className="text-lg mb-6 font-medium">{question.question}</p>

        <div className="space-y-3">
          {question.options.map((opt) => {
             const isSelected = quizState.selectedAnswer === opt.id;
             const isCorrect = opt.id === question.correctId;
             
             let btnClass = isMagical 
                ? "bg-slate-800 border-slate-700 hover:bg-slate-700" 
                : "bg-slate-50 border-slate-200 hover:bg-blue-50";

             if (quizState.selectedAnswer) {
                 if (isSelected && isCorrect) btnClass = "bg-green-500/20 border-green-500 text-green-500";
                 else if (isSelected && !isCorrect) btnClass = "bg-red-500/20 border-red-500 text-red-500";
                 else if (!isSelected && isCorrect) btnClass = "bg-green-500/20 border-green-500 text-green-500 opacity-70";
                 else btnClass += " opacity-50";
             }

             return (
               <button
                 key={opt.id}
                 onClick={() => handleAnswer(opt.id, question.correctId)}
                 disabled={!!quizState.selectedAnswer}
                 className={`w-full p-4 rounded-xl border-2 text-left transition-all ${btnClass}`}
               >
                 {opt.text}
               </button>
             );
          })}
        </div>

        {quizState.selectedAnswer && (
          <div className="mt-6 flex justify-end">
             <button 
                onClick={nextQuestion}
                className={`px-6 py-2 rounded-lg font-bold text-white ${isMagical ? 'bg-purple-600' : 'bg-blue-600'}`}
             >
                {quizState.currentQuestionIndex + 1 === selectedTopic.quiz.length ? "Finish" : "Next"} <ArrowRight size={18} className="inline ml-1" />
             </button>
          </div>
        )}
      </div>
    );
  }

  // VIEW 3: QUIZ RESULTS
  if (quizState.showResults) {
    const percentage = Math.round((quizState.score / selectedTopic.quiz.length) * 100);
    return (
        <div className={`p-8 rounded-2xl text-center border-2 ${isMagical ? 'bg-slate-900 border-purple-500' : 'bg-white border-blue-500'}`}>
            <h2 className="text-3xl font-bold mb-4">Quiz Complete!</h2>
            <div className="text-6xl font-black mb-4 text-purple-500">{percentage}%</div>
            <p className="mb-8 opacity-70">You answered {quizState.score} out of {selectedTopic.quiz.length} correctly.</p>
            <button 
                onClick={() => setSelectedTopic(null)}
                className={`px-8 py-3 rounded-xl font-bold text-white ${isMagical ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-900 hover:bg-slate-800'}`}
            >
                Back to Theory
            </button>
        </div>
    );
  }

  // VIEW 4: READING CONTENT
  return (
    <div className={`p-6 md:p-10 rounded-3xl border ${isMagical ? 'bg-slate-900/80 border-amber-900/30' : 'bg-white border-slate-200 shadow-xl'}`}>
      <div className="flex justify-between items-start mb-6">
        <h2 className={`text-3xl font-bold ${isMagical ? 'text-amber-100 font-serif' : 'text-slate-900'}`}>
          {getText(selectedTopic.title)}
        </h2>
        {selectedTopic.quiz && selectedTopic.quiz.length > 0 && (
            <button 
                onClick={startQuiz}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${isMagical ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}`}
            >
                <Brain size={16} /> Take Quiz
            </button>
        )}
      </div>
      
      <div className={`prose max-w-none leading-relaxed whitespace-pre-wrap mb-10 ${isMagical ? 'prose-invert text-slate-300' : 'text-slate-700'}`}>
        {getText(selectedTopic.content)}
      </div>
    </div>
  );
}