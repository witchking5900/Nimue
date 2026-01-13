import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, Key, Mail, Wand2, Activity, Globe, Scroll, X, ShieldAlert, User, Feather } from 'lucide-react';

export default function AuthModal() {
  const { signIn, signUp } = useAuth();
  const { theme, language, setLanguage } = useTheme();
  const isMagical = theme === 'magical';

  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [fullName, setFullName] = useState(''); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // UI State
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- TEXT DICTIONARY ---
  const t = {
    en: {
      titleMagic: isLogin ? "Identify Thyself" : "Inscribe Your Soul",
      titleStd: isLogin ? "Medical Login" : "Staff Registration",
      btnMagic: isLogin ? "Open the Gate" : "Bind Soul",
      btnStd: isLogin ? "Sign In" : "Register",
      switchMagic: isLogin ? "No Grimoire? Create one." : "Already bound? Enter.",
      switchStd: isLogin ? "No account? Sign up." : "Have an account? Login.",
      confirmPass: "Confirm Password",
      
      // Labels
      nameStd: "Name and Surname",
      nameMagic: "True Name",
      usernameStd: "Username",
      usernameMagic: "Wizard Handle", 
      
      agreeLabel: "I agree to the ",
      termsLink: "Terms of Use",
      errorPass: "Passwords do not match.",
      errorTerms: "You must swear the oath (Accept Terms).",
      termsTitleStd: "Terms of Service",
      termsTitleMagic: "The Binding Oath",
      
      // Terms: Adjusted to reflect that while the system is open, Admins still ban for toxicity
      termsBodyStd: "By registering, you agree to maintain professional conduct. While access restrictions have been lifted, the Administration reserves the right to terminate accounts for toxic behavior, harassment, or malicious sharing of sensitive content.",
      termsBodyMagic: "By inscribing your name, you enter a pact of free will. The library is open to all who seek knowledge. However, the High Council (Admins) watches. Those who spread darkness (toxicity) or betrayal shall be cast out into the void."
    },
    ka: {
      titleMagic: isLogin ? "წარადგინე თავი" : "სულის ჩაწერა",
      titleStd: isLogin ? "ავტორიზაცია" : "რეგისტრაცია",
      btnMagic: isLogin ? "კარიბჭის გახსნა" : "სულის მიბმა",
      btnStd: isLogin ? "შესვლა" : "რეგისტრაცია",
      switchMagic: isLogin ? "არ გაქვს გრიმუარი? შექმენი." : "უკვე გაქვს? შემოდი.",
      switchStd: isLogin ? "არ გაქვს ანგარიში? დარეგისტრირდი." : "გაქვს ანგარიში? შედი.",
      confirmPass: "დაადასტურეთ პაროლი",
      
      // Labels
      nameStd: "სახელი და გვარი",
      nameMagic: "ნამდვილი სახელი",
      usernameStd: "მომხმარებლის სახელი",
      usernameMagic: "ჯადოქრის სახელი",

      agreeLabel: "ვეთანხმები ",
      termsLink: "წესებს და პირობებს",
      errorPass: "პაროლები არ ემთხვევა.",
      errorTerms: "თქვენ უნდა დადოთ ფიცი (დაეთანხმეთ წესებს).",
      termsTitleStd: "გამოყენების წესები",
      termsTitleMagic: "ფიცი და პირობა",
      
      // Terms: Updated for "We Fight" protocol (Freedom + Admin Power)
      termsBodyStd: "რეგისტრაციით თქვენ ეთანხმებით პროფესიულ ეთიკას. მიუხედავად იმისა, რომ სისტემური შეზღუდვები მოხსნილია, ადმინისტრაცია იტოვებს უფლებას დაბლოკოს მომხმარებელი ტოქსიკური ქცევის, შეურაცხყოფის ან მასალების ბოროტად გამოყენების შემთხვევაში.",
      termsBodyMagic: "თქვენი სახელის ჩაწერით თქვენ დებთ ნების თავისუფლების აღთქმას. ბიბლიოთეკა ღიაა ყველასთვის, ვისაც ცოდნა სწყურია. თუმცა, გახსოვდეთ: უმაღლესი საბჭო (ადმინები) ფხიზლობს. ისინი, ვინც სიბნელეს (ტოქსიკურობას) გაავრცელებენ, გაძევებულ იქნებიან სამუდამოდ."
    }
  };

  const text = t[language];

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ka' : 'en');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!isLogin) {
        if (password !== confirmPassword) {
            setError(text.errorPass);
            return;
        }
        if (!agreedToTerms) {
            setError(text.errorTerms);
            return;
        }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        // Updated: Pass fullName as the 4th argument
        const { error } = await signUp(email, password, username, fullName);
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
      
      {/* --- TERMS OF USE MODAL --- */}
      {showTerms && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className={`max-w-lg w-full p-8 rounded-xl border-2 shadow-2xl relative ${
                isMagical 
                ? 'bg-slate-900 border-red-900 text-amber-50 shadow-red-900/20' 
                : 'bg-white border-slate-300 text-slate-800'
            }`}>
                <button onClick={() => setShowTerms(false)} className="absolute top-4 right-4 opacity-50 hover:opacity-100"><X size={24} /></button>
                <div className="flex items-center gap-3 mb-6">
                    {isMagical ? <ShieldAlert className="text-red-500" size={32} /> : <Scroll className="text-blue-600" size={32} />}
                    <h3 className="text-2xl font-bold">{isMagical ? text.termsTitleMagic : text.termsTitleStd}</h3>
                </div>
                <div className={`p-4 rounded-lg mb-6 text-sm leading-relaxed ${isMagical ? 'bg-black/30 border border-red-900/30 text-amber-100/80' : 'bg-slate-50 border border-slate-100'}`}>
                    {isMagical ? text.termsBodyMagic : text.termsBodyStd}
                </div>
                <button 
                    onClick={() => { setAgreedToTerms(true); setShowTerms(false); }}
                    className={`w-full py-3 rounded-lg font-bold ${isMagical ? 'bg-red-900 hover:bg-red-800 text-red-100' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                    {isMagical ? (language === 'ka' ? 'ვფიცავ' : 'I Swear') : (language === 'ka' ? 'ვეთანხმები' : 'I Agree')}
                </button>
            </div>
        </div>
      )}

      {/* --- MAIN AUTH CARD --- */}
      <div className={`w-full max-w-md p-8 rounded-2xl border-2 shadow-2xl animate-in zoom-in relative ${
        isMagical ? 'bg-slate-900 border-amber-600/50 text-amber-50' : 'bg-white border-blue-200 text-slate-800'
      }`}>
        
        <button onClick={toggleLanguage} className={`absolute top-4 right-4 z-50 p-2 rounded-full transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer ${isMagical ? 'bg-slate-800 hover:bg-slate-700 text-amber-500 border border-amber-900/50' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border border-blue-100'}`}>
          <Globe size={16} /><span>{language === 'en' ? 'EN' : 'GE'}</span>
        </button>

        <div className="flex justify-center mb-6">
          <div className={`p-4 rounded-full ${isMagical ? 'bg-amber-900/30' : 'bg-blue-100'}`}>
            {isMagical ? <Wand2 size={40} className="text-amber-500" /> : <Activity size={40} className="text-blue-600" />}
          </div>
        </div>

        <h2 className={`text-3xl font-bold text-center mb-8 ${isMagical ? 'font-serif' : 'font-sans'}`}>
          {isMagical ? text.titleMagic : text.titleStd}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/20 border border-red-500 text-red-500 text-sm text-center animate-pulse">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* REGISTRATION FIELDS */}
          {!isLogin && (
            <>
                {/* 1. Name & Surname */}
                <div className="relative animate-in slide-in-from-top-2 fade-in">
                    <Feather className="absolute left-3 top-3 opacity-50" size={18} />
                    <input 
                    type="text" 
                    placeholder={isMagical ? text.nameMagic : text.nameStd}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full pl-10 p-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                        isMagical 
                        ? 'bg-slate-800 border-slate-700 focus:border-amber-500 focus:ring-amber-500/20' 
                        : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                    required
                    />
                </div>

                {/* 2. Username */}
                <div className="relative animate-in slide-in-from-top-2 fade-in">
                    <User className="absolute left-3 top-3 opacity-50" size={18} />
                    <input 
                    type="text" 
                    placeholder={isMagical ? text.usernameMagic : text.usernameStd}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full pl-10 p-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                        isMagical 
                        ? 'bg-slate-800 border-slate-700 focus:border-amber-500 focus:ring-amber-500/20' 
                        : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                    required
                    />
                </div>
            </>
          )}

          {/* SHARED FIELDS (Login & Register) */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 opacity-50" size={18} />
            <input 
              type="email" 
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full pl-10 p-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                isMagical ? 'bg-slate-800 border-slate-700 focus:border-amber-500 focus:ring-amber-500/20' : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
              required
            />
          </div>

          <div className="relative">
            <Key className="absolute left-3 top-3 opacity-50" size={18} />
            <input 
              type="password" 
              placeholder={language === 'ka' ? "პაროლი" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-10 p-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                isMagical ? 'bg-slate-800 border-slate-700 focus:border-amber-500 focus:ring-amber-500/20' : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
              required
            />
          </div>

          {/* Confirm Password & Terms (Only Register) */}
          {!isLogin && (
            <div className="space-y-4 animate-in slide-in-from-top-2 fade-in">
                <div className="relative">
                    <Lock className="absolute left-3 top-3 opacity-50" size={18} />
                    <input 
                    type="password" 
                    placeholder={text.confirmPass}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 p-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                        isMagical ? 'bg-slate-800 border-slate-700 focus:border-amber-500 focus:ring-amber-500/20' : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                    required
                    />
                </div>

                <div className="flex items-center gap-2 text-sm px-1">
                    <input 
                        type="checkbox" id="terms" checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="terms" className="opacity-80 select-none cursor-pointer">
                        {text.agreeLabel} <span onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className={`font-bold underline cursor-pointer hover:opacity-100 ${isMagical ? 'text-amber-500' : 'text-blue-600'}`}>{text.termsLink}</span>
                    </label>
                </div>
            </div>
          )}

          <button 
            type="submit" disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-95 mt-4 ${isMagical ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(217,119,6,0.5)]' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'}`}
          >
            {loading ? '...' : (isMagical ? text.btnMagic : text.btnStd)}
          </button>
        </form>

        <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="w-full mt-6 text-sm opacity-60 hover:opacity-100 hover:underline">
          {isMagical ? text.switchMagic : text.switchStd}
        </button>

      </div>
    </div>
  );
}