"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { type DictionaryKey, translate } from "@/lib/i18n/dictionaries";
import { LANG_COOKIE, type Lang } from "@/lib/i18n/config";

type LanguageContextValue = {
  lang: Lang;
  setLang: (value: Lang) => void;
  t: (key: DictionaryKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: React.ReactNode;
}) {
  const [langState, setLangState] = useState<Lang>(initialLang);

  function setLang(value: Lang) {
    setLangState(value);
    document.cookie = `${LANG_COOKIE}=${value}; path=/; max-age=31536000`;
    document.documentElement.lang = value;
  }

  const value = useMemo(
    () => ({
      lang: langState,
      setLang,
      t: (key: DictionaryKey) => translate(langState, key),
    }),
    [langState],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useI18n must be used within LanguageProvider");
  }

  return context;
}
