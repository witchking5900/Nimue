import { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient.js';
import { Scroll, Save, Plus, Trash2, RefreshCw, Pencil, X, CheckCircle, XCircle } from 'lucide-react';

export default function ScrollsManager() {
  const [loading, setLoading] = useState(false);
  const [dbRanges, setDbRanges] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState({ en: '', ka: '' });
  const [correct, setCorrect] = useState('');
  const [wrongs, setWrongs] = useState(['', '', '']); // 3 Distractors

  // --- FETCH ---
  const fetchData = async () => {
    const { data } = await supabase
      .from('scrolls_ranges')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setDbRanges(data);
  };

  useEffect(() => { fetchData(); }, []);

  // --- HANDLERS ---
  const handleEdit = (item) => {
      setEditingId(item.id);
      setName(item.name);
      setCorrect(item.correct);
      // Filter out the correct answer from options to find the wrongs
      const wrongOpts = item.options.filter(o => o !== item.correct);
      // Ensure exactly 3 items
      const filledWrongs = [wrongOpts[0] || '', wrongOpts[1] || '', wrongOpts[2] || ''];
      setWrongs(filledWrongs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
      setEditingId(null);
      setName({ en: '', ka: '' });
      setCorrect('');
      setWrongs(['', '', '']);
  };

  const handleDelete = async (id) => {
      if(!confirm("Delete this range?")) return;
      await supabase.from('scrolls_ranges').delete().eq('id', id);
      if (editingId === id) handleCancel();
      fetchData();
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);

      // Validate
      if (!name.en || !correct || wrongs.some(w => !w)) {
          alert("Please fill all fields (Name, Correct Answer, and 3 Wrong Answers)");
          setLoading(false);
          return;
      }

      // Combine Correct + Wrongs into one array
      const allOptions = [correct, ...wrongs];

      const payload = {
          name,
          correct,
          options: allOptions
      };

      let error;
      let savedData; // Capture saved row for notification

      if (editingId) {
          // UPDATE
          const { error: err, data: upData } = await supabase
            .from('scrolls_ranges')
            .update(payload)
            .eq('id', editingId)
            .select()
            .single();
          error = err;
          savedData = upData;
      } else {
          // INSERT
          const { error: err, data: inData } = await supabase
            .from('scrolls_ranges')
            .insert(payload)
            .select() // Return ID for link
            .single();
          error = err;
          savedData = inData;
      }

      if (error) {
          alert(error.message);
      } else {
          
          // --- NOTIFICATION LOGIC ---
          if (!editingId && savedData) {
            console.log("--- SENDING SCROLLS NOTIFICATIONS ---");
            try {
                // 1. Find Subscribers for 'Hematology' (Default for Scrolls Game)
                const targetCategory = "Hematology"; 
                
                const { data: subs } = await supabase
                    .from('subscriptions')
                    .select('user_id')
                    .eq('category', targetCategory);

                if (subs && subs.length > 0) {
                    const notifications = subs.map(sub => ({
                        user_id: sub.user_id,
                        type: 'update',
                        title: `New Scroll Uncovered: ${targetCategory}`,
                        message: `New range added: ${savedData.name.en}`,
                        link: `/?scroll=${savedData.id}` 
                    }));

                    await supabase.from('notifications').insert(notifications);
                    console.log(`Sent notifications to ${subs.length} users.`);
                }
            } catch (notifErr) {
                console.error("Notification Error:", notifErr);
            }
          }

          alert(editingId ? "Range Updated!" : "Range Created!");
          handleCancel();
          fetchData();
      }
      setLoading(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl animate-in fade-in max-w-4xl mx-auto">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scroll className="text-amber-400" /> Scrolls Manager
        </h2>
        <button onClick={fetchData} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <RefreshCw size={20} className="text-slate-400" />
        </button>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-6 mb-12 border-b border-slate-700 pb-8">
          
          {/* 1. NAMES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="text-xs text-slate-500 font-bold uppercase">Name (EN)</label>
                  <input 
                      value={name.en} 
                      onChange={e => setName({...name, en: e.target.value})} 
                      className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white" 
                      placeholder="Hemoglobin (Male)" 
                  />
              </div>
              <div>
                  <label className="text-xs text-slate-500 font-bold uppercase">Name (KA)</label>
                  <input 
                      value={name.ka} 
                      onChange={e => setName({...name, ka: e.target.value})} 
                      className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white" 
                      placeholder="ჰემოგლობინი (კაცი)" 
                  />
              </div>
          </div>

          {/* 2. ANSWERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              
              {/* Correct Answer */}
              <div>
                  <label className="text-xs text-green-500 font-bold uppercase flex items-center gap-1 mb-2">
                      <CheckCircle size={14} /> Correct Range
                  </label>
                  <input 
                      value={correct} 
                      onChange={e => setCorrect(e.target.value)} 
                      className="w-full bg-slate-800 border-2 border-green-500/30 rounded p-3 text-white focus:border-green-500 outline-none" 
                      placeholder="e.g. 13.5 - 17.5 g/dL" 
                  />
              </div>

              {/* Wrong Answers */}
              <div className="space-y-3">
                  <label className="text-xs text-red-500 font-bold uppercase flex items-center gap-1">
                      <XCircle size={14} /> Distractors (Wrong Answers)
                  </label>
                  {wrongs.map((wrong, idx) => (
                      <input 
                          key={idx}
                          value={wrong} 
                          onChange={e => {
                              const newWrongs = [...wrongs];
                              newWrongs[idx] = e.target.value;
                              setWrongs(newWrongs);
                          }} 
                          className="w-full bg-slate-800 border border-red-500/30 rounded p-2 text-white focus:border-red-500 outline-none text-sm" 
                          placeholder={`Wrong Option ${idx + 1}`} 
                      />
                  ))}
              </div>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3">
            {editingId && (
                <button type="button" onClick={handleCancel} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">
                    Cancel
                </button>
            )}
            <button disabled={loading} className={`flex-[2] text-white font-bold py-3 rounded-xl shadow-lg transition-all ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-green-600 hover:bg-green-500'}`}>
                {loading ? "Processing..." : editingId ? "Update Scroll" : "Create Scroll"}
            </button>
          </div>
      </form>

      {/* LIST */}
      <div className="grid grid-cols-1 gap-3">
          {dbRanges.length === 0 && <p className="text-slate-500 text-center italic">No scrolls found.</p>}
          
          {dbRanges.map(item => (
              <div key={item.id} className={`p-4 rounded-lg flex justify-between items-center border ${editingId === item.id ? 'bg-amber-900/20 border-amber-500' : 'bg-slate-900/50 border-slate-700'}`}>
                  <div>
                      <div className="font-bold text-white">{item.name?.en} / {item.name?.ka}</div>
                      <div className="text-xs text-green-400 font-mono mt-1 flex items-center gap-2">
                          <CheckCircle size={12}/> {item.correct}
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg"><Pencil size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={18} /></button>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
}