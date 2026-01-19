import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabaseClient'; 

export const GameContext = createContext(null);

export function GameProvider({ children }) {
  const { user } = useAuth();
    
  const [tier, setTier] = useState('apprentice'); 
  const [hearts, setHearts] = useState(3);
  const [xp, setXp] = useState(0);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [tempUnlocks, setTempUnlocks] = useState({});
  const [regenTarget, setRegenTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  
  // ▼▼▼ THE FIX: LAZY INITIALIZATION ▼▼▼
  // We check storage IMMEDIATELY. This guarantees 'expired' is set before the first render.
  const [subscriptionStatus, setSubscriptionStatus] = useState(() => {
      if (typeof window !== 'undefined' && sessionStorage.getItem('nimue_force_expiration') === 'true') {
          console.log("🔔 Forced Expiration Banner Triggered (Instant)");
          sessionStorage.removeItem('nimue_force_expiration'); // Clean up immediately
          return 'expired';
      }
      return null;
  });

  // Ref to hold the downgrade timer so we can clear it if needed
  const downgradeTimerRef = useRef(null);

  // --- TIER HELPERS ---
  const isInfinite = ['archmage', 'insubstantial'].includes(tier); 
  const isArchmage = tier === 'archmage'; 
  
  const hasPermanentAccess = ['archmage', 'insubstantial', 'grand_magus', 'magus'].includes(tier);

  const getMaxHearts = (currentTier) => {
      if (['archmage', 'insubstantial'].includes(currentTier)) return 999;
      if (currentTier === 'grand_magus') return 5;
      return 3; 
  };

  const getRegenDuration = (currentTier) => {
      if (currentTier === 'grand_magus') return 900000; // 15m
      if (currentTier === 'magus') return 1800000;      // 30m
      return 3600000;                                   // 60m
  };

  // --- HELPER: PERFORM DB DOWNGRADE ---
  const performDowngrade = async (subId) => {
      await supabase.from('profiles').update({ tier: 'apprentice' }).eq('id', user.id);
      if (subId) {
          await supabase.from('subscriptions').update({ status: 'expired' }).eq('id', subId);
      }
  };

  // --- 1. INITIAL LOAD & LIVE ENFORCER ---
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
          setLoading(false);
          return;
      }
        
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) console.error("❌ Profile Load Error:", error.message);
      if (profileData) setProfile(profileData);

      const meta = user.user_metadata || {};
      
      // Determine Initial Tier
      let finalTier = profileData?.tier || meta.tier || 'apprentice';

      // ▼▼▼ THE ENFORCER (LIVE EDITION) ▼▼▼
      if (finalTier === 'magus' || finalTier === 'grand_magus') {
          const { data: sub } = await supabase
              .from('subscriptions')
              .select('id, current_period_end, status')
              .eq('user_id', user.id)
              .in('status', ['active', 'cancelled']) 
              .order('current_period_end', { ascending: false })
              .limit(1)
              .maybeSingle();

          if (sub && sub.current_period_end) {
              const now = new Date().getTime();
              const expiryDate = new Date(sub.current_period_end).getTime();
              const timeRemaining = expiryDate - now;

              // CASE 1: TIME ALREADY UP
              if (timeRemaining <= 0) {
                  console.log("⏳ Subscription Already Expired. Downgrading...");
                  await performDowngrade(sub.id);
                  finalTier = 'apprentice';
                  setSubscriptionStatus('expired'); // Banner shows immediately
              } 
              // CASE 2: TIME REMAINING -> SET TIME BOMB
              else {
                  console.log(`⏳ Subscription valid. Auto-downgrade set in ${Math.floor(timeRemaining/1000)} seconds.`);
                  
                  // Only set 'active' if we are NOT already showing the expired banner from the reload
                  setSubscriptionStatus(prev => prev === 'expired' ? 'expired' : 'active');

                  if (downgradeTimerRef.current) clearTimeout(downgradeTimerRef.current);

                  downgradeTimerRef.current = setTimeout(async () => {
                      console.log("⏰ TIME IS UP! Performing live downgrade...");
                      await performDowngrade(sub.id);
                      setTier('apprentice'); 
                      setSubscriptionStatus('expired'); 
                  }, timeRemaining);
              }
          }
      }
      // ▲▲▲ END ENFORCER ▲▲▲
      
      let finalXp = finalTier === 'archmage' ? 999999 : (profileData?.xp ?? (Number(meta.xp) || 0));
      let currentHearts = profileData?.hearts ?? (meta.hearts !== undefined ? Number(meta.hearts) : getMaxHearts(finalTier));
      let targetTime = profileData?.regen_target || meta.regen_target || null;
      const maxHearts = getMaxHearts(finalTier);

      // Offline Regen Logic
      const duration = getRegenDuration(finalTier);
      if (currentHearts < maxHearts) {
          if (targetTime) {
              const now = Date.now();
              const target = new Date(targetTime).getTime();
              if (now >= target) {
                  const timePassed = now - target;
                  const heartsGained = 1 + Math.floor(timePassed / duration);
                  currentHearts = Math.min(maxHearts, currentHearts + heartsGained);
                  if (currentHearts < maxHearts) {
                      const nextTarget = target + (heartsGained * duration);
                      targetTime = new Date(nextTarget).toISOString();
                  } else {
                      targetTime = null; 
                  }
                  await supabase.from('profiles').update({ hearts: currentHearts, regen_target: targetTime }).eq('id', user.id);
              }
          } else {
              const newTarget = new Date(Date.now() + duration).toISOString();
              targetTime = newTarget;
              await supabase.from('profiles').update({ regen_target: newTarget }).eq('id', user.id);
          }
      } else if (currentHearts >= maxHearts) {
          targetTime = null;
      }

      setTier(finalTier);
      setXp(finalXp);
      setHearts(currentHearts);
      setRegenTarget(targetTime);

      const now = Date.now();
      const validUnlocks = {};
      let sourceUnlocks = profileData?.unlocks || meta.unlocks || {};
      
      if (typeof sourceUnlocks === 'string') {
          try { sourceUnlocks = JSON.parse(sourceUnlocks); } catch (e) { sourceUnlocks = {}; }
      }

      Object.entries(sourceUnlocks).forEach(([key, expiry]) => {
          if (new Date(expiry).getTime() > now) validUnlocks[key] = expiry;
      });
      setTempUnlocks(validUnlocks);

      setLoading(false);
    };

    fetchProfileData();

    return () => {
        if (downgradeTimerRef.current) clearTimeout(downgradeTimerRef.current);
    };
  }, [user]);

  // --- 2. REALTIME ---
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`game_profile_${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
          if (payload.new.tier !== undefined) {
              setTier(payload.new.tier);
              if (payload.new.tier === 'archmage') setXp(999999);
          }
          if (payload.new.xp !== undefined && payload.new.tier !== 'archmage') setXp(payload.new.xp);
          if (payload.new.hearts !== undefined) setHearts(payload.new.hearts);
          if (payload.new.regen_target !== undefined) setRegenTarget(payload.new.regen_target);
          if (payload.new.unlocks !== undefined) setTempUnlocks(payload.new.unlocks || {});
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // --- 3. SAVE HELPER ---
  const saveToCloud = async (updates) => {
    if (!user) return;
    try {
        const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
        if (error) {
            console.error("❌ CRITICAL SAVE ERROR:", error.message);
        }
    } catch (err) {
        console.error("Save Execution Failed:", err);
    }
  };

  // --- 4. ACTIONS ---
  const gainXp = (amount) => {
    if (isArchmage) return;
    const newXp = xp + amount;
    setXp(newXp); 
    saveToCloud({ xp: newXp });
  };

  const spendXp = (amount) => {
    if (isArchmage) return;
    const newXp = Math.max(0, xp - amount);
    setXp(newXp);
    saveToCloud({ xp: newXp });
  };

  const completeActivity = async (activityId, amount) => {
    const safeId = String(activityId);
    if (completedIds.has(safeId)) return false; 
    const newSet = new Set(completedIds);
    newSet.add(safeId);
    setCompletedIds(newSet);
    localStorage.setItem(`nimue_completed_${user?.id}`, JSON.stringify([...newSet]));
    gainXp(amount);
    if (user) await supabase.from('activity_log').insert({ user_id: user.id, activity_id: safeId, xp_gained: amount });
    return true; 
  };

  const takeDamage = (amount = 1) => { 
      if (isInfinite) return; 
      const max = getMaxHearts(tier);
      const newVal = Math.max(0, hearts - amount);
      let newTarget = regenTarget;
      if (hearts >= max && newVal < max) {
          const duration = getRegenDuration(tier);
          newTarget = new Date(Date.now() + duration).toISOString();
          setRegenTarget(newTarget);
      }
      setHearts(newVal);
      saveToCloud({ hearts: newVal, regen_target: newTarget });
  };

  const buyHeartWithXp = () => {
      if (isArchmage) return { success: true, message: "Divine Vitality!" };
      const COST = 50;
      const max = getMaxHearts(tier);
      if (hearts >= max) return { success: false, message: "Health full!" };
      if (xp < COST) return { success: false, message: "Not enough XP!" };

      const newXp = xp - COST;
      const newHearts = hearts + 1;
      let newTarget = newHearts >= max ? null : regenTarget;

      setXp(newXp);
      setHearts(newHearts);
      setRegenTarget(newTarget);
      saveToCloud({ xp: newXp, hearts: newHearts, regen_target: newTarget });
      return { success: true, message: "Vitality Restored!" };
  };

  const buyFullRestore = () => {
      const max = getMaxHearts(tier);
      setHearts(max);
      setRegenTarget(null);
      saveToCloud({ hearts: max, regen_target: null });
      return { success: true, message: "Divine Restoration Complete!" };
  };

  useEffect(() => {
      if(user) {
          const saved = JSON.parse(localStorage.getItem(`nimue_completed_${user.id}`) || '[]');
          setCompletedIds(new Set(saved));
      }
  }, [user]);

  const value = {
    profile, 
    hearts, 
    maxHearts: getMaxHearts(tier), 
    isInfiniteHearts: isInfinite, 
    regenTarget, 
    regenSpeed: getRegenDuration(tier), 
    xp, 
    tier, 
    completedIds,
    subscriptionStatus, // <--- EXPOSED HERE
    takeDamage, gainXp, spendXp, completeActivity,
    
    // --- ACCESS LOGIC ---
    hasAccess: (appId) => {
        if (hasPermanentAccess) return true;
        const expiry = tempUnlocks[appId];
        if (!expiry) return false;
        return new Date(expiry).getTime() > Date.now();
    },
    
    unlocks: tempUnlocks, 
    buyHeartWithXp, buyFullRestore,
    level: Math.floor(xp / 100) + 1, 
    username: user?.email ? user.email.split('@')[0] : "Student",
    
    // --- RENT LOGIC ---
    rentApp: (appId, cost) => {
        if (hasPermanentAccess) return true;
        if (xp >= cost) {
            const newXp = xp - cost;
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 24);
            const expiryIso = expiryDate.toISOString();
            const newUnlocks = { ...tempUnlocks, [appId]: expiryIso };
            
            setXp(newXp);
            setTempUnlocks(newUnlocks);

            saveToCloud({ 
                xp: newXp, 
                unlocks: newUnlocks 
            });
            return true;
        }
        return false;
    }
  };

  return <GameContext.Provider value={value}>{!loading && children}</GameContext.Provider>;
}

export const useGameLogic = () => useContext(GameContext);