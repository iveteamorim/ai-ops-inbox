import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { LANG_COOKIE, normalizeLang } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Novua Inbox",
  description: "AI Ops Inbox v1",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);

  return (
    <html lang={lang}>
      <body>
        <LanguageProvider initialLang={lang}>
          <main className="app-shell">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
