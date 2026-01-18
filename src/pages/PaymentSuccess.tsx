import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function PaymentSuccess() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isMagical = theme === 'magical';

  // 5 წამში ავტომატურად გადავიყვანოთ მთავარ გვერდზე
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 6000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isMagical ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className={`max-w-md w-full text-center p-8 rounded-2xl border shadow-2xl relative overflow-hidden ${
        isMagical ? 'bg-slate-900 border-amber-500/50' : 'bg-white border-blue-100'
      }`}>
        
        {/* ანიმაციური ეფექტები */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>
        
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-500 shadow-lg animate-bounce">
            <Check className="text-green-600 w-10 h-10" strokeWidth={3} />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">
            {isMagical ? "ფიცი დადებულია!" : "Payment Successful!"}
        </h1>
        
        <p className={`text-lg mb-8 ${isMagical ? 'text-slate-400' : 'text-slate-600'}`}>
           {isMagical 
             ? "თქვენი ძალები გააქტიურდა. სამყარო გელოდებათ." 
             : "Your subscription is now active. Welcome aboard."}
        </p>

        <div className={`p-4 rounded-xl mb-8 flex items-center gap-4 text-left ${
            isMagical ? 'bg-amber-900/20 border border-amber-500/30' : 'bg-blue-50 border border-blue-100'
        }`}>
            <div className={`p-2 rounded-full ${isMagical ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'}`}>
                <Crown size={24} />
            </div>
            <div>
                <p className="text-sm opacity-70">New Status</p>
                <p className="font-bold text-lg">Magus / Pro Tier</p>
            </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className={`w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105 ${
            isMagical 
            ? 'bg-amber-600 hover:bg-amber-500 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <span>დაბრუნება</span>
          <ArrowRight size={18} />
        </button>

      </div>
    </div>
  );
}