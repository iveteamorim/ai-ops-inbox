import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { LANG_COOKIE, resolveLang } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Novua Inbox",
  description:
    "AI-powered operational inbox that prioritizes conversations by value, urgency, delay, and revenue risk.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const lang = resolveLang(cookieStore.get(LANG_COOKIE)?.value, headerStore.get("accept-language"));

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
