import { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient.js';
import { FlaskConical, Save, Plus, Trash2, RefreshCw, X, RotateCcw, Library, Search, Filter, Pencil } from 'lucide-react';

export default function LabManager() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('builder'); // 'builder' or 'library'
  const [showImportModal, setShowImportModal] = useState(false);

  // --- DATA STATE ---
  const [dbCases, setDbCases] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [libraryRanges, setLibraryRanges] = useState([]); 

  // --- EDIT STATE ---
  const [editingId, setEditingId] = useState(null);

  // --- CASE BUILDER STATE ---
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [category, setCategory] = useState('');
  const [titles, setTitles] = useState({ en: '', ka: '' });
  const [explanation, setExplanation] = useState({ en: '', ka: '' }); // General Summary
  const [labValues, setLabValues] = useState([]); 
  const [rawOptions, setRawOptions] = useState('');

  // --- LIBRARY MANAGER STATE ---
  const [libForm, setLibForm] = useState({ name: '', category: '', normal: '' });
  const [importFilter, setImportFilter] = useState('All'); 

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    
    // A. Fetch Categories
    const { data: catData } = await supabase.from('categories').select('*').order('slug');
    if (catData) {
        const validCats = catData.map(c => c.title?.en?.standard || c.slug);
        setCategories(validCats);
        if (!category && validCats.length > 0) setCategory(validCats[0]);
    }

    // B. Fetch Ranges Library
    const { data: libData } = await supabase.from('lab_ranges_library').select('*').order('category');
    if (libData) setLibraryRanges(libData);

    // C. Fetch Existing Cases
    const { data: cases } = await supabase.from('lab_cases').select('*').order('created_at', { ascending: false });
    if (cases) setDbCases(cases);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. HELPERS ---

  // Converts saved JSON options back to Text Syntax for editing
  const jsonOptionsToText = (options) => {
      if (!options || !Array.isArray(options)) return "";
      return options.map(opt => {
          const prefix = opt.correct ? "//" : "///";
          
          const tEn = typeof opt.text === 'string' ? opt.text : (opt.text?.en || '');
          const tKa = typeof opt.text === 'string' ? opt.text : (opt.text?.ka || '');
          
          let line = `${prefix} ${tEn} | ${tKa}`;

          // Add feedback if exists
          if (opt.feedback) {
              const fEn = typeof opt.feedback === 'string' ? opt.feedback : (opt.feedback?.en || '');
              const fKa = typeof opt.feedback === 'string' ? opt.feedback : (opt.feedback?.ka || '');
              if (fEn || fKa) {
                  line += ` ## ${fEn} | ${fKa}`;
              }
          }
          return line;
      }).join('\n');
  };

  // --- 3. LAB VALUE HANDLERS ---
  const addManualValue = () => {
    setLabValues([...labValues, { name: '', value: '', normal: '', status: 'normal' }]);
  };

  const importValue = (rangeTemplate) => {
      setLabValues([...labValues, { 
          name: rangeTemplate.name, 
          value: '', 
          normal: rangeTemplate.normal_range, 
          status: 'normal' 
      }]);
      setShowImportModal(false);
  };

  const removeLabValue = (index) => {
    setLabValues(labValues.filter((_, i) => i !== index));
  };

  const updateLabValue = (index, field, val) => {
    const newValues = [...labValues];
    newValues[index][field] = val;
    setLabValues(newValues);
  };

  // --- 4. LIBRARY HANDLERS ---
  const handleCreateRange = async (e) => {
      e.preventDefault();
      if (!libForm.name || !libForm.category || !libForm.normal) return alert("Fill all fields");

      const { error } = await supabase.from('lab_ranges_library').insert({
          name: libForm.name,
          category: libForm.category,
          normal_range: libForm.normal
      });

      if (error) alert(error.message);
      else {
          alert("Range added to Library!");
          setLibForm({ name: '', category: '', normal: '' });
          fetchData();
      }
  };

  const handleDeleteRange = async (id) => {
      if(!confirm("Delete this range from library?")) return;
      await supabase.from('lab_ranges_library').delete().eq('id', id);
      fetchData();
  };

  // --- 5. CASE HANDLERS ---
  
  const handleEdit = (c) => {
      setEditingId(c.id);
      setCategory(c.category);
      setTitles(c.title);
      setExplanation(c.explanation || { en: '', ka: '' });
      setLabValues(c.values || []);
      setRawOptions(jsonOptionsToText(c.options));
      setActiveTab('builder'); // Switch to builder tab
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setTitles({ en: '', ka: '' });
      setExplanation({ en: '', ka: '' });
      setLabValues([]);
      setRawOptions('');
  };

  const parseOptions = (text) => {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    return lines.map((line, idx) => {
        let isCorrect = false;
        let cleanLine = line;

        // 1. Determine Correct/Wrong
        if (line.startsWith('///')) {
            isCorrect = false; 
            cleanLine = line.replace(/^\/+\s*/, ''); // Robust remove
        } else if (line.startsWith('//')) {
            isCorrect = true; 
            cleanLine = line.replace(/^\/+\s*/, ''); // Robust remove
        }

        // 2. Split Main Text vs Specific Feedback (Delimiter: ##)
        const mainParts = cleanLine.split('##');
        const textPart = mainParts[0] ? mainParts[0].trim() : "";
        const feedbackPart = mainParts[1] ? mainParts[1].trim() : "";

        // 3. Parse Option Text (EN | KA)
        const textSegments = textPart.split('|');
        const enText = textSegments[0]?.trim() || "";
        const kaText = textSegments[1]?.trim() || enText;

        // 4. Parse Specific Feedback (EN | KA)
        const fbSegments = feedbackPart.split('|');
        const fbEn = fbSegments[0]?.trim() || "";
        const fbKa = fbSegments[1]?.trim() || fbEn;

        return {
            id: `opt_${idx}_${Date.now()}`,
            text: { en: enText, ka: kaText },
            feedback: { en: fbEn, ka: fbKa }, // Specific feedback per option
            correct: isCorrect
        };
    });
  };

  const handleSubmitCase = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isCreatingCategory && category) {
        const exists = categories.some(c => c.toLowerCase() === category.toLowerCase());
        if (!exists) {
             const slug = category.toLowerCase().replace(/\s+/g, '-');
             await supabase.from('categories').insert({
                 slug: slug,
                 title: { en: { standard: category }, ka: { standard: category } }
             });
        }
    }

    const parsedOptions = parseOptions(rawOptions);
    if (parsedOptions.length < 2) {
        alert("Please add at least 2 options!");
        setLoading(false);
        return;
    }

    const payload = {
        category,
        title: titles,
        explanation: explanation, // General case summary
        values: labValues,
        options: parsedOptions,   // Now contains specific feedback
        xp_reward: 25
    };

    let error;
    let savedData; // Capture for notifications

    if (editingId) {
        // UPDATE MODE
        const { error: upError, data: upData } = await supabase
            .from('lab_cases')
            .update(payload)
            .eq('id', editingId)
            .select()
            .single();
        error = upError;
        savedData = upData;
    } else {
        // CREATE MODE
        const { error: inError, data: inData } = await supabase
            .from('lab_cases')
            .insert(payload)
            .select() // IMPORTANT: return data so we have the ID
            .single();
        error = inError;
        savedData = inData;
    }

    if (error) {
        alert(error.message);
    } else {
        
        // --- NOTIFICATION LOGIC ---
        if (!editingId && savedData) {
            console.log("--- SENDING LAB NOTIFICATIONS ---");
            try {
                // 1. Find Subscribers (Category is string in lab_cases)
                const { data: subs } = await supabase
                    .from('subscriptions')
                    .select('user_id')
                    .eq('category', category);

                if (subs && subs.length > 0) {
                    const notifications = subs.map(sub => ({
                        user_id: sub.user_id,
                        type: 'update',
                        title: `New Alchemist Potion: ${category}`,
                        message: `New formulation available: ${savedData.title.en}`,
                        link: `/?lab=${savedData.id}` // We will handle ?lab= ID later
                    }));

                    await supabase.from('notifications').insert(notifications);
                    console.log(`Sent to ${subs.length} alchemists.`);
                }
            } catch (err) {
                console.error("Notification Error:", err);
            }
        }

        alert(editingId ? "Case Updated Successfully!" : "Case Created Successfully!");
        handleCancelEdit(); // Reset form
        fetchData();
    }
    setLoading(false);
  };

  const handleDeleteCase = async (id) => {
      if(!confirm("Delete this case?")) return;
      await supabase.from('lab_cases').delete().eq('id', id);
      if (editingId === id) handleCancelEdit();
      fetchData();
  };

  // --- HELPER: Get Unique Categories from Library ---
  const libCategories = ["All", ...new Set(libraryRanges.map(r => r.category))].sort();
  const filteredLibrary = importFilter === "All" ? libraryRanges : libraryRanges.filter(r => r.category === importFilter);

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl animate-in fade-in max-w-6xl mx-auto">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="text-emerald-400" /> {editingId ? "Edit Potion" : "Alchemist's Manager"}
        </h2>
        <div className="flex bg-slate-900 p-1 rounded-lg">
            <button onClick={() => setActiveTab('builder')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'builder' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                Case Builder
            </button>
            <button onClick={() => setActiveTab('library')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'library' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                Range Library
            </button>
        </div>
      </div>

      {/* --- TAB 1: RANGE LIBRARY --- */}
      {activeTab === 'library' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 fade-in">
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Library size={20} className="text-purple-400"/> Add New Range Template</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Range Name</label>
                          <input value={libForm.name} onChange={e => setLibForm({...libForm, name: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" placeholder="e.g. Hemoglobin" />
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Category (e.g. Hematology)</label>
                          <input value={libForm.category} onChange={e => setLibForm({...libForm, category: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" placeholder="e.g. Hematology" />
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">Normal Range Text</label>
                          <input value={libForm.normal} onChange={e => setLibForm({...libForm, normal: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" placeholder="e.g. 12-16 g/dL" />
                      </div>
                      <button onClick={handleCreateRange} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2 rounded flex items-center justify-center gap-2"><Plus size={18} /> Add</button>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {libraryRanges.map(range => (
                      <div key={range.id} className="bg-slate-900/50 border border-slate-700 p-4 rounded-lg flex justify-between items-start">
                          <div>
                              <div className="font-bold text-white">{range.name}</div>
                              <div className="text-xs text-emerald-400 font-mono">{range.normal_range}</div>
                              <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1 bg-slate-800 w-fit px-1 rounded">{range.category}</div>
                          </div>
                          <button onClick={() => handleDeleteRange(range.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded"><Trash2 size={16} /></button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- TAB 2: CASE BUILDER --- */}
      {activeTab === 'builder' && (
        <>
        <form onSubmit={handleSubmitCase} className="space-y-8 animate-in slide-in-from-left-4 fade-in">
            {/* 1. METADATA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Case Category</label>
                    <div className="flex gap-2">
                        {isCreatingCategory ? (
                            <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-800 border border-emerald-500 rounded p-2 text-white" placeholder="New Category..." autoFocus />
                        ) : (
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white">
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        )}
                        <button type="button" onClick={() => setIsCreatingCategory(!isCreatingCategory)} className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-white">
                            {isCreatingCategory ? <RotateCcw size={18} /> : <Plus size={18} />}
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs text-slate-500">Title (EN)</label><input value={titles.en} onChange={(e) => setTitles({...titles, en: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" /></div>
                    <div><label className="text-xs text-slate-500">Title (KA)</label><input value={titles.ka} onChange={(e) => setTitles({...titles, ka: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" /></div>
                </div>
            </div>

            {/* 2. CLINICAL RANGES (THE UPGRADED PART) */}
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                    <h3 className="font-bold text-white">Clinical Ranges</h3>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setShowImportModal(true)} className="text-xs flex items-center gap-1 bg-purple-600 px-3 py-1.5 rounded hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-900/20">
                            <Library size={14} /> Import from Library
                        </button>
                        <button type="button" onClick={addManualValue} className="text-xs flex items-center gap-1 bg-slate-700 px-3 py-1.5 rounded hover:bg-slate-600 text-white">
                            <Plus size={14} /> Custom
                        </button>
                    </div>
                </div>
                
                {labValues.length === 0 && <div className="text-center py-8 text-slate-600 italic">No ranges added. Use the buttons above.</div>}

                <div className="space-y-2">
                    {labValues.map((val, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-slate-950 p-2 rounded border border-slate-800 animate-in slide-in-from-top-2">
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-500 uppercase block">Test Name</label>
                                <input value={val.name} onChange={(e) => updateLabValue(idx, 'name', e.target.value)} className="w-full bg-transparent border-b border-slate-700 text-white outline-none font-bold" />
                            </div>
                            <div className="w-24">
                                <label className="text-[10px] text-amber-500 uppercase block">Patient Value</label>
                                <input value={val.value} onChange={(e) => updateLabValue(idx, 'value', e.target.value)} className="w-full bg-transparent border-b border-amber-500/50 text-white outline-none font-mono" autoFocus />
                            </div>
                            <div className="w-32">
                                <label className="text-[10px] text-slate-500 uppercase block">Normal Range</label>
                                <input value={val.normal} onChange={(e) => updateLabValue(idx, 'normal', e.target.value)} className="w-full bg-transparent border-b border-slate-700 text-slate-400 outline-none text-sm" />
                            </div>
                            
                            <div className="w-24">
                                <label className="text-[10px] text-slate-500 uppercase block">Status</label>
                                <select value={val.status} onChange={(e) => updateLabValue(idx, 'status', e.target.value)} className={`w-full bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-sm ${val.status === 'low' ? 'text-blue-400' : val.status === 'high' ? 'text-red-400' : 'text-green-400'}`}>
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <button type="button" onClick={() => removeLabValue(idx)} className="text-red-500 hover:bg-red-500/10 p-2 rounded mt-3 md:mt-0"><X size={16} /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. LOGIC & FEEDBACK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
                    <label className="block font-bold text-white mb-2">Options Logic (With Specific Feedback)</label>
                    <div className="text-xs text-slate-500 mb-2 p-2 bg-black/20 rounded border border-slate-800">
                        <strong>Syntax:</strong> <span className="text-green-400">// Correct</span> or <span className="text-red-400">/// Wrong</span><br/>
                        Use <span className="text-purple-400">##</span> to separate feedback.<br/>
                        <span className="opacity-50">Example: /// Choice Name ## Why it is wrong</span>
                    </div>
                    <textarea 
                        value={rawOptions} 
                        onChange={(e) => setRawOptions(e.target.value)} 
                        className="w-full h-48 bg-slate-950 border border-slate-800 rounded p-3 text-slate-300 font-mono text-sm leading-relaxed" 
                        placeholder={`// Iron Deficiency | რკინადეფიციტური ## Correct! Low Ferritin confirms this. | სწორია! დაბალი ფერიტინი ამას ადასტურებს.\n\n/// B12 Deficiency | B12 დეფიციტი ## Wrong. MCV is normal. | არასწორია. MCV ნორმაშია.`} 
                    />
                </div>
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl space-y-4">
                    <label className="block font-bold text-white">General Case Summary (Optional)</label>
                    <div className="text-xs text-slate-500 mb-2">This appears regardless of which option they pick.</div>
                    <textarea value={explanation.en} onChange={(e) => setExplanation({...explanation, en: e.target.value})} className="w-full h-20 bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm" placeholder="English Summary..." />
                    <textarea value={explanation.ka} onChange={(e) => setExplanation({...explanation, ka: e.target.value})} className="w-full h-20 bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm" placeholder="ქართული შეჯამება..." />
                </div>
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
                <button disabled={loading} className={`flex-[2] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                    {loading ? "Brewing..." : <><Save size={20} /> {editingId ? "Update Potion Case" : "Create Potion Case"}</>}
                </button>
            </div>
        </form>

        {/* --- IMPORT MODAL --- */}
        {showImportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="w-full max-w-2xl bg-slate-900 border-2 border-purple-500/50 rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[80vh]">
                    <button onClick={() => setShowImportModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24}/></button>
                    
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Library className="text-purple-400" /> Select Clinical Range</h3>
                    
                    {/* Filter Bar */}
                    <div className="flex gap-2 overflow-x-auto pb-4 border-b border-slate-800 mb-4 no-scrollbar">
                        {libCategories.map(cat => (
                            <button key={cat} onClick={() => setImportFilter(cat)} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${importFilter === cat ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-2">
                        {filteredLibrary.map(range => (
                            <button key={range.id} onClick={() => importValue(range)} className="text-left bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 hover:border-purple-500 transition-all group">
                                <div className="font-bold text-white group-hover:text-purple-300">{range.name}</div>
                                <div className="text-xs text-slate-400 flex justify-between mt-1">
                                    <span>{range.normal_range}</span>
                                    <span className="opacity-50">{range.category}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* EXISTING CASES LIST */}
        <div className="mt-12 pt-8 border-t border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Existing Potions ({dbCases.length})</h3>
            <div className="space-y-2">
                {dbCases.map(c => (
                    <div key={c.id} className={`p-4 rounded-lg flex justify-between items-center border transition-all ${editingId === c.id ? 'bg-amber-900/20 border-amber-500' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}>
                        <div>
                            <div className={`font-bold ${editingId === c.id ? 'text-amber-400' : 'text-white'}`}>
                                {c.title?.en} / {c.title?.ka}
                            </div>
                            <div className="text-xs text-emerald-400 font-mono mt-1">{c.category} • {c.values?.length} Values</div>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => handleEdit(c)} className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit Case">
                                <Pencil size={18} />
                            </button>
                            <button type="button" onClick={() => handleDeleteCase(c.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Case">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        </>
      )}
    </div>
  );
}