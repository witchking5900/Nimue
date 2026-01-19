import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

export default function SubscriptionManager() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkSubscription = async () => {
      // 1. Call the Secure Database Function
      const { error } = await supabase.rpc('check_and_downgrade');

      if (!error) {
        // 2. Fetch the latest profile status
        const { data: profile } = await supabase
            .from('profiles')
            .select('tier')
            .eq('id', user.id)
            .single();
            
        // 3. TRACKING LOGIC
        if (profile?.tier === 'magus' || profile?.tier === 'grand_magus') {
            localStorage.setItem('was_magus', 'true');
        }

        // 4. DOWNGRADE DETECTION
        if (profile?.tier === 'apprentice' && localStorage.getItem('was_magus') === 'true') {
            
            console.log("📉 Downgrade detected. Cleaning up...");

            // A. Clear the "I was magus" flag
            localStorage.removeItem('was_magus');

            // B. Clear the banner memory (so it shows up again)
            sessionStorage.removeItem('nimue_banner_dismissed');

            // C. SET THE FLAG FOR GAME CONTEXT (The Fix!)
            sessionStorage.setItem('nimue_force_expiration', 'true');

            // D. Reload
            window.location.reload();
        }
      }
    };

    checkSubscription();
    const interval = setInterval(checkSubscription, 5000);
    return () => clearInterval(interval);

  }, [user]);

  return null; 
}