import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState(null);

  // YOUR ARCHMAGE ID (For alerts)
  const ARCHMAGE_ID = '9177228f-6e97-4ebe-9dcc-f8ee4cce8026';

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
          // 2.1 CHECK IF BANNED
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
            validateSessionSecurity(session.user.id, session.user.email, session.user);
          }
      }
      setLoading(false);
    };

    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
          setUser(session.user);
          validateSessionSecurity(session.user.id, session.user.email, session.user);
      } else {
          setUser(null);
      }
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [deviceId]);

  // --- 3. THE BUREAUCRAT (SECURITY LOGIC) ---
  const validateSessionSecurity = async (userId, userEmail, fullUserObject) => {
      if (!deviceId) return;

      const { data: trustedDevices } = await supabase
          .from('trusted_devices')
          .select('device_id')
          .eq('user_id', userId);

      const isTrusted = trustedDevices?.some(d => d.device_id === deviceId);
      const deviceCount = trustedDevices?.length || 0;

      // God Mode Check
      const maxDevices = (fullUserObject?.user_metadata?.tier === 'archmage') ? 999 : 2;

      if (!isTrusted) {
          if (deviceCount >= maxDevices) {
              await supabase.auth.signOut();
              
              if (maxDevices === 2) {
                  await supabase.rpc('send_petition', {
                      target_user_id: ARCHMAGE_ID,
                      topic: `Security: 3rd Device Attempt`,
                      content: `User ${userEmail} tried to login from a 3rd device (Blocked).`,
                      sender: userEmail
                  });
              }

              alert("🚫 ACCESS DENIED 🚫\n\nYour account is linked to the maximum number of devices.\nThis device is not authorized.");
              return;
          } else {
              await supabase.from('trusted_devices').insert({
                  user_id: userId,
                  device_id: deviceId,
                  device_name: navigator.userAgent
              });
          }
      }

      const { data: activeSessions } = await supabase
          .from('active_sessions')
          .select('*')
          .eq('user_id', userId);

      const otherActiveSessions = activeSessions?.filter(s => 
          s.device_id !== deviceId && 
          (new Date() - new Date(s.last_seen) < 5 * 60 * 1000) 
      );

      const isArchmage = fullUserObject?.user_metadata?.tier === 'archmage';

      if (otherActiveSessions?.length > 0 && !isArchmage) {
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
  };

  // --- 4. AUTH ACTIONS ---
  
  // LOGIN
  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  // REGISTER (ეს ფუნქცია აკლდა!)
  const signUp = async (email, password, username, fullName) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: fullName, // გვინდა რომ სახელი შეინახოს მეტამონაცემებში
          tier: 'apprentice',  // სტანდარტული ტიერი
          hearts: 5,
          xp: 0
        }
      }
    });
  };

  const signOut = async () => {
    if (user && deviceId) {
        await supabase.from('active_sessions').delete().match({ user_id: user.id, device_id: deviceId });
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  // signUp დავამატეთ აქ 
  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);