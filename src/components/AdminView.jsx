import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGameLogic } from '../context/GameContext';
import { supabase } from '../supabaseClient';
import { 
  Shield, Users, Activity, Search, Save, X, 
  Trash2, Plus, AlertTriangle, Check, Terminal,
  Database, Lock
} from 'lucide-react';

export default function AdminView() {
  const { user } = useAuth();
  const { tier } = useGameLogic();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [users, setUsers] = useState([]);
  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Editor State
  const [editingUser, setEditingUser] = useState(null);
  const [newCaseJson, setNewCaseJson] = useState('');

  // --- SECURITY CHECK ---
  if (tier !== 'archmage') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-red-500 p-8 text-center">
              <Shield size={64} className="mb-4" />
              <h1 className="text-3xl font-bold mb-2">ACCESS DENIED</h1>
              <p>Only the Archmage may enter the Restricted Section.</p>
          </div>
      );
  }

  // --- FETCH DATA ---
  useEffect(() => {
    fetchUsers();
    fetchCases();
  }, []);

  const fetchUsers = async () => {
      setLoading(true);
      // Note: This assumes you have a way to link auth.users to public.profiles
      // Usually admins query 'profiles' table directly.
      const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('xp', { ascending: false });
      
      if (data) setUsers(data);
      if (error) console.error("Error fetching users:", error);
      setLoading(false);
  };

  const fetchCases = async () => {
      const { data, error } = await supabase
          .from('clinical_cases')
          .select('*')
          .order('created_at', { ascending: false });
      if (data) setCases(data);
  };

  // --- ACTIONS ---
  const handleUpdateUser = async (e) => {
      e.preventDefault();
      if (!editingUser) return;

      const { error } = await supabase
          .from('profiles')
          .update({ 
              tier: editingUser.tier, 
              xp: parseInt(editingUser.xp),
              hearts: parseInt(editingUser.hearts)
          })
          .eq('id', editingUser.id);

      if (!error) {
          alert("User Updated!");
          setEditingUser(null);
          fetchUsers();
      } else {
          alert("Error: " + error.message);
      }
  };

  const handleCreateCase = async () => {
      try {
          const parsed = JSON.parse(newCaseJson);
          const { error } = await supabase.from('clinical_cases').insert(parsed);
          if (error) throw error;
          alert("Case added to Grimoire!");
          setNewCaseJson('');
          fetchCases();
      } catch (err) {
          alert("Invalid JSON or DB Error: " + err.message);
      }
  };

  const handleDeleteCase = async (id) => {
      if(!confirm("Destroy this knowledge forever?")) return;
      await supabase.from('clinical_cases').delete().eq('id', id);
      fetchCases();
  };

  // --- UI COMPONENTS ---
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30">
        
        {/* HEADER */}
        <header className="bg-slate-900 border-b border-slate-800 p-6 sticky top-0 z-20">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600 rounded-lg"><Terminal size={24} className="text-white"/></div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-wide">NIMUE <span className="text-purple-400">ADMIN</span></h1>
                        <p className="text-xs text-slate-500 font-mono">System v1.0 • Connected as Archmage</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'users' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'hover:bg-slate-800 text-slate-400'}`}>
                        <Users size={16} /> Users
                    </button>
                    <button onClick={() => setActiveTab('cases')} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'cases' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'hover:bg-slate-800 text-slate-400'}`}>
                        <Database size={16} /> Cases
                    </button>
                </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto p-6">
            
            {/* --- USERS TAB --- */}
            {activeTab === 'users' && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="text-purple-400"/> User Database</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search UUID..." 
                                className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 w-64 text-sm"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {users.filter(u => u.id.includes(searchTerm)).map(u => (
                            <div key={u.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${u.tier === 'archmage' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                                        {u.tier === 'archmage' ? 'A' : 'U'}
                                    </div>
                                    <div>
                                        <div className="font-mono text-xs opacity-50 mb-1">{u.id}</div>
                                        <div className="flex items-center gap-3 text-sm font-bold">
                                            <span className={`px-2 py-0.5 rounded text-xs uppercase ${u.tier === 'archmage' ? 'bg-purple-900 text-purple-200' : 'bg-slate-800 text-slate-300'}`}>{u.tier}</span>
                                            <span className="text-amber-500">{u.xp} XP</span>
                                            <span className="text-red-400">{u.hearts} ♥</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setEditingUser(u)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold border border-slate-700">
                                    Edit
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- CASES TAB --- */}
            {activeTab === 'cases' && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* CASE CREATOR */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit sticky top-24">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="text-green-400"/> Inject New Case</h3>
                            <p className="text-sm text-slate-500 mb-4">Paste the JSON object for the new clinical scenario here.</p>
                            <textarea 
                                className="w-full h-96 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-green-400 focus:outline-none focus:border-green-500 resize-none"
                                placeholder='{ "title": { "en": "..." }, "steps": [...] }'
                                value={newCaseJson}
                                onChange={e => setNewCaseJson(e.target.value)}
                            ></textarea>
                            <button onClick={handleCreateCase} className="w-full mt-4 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all">
                                Upload to Database
                            </button>
                        </div>

                        {/* CASE LIST */}
                        <div>
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Database className="text-purple-400"/> Existing Records</h3>
                            <div className="space-y-3">
                                {cases.map(c => (
                                    <div key={c.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl group hover:border-purple-500/50 transition-all">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-white">{c.title?.en || "Untitled Case"}</h4>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="px-2 py-1 bg-slate-950 rounded text-xs font-mono text-slate-400">{c.category}</span>
                                                    <span className="px-2 py-1 bg-slate-950 rounded text-xs font-mono text-slate-400">{c.steps ? c.steps.length : 0} Steps</span>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteCase(c.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <details className="mt-3">
                                            <summary className="text-xs cursor-pointer opacity-50 hover:opacity-100">View Raw Data</summary>
                                            <pre className="mt-2 p-3 bg-black rounded-lg text-[10px] text-slate-400 overflow-x-auto">
                                                {JSON.stringify(c, null, 2)}
                                            </pre>
                                        </details>
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>
                </div>
            )}
        </main>

        {/* --- EDIT USER MODAL --- */}
        {editingUser && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded-2xl shadow-2xl">
                    <h3 className="text-xl font-bold mb-6">Edit User Data</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs uppercase font-bold text-slate-500">Tier (Rank)</label>
                            <select 
                                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mt-1 text-white"
                                value={editingUser.tier}
                                onChange={e => setEditingUser({...editingUser, tier: e.target.value})}
                            >
                                <option value="apprentice">Apprentice</option>
                                <option value="magus">Magus</option>
                                <option value="grand_magus">Grand Magus</option>
                                <option value="archmage">Archmage (Admin)</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs uppercase font-bold text-slate-500">Experience (XP)</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mt-1 text-white"
                                value={editingUser.xp}
                                onChange={e => setEditingUser({...editingUser, xp: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="text-xs uppercase font-bold text-slate-500">Hearts</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl mt-1 text-white"
                                value={editingUser.hearts}
                                onChange={e => setEditingUser({...editingUser, hearts: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button onClick={() => setEditingUser(null)} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold text-slate-400 hover:bg-slate-700">Cancel</button>
                        <button onClick={handleUpdateUser} className="flex-1 py-3 bg-purple-600 rounded-xl font-bold text-white hover:bg-purple-500">Save Changes</button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
}