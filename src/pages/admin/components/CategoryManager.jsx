import { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient.js';
import { FolderPlus, Save, Trash2, RefreshCw } from 'lucide-react';

export default function CategoryManager() {
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState('');
  const [categories, setCategories] = useState([]); // Store list of existing categories
  
  // The Data Structure
  const [formData, setFormData] = useState({
    en: { standard: '', magical: '' },
    ka: { standard: '', magical: '' }
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

  const handleDelete = async (id) => {
      if (!window.confirm("Delete this category? \n\nWarning: If inscriptions are linked to this category, the deletion might fail or cascade depending on your database settings.")) return;

      try {
          const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

          if (error) throw error;

          // Remove locally
          setCategories(prev => prev.filter(c => c.id !== id));
      } catch (err) {
          alert("Error deleting: " + err.message);
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('categories').insert({
      slug: slug.toLowerCase().replace(/\s+/g, '-'), // Auto-slugify
      title: formData
    });

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Category Created Successfully!');
      setSlug('');
      setFormData({ en: { standard: '', magical: '' }, ka: { standard: '', magical: '' } });
      fetchCategories(); // Refresh list
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderPlus className="text-emerald-400" /> Category Manager
        </h2>
        <button onClick={fetchCategories} className="p-2 hover:bg-slate-700 rounded-full transition-colors" title="Refresh List">
            <RefreshCw size={20} className="text-slate-400" />
        </button>
      </div>

      {/* CREATE FORM */}
      <form onSubmit={handleSubmit} className="space-y-6 mb-12 border-b border-slate-700 pb-8">
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
          {/* ENGLISH SECTION */}
          <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
              <span className="text-xl">🇬🇧</span> English
            </div>
            <div>
              <label className="text-xs text-slate-500">Standard Name</label>
              <input 
                value={formData.en.standard}
                onChange={(e) => handleChange('en', 'standard', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                placeholder="Cardiology"
              />
            </div>
            <div>
              <label className="text-xs text-amber-500">Magical Name</label>
              <input 
                value={formData.en.magical}
                onChange={(e) => handleChange('en', 'magical', e.target.value)}
                className="w-full bg-slate-800 border border-amber-900/50 rounded p-2 text-amber-100"
                placeholder="The Rhythm Arts"
              />
            </div>
          </div>

          {/* GEORGIAN SECTION */}
          <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
              <span className="text-xl">🇬🇪</span> Georgian
            </div>
            <div>
              <label className="text-xs text-slate-500">Standard Name</label>
              <input 
                value={formData.ka.standard}
                onChange={(e) => handleChange('ka', 'standard', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                placeholder="კარდიოლოგია"
              />
            </div>
            <div>
              <label className="text-xs text-amber-500">Magical Name</label>
              <input 
                value={formData.ka.magical}
                onChange={(e) => handleChange('ka', 'magical', e.target.value)}
                className="w-full bg-slate-800 border border-amber-900/50 rounded p-2 text-amber-100"
                placeholder="გულის ხელოვნება"
              />
            </div>
          </div>
        </div>

        <button 
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? "Saving..." : <><Save size={18} /> Create Category</>}
        </button>
      </form>

      {/* EXISTING CATEGORIES LIST */}
      <div>
          <h3 className="text-lg font-bold text-white mb-4">Existing Categories ({categories.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">No categories found.</p>
              ) : (
                  categories.map(cat => (
                      <div key={cat.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 hover:border-slate-600 flex justify-between items-center group">
                          <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                  {cat.title?.en?.standard || cat.slug}
                                  <span className="text-xs font-normal text-amber-500 bg-amber-900/20 px-2 py-0.5 rounded border border-amber-900/50">
                                      {cat.title?.en?.magical}
                                  </span>
                              </div>
                              <div className="text-xs text-slate-500 font-mono mt-1">ID: {cat.slug}</div>
                          </div>
                          
                          <button 
                              onClick={() => handleDelete(cat.id)}
                              className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete Category"
                          >
                              <Trash2 size={18} />
                          </button>
                      </div>
                  ))
              )}
          </div>
      </div>
    </div>
  );
}