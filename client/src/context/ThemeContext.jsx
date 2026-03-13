import { createContext, useContext, useState, useEffect } from 'react';

// Possible values: 'dark' | 'light' | 'system'
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('echo_theme') || 'dark'
  );

  // Apply the right class to <html> whenever theme changes
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark', 'light');
    if (theme === 'dark' || theme === 'light') {
      html.classList.add(theme);
    }
    // 'system' = no class, CSS media query takes over
    localStorage.setItem('echo_theme', theme);
  }, [theme]);

  const setTheme = (value) => {
    if (['dark', 'light', 'system'].includes(value)) setThemeState(value);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
