import { createContext, useContext, useState, ReactNode } from 'react';
import T, { Lang, TranslationKey } from '../data/translations';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  tf: (key: TranslationKey, vars: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const STORAGE_KEY = 'thub_lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    return stored && (stored === 'en' || stored === 'ka' || stored === 'ru') ? stored : 'en';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: TranslationKey): string =>
    (T[lang] as Record<string, string>)[key] ?? (T.en as Record<string, string>)[key] ?? key;

  const tf = (key: TranslationKey, vars: Record<string, string | number>): string => {
    let str = t(key);
    for (const [k, v] of Object.entries(vars)) {
      str = str.split(`{{${k}}}`).join(String(v));
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tf }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
