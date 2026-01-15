import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom'; 
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider, useGameLogic } from './context/GameContext'; 

// --- CRITICAL RESTORATION ---
import { ToastProvider, useToast } from './context/ToastContext';

// --- SECURITY SHIELD ---
import SecurityOverlay from './components/SecurityOverlay';

import Navbar from './components/Navbar';
import WelcomeModal from './components/WelcomeModal';
import TheoryViewer from './components/TheoryViewer';
import AppsMenu from './components/AppsMenu';
import AuthModal from './components/AuthModal'; 
import ProfileView from './components/ProfileView'; 
import CommunityHub from './pages/CommunityHub'; 
import Grimoire from './pages/Grimoire'; 
import { Book, GraduationCap, LogOut, ChevronLeft, Users, Crown } from 'lucide-react'; 

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

// ▼▼▼ NEW IMPORTS (Pricing & Security & Banner) ▼▼▼
import PricingPage from './pages/PricingPage';
import SecurityManager from './pages/admin/components/SecurityManager';
import ExpirationBanner from './components/ExpirationBanner'; // <--- ADDED THIS

const translations = {
  en: {
    magicalTitle: "The Grimoire Awaits",
    magicalDesc: "Toggle the switch above to lift the veil of magic and return to the mortal realm.",
    standardTitle: "Medical Dashboard",
    standardDesc: "Toggle the switch above to enable the gamified learning interface.",
    theoryStandard: "Theory",
    theoryMagical: "Inscriptions",
    appsStandard: "Clinical Apps",
    appsMagical: "Grimoires",
    communityStandard: "Conference Room",
    communityMagical: "Council of Elders"
  },
  ka: {
    magicalTitle: "გრიმუარი გელოდებათ",
    magicalDesc: "გამოიყენეთ ღილაკი ზემოთ რათა გადააფაროთ ფარდა მაგიას და დაბრუნდეთ მოკვდავთა სამყაროში",
    standardTitle: "სამედიცინო გზამკვლევი",
    standardDesc: "გამოიყენეთ ღილაკი რათა გადაეშვათ მედიცინის მაგიურ სამყაროში",
    theoryStandard: "თეორია",
    theoryMagical: "ჩანაწერები",
    appsStandard: "კლინიკური აპლიკაციები",
    appsMagical: "გრიმუარები",
    communityStandard: "საკონფერენციო",
    communityMagical: "უხუცესთა საბჭო"
  }
};

// --- HELPER: Fixes Profile Navigation from Pricing Page ---
const PricingNavbarWrapper = () => {
    const navigate = useNavigate();
    return <Navbar onOpenProfile={() => navigate('/?section=profile')} />;
};

// --- PROTECTED GRIMOIRE WRAPPER ---
const GrimoireRoute = () => {
    const { tier } = useGameLogic();
    const { addToast } = useToast();
    const navigate = useNavigate();
    
    const allowedTiers = ['magus', 'grand_magus', 'insubstantial', 'archmage'];
    const hasAccess = allowedTiers.includes(tier);

    useEffect(() => {
        if (!hasAccess) {
            addToast("Only Magus rank and above can enter the Grimoire.", "error");
            navigate('/'); 
        }
    }, [hasAccess, navigate, addToast]);

    if (!hasAccess) return null;

    return <Grimoire />;
};

function Dashboard() {
  const { theme, language } = useTheme();
  const { user, signOut } = useAuth();
  const isMagical = theme === 'magical';
  const t = translations[language];

  const [searchParams] = useSearchParams();
  
  const getInitialSection = () => {
      // ▼▼▼ FIXED: Check for 'profile' in URL ▼▼▼
      if (searchParams.get('section') === 'profile') return 'profile';
      
      if (searchParams.get('inscription')) return 'theory';
      if (searchParams.get('community')) return 'community';
      if (searchParams.get('trial')) return 'apps';
      if (searchParams.get('lab')) return 'apps';
      if (searchParams.get('scroll')) return 'apps';
      return null;
  };

  const [activeSection, setActiveSection] = useState(getInitialSection());

  useEffect(() => {
    const sectionParam = searchParams.get('section');
    const inscriptionId = searchParams.get('inscription');
    const communityId = searchParams.get('community');
    const trialId = searchParams.get('trial');
    const labId = searchParams.get('lab');
    const scrollId = searchParams.get('scroll');
    
    let detected = false;

    // ▼▼▼ FIXED: Handle Profile Navigation ▼▼▼
    if (sectionParam === 'profile') {
      setActiveSection('profile');
      detected = true;
    }
    else if (inscriptionId) {
      localStorage.setItem('pending_inscription_id', inscriptionId); 
      setActiveSection('theory');
      detected = true;
    } 
    else if (communityId) {
      localStorage.setItem('pending_community_id', communityId); 
      setActiveSection('community');
      detected = true;
    }
    else if (trialId) {
      localStorage.setItem('pending_game_id', 'clinical'); 
      localStorage.setItem('pending_case_id', trialId);
      setActiveSection('apps'); 
      detected = true;
    }
    else if (labId) {
      localStorage.setItem('pending_game_id', 'labs');
      localStorage.setItem('pending_case_id', labId);
      setActiveSection('apps'); 
      detected = true;
    }
    else if (scrollId) {
      localStorage.setItem('pending_game_id', 'ranges');
      localStorage.setItem('pending_case_id', scrollId);
      setActiveSection('apps'); 
      detected = true;
    }

    if (detected) {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams]);

  return (
    <div className={`min-h-screen transition-colors duration-500 flex flex-col ${
      isMagical ? 'bg-slate-950 text-amber-50' : 'bg-slate-50 text-slate-900' 
    }`}>
      
      <WelcomeModal />

      {!user ? (
        <AuthModal />
      ) : (
        <>
          <Navbar onOpenProfile={() => setActiveSection('profile')} />
          
          <div className="fixed bottom-4 right-4 z-50">
            <button onClick={signOut} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1 rounded text-xs font-bold border border-red-500/20 transition-all flex items-center gap-2">
              <LogOut size={12} /> Sign Out
            </button>
          </div>

          <main className="container mx-auto p-4 md:p-8 flex-1 flex flex-col">
            
            {/* ▼▼▼ EXPIRATION BANNER ADDED HERE ▼▼▼ */}
            <ExpirationBanner />
            {/* ▲▲▲ IT SITS AT THE TOP OF CONTENT ▲▲▲ */}

            {!activeSection && (
              <div className="flex-1 flex flex-col items-center justify-center -mt-20 animate-in fade-in">
                <h1 className={`text-5xl mb-6 text-center ${isMagical ? 'font-serif text-amber-500' : 'font-sans text-blue-600 font-bold'}`}>
                  {isMagical ? t.magicalTitle : t.standardTitle}
                </h1>
                <p className="text-xl opacity-80 max-w-lg text-center mb-12">
                  {isMagical ? t.magicalDesc : t.standardDesc}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                  <button onClick={() => setActiveSection('theory')} className={`p-8 rounded-xl border flex flex-col items-center gap-4 transition-all hover:scale-105 ${isMagical ? 'bg-slate-900 border-amber-900/50 hover:border-amber-500' : 'bg-white border-slate-200 shadow-lg hover:shadow-xl'}`}>
                    <Book size={48} className={isMagical ? 'text-amber-500' : 'text-blue-500'} />
                    <span className="text-2xl font-bold">{isMagical ? t.theoryMagical : t.theoryStandard}</span>
                  </button>
                  <button onClick={() => setActiveSection('apps')} className={`p-8 rounded-xl border flex flex-col items-center gap-4 transition-all hover:scale-105 ${isMagical ? 'bg-slate-900 border-amber-900/50 hover:border-amber-500' : 'bg-white border-slate-200 shadow-lg hover:shadow-xl'}`}>
                    <GraduationCap size={48} className={isMagical ? 'text-emerald-500' : 'text-blue-500'} />
                    <span className="text-2xl font-bold">{isMagical ? t.appsMagical : t.appsStandard}</span>
                  </button>
                  <button onClick={() => setActiveSection('community')} className={`p-8 rounded-xl border flex flex-col items-center gap-4 transition-all hover:scale-105 ${isMagical ? 'bg-slate-900 border-amber-900/50 hover:border-amber-500' : 'bg-white border-slate-200 shadow-lg hover:shadow-xl'}`}>
                    {isMagical ? <Crown size={48} className="text-purple-500" /> : <Users size={48} className="text-blue-600" />}
                    <span className="text-2xl font-bold">{isMagical ? t.communityMagical : t.communityStandard}</span>
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'theory' && <div className="w-full max-w-4xl mx-auto animate-in fade-in zoom-in duration-300"><TheoryViewer onBack={() => setActiveSection(null)} /></div>}
            {activeSection === 'apps' && <AppsMenu onBack={() => setActiveSection(null)} />}
            {activeSection === 'community' && <CommunityHub onBack={() => setActiveSection(null)} />}
            {activeSection === 'profile' && <div className="w-full animate-in fade-in zoom-in duration-300"><div className="max-w-2xl mx-auto mb-4"><button onClick={() => setActiveSection(null)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${isMagical ? 'bg-slate-800 border-slate-700 text-amber-100 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}><ChevronLeft size={18} /> {language === 'ka' ? 'მენიუ' : 'Menu'}</button></div><ProfileView /></div>}

          </main>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <GameProvider>
            {/* SECURITY WRAPS ROUTES */}
            <SecurityOverlay>
              <Routes>
                {/* PUBLIC ROUTES */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/community" element={<Dashboard />} />
                
                {/* ▼▼▼ FIXED: PRICING WITH WRAPPER ▼▼▼ */}
                <Route path="/pricing" element={
                    <>
                        <PricingNavbarWrapper /> 
                        <PricingPage />
                    </>
                } />

                {/* ADMIN ROUTES */}
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                
                {/* ▼▼▼ ADDED: SECURITY MANAGER ROUTE ▼▼▼ */}
                <Route path="/admin/security" element={<SecurityManager />} />
                
                {/* PROTECTED GRIMOIRE ROUTE */}
                <Route path="/grimoire" element={<GrimoireRoute />} />
                
                {/* FALLBACK */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </SecurityOverlay>
          </GameProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}