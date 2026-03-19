import { createContext, useContext, useState } from 'react';

const LangContext = createContext({ lang: 'en', setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('echo-landing-lang');
    if (saved === 'en' || saved === 'es') return saved;
    return navigator.language?.startsWith('es') ? 'es' : 'en';
  });

  const updateLang = (l) => {
    setLang(l);
    localStorage.setItem('echo-landing-lang', l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang: updateLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
