import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Bell, CheckCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { theme, language } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isMagical = theme === 'magical';

  // --- TEXT CONFIG ---
  const t = {
    en: {
        title: isMagical ? "Whispers" : "Notifications",
        markAll: "Mark all read",
        empty: isMagical ? "The void is silent..." : "No new notifications",
        // Formatting for types
        bounty: "BOUNTY",
        report: "REPORT",
        system: "SYSTEM"
    },
    ka: {
        title: isMagical ? "ჩურჩული" : "შეტყობინებები",
        markAll: "წაკითხულად მონიშვნა",
        empty: isMagical ? "სიჩუმეა..." : "შეტყობინებები არ არის",
        bounty: "ჯილდო",
        report: "რეპორტი",
        system: "სისტემა"
    }
  };
  const text = t[language] || t.en;

  // --- 1. FETCH FUNCTION ---
  const fetchLatest = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
  };

  useEffect(() => {
    let channel;
    
    // A. Initial Load
    fetchLatest();

    // B. Realtime Listener
    channel = supabase
      .channel('notification_bell')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          supabase.auth.getUser().then(({ data: { user } }) => {
              if (user && payload.new.user_id === user.id) {
                  fetchLatest();
              }
          });
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // --- ACTIONS ---
  
  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();

    // 1. Optimistic Update (Update UI first)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // 2. Database Update
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    
    if (error) console.error("Notification Error:", error);
  };

  const handleNotificationClick = (n) => {
    if (!n.is_read) markAsRead(n.id);
    setIsOpen(false);
    if (n.link) navigate(n.link);
  };

  const clearAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Optimistic Update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    // 2. Database Update
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);

    if (error) console.error("Clear All Error:", error);
  };

  // --- CLICK OUTSIDE TO CLOSE ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full transition-all relative ${isMagical ? 'text-amber-200 hover:bg-amber-900/30' : 'text-slate-600 hover:bg-slate-100'}`}
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl shadow-2xl border-2 z-50 animate-in slide-in-from-top-2 ${isMagical ? 'bg-slate-900 border-amber-600 shadow-amber-900/50' : 'bg-white border-slate-200'}`}>
          <div className={`p-3 border-b flex justify-between items-center ${isMagical ? 'border-amber-500/30' : 'border-slate-100'}`}>
            <span className={`font-bold text-sm ${isMagical ? 'text-amber-100' : 'text-slate-800'}`}>{text.title}</span>
            {unreadCount > 0 && (
                <button onClick={clearAll} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100 hover:underline">
                    <CheckCheck size={12}/> {text.markAll}
                </button>
            )}
          </div>
          <div className="flex flex-col">
            {notifications.length === 0 ? (
              <div className={`p-8 text-center text-sm italic ${isMagical ? 'text-slate-500' : 'text-slate-400'}`}>{text.empty}</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 border-b cursor-pointer transition-colors relative text-left ${isMagical ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'} ${!n.is_read ? (isMagical ? 'bg-amber-900/20' : 'bg-blue-50') : ''}`}
                >
                  {!n.is_read && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500" />}
                  <div className={`text-[10px] font-bold uppercase mb-1 ${n.type === 'bounty' ? 'text-green-500' : n.type === 'report' ? 'text-red-500' : isMagical ? 'text-amber-500' : 'text-blue-500'}`}>
                      {text[n.type] || n.type}
                  </div>
                  <div className={`text-sm font-bold mb-1 leading-tight ${isMagical ? 'text-slate-200' : 'text-slate-800'}`}>{n.title}</div>
                  <div className={`text-xs leading-snug ${isMagical ? 'text-slate-400' : 'text-slate-500'}`}>{n.message}</div>
                  <div className="text-[10px] opacity-30 mt-2 text-right">{new Date(n.created_at).toLocaleDateString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}