import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useGameLogic } from '../context/GameContext';
import { 
  Droplets, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Scale, 
  Scroll, 
  RefreshCw 
} from 'lucide-react';

const RANGE_DATA = [
  { 
    id: 'hb_m', name: { en: "Hemoglobin (Male)", ka: "ჰემოგლობინი (კაცი)" }, 
    correct: "13.5 - 17.5 g/dL", 
    options: ["13.5 - 17.5 g/dL", "10.0 - 12.0 g/dL", "18.0 - 22.0 g/dL", "9.5 - 14.5 g/dL"] 
  },
  { 
    id: 'hb_f', name: { en: "Hemoglobin (Female)", ka: "ჰემოგლობინი (ქალი)" }, 
    correct: "12.0 - 15.5 g/dL", 
    options: ["12.0 - 15.5 g/dL", "14.0 - 18.0 g/dL", "10.0 - 11.5 g/dL", "9.0 - 13.0 g/dL"] 
  },
  { 
    id: 'wbc', name: { en: "WBC Count", ka: "ლეიკოციტები" }, 
    correct: "4,500 - 11,000 /µL", 
    options: ["4,500 - 11,000 /µL", "2,000 - 5,000 /µL", "12,000 - 20,000 /µL", "1,500 - 4,000 /µL"] 
  },
  { 
    id: 'plt', name: { en: "Platelets", ka: "თრომბოციტები" }, 
    correct: "150,000 - 450,000 /µL", 
    options: ["150,000 - 450,000 /µL", "50,000 - 100,000 /µL", "500,000 - 1,000,000 /µL", "100,000 - 200,000 /µL"] 
  },
  { 
    id: 'mcv', name: { en: "MCV (Mean Corpuscular Volume)", ka: "MCV (საშუალო მოცულობა)" }, 
    correct: "80 - 100 fL", 
    options: ["80 - 100 fL", "60 - 80 fL", "100 - 120 fL", "70 - 90 fL"] 
  },
  { 
    id: 'ferritin', name: { en: "Ferritin (Male)", ka: "ფერიტინი (კაცი)" }, 
    correct: "24 - 336 ng/mL", 
    options: ["24 - 336 ng/mL", "10 - 50 ng/mL", "500 - 1000 ng/mL", "5 - 15 ng/mL"] 
  }
];

export default function HemaRangesGame({ onBack }) {
  const { theme, language } = useTheme();
  // We ONLY import gainXp. We do NOT import takeDamage.
  const { gainXp } = useGameLogic(); 
  const isMagical = theme === 'magical';

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  const t = {
    en: {
      title: isMagical ? "Scrolls of Balance" : "Hematology Ranges",
      subtitle: isMagical ? "Memorize the laws of nature." : "Normal Reference Range Drill",
      question: isMagical ? "What is the Divine Proportion for:" : "Select the normal range for:",
      next: "Next Law",
      start: "Begin Drill",
      correct: "Correct! (+1 XP)",
      wrong: "Incorrect. Study this:",
      back: "Back"
    },
    ka: {
      title: isMagical ? "წონასწორობის გრაგნილები" : "ჰემატოლოგიური ნორმები",
      subtitle: isMagical ? "დაიმახსოვრე ბუნების კანონები." : "ნორმების სავარჯიშო",
      question: isMagical ? "რა არის ღვთაებრივი პროპორცია:" : "აირჩიეთ ნორმის ფარგლები:",
      next: "შემდეგი",
      start: "დაწყება",
      correct: "სწორია! (+1 XP)",
      wrong: "შეცდომაა. დაიმახსოვრეთ:",
      back: "უკან"
    }
  };
  const text = t[language];

  // --- LOGIC ---
  const generateQuestion = () => {
    const randomQ = RANGE_DATA[Math.floor(Math.random() * RANGE_DATA.length)];
    // Shuffle options
    const shuffled = [...randomQ.options].sort(() => Math.random() - 0.5);
    
    setCurrentQuestion(randomQ);
    setShuffledOptions(shuffled);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  const handleAnswer = (option) => {
    if (selectedOption) return; // Prevent double click
    setSelectedOption(option);
    
    if (option === currentQuestion.correct) {
      setIsCorrect(true);
      // 🔥 CHANGED TO 1 XP 🔥
      gainXp(1); 
    } else {
      setIsCorrect(false);
      // NO DAMAGE TAKEN HERE!
    }
  };

  // --- RENDER ---
  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom duration-500">
      
      {/* Header */}
      <button onClick={onBack} className="mb-6 opacity-60 hover:opacity-100 flex items-center gap-2 font-bold transition-all">
        <ArrowLeft size={18}/> {text.back}
      </button>

      <div className={`p-8 rounded-3xl border-2 shadow-xl ${
          isMagical 
            ? 'bg-[#1a0b2e] border-purple-500/30 text-purple-50' 
            : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Title Area */}
        <div className="text-center mb-10">
            <div className={`inline-flex p-4 rounded-full mb-4 ${isMagical ? 'bg-purple-900/30 text-purple-400' : 'bg-red-50 text-red-600'}`}>
                {isMagical ? <Scroll size={40} /> : <Droplets size={40} />}
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${isMagical ? 'font-serif text-purple-200' : 'font-sans'}`}>
                {text.title}
            </h1>
            <p className="opacity-60">{text.subtitle}</p>
        </div>

        {/* Game Area */}
        {!currentQuestion ? (
             <div className="text-center">
                 <button 
                    onClick={generateQuestion}
                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 ${
                        isMagical 
                            ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]' 
                            : 'bg-slate-900 text-white shadow-lg'
                    }`}
                 >
                    {text.start}
                 </button>
             </div>
        ) : (
            <div className="animate-in zoom-in duration-300">
                <h3 className="text-lg font-bold text-center mb-2 opacity-80">{text.question}</h3>
                <h2 className={`text-3xl font-bold text-center mb-8 ${isMagical ? 'text-amber-400 font-serif' : 'text-blue-600'}`}>
                    {currentQuestion.name[language]}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shuffledOptions.map((opt, idx) => {
                        let style = isMagical 
                            ? 'bg-slate-900 border-purple-900/50 hover:border-purple-500' 
                            : 'bg-slate-50 border-slate-200 hover:border-blue-400';
                        
                        if (selectedOption) {
                            if (opt === currentQuestion.correct) style = 'bg-green-500/20 border-green-500 text-green-600';
                            else if (opt === selectedOption) style = 'bg-red-500/20 border-red-500 text-red-600';
                            else style = 'opacity-50';
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(opt)}
                                disabled={selectedOption !== null}
                                className={`p-4 rounded-xl border-2 font-bold transition-all ${style}`}
                            >
                                {opt}
                            </button>
                        )
                    })}
                </div>

                {/* Feedback & Next */}
                {selectedOption && (
                    <div className="mt-8 text-center animate-in slide-in-from-bottom fade-in">
                        <div className={`mb-4 font-bold text-lg flex items-center justify-center gap-2 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                            {isCorrect ? <CheckCircle /> : <XCircle />}
                            {isCorrect ? text.correct : text.wrong}
                        </div>
                        {!isCorrect && (
                            <div className="mb-4 text-xl font-mono font-bold">
                                {currentQuestion.correct}
                            </div>
                        )}
                        <button 
                            onClick={generateQuestion}
                            className={`px-8 py-3 rounded-xl font-bold transition-all ${
                                isMagical 
                                    ? 'bg-purple-600 text-white hover:bg-purple-500' 
                                    : 'bg-slate-900 text-white hover:bg-slate-700'
                            }`}
                        >
                            {text.next} <RefreshCw className="inline ml-2" size={18} />
                        </button>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
}