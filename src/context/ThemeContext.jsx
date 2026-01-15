import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // 1. THEME STATE WITH IMPROVED MEMORY
  // We check LocalStorage (Permanent) first, then SessionStorage (Temporary), then default.
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const persistent = localStorage.getItem('nimue-theme-pref'); // Matches WelcomeModal
      const session = sessionStorage.getItem('nimue-theme-session');
      // If nothing is found, default to 'magical' (or 'standard' if you prefer)
      return persistent || session || 'magical';
    }
    return 'magical';
  });

  // 2. LANGUAGE STATE
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app-lang') || 'en';
  });

  // 3. THEME EFFECT (Syncs with CSS & Session)
  useEffect(() => {
    // Save to Session Storage automatically (Keeps theme while tab is open)
    sessionStorage.setItem('nimue-theme-session', theme);

    // Apply CSS classes to the HTML tag (Important for styling)
    const root = window.document.documentElement;
    root.classList.remove('standard', 'magical');
    root.classList.add(theme);
    
    // We do NOT force save to localStorage here. 
    // That is handled by the WelcomeModal only if the user asked to "Remember".
  }, [theme]);

  // 4. LANGUAGE EFFECT (Always Persist)
  useEffect(() => {
    localStorage.setItem('app-lang', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'standard' ? 'magical' : 'standard'));
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    language,
    setLanguage
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) return {}; 
  return context;
}