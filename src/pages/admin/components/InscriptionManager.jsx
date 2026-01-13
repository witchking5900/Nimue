import { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient.js';
import { BookOpen, Save, FileText, Plus, RotateCcw, Trash2, RefreshCw, Pencil, X } from 'lucide-react';

export default function InscriptionManager() {
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [dbInscriptions, setDbInscriptions] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Edit State
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [selectedCat, setSelectedCat] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [newCatName, setNewCatName] = useState(''); 
  
  const [formData, setFormData] = useState({
    en: { standardTitle: '', magicalTitle: '', standardContent: '', magicalContent: '' },
    ka: { standardTitle: '', magicalTitle: '', standardContent: '', magicalContent: '' }
  });

  const [rawTestData, setRawTestData] = useState('');

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    // A. Fetch Categories
    const { data: cats } = await supabase.from('categories').select('*').order('slug');
    if (cats) setCategories(cats);

    // B. Fetch Inscriptions (with Category Info)
    const { data: insc } = await supabase
      .from('inscriptions') // OR 'theory_posts' depending on your DB name. Keeping 'inscriptions' as per your provided file.
      .select('*, categories(title)') 
      .order('created_at', { ascending: false });
    
    if (insc) setDbInscriptions(insc);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. HELPERS ---
  const jsonTestToText = (testData) => {
      if (!testData || !Array.isArray(testData)) return "";
      return testData.map(block => {
          let text = `//// ${block.question}`;
          block.options.forEach(opt => {
              const prefix = opt.id === block.correctId ? "//" : "///";
              text += `\n${prefix} ${opt.text}`;
          });
          return text;
      }).join('\n\n');
  };

  // --- 3. HANDLERS ---
  const handleChange = (lang, field, value) => {
    setFormData(prev => ({
      ...prev,
      [lang]: { ...prev[lang], [field]: value }
    }));
  };

  const handleEdit = (inc) => {
      setEditingId(inc.id);
      setSelectedCat(inc.category_id);
      setFormData({
          en: {
              standardTitle: inc.title.en.standard,
              magicalTitle: inc.title.en.magical,
              standardContent: inc.content.en.standard,
              magicalContent: inc.content.en.magical
          },
          ka: {
              standardTitle: inc.title.ka.standard,
              magicalTitle: inc.title.ka.magical,
              standardContent: inc.content.ka.standard,
              magicalContent: inc.content.ka.magical
          }
      });
      setRawTestData(jsonTestToText(inc.test_data));
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setSelectedCat('');
      setRawTestData('');
      setFormData({
        en: { standardTitle: '', magicalTitle: '', standardContent: '', magicalContent: '' },
        ka: { standardTitle: '', magicalTitle: '', standardContent: '', magicalContent: '' }
      });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this inscription?")) return;
    try {
        const { error, data } = await supabase.from('inscriptions').delete().eq('id', id).select();
        if (error) throw error;
        if (!data || data.length === 0) {
            alert("Delete failed: Permission denied or item not found.");
        } else {
            setDbInscriptions(prev => prev.filter(i => i.id !== id));
            if (editingId === id) handleCancelEdit();
        }
    } catch (err) {
        alert("Error deleting: " + err.message);
    }
  };

  const parseSlashSyntax = (text) => {
    if (!text.trim()) return null;
    const blocks = text.split('////').filter(b => b.trim().length > 0);
    return blocks.map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const questionText = lines[0];
      const options = [];
      let correctAnswerId = null;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('// ')) {
          const txt = line.replace('// ', '');
          options.push({ id: `opt_${i}`, text: txt });
          correctAnswerId = `opt_${i}`;
        } else if (line.startsWith('/// ')) {
          const txt = line.replace('/// ', '');
          options.push({ id: `opt_${i}`, text: txt });
        }
      }
      return { id: crypto.randomUUID(), question: questionText, options: options, correctId: correctAnswerId };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let finalCategoryId = selectedCat;

    // Handle New Category Creation on the fly
    if (isCreatingCat && newCatName) {
        const slug = newCatName.toLowerCase().replace(/\s+/g, '-');
        const catPayload = {
            slug: slug,
            title: { 
                en: { standard: newCatName, magical: newCatName }, 
                ka: { standard: newCatName, magical: newCatName } 
            }
        };
        const { data, error } = await supabase.from('categories').insert(catPayload).select();
        if (error) {
            alert("Category Error: " + error.message);
            setLoading(false);
            return;
        }
        finalCategoryId = data[0].id;
        // Refresh categories so the new one appears in the list next time
        const { data: newCats } = await supabase.from('categories').select('*').order('slug');
        if (newCats) setCategories(newCats);
    }

    if (!finalCategoryId) {
        alert("Please select or create a category!");
        setLoading(false);
        return;
    }

    const parsedTest = parseSlashSyntax(rawTestData);
    
    const payload = {
      category_id: finalCategoryId,
      title: {
        en: { standard: formData.en.standardTitle, magical: formData.en.magicalTitle },
        ka: { standard: formData.ka.standardTitle, magical: formData.ka.magicalTitle }
      },
      content: {
        en: { standard: formData.en.standardContent, magical: formData.en.magicalContent },
        ka: { standard: formData.ka.standardContent, magical: formData.ka.magicalContent }
      },
      test_data: parsedTest 
    };

    let error;
    let savedData; 

    if (editingId) {
        const { error: upError, data: upData } = await supabase.from('inscriptions').update(payload).eq('id', editingId).select().single();
        error = upError;
        savedData = upData;
    } else {
        const { error: inError, data: inData } = await supabase.from('inscriptions').insert(payload).select().single();
        error = inError;
        savedData = inData;
    }

    if (error) {
      alert('Error: ' + error.message);
    } else {
      
      // --- NOTIFICATION LOGIC (PRODUCTION READY) ---
      if (!editingId && savedData) {
        console.log("--- SENDING NOTIFICATIONS ---");
        try {
            // 1. Get Category Name (String) to match Subscription Table
            // In 'categories' table, title is JSON. In 'subscriptions', category is likely a simple String name.
            // We use the EN Standard name as the key.
            const catObj = categories.find(c => c.id === finalCategoryId);
            const catName = catObj?.title?.en?.standard || newCatName; // Fallback to new name if just created

            if (catName) {
                // 2. Find Subscribers
                const { data: subs } = await supabase
                    .from('subscriptions')
                    .select('user_id')
                    .eq('category', catName);

                if (subs && subs.length > 0) {
                    const notifications = subs.map(sub => ({
                        user_id: sub.user_id,
                        type: 'update',
                        title: `New Inscription: ${catName}`,
                        message: `New theory available: ${savedData.title.en.standard}`,
                        link: `/?inscription=${savedData.id}` // <--- CORRECT DEEP LINK
                    }));

                    const { error: insertError } = await supabase.from('notifications').insert(notifications);
                    if (insertError) console.error("Notification Error:", insertError);
                    else console.log(`Sent notifications to ${subs.length} scholars.`);
                }
            }
        } catch (err) {
            console.error("Notification System Failed:", err);
        }
      }
      // --- END NOTIFICATION LOGIC ---
      
      alert(editingId ? 'Inscription Updated!' : 'Inscription Created!');
      handleCancelEdit(); 
      fetchData(); 
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl animate-in fade-in max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-blue-400" /> {editingId ? "Edit Inscription" : "Inscription Editor"}
        </h2>
        <button onClick={fetchData} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <RefreshCw size={20} className="text-slate-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* CATEGORY SELECTOR */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category</label>
          <div className="flex gap-2">
            {isCreatingCat ? (
                <input 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full bg-slate-800 border border-amber-500 rounded p-3 text-white focus:outline-none"
                    placeholder="Type New Category Name..."
                    autoFocus
                />
            ) : (
                <select 
                    value={selectedCat} 
                    onChange={(e) => setSelectedCat(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white"
                >
                    <option value="">-- Choose Category --</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.title?.en?.standard || cat.slug}
                        </option>
                    ))}
                </select>
            )}
            <button 
                type="button"
                onClick={() => setIsCreatingCat(!isCreatingCat)}
                className="p-3 rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                title={isCreatingCat ? "Select Existing" : "Create New"}
            >
                {isCreatingCat ? <RotateCcw size={18} /> : <Plus size={18} />}
            </button>
          </div>
        </div>

        {/* EDITORS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ENGLISH */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
              <span className="text-xl">🇬🇧</span> English Content
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Standard Title" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={formData.en.standardTitle} onChange={(e) => handleChange('en', 'standardTitle', e.target.value)} />
              <input placeholder="Magical Title" className="bg-slate-900 border border-amber-900/50 rounded p-2 text-amber-100 text-sm" value={formData.en.magicalTitle} onChange={(e) => handleChange('en', 'magicalTitle', e.target.value)} />
            </div>
            <textarea placeholder="Standard Text Content..." rows={6} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white text-sm font-mono" value={formData.en.standardContent} onChange={(e) => handleChange('en', 'standardContent', e.target.value)} />
            <textarea placeholder="Magical Text Content..." rows={6} className="w-full bg-slate-900 border border-amber-900/50 rounded p-3 text-amber-100 text-sm font-mono" value={formData.en.magicalContent} onChange={(e) => handleChange('en', 'magicalContent', e.target.value)} />
          </div>

          {/* GEORGIAN */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
              <span className="text-xl">🇬🇪</span> Georgian Content
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="სტანდარტული სათაური" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={formData.ka.standardTitle} onChange={(e) => handleChange('ka', 'standardTitle', e.target.value)} />
              <input placeholder="მაგიური სათაური" className="bg-slate-900 border border-amber-900/50 rounded p-2 text-amber-100 text-sm" value={formData.ka.magicalTitle} onChange={(e) => handleChange('ka', 'magicalTitle', e.target.value)} />
            </div>
            <textarea placeholder="სტანდარტული ტექსტი..." rows={6} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white text-sm font-mono" value={formData.ka.standardContent} onChange={(e) => handleChange('ka', 'standardContent', e.target.value)} />
            <textarea placeholder="მაგიური ტექსტი..." rows={6} className="w-full bg-slate-900 border border-amber-900/50 rounded p-3 text-amber-100 text-sm font-mono" value={formData.ka.magicalContent} onChange={(e) => handleChange('ka', 'magicalContent', e.target.value)} />
          </div>
        </div>

        {/* TEST BUILDER */}
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <FileText className="text-purple-400" /> Test Module Builder
            </h3>
            <div className="text-xs text-slate-500">Syntax: //// New Q, // Correct, /// Incorrect</div>
          </div>
          <textarea 
            value={rawTestData}
            onChange={(e) => setRawTestData(e.target.value)}
            className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-300 font-mono text-sm focus:border-purple-500 focus:outline-none"
            placeholder={`//// What is 2+2?
// 4
/// 5`}
          />
        </div>

        <div className="flex gap-3">
            {editingId && (
                <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                >
                    <X size={20} /> Cancel Edit
                </button>
            )}
            <button 
                disabled={loading} 
                className={`flex-[2] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${
                    editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
            >
                {loading ? "Writing..." : <><Save size={20} /> {editingId ? "Update Inscription" : "Save Inscription"}</>}
            </button>
        </div>
      </form>

      {/* --- MANAGE EXISTING --- */}
      <div className="mt-12 pt-8 border-t border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">Manage Inscriptions ({dbInscriptions.length})</h3>
        <div className="space-y-2">
            {dbInscriptions.map(inc => (
                <div key={inc.id} className={`p-4 rounded-lg flex justify-between items-center border transition-all ${
                    editingId === inc.id ? 'bg-amber-900/20 border-amber-500' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                }`}>
                    <div>
                        <div className={`font-bold ${editingId === inc.id ? 'text-amber-400' : 'text-white'}`}>
                            {inc.title?.en?.standard}
                        </div>
                        <div className="text-xs text-blue-400 font-mono mt-1">
                            {inc.categories?.title?.en?.standard || 'Uncategorized'}
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button type="button" onClick={() => handleEdit(inc)} className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit Inscription">
                            <Pencil size={18} />
                        </button>
                        <button type="button" onClick={() => handleDelete(inc.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Inscription">
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