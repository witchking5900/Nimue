import { useCallback } from 'react';

export function useSound() {
  const playSound = useCallback((type) => {
    try {
      // 1. Setup Audio Context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // 2. Create Oscillator (Sound Wave) and Gain (Volume)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'correct') {
        // --- MAGICAL DING (Sine Wave) ---
        osc.type = 'sine'; 
        // Start high (1000Hz)
        osc.frequency.setValueAtTime(1000, now);
        // Instant volume, then long fade out (1.5 seconds) for that "crystal" sound
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.05); 
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5); 
        
        osc.start(now);
        osc.stop(now + 1.5);

      } else if (type === 'wrong') {
        // --- BUZZER (Sawtooth Wave) ---
        osc.type = 'sawtooth'; 
        // Low pitch (80Hz)
        osc.frequency.setValueAtTime(80, now);
        // Constant volume then abrupt stop
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.3);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
        
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      console.error("Sound gen error:", e);
    }
  }, []);

  return { playSound };
}