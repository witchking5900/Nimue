import { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient.js';
import { FolderPlus, Save, Trash2, RefreshCw, Pencil, X, Sparkles } from 'lucide-react';

export default function CategoryManager() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Edit Mode State
  const [editingId, setEditingId] = useState(null);

  // Form Data - Added magicalSubtitle
  const [slug, setSlug] = useState('');
  const [formData, setFormData] = useState({
    en: { standard: '', magical: '', magicalSubtitle: '' },
    ka: { standard: '', magical: '', magicalSubtitle: '' }
  });

  // --- FETCH DATA ---
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('slug');
    
    if (error) console.error("Error loading categories:", error);
    if (data) setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- HANDLERS ---
  const handleChange = (lang, type, value) => {
    setFormData(prev => ({
      ...prev,
      [lang]: { ...prev[lang], [type]: value }
    }));
  };

  // 1. POPULATE FORM FOR EDITING
  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setSlug(cat.slug);
    // Safety check + Load Subtitles
    setFormData({
      en: { 
        standard: cat.title?.en?.standard || '', 
        magical: cat.title?.en?.magical || '',
        magicalSubtitle: cat.title?.en?.magicalSubtitle || '' 
      },
      ka: { 
        standard: cat.title?.ka?.standard || '', 
        magical: cat.title?.ka?.magical || '',
        magicalSubtitle: cat.title?.ka?.magicalSubtitle || '' 
      }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSlug('');
    setFormData({ 
        en: { standard: '', magical: '', magicalSubtitle: '' }, 
        ka: { standard: '', magical: '', magicalSubtitle: '' } 
    });
  };

  // 2. DELETE 
  const handleDelete = async (id) => {
      if (!window.confirm("Delete this category?")) return;

      const previousCategories = [...categories];
      setCategories(prev => prev.filter(c => c.id !== id));

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
          alert("⚠️ DATABASE ERROR: Could not delete.\nCheck your RLS Policies!");
          console.error(error);
          setCategories(previousCategories);
      }
  };

  // 3. SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      title: formData // This now includes subtitles
    };

    let error;

    if (editingId) {
        const result = await supabase.from('categories').update(payload).eq('id', editingId);
        error = result.error;
    } else {
        const result = await supabase.from('categories').insert(payload);
        error = result.error;
    }

    if (error) {
      alert('Error: ' + error.message);
    } else {
      cancelEdit();
      fetchCategories(); 
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderPlus className={editingId ? "text-amber-400" : "text-emerald-400"} /> 
            {editingId ? "Edit Category" : "Category Manager"}
        </h2>
        <button onClick={fetchCategories} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <RefreshCw size={20} className="text-slate-400" />
        </button>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className={`space-y-6 mb-12 border-b border-slate-700 pb-8 transition-all ${editingId ? 'bg-amber-900/10 p-4 rounded-xl border border-amber-900/50' : ''}`}>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Unique Slug (ID)</label>
          <input 
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono"
            placeholder="e.g. cardiology"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ENGLISH */}
          <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 relative overflow-hidden">
            <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
              <span className="text-xl">🇬🇧</span> English
            </div>
            
            {/* Standard */}
            <div>
              <label className="text-xs text-slate-500 font-bold">Standard Name</label>
              <input 
                value={formData.en.standard}
                onChange={(e) => handleChange('en', 'standard', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white placeholder-slate-600"
                placeholder="Cardiology"
              />
            </div>

            {/* Magical Section */}
            <div className="pt-2 border-t border-slate-700/50 space-y-3">
                <div>
                    <label className="text-xs text-amber-500 font-bold flex items-center gap-1"><Sparkles size={10}/> Magical Name</label>
                    <input 
                        value={formData.en.magical}
                        onChange={(e) => handleChange('en', 'magical', e.target.value)}
                        className="w-full bg-slate-800 border border-amber-900/50 rounded p-2 text-amber-100 placeholder-amber-900/50"
                        placeholder="The Rhythm Arts"
                    />
                </div>
                <div>
                    <label className="text-xs text-amber-500/70 font-bold">Magical Subtitle</label>
                    <input 
                        value={formData.en.magicalSubtitle}
                        onChange={(e) => handleChange('en', 'magicalSubtitle', e.target.value)}
                        className="w-full bg-slate-800 border border-amber-900/30 rounded p-2 text-amber-200/70 placeholder-amber-900/30 text-sm"
                        placeholder="Study of the Heart..."
                    />
                </div>
            </div>
          </div>

          {/* GEORGIAN */}
          <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
              <span className="text-xl">🇬🇪</span> Georgian
            </div>
            
            {/* Standard */}
            <div>
              <label className="text-xs text-slate-500 font-bold">Standard Name</label>
              <input 
                value={formData.ka.standard}
                onChange={(e) => handleChange('ka', 'standard', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white placeholder-slate-600"
                placeholder="კარდიოლოგია"
              />
            </div>

             {/* Magical Section */}
             <div className="pt-2 border-t border-slate-700/50 space-y-3">
                <div>
                    <label className="text-xs text-amber-500 font-bold flex items-center gap-1"><Sparkles size={10}/> Magical Name</label>
                    <input 
                        value={formData.ka.magical}
                        onChange={(e) => handleChange('ka', 'magical', e.target.value)}
                        className="w-full bg-slate-800 border border-amber-900/50 rounded p-2 text-amber-100 placeholder-amber-900/50"
                        placeholder="გულის ხელოვნება"
                    />
                </div>
                <div>
                    <label className="text-xs text-amber-500/70 font-bold">Magical Subtitle</label>
                    <input 
                        value={formData.ka.magicalSubtitle}
                        onChange={(e) => handleChange('ka', 'magicalSubtitle', e.target.value)}
                        className="w-full bg-slate-800 border border-amber-900/30 rounded p-2 text-amber-200/70 placeholder-amber-900/30 text-sm"
                        placeholder="გულის შესწავლა..."
                    />
                </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
            {editingId && (
                <button 
                    type="button"
                    onClick={cancelEdit}
                    className="w-1/3 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                    <X size={18} /> Cancel
                </button>
            )}
            <button 
                disabled={loading}
                className={`flex-1 font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg text-white ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
            >
                {loading ? "Saving..." : editingId ? <><Save size={18} /> Update Category</> : <><Save size={18} /> Create Category</>}
            </button>
        </div>
      </form>

      {/* LIST PREVIEW */}
      <div>
          <h3 className="text-lg font-bold text-white mb-4">Existing Categories ({categories.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(cat => (
                  <div key={cat.id} className={`p-4 rounded-lg border flex justify-between items-center group transition-all ${editingId === cat.id ? 'bg-amber-900/20 border-amber-500' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}>
                      <div>
                          <div className="font-bold text-white flex items-center gap-2">
                              {cat.title?.en?.standard || cat.slug}
                          </div>
                          {/* Magical Preview */}
                          {(cat.title?.en?.magical || cat.title?.en?.magicalSubtitle) && (
                              <div className="mt-1 flex flex-col items-start gap-1">
                                  {cat.title?.en?.magical && (
                                    <span className="text-xs font-bold text-amber-500 bg-amber-900/20 px-2 py-0.5 rounded border border-amber-900/50">
                                        ✨ {cat.title?.en?.magical}
                                    </span>
                                  )}
                                  {cat.title?.en?.magicalSubtitle && (
                                    <span className="text-[10px] text-amber-400/60 ml-1 italic">
                                        "{cat.title?.en?.magicalSubtitle}"
                                    </span>
                                  )}
                              </div>
                          )}
                          <div className="text-xs text-slate-500 font-mono mt-2">ID: {cat.slug}</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                              onClick={() => handleEdit(cat)}
                              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-900/20 rounded-lg transition-colors"
                              title="Edit"
                          >
                              <Pencil size={18} />
                          </button>
                          <button 
                              onClick={() => handleDelete(cat.id)}
                              className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete"
                          >
                              <Trash2 size={18} />
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}