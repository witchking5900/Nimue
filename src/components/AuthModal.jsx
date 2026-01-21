import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
// Added Stethoscope (for Phonendoscope) and Check
import { Lock, Key, Mail, Wand2, Activity, Globe, Scroll, X, ShieldAlert, User, Feather, Stethoscope, Check } from 'lucide-react'; 

function AuthModal() {
  const auth = useAuth();
  const themeContext = useTheme();

  if (!auth || !themeContext) return null; 

  const { signIn, signUp } = auth;
  const { theme, language, setLanguage, setTheme } = themeContext; // Get setters
  
  // --- NEW STATE FOR ONBOARDING FLOW ---
  // view can be: 'language' | 'theme' | 'auth'
  const [view, setView] = useState('language'); 

  const isMagical = theme === 'magical';
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [fullName, setFullName] = useState(''); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- TEXT DICTIONARY (Kept your original text) ---
  const t = {
    en: {
      titleMagic: isLogin ? "Identify Thyself" : "Inscribe Your Soul",
      titleStd: isLogin ? "Medical Login" : "Staff Registration",
      btnMagic: isLogin ? "Open the Gate" : "Bind Soul",
      btnStd: isLogin ? "Sign In" : "Register",
      switchMagic: isLogin ? "No Grimoire? Create one." : "Already bound? Enter.",
      switchStd: isLogin ? "No account? Sign up." : "Have an account? Login.",
      confirmPass: "Confirm Password",
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
      termsBodyStd: "By registering, you agree strictly not to share your account credentials...",
      termsBodyMagic: "By inscribing your true name, you swear a binding oath to the High Council..."
    },
    ka: {
      titleMagic: isLogin ? "წარადგინე თავი" : "სულის ჩაწერა",
      titleStd: isLogin ? "ავტორიზაცია" : "რეგისტრაცია",
      btnMagic: isLogin ? "კარიბჭის გახსნა" : "სულის მიბმა",
      btnStd: isLogin ? "შესვლა" : "რეგისტრაცია",
      switchMagic: isLogin ? "არ გაქვს გრიმუარი? შექმენი." : "უკვე გაქვს? შემოდი.",
      switchStd: isLogin ? "არ გაქვს ანგარიში? დარეგისტრირდი." : "გაქვს ანგარიში? შედი.",
      confirmPass: "დაადასტურეთ პაროლი",
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
      termsBodyStd: "რეგისტრაციით თქვენ ადასტურებთ, რომ არ გადასცემთ თქვენს ანგარიშს...",
      termsBodyMagic: "ბნელ გრიმუარში თქვენი სახელის ჩაწერით თქვენ ფიცს დებთ..."
    }
  };

  const text = t[language] || t.en;

  // --- HANDLERS ---
  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    setView('theme'); // Move to next step
  };

  const handleThemeSelect = (selectedTheme) => {
    setTheme(selectedTheme);
    setView('auth'); // Move to final step
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ka' : 'en');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!isLogin) {
        if (password !== confirmPassword) { setError(text.errorPass); return; }
        if (!agreedToTerms) { setError(text.errorTerms); return; }
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password, username, fullName);
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // VIEW 1: LANGUAGE SELECTION
  // ==========================================
  if (view === 'language') {
    return (
      <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
        <div className="w-full max-w-md animate-in zoom-in duration-300">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">Choose your language</h2>
            <h3 className="text-xl md:text-2xl text-center text-slate-400 mb-8 font-serif">აირჩიე ენა</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ENGLISH */}
                <button 
                    onClick={() => handleLanguageSelect('en')}
                    className="group relative p-6 bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 hover:shadow-blue-900/50 hover:shadow-2xl"
                >
                    <span className="text-5xl drop-shadow-lg filter">🇺🇸</span>
                    <span className="text-white font-bold tracking-widest group-hover:text-blue-400 transition-colors">ENGLISH</span>
                </button>

                {/* GEORGIAN */}
                <button 
                    onClick={() => handleLanguageSelect('ka')}
                    className="group relative p-6 bg-slate-900 border border-slate-700 hover:border-red-500 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 hover:shadow-red-900/50 hover:shadow-2xl"
                >
                    <span className="text-5xl drop-shadow-lg filter">🇬🇪</span>
                    <span className="text-white font-bold tracking-widest group-hover:text-red-400 transition-colors">ქართული</span>
                </button>
            </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: THEME/APPROACH SELECTION
  // ==========================================
  if (view === 'theme') {
    return (
      <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
        <div className="w-full max-w-2xl animate-in slide-in-from-right duration-300">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">Choose your approach</h2>
            <h3 className="text-xl md:text-2xl text-center text-slate-400 mb-10 font-serif">აირჩიე მიდგომა</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* STANDARD */}
                <button 
                    onClick={() => handleThemeSelect('standard')}
                    className="group relative p-8 bg-white/5 border border-slate-700 hover:border-blue-400 hover:bg-blue-900/10 rounded-2xl flex flex-col items-center gap-6 transition-all hover:scale-105"
                >
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Stethoscope size={40} className="text-blue-600" />
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-white mb-1">Standard</div>
                        <div className="text-lg text-slate-400 font-serif">სტანდარტული</div>
                    </div>
                </button>

                {/* MAGICAL */}
                <button 
                    onClick={() => handleThemeSelect('magical')}
                    className="group relative p-8 bg-black/40 border border-amber-900 hover:border-amber-500 hover:bg-amber-900/20 rounded-2xl flex flex-col items-center gap-6 transition-all hover:scale-105 shadow-[0_0_30px_rgba(245,158,11,0.05)] hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                >
                    <div className="w-20 h-20 bg-amber-900/30 rounded-full flex items-center justify-center group-hover:-rotate-12 transition-transform border border-amber-500/30">
                        <Wand2 size={40} className="text-amber-500" />
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-amber-100 mb-1">Magical</div>
                        <div className="text-lg text-amber-500/60 font-serif">ჯადოსნური</div>
                    </div>
                </button>
            </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: AUTH FORM (Your Existing Code)
  // ==========================================
  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
      
      {/* TERMS MODAL */}
      {showTerms && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className={`max-w-lg w-full p-8 rounded-xl border-2 shadow-2xl relative ${
                isMagical ? 'bg-slate-900 border-red-900 text-amber-50 shadow-red-900/20' : 'bg-white border-slate-300 text-slate-800'
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

      {/* MAIN AUTH CARD */}
      <div className={`w-full max-w-md p-8 rounded-2xl border-2 shadow-2xl animate-in zoom-in relative ${
        isMagical ? 'bg-slate-900 border-amber-600/50 text-amber-50' : 'bg-white border-blue-200 text-slate-800'
      }`}>
        
        {/* Language Toggle (Still here if they want to change it back) */}
        <button onClick={toggleLanguage} className={`absolute top-4 right-4 z-50 p-2 rounded-full transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer ${isMagical ? 'bg-slate-800 hover:bg-slate-700 text-amber-500 border border-amber-900/50' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border border-blue-100'}`}>
          <Globe size={16} /><span>{language === 'en' ? 'EN' : 'GE'}</span>
        </button>

        {/* Back Button to Theme Select (Optional, but good UX) */}
        <button onClick={() => setView('theme')} className={`absolute top-4 left-4 z-50 p-2 rounded-full transition-colors opacity-50 hover:opacity-100 ${isMagical ? 'text-amber-500' : 'text-slate-500'}`}>
             <span className="text-xs font-bold">←</span>
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

          {/* SHARED FIELDS */}
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

export default AuthModal;