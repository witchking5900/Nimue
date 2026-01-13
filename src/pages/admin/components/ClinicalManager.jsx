import { useState, useEffect } from 'react'; 
import { supabase } from '/src/supabaseClient.js';
import { Skull, Save, Activity, FileText, HelpCircle, Plus, RotateCcw, Trash2, RefreshCw, Pencil, X } from 'lucide-react';

export default function ClinicalManager() {
  const [loading, setLoading] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  
  // Data State
  const [dbCases, setDbCases] = useState([]);
  const [dynamicCategories, setDynamicCategories] = useState([]); 

  // Edit Mode State
  const [editingId, setEditingId] = useState(null); // ID of case being edited

  // Form State
  const [patientData, setPatientData] = useState({
    vitals: { bp: '120/80', hr: '80' },
    details: { en: '', ka: '' },
    complaint: { en: '', ka: '' },
    ecg: { en: 'NSR', ka: 'NSR' }
  });
  const [titles, setTitles] = useState({ en: '', ka: '' });
  const [category, setCategory] = useState('');
  const [rawSteps, setRawSteps] = useState('');

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    // A. Fetch Cases
    const { data: casesData } = await supabase
      .from('clinical_cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (casesData) {
        setDbCases(casesData);
    }

    // B. Fetch Master Categories
    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .order('slug');

    if (catData) {
        const validCats = catData.map(cat => 
            cat.title?.en?.standard || cat.title?.en || cat.slug
        ).sort();

        setDynamicCategories(validCats);
        
        if (!category && validCats.length > 0) {
            setCategory(validCats[0]);
        }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. HELPERS ---
  const jsonStepsToText = (steps) => {
      if (!steps || !Array.isArray(steps)) return "";
      
      return steps.map(step => {
          let block = `//// ${step.question.en || step.question} | ${step.question.ka || step.question}`;
          
          if (step.hint) {
              const hEn = typeof step.hint === 'string' ? step.hint : step.hint.en;
              const hKa = typeof step.hint === 'string' ? step.hint : step.hint.ka;
              block += `\n???? ${hEn} | ${hKa}`;
          }

          step.options.forEach(opt => {
              const prefix = opt.correct ? "//" : "///";
              const tEn = typeof opt.text === 'string' ? opt.text : opt.text.en;
              const tKa = typeof opt.text === 'string' ? opt.text : opt.text.ka;
              
              let line = `\n${prefix} ${tEn} | ${tKa}`;
              
              if (opt.feedback) {
                  const fEn = typeof opt.feedback === 'string' ? opt.feedback : opt.feedback.en;
                  const fKa = typeof opt.feedback === 'string' ? opt.feedback : opt.feedback.ka;
                  if (!fEn.includes("Correct!") && !fEn.includes("Incorrect")) {
                      line += ` ## ${fEn} | ${fKa}`;
                  }
              }
              block += line;
          });

          return block;
      }).join('\n\n');
  };

  // --- 3. HANDLERS ---
  const handlePatientChange = (field, lang, value) => {
    if (field === 'vitals') {
      setPatientData(prev => ({ ...prev, vitals: { ...prev.vitals, [lang]: value } })); 
    } else {
      setPatientData(prev => ({ ...prev, [field]: { ...prev[field], [lang]: value } }));
    }
  };

  const handleEdit = (c) => {
      setEditingId(c.id);
      setTitles(c.title);
      setCategory(c.category);
      setPatientData(c.patient_data || c.patient); 
      setRawSteps(jsonStepsToText(c.steps));
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setTitles({ en: '', ka: '' });
      setPatientData({
        vitals: { bp: '120/80', hr: '80' },
        details: { en: '', ka: '' },
        complaint: { en: '', ka: '' },
        ecg: { en: 'NSR', ka: 'NSR' }
      });
      setRawSteps('');
  };

  const handleDelete = async (id) => {
      if (!window.confirm("Are you sure you want to delete this case?")) return;
      
      try {
          const { error, data } = await supabase
            .from('clinical_cases')
            .delete()
            .eq('id', id)
            .select();
          
          if (error) throw error;

          if (!data || data.length === 0) {
              alert("Delete failed: Permission denied (RLS) or item not found.");
          } else {
              setDbCases(prev => prev.filter(c => c.id !== id));
              if (editingId === id) handleCancelEdit();
          }
      } catch (err) {
          alert("Error: " + err.message);
      }
  };

  // --- 4. ADVANCED PARSER ---
  const parseClinicalSyntax = (text) => {
    if (!text.trim()) return [];
    
    const blocks = text.split('////').filter(b => b.trim().length > 0);

    return blocks.map((block, index) => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      const questionLine = lines[0];
      const qParts = questionLine.split('|');
      const qEn = qParts[0]?.trim() || "";
      const qKa = qParts[1]?.trim() || qEn;
      
      let hintText = null;
      const options = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('????')) {
          const rawHint = line.replace(/^\?+\s*/, ''); 
          const hParts = rawHint.split('|');
          const hEn = hParts[0]?.trim() || "";
          const hKa = hParts[1]?.trim() || hEn;
          hintText = { en: hEn, ka: hKa };
        } 
        else if (line.startsWith('//')) {
            const isCorrect = !line.startsWith('///'); 
            let cleanLine = line.replace(/^\/+\s*/, '');

            const parts = cleanLine.split('##');
            const mainText = parts[0] ? parts[0].trim() : "";
            const feedbackText = parts[1] ? parts[1].trim() : "";

            const tParts = mainText.split('|');
            const tEn = tParts[0]?.trim() || "";
            const tKa = tParts[1]?.trim() || tEn;

            let fbEn = isCorrect ? "Correct!" : "Incorrect choice.";
            let fbKa = isCorrect ? "სწორია!" : "არასწორია.";

            if (feedbackText) {
                const fParts = feedbackText.split('|');
                fbEn = fParts[0]?.trim() || "";
                fbKa = fParts[1]?.trim() || fbEn;
            }

            options.push({ 
                id: `s${index}_opt${i}`, 
                text: { en: tEn, ka: tKa }, 
                correct: isCorrect, 
                feedback: { en: fbEn, ka: fbKa } 
            }); 
        }
      }

      return {
        id: `step_${index}`,
        question: { en: qEn, ka: qKa },
        hint: hintText,
        options: options
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Auto-create category
    if (isCreatingCategory && category) {
        const exists = dynamicCategories.some(c => c.toLowerCase() === category.toLowerCase());
        if (!exists) {
             const slug = category.toLowerCase().replace(/\s+/g, '-');
             await supabase.from('categories').insert({
                 slug: slug,
                 title: { en: { standard: category }, ka: { standard: category } }
             });
        }
    }

    const parsedSteps = parseClinicalSyntax(rawSteps);

    const payload = {
      title: titles,
      patient_data: patientData,
      steps: parsedSteps,
      xp_reward: 150,
      category: category 
    };

    let error;
    let savedData; 
    
    if (editingId) {
        // UPDATE MODE
        const { error: upError, data: upData } = await supabase
            .from('clinical_cases')
            .update(payload)
            .eq('id', editingId)
            .select()
            .single();
        error = upError;
        savedData = upData;
    } else {
        // CREATE MODE
        const { error: inError, data: inData } = await supabase
            .from('clinical_cases')
            .insert(payload)
            .select()
            .single();
        error = inError;
        savedData = inData;
    }

    if (error) {
      alert('Error: ' + error.message);
    } else {
      
      // --- NOTIFICATION LOGIC (FIXED) ---
      if (!editingId && savedData) {
        console.log("--- SENDING CLINICAL NOTIFICATIONS ---");
        try {
            // THE FIX: We check for subscribers to the specific category OR "Clinical" (the general app tag)
            const { data: subs } = await supabase
                .from('subscriptions')
                .select('user_id')
                .in('category', [category, 'Clinical']);

            if (subs && subs.length > 0) {
                // Remove duplicates (in case someone subscribed to both)
                const uniqueUserIds = [...new Set(subs.map(s => s.user_id))];

                const notifications = uniqueUserIds.map(userId => ({
                    user_id: userId,
                    type: 'update', 
                    title: `New Trial of Souls: ${category}`,
                    message: `New case available: ${savedData.title.en}`,
                    link: `/?trial=${savedData.id}` 
                }));

                const { error: insertError } = await supabase.from('notifications').insert(notifications);
                if (insertError) console.error("Notification Error:", insertError);
                else console.log(`Sent notifications to ${uniqueUserIds.length} users.`);
            } else {
                console.warn(`No subscribers found for clinical category: ${category} or 'Clinical'.`);
            }
        } catch (err) {
            console.error("Critical Notification Error:", err);
        }
      }
      // --- END NOTIFICATION LOGIC ---

      alert(editingId ? 'Case Updated!' : 'Case Created!');
      handleCancelEdit(); 
      fetchData(); 
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl animate-in fade-in max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Skull className="text-purple-500" /> {editingId ? "Edit Case" : "Trial Builder"}
        </h2>
        <button onClick={fetchData} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <RefreshCw size={20} className="text-slate-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* METADATA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Case Category</label>
                <div className="flex gap-2">
                    {isCreatingCategory ? (
                        <input 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-slate-800 border border-amber-500 rounded p-2 text-white focus:outline-none animate-in fade-in"
                            placeholder="New Category Name..."
                            autoFocus
                        />
                    ) : (
                        <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                        >
                            {dynamicCategories.length === 0 && <option value="">No Categories Found</option>}
                            {dynamicCategories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    )}
                    
                    <button 
                        type="button"
                        onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                        className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-white"
                    >
                        {isCreatingCategory ? <RotateCcw size={18} /> : <Plus size={18} />}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Title (EN)</label>
                    <input 
                        value={titles.en}
                        onChange={(e) => setTitles(prev => ({...prev, en: e.target.value}))}
                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                        placeholder="The Silent Killer"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Title (KA)</label>
                    <input 
                        value={titles.ka}
                        onChange={(e) => setTitles(prev => ({...prev, ka: e.target.value}))}
                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                        placeholder="ჩუმი მკვლელი"
                    />
                </div>
            </div>
        </div>

        {/* PATIENT PROFILE */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-4">
            <h3 className="font-bold text-slate-300 flex items-center gap-2 border-b border-slate-700 pb-2">
                <Activity size={18} /> Patient Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-xs text-slate-500">BP</label>
                        <input value={patientData.vitals.bp} onChange={(e) => handlePatientChange('vitals', 'bp', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" placeholder="120/80" />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-slate-500">HR</label>
                        <input value={patientData.vitals.hr} onChange={(e) => handlePatientChange('vitals', 'hr', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" placeholder="80" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs text-slate-500">ECG (EN)</label><input value={patientData.ecg.en} onChange={(e) => handlePatientChange('ecg', 'en', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" /></div>
                    <div><label className="text-xs text-slate-500">ECG (KA)</label><input value={patientData.ecg.ka} onChange={(e) => handlePatientChange('ecg', 'ka', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" /></div>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <textarea rows={2} placeholder="Patient Details (EN)..." className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm" value={patientData.details.en} onChange={(e) => handlePatientChange('details', 'en', e.target.value)} />
                    <textarea rows={2} placeholder="პაციენტის დეტალები (KA)..." className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm" value={patientData.details.ka} onChange={(e) => handlePatientChange('details', 'ka', e.target.value)} />
                </div>
            </div>
        </div>

        {/* LOGIC */}
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white flex items-center gap-2"><FileText className="text-purple-400" /> Case Steps Logic</h3>
            <div className="text-xs text-slate-500 bg-slate-800 px-3 py-2 rounded border border-slate-700">
              <div className="flex items-center gap-2 mb-1 text-slate-400"><HelpCircle size={14} /> <strong>How to write:</strong></div>
              <ul className="space-y-1 ml-4 list-disc text-[10px]">
                  <li><span className="text-yellow-500">////</span> New Step (Question)</li>
                  <li><span className="text-blue-400">????</span> Hint (EN | KA)</li>
                  <li><span className="text-green-400">//</span> Correct Option (EN | KA) <span className="text-purple-400">##</span> Feedback</li>
                  <li><span className="text-red-400">///</span> Wrong Option (EN | KA) <span className="text-purple-400">##</span> Feedback</li>
              </ul>
            </div>
          </div>
          <textarea 
            value={rawSteps} 
            onChange={(e) => setRawSteps(e.target.value)} 
            className="w-full h-64 bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-300 font-mono text-sm leading-relaxed focus:border-purple-500 focus:outline-none" 
            placeholder={`//// What is the Diagnosis? | რა არის დიაგნოზი?
???? Look at ST segment | შეხედეთ ST სეგმენტს
// STEMI | STEMI ## Correct! ST elevation present. | სწორია! ST ელევაცია სახეზეა.
/// NSTEMI | NSTEMI ## Wrong. ST is elevated. | არასწორია. ST აწეულია.`} 
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
                    editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-purple-600 hover:bg-purple-500'
                }`}
            >
                {loading ? "Forging Case..." : <><Save size={20} /> {editingId ? "Update Clinical Case" : "Save Clinical Case"}</>}
            </button>
        </div>
      </form>

      {/* EXISTING CASES */}
      <div className="mt-12 pt-8 border-t border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">Manage Existing Cases ({dbCases.length})</h3>
          <div className="space-y-2">
              {dbCases.map(c => (
                  <div key={c.id} className={`p-4 rounded-lg flex justify-between items-center border transition-all ${
                      editingId === c.id ? 'bg-amber-900/20 border-amber-500' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                  }`}>
                      <div>
                          <div className={`font-bold ${editingId === c.id ? 'text-amber-400' : 'text-white'}`}>
                              {c.title?.en} / {c.title?.ka}
                          </div>
                          <div className="text-xs text-purple-400 font-mono mt-1">{c.category} • {c.steps?.length || 0} Steps</div>
                      </div>
                      
                      <div className="flex gap-2">
                          <button type="button" onClick={() => handleEdit(c)} className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit Case">
                              <Pencil size={18} />
                          </button>
                          <button type="button" onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Case">
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