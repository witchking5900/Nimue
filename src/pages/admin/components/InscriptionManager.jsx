import { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient.js';
import { BookOpen, Save, FileText, Plus, RotateCcw, Trash2, RefreshCw, Pencil, X } from 'lucide-react';

export default function InscriptionManager() {
  const [loading, setLoading] = useState(false);
  const [dbInscriptions, setDbInscriptions] = useState([]);
  const [categories, setCategories] = useState([]);
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

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    const { data: cats } = await supabase.from('categories').select('*').order('slug');
    if (cats) setCategories(cats);

    // FIXED: Now pointing to 'inscriptions'
    const { data: insc } = await supabase
      .from('inscriptions') 
      .select('*, categories(title)') 
      .order('created_at', { ascending: false });
    
    if (insc) setDbInscriptions(insc);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- HELPERS ---
  const safeGet = (obj, lang) => obj?.[lang] || "";

  // Convert JSON back to "Trial of Souls" Syntax for editing
  const jsonTestToText = (testData) => {
      if (!testData || !Array.isArray(testData)) return "";
      return testData.map(block => {
          let text = `//// ${safeGet(block.question, 'en')} | ${safeGet(block.question, 'ka')}`;
          
          block.options.forEach(opt => {
              const prefix = opt.id === block.correctId ? "//" : "///";
              const enText = safeGet(opt.text, 'en');
              const kaText = safeGet(opt.text, 'ka');
              const enFeed = safeGet(opt.feedback, 'en');
              const kaFeed = safeGet(opt.feedback, 'ka');
              
              text += `\n${prefix} ${enText} | ${kaText}`;
              
              if (enFeed || kaFeed) {
                  text += ` ## ${enFeed} | ${kaFeed}`;
              }
          });
          return text;
      }).join('\n\n');
  };

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
              standardTitle: inc.title?.en?.standard || '',
              magicalTitle: inc.title?.en?.magical || '',
              standardContent: inc.content?.en?.standard || '',
              magicalContent: inc.content?.en?.magical || ''
          },
          ka: {
              standardTitle: inc.title?.ka?.standard || '',
              magicalTitle: inc.title?.ka?.magical || '',
              standardContent: inc.content?.ka?.standard || '',
              magicalContent: inc.content?.ka?.magical || ''
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
    if (!window.confirm("Delete this inscription?")) return;
    // FIXED: Pointing to 'inscriptions'
    const { error } = await supabase.from('inscriptions').delete().eq('id', id);
    if (!error) {
        setDbInscriptions(prev => prev.filter(i => i.id !== id));
        if (editingId === id) handleCancelEdit();
    }
  };

  // --- PARSER ---
  const parseTrialSyntax = (text) => {
    if (!text.trim()) return null;
    
    const splitLang = (str) => {
        if (!str) return { en: "", ka: "" };
        const parts = str.split('|');
        return {
            en: parts[0]?.trim() || "",
            ka: parts[1]?.trim() || parts[0]?.trim() || "" 
        };
    };

    const blocks = text.split('////').filter(b => b.trim().length > 0);
    
    return blocks.map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const questionObj = splitLang(lines[0]);
      
      const options = [];
      let correctAnswerId = null;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        let rawContent = "";
        let isCorrect = false;

        if (line.startsWith('// ')) {
            isCorrect = true;
            rawContent = line.replace('// ', '');
        } else if (line.startsWith('/// ')) {
            isCorrect = false;
            rawContent = line.replace('/// ', '');
        } else {
            continue; 
        }

        const feedbackSplit = rawContent.split('##');
        const answerPart = feedbackSplit[0];
        const feedbackPart = feedbackSplit[1] || "";

        const answerObj = splitLang(answerPart);
        const feedbackObj = splitLang(feedbackPart);

        const optId = `opt_${crypto.randomUUID().slice(0,4)}`;
        
        options.push({
            id: optId,
            text: answerObj,      
            feedback: feedbackObj 
        });

        if (isCorrect) correctAnswerId = optId;
      }

      return { 
          id: crypto.randomUUID(), 
          question: questionObj, 
          options: options, 
          correctId: correctAnswerId 
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let finalCategoryId = selectedCat;

    if (isCreatingCat && newCatName) {
        const slug = newCatName.toLowerCase().replace(/\s+/g, '-');
        const { data, error } = await supabase.from('categories').insert({
            slug: slug,
            title: { 
                en: { standard: newCatName, magical: newCatName }, 
                ka: { standard: newCatName, magical: newCatName } 
            }
        }).select();
        
        if (error) { alert("Error: " + error.message); setLoading(false); return; }
        finalCategoryId = data[0].id;
        
        const { data: newCats } = await supabase.from('categories').select('*').order('slug');
        if (newCats) setCategories(newCats);
    }

    if (!finalCategoryId) { alert("Select a category!"); setLoading(false); return; }

    const parsedTest = parseTrialSyntax(rawTestData);
    
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

    // FIXED: Pointing to 'inscriptions'
    const query = editingId 
        ? supabase.from('inscriptions').update(payload).eq('id', editingId)
        : supabase.from('inscriptions').insert(payload);

    const { error } = await query;

    if (error) alert('Error: ' + error.message);
    else {
      alert(editingId ? 'Updated!' : 'Created!');
      handleCancelEdit(); 
      fetchData(); 
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl animate-in fade-in max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-blue-400" /> {editingId ? "Edit Inscription" : "Inscription Editor"}
        </h2>
        <button onClick={fetchData} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <RefreshCw size={20} className="text-slate-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* CATEGORY */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category</label>
          <div className="flex gap-2">
            {isCreatingCat ? (
                <input 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full bg-slate-800 border border-amber-500 rounded p-3 text-white focus:outline-none"
                    placeholder="New Category Name..."
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
                        <option key={cat.id} value={cat.id}>{cat.title?.en?.standard || cat.slug}</option>
                    ))}
                </select>
            )}
            <button type="button" onClick={() => setIsCreatingCat(!isCreatingCat)} className="p-3 rounded bg-slate-700 hover:bg-slate-600 text-white">
                {isCreatingCat ? <RotateCcw size={18} /> : <Plus size={18} />}
            </button>
          </div>
        </div>

        {/* CONTENT EDITORS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">🇬🇧 English</div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Standard Title" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={formData.en.standardTitle} onChange={(e) => handleChange('en', 'standardTitle', e.target.value)} />
              <input placeholder="Magical Title" className="bg-slate-900 border border-amber-900/50 rounded p-2 text-amber-100 text-sm" value={formData.en.magicalTitle} onChange={(e) => handleChange('en', 'magicalTitle', e.target.value)} />
            </div>
            <textarea placeholder="English Content..." rows={6} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white text-sm font-mono" value={formData.en.standardContent} onChange={(e) => handleChange('en', 'standardContent', e.target.value)} />
            <textarea placeholder="Magical English Content..." rows={6} className="w-full bg-slate-900 border border-amber-900/50 rounded p-3 text-amber-100 text-sm font-mono" value={formData.en.magicalContent} onChange={(e) => handleChange('en', 'magicalContent', e.target.value)} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">🇬🇪 Georgian</div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Standard Title" className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" value={formData.ka.standardTitle} onChange={(e) => handleChange('ka', 'standardTitle', e.target.value)} />
              <input placeholder="Magical Title" className="bg-slate-900 border border-amber-900/50 rounded p-2 text-amber-100 text-sm" value={formData.ka.magicalTitle} onChange={(e) => handleChange('ka', 'magicalTitle', e.target.value)} />
            </div>
            <textarea placeholder="Georgian Content..." rows={6} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white text-sm font-mono" value={formData.ka.standardContent} onChange={(e) => handleChange('ka', 'standardContent', e.target.value)} />
            <textarea placeholder="Magical Georgian Content..." rows={6} className="w-full bg-slate-900 border border-amber-900/50 rounded p-3 text-amber-100 text-sm font-mono" value={formData.ka.magicalContent} onChange={(e) => handleChange('ka', 'magicalContent', e.target.value)} />
          </div>
        </div>

        {/* TRIAL OF SOULS TEST BUILDER */}
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <FileText className="text-purple-400" /> Trial of Souls Logic
            </h3>
            <div className="text-[10px] text-slate-400 font-mono bg-slate-950 px-3 py-2 rounded border border-slate-800">
               //// Question EN | KA <br/>
               // Correct EN | KA ## Feedback EN | KA <br/>
               /// Wrong EN | KA ## Feedback EN | KA
            </div>
          </div>
          <textarea 
            value={rawTestData}
            onChange={(e) => setRawTestData(e.target.value)}
            className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-300 font-mono text-sm focus:border-purple-500 focus:outline-none leading-relaxed"
            placeholder={`//// What is ATP? | რა არის ATP?
// Energy Source | ენერგიის წყარო ## Correct! | სწორია!
/// Genetic Code | გენეტიკური კოდი ## Wrong, that is DNA. | არა, ეგ დნმ-ია.`}
          />
        </div>

        <div className="flex gap-3">
            {editingId && (
                <button type="button" onClick={handleCancelEdit} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                    <X size={20} /> Cancel
                </button>
            )}
            <button disabled={loading} className={`flex-[2] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                {loading ? "Writing..." : <><Save size={20} /> {editingId ? "Update" : "Save"}</>}
            </button>
        </div>
      </form>

      {/* LIST */}
      <div className="mt-12 pt-8 border-t border-slate-700 space-y-2">
        {dbInscriptions.map(inc => (
            <div key={inc.id} className="p-4 rounded-lg flex justify-between items-center border bg-slate-900/50 border-slate-700">
                <div className="font-bold text-white">{inc.title?.en?.standard}</div>
                <div className="flex gap-2">
                    <button onClick={() => handleEdit(inc)} className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg"><Pencil size={18} /></button>
                    <button onClick={() => handleDelete(inc.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={18} /></button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}