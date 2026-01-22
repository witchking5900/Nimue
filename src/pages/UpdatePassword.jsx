import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Key, Lock, Wand2, Stethoscope, CheckCircle, AlertTriangle } from 'lucide-react';

export default function UpdatePassword() {
  const { theme, language } = useTheme();
  const navigate = useNavigate();
  const isMagical = theme === 'magical';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Text Dictionary
  const t = {
    en: {
      titleMagic: "Forge New Seal",
      titleStd: "Set New Password",
      descMagic: "Enter a new incantation to secure your grimoire.",
      descStd: "Please enter your new password below.",
      btnMagic: "Seal the Bond",
      btnStd: "Update Password",
      successMagic: "The bond is renewed. Redirecting...",
      successStd: "Password updated. Redirecting...",
      placeholder: "New Password",
      confirm: "Confirm Password",
      mismatch: "Passwords do not match"
    },
    ka: {
      titleMagic: "ახალი ბეჭედი",
      titleStd: "პაროლის განახლება",
      descMagic: "ჩაწერეთ ახალი შელოცვა გრიმუარის დასაცავად.",
      descStd: "გთხოვთ შეიყვანოთ ახალი პაროლი.",
      btnMagic: "შელოცვის დადება",
      btnStd: "პაროლის შეცვლა",
      successMagic: "კავშირი აღდგენილია. გადამისამართება...",
      successStd: "პაროლი განახლდა. გადამისამართება...",
      placeholder: "ახალი პაროლი",
      confirm: "დაადასტურეთ პაროლი",
      mismatch: "პაროლები არ ემთხვევა"
    }
  };

  const text = t[language] || t.en;

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(text.mismatch);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;
      
      setSuccess(true);
      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isMagical ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className={`w-full max-w-md p-8 rounded-2xl border-2 shadow-2xl relative ${
        isMagical ? 'bg-slate-800 border-amber-600/50 text-amber-50' : 'bg-white border-blue-200 text-slate-800'
      }`}>
        
        <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full ${isMagical ? 'bg-amber-900/30' : 'bg-blue-100'}`}>
                {isMagical ? <Key size={40} className="text-amber-500" /> : <Lock size={40} className="text-blue-600" />}
            </div>
        </div>

        <h2 className={`text-3xl font-bold text-center mb-2 ${isMagical ? 'font-serif' : 'font-sans'}`}>
            {text.titleMagic}
        </h2>
        <p className={`text-center mb-8 opacity-70 ${isMagical ? 'font-serif' : 'font-sans'}`}>
            {isMagical ? text.descMagic : text.descStd}
        </p>

        {error && (
            <div className="mb-4 p-3 rounded bg-red-500/20 border border-red-500 text-red-500 text-sm flex items-center gap-2 justify-center">
                <AlertTriangle size={16} /> {error}
            </div>
        )}

        {success ? (
            <div className="text-center py-8 animate-in zoom-in">
                <div className="flex justify-center mb-4 text-green-500">
                    <CheckCircle size={48} />
                </div>
                <h3 className="text-xl font-bold text-green-500 mb-2">{isMagical ? text.successMagic : text.successStd}</h3>
            </div>
        ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
                <div className="relative">
                    <Lock className="absolute left-3 top-3 opacity-50" size={18} />
                    <input 
                        type="password" 
                        placeholder={text.placeholder}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-10 p-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                            isMagical ? 'bg-slate-900 border-slate-700 focus:border-amber-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'
                        }`}
                        required
                    />
                </div>

                <div className="relative">
                    <Key className="absolute left-3 top-3 opacity-50" size={18} />
                    <input 
                        type="password" 
                        placeholder={text.confirm}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-10 p-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                            isMagical ? 'bg-slate-900 border-slate-700 focus:border-amber-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'
                        }`}
                        required
                    />
                </div>

                <button 
                    type="submit" disabled={loading}
                    className={`w-full py-3 rounded-lg font-bold text-lg mt-4 transition-transform active:scale-95 ${
                        isMagical ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                    {loading ? '...' : (isMagical ? text.btnMagic : text.btnStd)}
                </button>
            </form>
        )}

      </div>
    </div>
  );
}