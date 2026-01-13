import { useState, useEffect } from 'react';
import { supabase } from '/src/supabaseClient.js';
import { Users, Zap, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';

export default function AdminStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineNow: 0,
    peakOnline: 0,
    monthlyActive: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // 1. GET TOTAL USERS (Count all profiles)
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 2. GET ONLINE NOW (Count active_sessions)
      const { count: onlineNow } = await supabase
        .from('active_sessions')
        .select('*', { count: 'exact', head: true });

      // 3. GET MONTHLY ACTIVE USERS (MAU)
      // Users who signed in within the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: monthlyActive } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('last_sign_in_at', thirtyDaysAgo.toISOString());

      // 4. GET & UPDATE PEAK RECORD
      let { data: peakData } = await supabase
        .from('analytics_stats')
        .select('value')
        .eq('metric_name', 'peak_concurrent_users')
        .single();
      
      let peakOnline = peakData ? peakData.value : 0;

      // Logic: If current online > old record, update the record!
      if (onlineNow > peakOnline) {
        await supabase
          .from('analytics_stats')
          .update({ value: onlineNow, updated_at: new Date() })
          .eq('metric_name', 'peak_concurrent_users');
        peakOnline = onlineNow; // Update local display
      }

      setStats({ totalUsers, onlineNow, peakOnline, monthlyActive });
    } catch (error) {
      console.error("Stats Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Total Students",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-500",
      desc: "Registered Accounts"
    },
    {
      title: "Online Now",
      value: stats.onlineNow,
      icon: Zap,
      color: "bg-emerald-500",
      desc: "Active Sessions"
    },
    {
      title: "Peak Concurrent",
      value: stats.peakOnline,
      icon: TrendingUp,
      color: "bg-amber-500",
      desc: "All-Time Record"
    },
    {
      title: "Active (30d)",
      value: stats.monthlyActive,
      icon: Calendar,
      color: "bg-purple-500",
      desc: "Monthly Active Users"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in slide-in-from-top-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-lg ${card.color} bg-opacity-20 text-white`}>
              <card.icon size={20} className={card.color.replace('bg-', 'text-')} />
            </div>
            {loading && <div className="h-4 w-4 rounded-full border-2 border-slate-600 border-t-transparent animate-spin"/>}
          </div>
          <div className="text-3xl font-bold text-slate-100 mb-1">
            {loading ? "-" : card.value}
          </div>
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            {card.title}
          </div>
          <div className="text-[10px] text-slate-600 mt-1">
            {card.desc}
          </div>
          {/* Decorative Glow */}
          <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 blur-xl ${card.color}`}></div>
        </div>
      ))}
    </div>
  );
}