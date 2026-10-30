"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Lang = "mn" | "en";

interface LanguageContextValue {
  lang: Lang;
  toggleLang: () => void;
  t: (mn: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "mhida-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default to Mongolian on both server and first client render so
  // hydration output always matches (avoids a hydration mismatch).
  // Once mounted, read the visitor's saved preference from
  // localStorage and switch — this is a deliberate one-time sync from
  // an external system (browser storage) on mount, not app state
  // ping-ponging, so we intentionally opt out of the
  // set-state-in-effect lint rule here.
  const [lang, setLang] = useState<Lang>("mn");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "mn" || stored === "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage on mount, see comment above
      setLang(stored);
    }
  }, []);

  const toggleLang = () => {
    setLang((prev) => {
      const next: Lang = prev === "mn" ? "en" : "mn";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  const t = (mn: string, en: string) => (lang === "mn" ? mn : en);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
