import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Bell, CheckCheck, Zap, Skull, MessageCircle, BookOpen } from 'lucide-react'; // Added icons
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isMagical = theme === 'magical';

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
    fetchLatest();

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
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) {
        alert(`⚠️ DATABASE ERROR:\n${error.message}`);
        fetchLatest(); 
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.is_read) markAsRead(n.id);
    setIsOpen(false);
    if (n.link) navigate(n.link);
  };

  const clearAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    if (error) {
        alert(`⚠️ DATABASE ERROR:\n${error.message}`);
        fetchLatest(); 
    }
  };

  // --- CLICK OUTSIDE TO CLOSE ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HELPER: GET STYLES BASED ON TYPE ---
  const getNotificationConfig = (type) => {
      // 🟢 GOOD (Green)
      if (['xp', 'reply', 'favorite_update', 'amnesty', 'bounty'].includes(type)) {
          return {
              bg: isMagical ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-green-50 border-green-200',
              text: isMagical ? 'text-emerald-300' : 'text-green-700',
              icon: type === 'xp' ? <Zap size={14}/> : <CheckCheck size={14}/>
          };
      }
      // 🔴 BAD (Red)
      if (['ban', 'strike', 'report', 'warning'].includes(type)) {
          return {
              bg: isMagical ? 'bg-red-900/20 border-red-500/50' : 'bg-red-50 border-red-200',
              text: isMagical ? 'text-red-300' : 'text-red-700',
              icon: <Skull size={14}/>
          };
      }
      // 🔵 NEUTRAL (Default)
      return {
          bg: isMagical ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100',
          text: isMagical ? 'text-slate-300' : 'text-slate-700',
          icon: <MessageCircle size={14}/>
      };
  };

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
            <span className={`font-bold text-sm ${isMagical ? 'text-amber-100' : 'text-slate-800'}`}>Notifications</span>
            {unreadCount > 0 && (
                <button onClick={clearAll} className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100 hover:underline">
                    <CheckCheck size={12}/> Mark all read
                </button>
            )}
          </div>
          <div className="flex flex-col">
            {notifications.length === 0 ? (
              <div className={`p-8 text-center text-sm italic ${isMagical ? 'text-slate-500' : 'text-slate-400'}`}>No new whispers...</div>
            ) : (
              notifications.map(n => {
                const style = getNotificationConfig(n.type);
                return (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 border-b cursor-pointer transition-all relative text-left border-l-4 ${style.bg} ${isMagical ? 'hover:bg-white/5' : 'hover:bg-slate-50'} ${!n.is_read ? 'font-semibold' : 'opacity-80'}`}
                    >
                      {!n.is_read && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />}
                      
                      <div className={`text-[10px] font-bold uppercase mb-1 flex items-center gap-1 ${style.text}`}>
                        {style.icon} {n.type.replace('_', ' ')}
                      </div>
                      <div className={`text-sm mb-1 leading-tight ${isMagical ? 'text-slate-200' : 'text-slate-800'}`}>{n.title}</div>
                      <div className={`text-xs leading-snug ${isMagical ? 'text-slate-400' : 'text-slate-500'}`}>{n.message}</div>
                      <div className="text-[10px] opacity-30 mt-2 text-right">{new Date(n.created_at).toLocaleDateString()}</div>
                    </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}