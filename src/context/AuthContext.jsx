import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

// ▼▼▼ THE FIX: GLOBAL LOCK (Survives Strict Mode Remounts) ▼▼▼
let validationInProgress = false;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState(null);

  // YOUR ARCHMAGE ID
  const ARCHMAGE_ID = '69a13b7d-53c3-40e0-8ad2-8b93440e7aad';

  // --- 1. DEVICE FINGERPRINTING ---
  useEffect(() => {
    let storedId = localStorage.getItem('nimue_device_id');
    if (!storedId) {
        storedId = crypto.randomUUID();
        localStorage.setItem('nimue_device_id', storedId);
    }
    setDeviceId(storedId);
  }, []);

  // --- 2. AUTH LISTENER ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
          // Check Ban Status
          const { data: profile } = await supabase
            .from('profiles')
            .select('banned, ban_reason')
            .eq('id', session.user.id)
            .single();

          if (profile?.banned) {
            await supabase.auth.signOut();
            alert(`⛔ ACCOUNT TERMINATED ⛔\n\nReason: ${profile.ban_reason || "Violation of Academy Rules"}`);
            setUser(null);
          } else {
            setUser(session.user);
            validateSessionSecurity(session.user.id, session.user.email);
          }
      }
      setLoading(false);
    };

    // Only run checkUser if we aren't already listening (Basic check)
    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
          setUser(session.user);
          // Only validate on explicit sign-in events to reduce noise
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
              validateSessionSecurity(session.user.id, session.user.email);
          }
      } else {
          setUser(null);
      }
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [deviceId]);

  // --- 3. THE BUREAUCRAT (FIXED SECURITY LOGIC) ---
  const validateSessionSecurity = async (userId, userEmail) => {
      if (!deviceId) return;

      // 🛑 TRAFFIC LIGHT: Check the GLOBAL variable
      if (validationInProgress) {
          console.log("🚦 Security check already in progress. Skipping duplicate.");
          return;
      }
      validationInProgress = true;

      try {
          // 1. GET THE TRUTH FROM THE DB (Rank & Devices)
          const [devicesResult, profileResult] = await Promise.all([
              supabase.from('trusted_devices').select('device_id').eq('user_id', userId),
              supabase.from('profiles').select('tier').eq('id', userId).single()
          ]);

          const trustedDevices = devicesResult.data || [];
          const realTier = profileResult.data?.tier || 'apprentice';

          // 2. GOD MODE CHECK (Immediate Bypass)
          if (realTier === 'archmage') {
              const isTrusted = trustedDevices.some(d => d.device_id === deviceId);
              if (!isTrusted) {
                  await supabase.from('trusted_devices').insert({
                      user_id: userId,
                      device_id: deviceId,
                      device_name: navigator.userAgent
                  });
              }
              return; 
          }

          // 3. MORTAL CHECK (For everyone else)
          const isTrusted = trustedDevices.some(d => d.device_id === deviceId);
          const deviceCount = trustedDevices.length;
          const maxDevices = 2; // Hard limit

          if (!isTrusted) {
              if (deviceCount >= maxDevices) {
                  
                  // Alert the Admin
                  try {
                    await supabase.rpc('send_petition', {
                        target_user_id: ARCHMAGE_ID,
                        topic: `Security: 3rd Device Attempt`,
                        content: `User ${userEmail} tried to login from a 3rd device (Blocked).`,
                        sender: userEmail
                    });
                  } catch (err) {
                    console.error("Failed to send security alert:", err);
                  }

                  // Kick the User
                  await supabase.auth.signOut();
                  alert("🚫 ACCESS DENIED 🚫\n\nYour account is linked to the maximum number of devices.\nThis device is not authorized.");
                  return;
              } else {
                  // Register new device
                  await supabase.from('trusted_devices').insert({
                      user_id: userId,
                      device_id: deviceId,
                      device_name: navigator.userAgent
                  });
              }
          }

          // 4. PARALLEL SESSION CHECK
          const { data: activeSessions } = await supabase
              .from('active_sessions')
              .select('*')
              .eq('user_id', userId);

          const otherActiveSessions = activeSessions?.filter(s => 
              s.device_id !== deviceId && 
              (new Date() - new Date(s.last_seen) < 5 * 60 * 1000) 
          );

          if (otherActiveSessions?.length > 0 && realTier !== 'archmage') {
              console.warn("⚠️ Parallel session detected.");
              
              await supabase.rpc('send_petition', {
                  target_user_id: ARCHMAGE_ID,
                  topic: `Security: Parallel Login`,
                  content: `User ${userEmail} attempted simultaneous login. Session Nuked.`,
                  sender: userEmail
              });

              await supabase.from('active_sessions').delete().eq('user_id', userId);
              await supabase.auth.signOut();
              
              alert("⚡ SECURITY VIOLATION ⚡\n\nSimultaneous logins are strictly forbidden.\nThis incident has been reported to the Archmage.");
              return;
          }

          // Heartbeat
          const mySession = activeSessions?.find(s => s.device_id === deviceId);
          if (!mySession) {
              await supabase.from('active_sessions').insert({
                  user_id: userId,
                  device_id: deviceId,
                  device_name: navigator.userAgent
              });
          } else {
              await supabase.from('active_sessions').update({ last_seen: new Date() }).eq('id', mySession.id);
          }

      } catch (err) {
          console.error("Security Validation Error:", err);
      } finally {
          // 🟢 GREEN LIGHT: Release lock after 2 seconds to allow future checks
          setTimeout(() => {
              validationInProgress = false;
          }, 2000);
      }
  };

  // --- 4. AUTH ACTIONS ---
  
  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  // ▼▼▼ THE ONLY CHANGED FUNCTION ▼▼▼
  const signUp = async (email, password, username, fullName) => {
    // 1. Get the current URL (e.g. https://nimue.ge or http://localhost:5173)
    const origin = window.location.origin;

    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: fullName, 
          tier: 'apprentice', 
          hearts: 5,
          xp: 0
        },
        // 2. CRITICAL: Tell Supabase where to send the user after they click the link
        emailRedirectTo: `${origin}/`, 
      }
    });
  };
  // ▲▲▲ END OF CHANGE ▲▲▲

  const signOut = async () => {
    if (user && deviceId) {
        await supabase.from('active_sessions').delete().match({ user_id: user.id, device_id: deviceId });
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);