import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState(null);

  // --- 1. DEVICE FINGERPRINTING (Kept for analytics only) ---
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
          // Check Ban Status (Optional: Keep this if you still want to ban bad actors manually)
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
            // We still run this, but it no longer blocks anyone
            logSessionHeartbeat(session.user.id);
          }
      }
      setLoading(false);
    };

    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
          setUser(session.user);
          logSessionHeartbeat(session.user.id);
      } else {
          setUser(null);
      }
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [deviceId]);

  // --- 3. THE BUREAUCRAT (RETIRED) ---
  // "WE FIGHT" PROTOCOL: This function now simply notes attendance.
  // It effectively allows UNLIMITED devices and parallel sessions.
  const logSessionHeartbeat = async (userId) => {
      if (!deviceId) return;

      // We just update the 'active_sessions' table so you can see who is online
      // But we DO NOT check for limits or throw alerts anymore.
      
      try {
        const { data: existing } = await supabase
            .from('active_sessions')
            .select('id')
            .eq('user_id', userId)
            .eq('device_id', deviceId)
            .single();

        if (!existing) {
            await supabase.from('active_sessions').insert({
                user_id: userId,
                device_id: deviceId,
                device_name: navigator.userAgent
            });
        } else {
            await supabase.from('active_sessions')
                .update({ last_seen: new Date() })
                .eq('id', existing.id);
        }
      } catch (err) {
          // If the table doesn't exist or errors, we ignore it. Freedom above all.
          console.log("Session heartbeat skipped (Non-critical)");
      }
  };

  // --- 4. AUTH ACTIONS ---
  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  // ✅ ADDED MISSING SIGN UP FUNCTION
  const signUp = async (email, password, username, fullName) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName, // Store the name in metadata
          tier: 'apprentice'   // Default rank
        }
      }
    });
  };

  const signOut = async () => {
    // Optional: Clean up session on logout
    if (user && deviceId) {
        try {
            await supabase.from('active_sessions').delete().match({ user_id: user.id, device_id: deviceId });
        } catch (e) { /* ignore */ }
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