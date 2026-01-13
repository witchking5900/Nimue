import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Load initial values from localStorage to prevent "White Screen" on refresh
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'standard');
  
  // CHANGED: Default language is now Georgian ('ka') if no preference is saved
  const [language, setLanguage] = useState(() => localStorage.getItem('app-lang') || 'ka');

  // Persist changes to localStorage
  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

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
  if (!context) return {}; // Return empty object instead of crashing if context is missing
  return context;
}