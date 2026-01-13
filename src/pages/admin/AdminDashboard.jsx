import { useState, useEffect } from 'react';
// FIX: Using absolute path for stability
import { supabase } from '/src/supabaseClient.js'; 
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Book, FolderTree, Skull, LogOut, FlaskConical, Scroll, ShieldAlert } from 'lucide-react';

// Import the Managers
import CategoryManager from './components/CategoryManager';
import InscriptionManager from './components/InscriptionManager';
import ClinicalManager from './components/ClinicalManager';
import LabManager from './components/LabManager';
import ScrollsManager from './components/ScrollsManager';
import SecurityManager from './components/SecurityManager';
import AdminStats from './components/AdminStats'; // NEW IMPORT

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('categories');
  const navigate = useNavigate();

  // Protect Route
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) navigate('/admin'); // Kick out if not logged in
    };
    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full left-0 top-0 z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-serif text-amber-500">Nimue Admin</h1>
          <p className="text-xs text-slate-500">Content Management</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'categories' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <FolderTree size={20} /> Categories
          </button>
          
          <button 
            onClick={() => setActiveTab('inscriptions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'inscriptions' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Book size={20} /> Inscriptions
          </button>

          <button 
            onClick={() => setActiveTab('clinical')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'clinical' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Skull size={20} /> Trial of Souls
          </button>

          <button 
            onClick={() => setActiveTab('lab')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'lab' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <FlaskConical size={20} /> Alchemist's Table
          </button>

          <button 
            onClick={() => setActiveTab('scrolls')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'scrolls' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Scroll size={20} /> Scrolls of Balance
          </button>

          <div className="my-2 border-t border-slate-800/50"></div>

          {/* SECURITY TAB */}
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'security' ? 'bg-red-900/20 text-red-400 border border-red-900/30' : 'text-slate-400 hover:text-white'}`}
          >
            <ShieldAlert size={20} /> Security Console
          </button>

        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 px-4 py-2">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 ml-64 overflow-y-auto min-h-screen">
        <div className="max-w-7xl mx-auto">
            
            {/* --- ADMIN STATS BAR --- */}
            <AdminStats />
            <div className="h-6"></div> {/* Spacer */}

            {/* DYNAMIC CONTENT SWITCHER */}
            {activeTab === 'categories' && <CategoryManager />}
            {activeTab === 'inscriptions' && <InscriptionManager />}
            {activeTab === 'clinical' && <ClinicalManager />}
            {activeTab === 'lab' && <LabManager />}
            {activeTab === 'scrolls' && <ScrollsManager />}
            {activeTab === 'security' && <SecurityManager />}
        </div>
      </main>
    </div>
  );
}