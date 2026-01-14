import { useState } from 'react';
import { supabase } from '../../supabaseClient'; // Ensure path is correct
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Loader2 } from 'lucide-react'; // Changed RefreshCw to Loader2 for better spinner

// !!! REPLACE THIS WITH YOUR EXACT EMAIL !!!
const ADMIN_EMAIL = "witchking5900@gmail.com"; 

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // --- THE FIX: Clean the input (Remove spaces & lowercase) ---
    const cleanInputEmail = email.trim().toLowerCase();
    const cleanAdminEmail = ADMIN_EMAIL.trim().toLowerCase();

    // 1. Hardcoded Security Check (Frontend level)
    if (cleanInputEmail !== cleanAdminEmail) {
        alert("Access Denied: You are not the Archmage.");
        setLoading(false);
        return;
    }

    // 2. Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanInputEmail, // Use the cleaned email
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      navigate('/admin/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-amber-900/50 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]"></div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-serif text-amber-50">Grimoire Gatekeeper</h1>
          <p className="text-slate-400 text-sm">Restricted Area. Authorized Personnel Only.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-amber-500 focus:outline-none"
              placeholder="archmage@nimue.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-amber-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
            {loading ? "Verifying..." : "Unlock Grimoire"}
          </button>
        </form>
      </div>
    </div>
  );
}