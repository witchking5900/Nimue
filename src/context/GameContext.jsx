import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabaseClient'; 
import { useTheme } from './ThemeContext'; 

export const GameContext = createContext(null);

// --- 🌍 TRANSLATIONS & TEXT MODES ---
const GAME_TRANSLATIONS = {
  en: {
    standard: {
      vitalityRestored: "Health Restored",
      healthFull: "Health is already full",
      notEnoughXp: "Insufficient Points",
      adminOverride: "Admin Override Active",
      restorationComplete: "System Recovery Complete"
    },
    magical: {
      vitalityRestored: "Vitality Restored!",
      healthFull: "Vessel is full!",
      notEnoughXp: "Not enough Essence!",
      adminOverride: "Divine Vitality!",
      restorationComplete: "Divine Restoration Complete!"
    }
  },
  ka: {
    standard: {
      vitalityRestored: "ჯანმრთელობა აღდგენილია",
      healthFull: "ჯანმრთელობა სავსეა",
      notEnoughXp: "არასაკმარისი ქულები",
      adminOverride: "ადმინისტრატორის უფლება",
      restorationComplete: "სისტემა აღდგენილია"
    },
    magical: {
      vitalityRestored: "სასიცოცხლო ძალა აღდგენილია!",
      healthFull: "ჭურჭელი სავსეა!",
      notEnoughXp: "არასაკმარისი ესენცია!",
      adminOverride: "ღვთიური ძალა!",
      restorationComplete: "ღვთიური აღდგენა დასრულებულია!"
    }
  }
};

export function GameProvider({ children }) {
  const { user } = useAuth();
  const { theme, language } = useTheme(); 

  // Helper to get text based on current mode
  const getText = (key) => {
    const langObj = GAME_TRANSLATIONS[language] || GAME_TRANSLATIONS['en'];
    const modeObj = theme === 'magical' ? langObj.magical : langObj.standard;
    return modeObj[key] || key;
  };
    
  const [tier, setTier] = useState('apprentice'); 
  const [hearts, setHearts] = useState(3);
  const [xp, setXp] = useState(0);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [tempUnlocks, setTempUnlocks] = useState({}); // Kept for legacy data compatibility
  const [regenTarget, setRegenTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // --- 🛡️ TIER LOGIC (Dynamic) ---
  const protectedTiers = ['archmage', 'insubstantial']; // Ranks that XP cannot change
  
  // 1. Calculate Rank based on XP
  const calcTierFromXp = (currentXp, currentTier) => {
      // If user is an Admin/God, ignore XP rules
      if (protectedTiers.includes(currentTier)) return currentTier;

      if (currentXp >= 2000) return 'grand_magus';
      if (currentXp >= 500) return 'magus';
      return 'apprentice';
  };

  const isInfinite = protectedTiers.includes(tier); 
  const isArchmage = tier === 'archmage';
  
  const getMaxHearts = (currentTier) => {
      if (protectedTiers.includes(currentTier)) return 999;
      if (currentTier === 'grand_magus') return 5;
      return 3; 
  };

  const getRegenDuration = (currentTier) => {
      if (currentTier === 'grand_magus') return 900000; // 15m
      if (currentTier === 'magus') return 1800000;      // 30m
      return 3600000;                                   // 60m
  };

  // --- 1. INITIAL LOAD ---
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
      let loadedTier = profileData?.tier || meta.tier || 'apprentice';
      
      // Load XP
      let finalXp = loadedTier === 'archmage' ? 999999 : (profileData?.xp ?? (Number(meta.xp) || 0));

      // ⚡ RECALCULATE TIER ON LOAD (In case XP changed elsewhere)
      const correctTier = calcTierFromXp(finalXp, loadedTier);

      // Hearts Logic
      let currentHearts = profileData?.hearts ?? (meta.hearts !== undefined ? Number(meta.hearts) : getMaxHearts(correctTier));
      let targetTime = profileData?.regen_target || meta.regen_target || null;
      const maxHearts = getMaxHearts(correctTier);

      // Offline Regen Calculation
      const duration = getRegenDuration(correctTier);
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
                  // We update the DB with new heart calculation
                  await supabase.from('profiles').update({ hearts: currentHearts, regen_target: targetTime }).eq('id', user.id);
              }
          } else {
              const newTarget = new Date(Date.now() + duration).toISOString();
              targetTime = newTarget;
              await supabase.from('profiles').update({ regen_target: newTarget }).eq('id', user.id);
          }
      } else if (currentHearts >= maxHearts) {
          // Fix: Ensure we don't start with more hearts than allowed (if demoted while offline)
          if (currentHearts > maxHearts) currentHearts = maxHearts;
          targetTime = null;
      }

      setTier(correctTier);
      setXp(finalXp);
      setHearts(currentHearts);
      setRegenTarget(targetTime);

      // Unlocks Logic (Legacy data load only)
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
  }, [user]);

  // --- 2. REALTIME LISTENER ---
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`game_profile_${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
          // If DB updates from Admin Dashboard, reflect it here
          if (payload.new.xp !== undefined && payload.new.tier !== 'archmage') {
             const newXp = payload.new.xp;
             setXp(newXp);
             
             // Recalc tier
             const newTier = calcTierFromXp(newXp, payload.new.tier);
             setTier(newTier);

             // --- FIX: Check heart cap on remote update ---
             setHearts(currentHearts => {
                 const newMax = getMaxHearts(newTier);
                 if (currentHearts > newMax) return newMax;
                 return currentHearts;
             });
          }
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
        if (error) console.error("❌ CRITICAL SAVE ERROR:", error.message);
    } catch (err) {
        console.error("Save Execution Failed:", err);
    }
  };

  // --- 4. XP ACTIONS (WITH TIER UPDATE) ---
  
  const gainXp = (amount) => {
    if (isArchmage) return;
    
    const newXp = xp + amount;
    const newTier = calcTierFromXp(newXp, tier); // ⬆️ Check for promotion
    
    setXp(newXp); 
    setTier(newTier);

    saveToCloud({ xp: newXp, tier: newTier });
  };

  // Used for Hints, Grimoire, Council of Elders
  const spendXp = (amount) => {
    if (isArchmage) return;
    
    const newXp = Math.max(0, xp - amount);
    const newTier = calcTierFromXp(newXp, tier); // ⬇️ Check for demotion
    
    // --- FIX: Cap hearts if tier drops ---
    const newMaxHearts = getMaxHearts(newTier);
    let finalHearts = hearts;
    let newRegenTarget = regenTarget;

    if (hearts > newMaxHearts) {
        finalHearts = newMaxHearts;
        newRegenTarget = null; // We are full at the lower tier
    }

    setXp(newXp);
    setTier(newTier);
    if (finalHearts !== hearts) {
        setHearts(finalHearts);
        setRegenTarget(newRegenTarget);
    }

    const updates = { xp: newXp, tier: newTier };
    if (finalHearts !== hearts) {
        updates.hearts = finalHearts;
        updates.regen_target = newRegenTarget;
    }

    saveToCloud(updates);
  };

  const completeActivity = async (activityId, amount) => {
    const safeId = String(activityId);
    if (completedIds.has(safeId)) return false; 
    
    const newSet = new Set(completedIds);
    newSet.add(safeId);
    setCompletedIds(newSet);
    localStorage.setItem(`nimue_completed_${user?.id}`, JSON.stringify([...newSet]));
    
    gainXp(amount); // This will handle tier updates internally
    
    if (user) await supabase.from('activity_log').insert({ user_id: user.id, activity_id: safeId, xp_gained: amount });
    return true; 
  };

  const takeDamage = (amount = 1) => { 
      if (isInfinite) return; 
      const max = getMaxHearts(tier);
      const newVal = Math.max(0, hearts - amount);
      let newTarget = regenTarget;
      
      // If we dropped below max, start regen timer
      if (hearts >= max && newVal < max) {
          const duration = getRegenDuration(tier);
          newTarget = new Date(Date.now() + duration).toISOString();
          setRegenTarget(newTarget);
      }
      setHearts(newVal);
      saveToCloud({ hearts: newVal, regen_target: newTarget });
  };

  const buyHeartWithXp = () => {
      if (isArchmage) return { success: true, message: getText('adminOverride') };
      
      const COST = 50;
      const currentMax = getMaxHearts(tier);
      
      if (hearts >= currentMax) return { success: false, message: getText('healthFull') };
      if (xp < COST) return { success: false, message: getText('notEnoughXp') };

      // Calculate New State
      const newXp = xp - COST;
      const newTier = calcTierFromXp(newXp, tier); // ⬇️ Possible Demotion!
      
      // Calculate intended hearts
      let newHearts = hearts + 1;
      
      // --- FIX: Cap hearts against the NEW tier limit ---
      // If buying the heart costs enough XP to drop us below Grand Magus,
      // we must ensure we don't end up with more hearts than the new tier allows.
      const newMaxHearts = getMaxHearts(newTier);
      if (newHearts > newMaxHearts) {
          newHearts = newMaxHearts;
      }
      
      let newTarget = newHearts >= newMaxHearts ? null : regenTarget;

      // Update State
      setXp(newXp);
      setHearts(newHearts);
      setTier(newTier);
      setRegenTarget(newTarget);
      
      saveToCloud({ xp: newXp, hearts: newHearts, tier: newTier, regen_target: newTarget });
      return { success: true, message: getText('vitalityRestored') };
  };

  const buyFullRestore = () => {
      const max = getMaxHearts(tier);
      setHearts(max);
      setRegenTarget(null);
      saveToCloud({ hearts: max, regen_target: null });
      return { success: true, message: getText('restorationComplete') };
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
    takeDamage, 
    gainXp, 
    spendXp, // Use this for Council/Hints/Grimoire
    completeActivity,
    
    // Always true now, as all apps are free
    hasAccess: () => true,
    
    unlocks: tempUnlocks, 
    buyHeartWithXp, 
    buyFullRestore,
    level: Math.floor(xp / 100) + 1, 
    username: user?.email ? user.email.split('@')[0] : "Student"
  };

  return <GameContext.Provider value={value}>{!loading && children}</GameContext.Provider>;
}

export const useGameLogic = () => useContext(GameContext);