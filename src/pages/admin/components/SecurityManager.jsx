import { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient.js';
import { 
  ShieldAlert, Trash2, Search, Smartphone, 
  CheckCircle, Mail, RefreshCw, Loader2, Gavel, AlertTriangle, Skull, Lock, Crown 
} from 'lucide-react';

export default function SecurityManager() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Device & User Manager State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUserDevices, setSelectedUserDevices] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .in('type', ['admin_request', 'security', 'security_alert'])
      .order('created_at', { ascending: false });

    if (!error) setRequests(data || []);
    setLoading(false);
  };

  const markRequestRead = async (id) => {
      await supabase.from('notifications').delete().eq('id', id);
      setRequests(prev => prev.filter(r => r.id !== id));
      setSelectedRequest(null);
  };

  // --- USER SEARCH ---
  const searchUser = async () => {
    if (!searchTerm) return;
    // Added 'tier' to the selection so we can see current rank
    const { data } = await supabase
      .from('profiles')
      .select('id, email, banned, ban_reason, strikes, banned_until, apps_blocked_until, tier')
      .ilike('email', `%${searchTerm}%`)
      .limit(5);
    
    if (data) setSearchResults(data);
  };

  // --- THE PROMOTION SYSTEM (ROLES) ---
  const handlePromotion = async (user) => {
    const choice = prompt(
        `👑 GRANT ROLE FOR: ${user.email}\n` +
        `Current Rank: ${user.tier || 'apprentice'}\n\n` +
        `Type a number:\n` +
        `1 - APPRENTICE (Reset to Default)\n` +
        `2 - MAGUS (Subscriber)\n` +
        `3 - GRAND MAGUS (Lifetime/VIP)\n` +
        `4 - INSUBSTANTIAL (Ghost/Tester)\n` +
        `5 - ARCHMAGE (Admin God Mode)`
    );

    if (!choice) return;

    let newTier = '';
    let notifTitle = "Rank Update";
    let notifMsg = "";

    switch (choice) {
        case '1':
            newTier = 'apprentice';
            notifTitle = "Rank Reset";
            notifMsg = "Your rank has been reset to Apprentice.";
            break;
        case '2':
            newTier = 'magus';
            notifTitle = "Promotion: Magus";
            notifMsg = "You have been granted Magus status. The archives are open.";
            break;
        case '3':
            newTier = 'grand_magus';
            notifTitle = "Promotion: Grand Magus";
            notifMsg = "You are now a Grand Magus. Eternal access granted.";
            break;
        case '4':
            newTier = 'insubstantial';
            notifTitle = "Status Update";
            notifMsg = "You have faded from the mortal coil. (Insubstantial Rank Granted)";
            break;
        case '5':
            newTier = 'archmage';
            notifTitle = "Ascension";
            notifMsg = "You have been granted Archmage privileges. Tread carefully.";
            break;
        default:
            return alert("Invalid choice.");
    }

    // --- NEW: SYNCHRONIZED DATABASE UPDATE ---
    let profileUpdates = { tier: newTier };

    if (newTier === 'apprentice') {
        // 1. DOWNGRADE: Revoke profile status and force 'expired'
        profileUpdates.is_subscribed = false;
        profileUpdates.subscription_end = null;
        profileUpdates.subscription_status = 'expired'; // Explicitly matching your DB
        
        await supabase.from('subscriptions')
            .update({ 
                status: 'expired', // Changed from 'canceled' to 'expired'
                current_period_end: new Date(Date.now() - 86400000).toISOString() // Expired yesterday
            })
            .eq('user_id', user.id)
            .eq('status', 'active'); // Only touch active ones
            
    } else {
        // 2. UPGRADE: Grant profile status and create a valid "dummy" subscription
        profileUpdates.is_subscribed = true;
        profileUpdates.subscription_status = 'active'; 
        
        // Give 10 years of access for admin-granted roles
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 10); 
        profileUpdates.subscription_end = futureDate.toISOString();

        // First, expire any old stuck subscriptions...
        await supabase.from('subscriptions')
            .update({ status: 'expired' }) // Changed from 'canceled'
            .eq('user_id', user.id);

        // ...Then insert a fresh "Active" one so check_and_downgrade accepts the new role
        await supabase.from('subscriptions').insert({
            user_id: user.id,
            status: 'active',
            tier: newTier,
            plan_id: 'admin_granted',
            current_period_start: new Date().toISOString(),
            current_period_end: futureDate.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    }

    // Execute Database Update for Profile
    const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

    if (error) {
        alert("Promotion Failed: " + error.message);
    } else {
        // Notify User
        await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'system', // specific type for system msgs
            title: notifTitle,
            message: notifMsg,
            link: null
        });

        alert(`User promoted to ${newTier.toUpperCase()}. Notification sent.`);
        searchUser(); // Refresh UI
    }
  };

  // --- THE JUDGEMENT SYSTEM (BANS) ---
  const handleJudgement = async (user) => {
      const choice = prompt(
          `⚖️ JUDGEMENT FOR: ${user.email}\n` +
          `Current Strikes: ${user.strikes || 0}\n\n` +
          `Type a number:\n` +
          `1 - STRIKE (Warning Only)\n` +
          `2 - BANISH 24H (Social Only)\n` +
          `3 - BANISH 24H + BLOCK APPS (Social + Clinical)\n` +
          `4 - BANISH 7 DAYS (Social Only)\n` +
          `5 - BANISH 7 DAYS + BLOCK APPS (Social + Clinical)\n` +
          `6 - PERMANENT EXILE (Login Block)\n` +
          `7 - FORGIVE (Reset All)`
      );

      if (!choice) return;

      let updates = {};
      let notifMsg = "";
      let notifTitle = "Administrative Action";
      const newStrikes = (user.strikes || 0) + 1;
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      switch (choice) {
          case '1': // Warning
              updates = { strikes: newStrikes };
              notifTitle = "Official Warning";
              notifMsg = `You have received a strike for misconduct. Total Strikes: ${newStrikes}.`;
              break;
          case '2': // 24h Social
              updates = { 
                  strikes: newStrikes,
                  banned_until: new Date(now + oneDay).toISOString()
              };
              notifTitle = "24h Social Suspension";
              notifMsg = `You are banned from the Community for 24 hours.`;
              break;
          case '3': // 24h Social + Apps
              updates = { 
                  strikes: newStrikes,
                  banned_until: new Date(now + oneDay).toISOString(),
                  apps_blocked_until: new Date(now + oneDay).toISOString()
              };
              notifTitle = "24h Academic Suspension";
              notifMsg = `Access to Community AND Clinical Apps is revoked for 24 hours.`;
              break;
          case '4': // 7d Social
              updates = { 
                  strikes: newStrikes,
                  banned_until: new Date(now + sevenDays).toISOString()
              };
              notifTitle = "7-Day Social Suspension";
              notifMsg = `You are banned from the Community for 7 days.`;
              break;
          case '5': // 7d Social + Apps
              updates = { 
                  strikes: newStrikes,
                  banned_until: new Date(now + sevenDays).toISOString(),
                  apps_blocked_until: new Date(now + sevenDays).toISOString()
              };
              notifTitle = "7-Day Academic Suspension";
              notifMsg = `Severe Violation. Community and Apps are blocked for 7 days.`;
              break;
          case '6': // Perm
              updates = { 
                  strikes: newStrikes,
                  banned: true,
                  ban_reason: "Permanent Exile by Security Console"
              };
              notifTitle = "Permanent Exile";
              notifMsg = `Your account has been terminated.`;
              break;
          case '7': // Forgive
              updates = { 
                  strikes: 0,
                  banned: false,
                  banned_until: null,
                  apps_blocked_until: null,
                  ban_reason: null
              };
              notifTitle = "Divine Mercy";
              notifMsg = `Your record has been expunged. Strikes reset to 0.`;
              break;
          default:
              return alert("Invalid choice.");
      }

      // Execute Database Update
      const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

      if (error) {
          alert("Judgement Failed: " + error.message);
      } else {
          // Send Notification
          await supabase.from('notifications').insert({
              user_id: user.id,
              type: 'report',
              title: notifTitle,
              message: notifMsg,
              link: null
          });

          alert("Sentence executed. User notified.");
          searchUser(); // Refresh UI
      }
  };

  const loadUserDevices = async (userId) => {
    const { data } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('user_id', userId)
      .order('added_at');
    
    if (data) setSelectedUserDevices(data);
  };

  const revokeDevice = async (deviceId) => {
    if (!confirm("Are you sure you want to banish this device?")) return;

    const { error } = await supabase
      .from('trusted_devices')
      .delete()
      .eq('id', deviceId);

    if (error) {
      alert("Failed: " + error.message);
    } else {
      setSelectedUserDevices(prev => prev.filter(d => d.id !== deviceId));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="text-red-500" /> Security Console
          </h2>
          <p className="text-slate-400 text-sm">Manage trusted devices, breaches, and bans.</p>
        </div>
        <button onClick={fetchRequests} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition text-slate-300">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: INBOX */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[600px]">
          <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2"><Mail size={18}/> Inbox ({requests.length})</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {requests.length === 0 ? (
              <div className="text-center py-10 text-slate-600 text-sm">No active alerts.</div>
            ) : (
              requests.map(req => (
                <div 
                  key={req.id} 
                  onClick={() => setSelectedRequest(req)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedRequest?.id === req.id ? 'bg-slate-800 border-amber-500/50' : 'bg-slate-950/50 border-slate-800 hover:border-slate-600'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${req.type === 'security' ? 'bg-red-900/30 text-red-400' : 'bg-amber-900/30 text-amber-400'}`}>
                      {req.type === 'security' ? 'BREACH' : 'REQUEST'}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-slate-200 text-sm truncate">{req.title}</h4>
                  {req.sender_email && <div className="text-[10px] text-amber-500/70 font-mono mt-0.5">{req.sender_email}</div>}
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{req.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: DETAILS & ACTIONS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* REQUEST VIEWER */}
          {selectedRequest && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                      <h3 className={`text-lg font-bold ${selectedRequest.type === 'security' ? 'text-red-400' : 'text-slate-100'}`}>
                          {selectedRequest.type === 'security' && <ShieldAlert className="inline mr-2 mb-1" size={20}/>}
                          {selectedRequest.title}
                      </h3>
                      <button onClick={() => markRequestRead(selectedRequest.id)} className="text-xs flex items-center gap-1 bg-emerald-900/30 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full hover:bg-emerald-900/50 transition">
                          <CheckCircle size={12}/> Resolve
                      </button>
                  </div>
                  
                  {selectedRequest.sender_email && (
                      <div className="mb-2">
                          <span className="text-xs text-slate-500 uppercase font-bold mr-2">Sender:</span>
                          <span className="text-sm text-amber-400 font-mono">{selectedRequest.sender_email}</span>
                      </div>
                  )}

                  <div className="bg-slate-950 p-4 rounded-lg text-sm text-slate-300 font-mono mb-4 border border-slate-800">
                      {selectedRequest.message}
                  </div>

                  {selectedRequest.sender_email && (
                      <button 
                          onClick={() => { setSearchTerm(selectedRequest.sender_email); searchUser(); }}
                          className="mt-2 text-xs bg-slate-800 text-blue-400 px-3 py-2 rounded hover:bg-slate-700 transition"
                      >
                          🔍 Manage User {selectedRequest.sender_email}
                      </button>
                  )}
              </div>
          )}

          {/* USER & DEVICE MANAGER */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2"><Smartphone size={18}/> User & Device Manager</h3>
              
              <div className="flex gap-2 mb-4">
                  <input 
                      type="text" 
                      placeholder="Search email..." 
                      className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 p-2 rounded-lg focus:outline-none focus:border-amber-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                  />
                  <button onClick={searchUser} className="bg-slate-800 text-slate-200 px-4 py-2 rounded-lg hover:bg-slate-700 border border-slate-700">
                      <Search size={18} />
                  </button>
              </div>

              {/* SEARCH RESULTS */}
              {searchResults.length > 0 && !selectedUserDevices && (
                  <div className="mb-4 space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase">Users Found:</p>
                      {searchResults.map(u => {
                          const isAppsBlocked = u.apps_blocked_until && new Date(u.apps_blocked_until) > new Date();
                          const isTempBanned = u.banned_until && new Date(u.banned_until) > new Date() && !u.banned;

                          return (
                              <div key={u.id} className={`w-full p-3 rounded-lg border flex items-center justify-between transition-all ${u.banned ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-950 border-slate-800'}`}>
                                  <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                          <span className={u.banned ? "text-red-500 line-through" : "text-slate-300"}>{u.email}</span>
                                          {u.banned && <span className="text-[10px] bg-red-900/50 text-red-200 px-1.5 py-0.5 rounded font-bold uppercase">BANNED</span>}
                                          {isTempBanned && <span className="text-[10px] bg-orange-900/50 text-orange-200 px-1.5 py-0.5 rounded font-bold uppercase">TEMP BAN</span>}
                                          {isAppsBlocked && <span className="text-[10px] bg-purple-900/50 text-purple-200 px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1"><Lock size={8}/> APPS LOCKED</span>}
                                          {/* Show Current Rank */}
                                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase border border-slate-700">
                                              {u.tier || 'APPRENTICE'}
                                          </span>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1">
                                          <div className="text-[10px] text-slate-600 font-mono">{u.id}</div>
                                          <div className="text-[10px] flex items-center gap-1 text-amber-600 bg-amber-900/10 px-1 rounded">
                                              <AlertTriangle size={10} /> {u.strikes || 0} Strikes
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      {/* CROWN BUTTON (PROMOTION) */}
                                      <button 
                                          onClick={() => handlePromotion(u)}
                                          className="p-2 rounded-lg border bg-slate-800 text-amber-500 border-slate-700 hover:bg-slate-700 hover:text-amber-400 transition-colors"
                                          title="Grant Role"
                                      >
                                          <Crown size={16} />
                                      </button>

                                      {/* GAVEL BUTTON (BAN) */}
                                      <button 
                                          onClick={() => handleJudgement(u)}
                                          className={`p-2 rounded-lg border transition-colors ${u.banned ? 'bg-red-900/20 text-red-500 border-red-900/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                                          title="Judgement"
                                      >
                                          <Gavel size={16} />
                                      </button>
                                      
                                      <button 
                                          onClick={() => loadUserDevices(u.id)}
                                          className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-400 hover:text-white border border-slate-700"
                                      >
                                          Devices
                                      </button>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}

              {/* DEVICE LIST */}
              {selectedUserDevices && (
                  <div className="animate-in slide-in-from-bottom-2">
                      <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-sm text-slate-400">Trusted Devices ({selectedUserDevices.length}/2)</h4>
                          <button onClick={() => setSelectedUserDevices(null)} className="text-xs text-amber-500 hover:text-amber-400">Clear</button>
                      </div>
                      
                      <div className="space-y-2">
                          {selectedUserDevices.length === 0 ? (
                              <div className="p-4 text-center text-sm text-slate-600 border border-dashed border-slate-800 rounded-lg">No devices found.</div>
                          ) : (
                              selectedUserDevices.map((dev, i) => (
                                  <div key={dev.id} className="p-4 border border-slate-800 rounded-lg flex justify-between items-center bg-slate-950">
                                      <div>
                                          <div className="font-bold text-sm text-slate-200 flex items-center gap-2">
                                              Device {i+1}
                                              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{dev.device_name || "Unknown"}</span>
                                          </div>
                                          <div className="text-[10px] font-mono text-slate-600 mt-1">{dev.device_id}</div>
                                          <div className="text-[10px] text-slate-600">Added: {new Date(dev.added_at).toLocaleDateString()}</div>
                                      </div>
                                      <button 
                                          onClick={() => revokeDevice(dev.id)}
                                          className="p-2 bg-red-900/20 text-red-500 rounded-lg hover:bg-red-900/40 border border-red-900/30 transition-colors"
                                          title="Revoke Access"
                                      >
                                          <Trash2 size={18} />
                                      </button>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              )}
          </div>

        </div>
      </div>
    </div>
  );
}