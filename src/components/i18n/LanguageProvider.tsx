"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [langState, setLangState] = useState<Lang>(initialLang);
  const [, startTransition] = useTransition();

  const setLang = useCallback((value: Lang) => {
    if (value === langState) return;

    setLangState(value);
    document.cookie = `${LANG_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = value;
    startTransition(() => {
      router.refresh();
    });
  }, [langState, router]);

  const value = useMemo(
    () => ({
      lang: langState,
      setLang,
      t: (key: DictionaryKey) => translate(langState, key),
    }),
    [langState, setLang],
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
