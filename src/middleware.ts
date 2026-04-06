import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasTrialExpired } from "@/lib/trial";
import { LANG_COOKIE, detectLangFromHeader, normalizeLang } from "@/lib/i18n/config";
import { isNovuaInternalUser } from "@/lib/internal-access";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/accept-invite",
  "/reset-password",
  "/api/webhooks/whatsapp",
  "/api/webhooks/instagram",
];
const INTERNAL_BYPASS = ["/_next", "/favicon.ico"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

function isBypassPath(pathname: string): boolean {
  return INTERNAL_BYPASS.some((path) => pathname.startsWith(path));
}

function applyLanguageCookie(request: NextRequest, response: NextResponse) {
  const current = request.cookies.get(LANG_COOKIE)?.value;
  const lang = current ? normalizeLang(current) : detectLangFromHeader(request.headers.get("accept-language"));

  if (!current || current !== lang) {
    response.cookies.set(LANG_COOKIE, lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isBypassPath(pathname)) {
    const response = NextResponse.next();
    applyLanguageCookie(request, response);
    return response;
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  applyLanguageCookie(request, response);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (!isPublicPath(pathname)) {
      const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
      applyLanguageCookie(request, redirectResponse);
      return redirectResponse;
    }

    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isInternalWorkspace = isNovuaInternalUser(user?.email);

  const trialEndsAt = (user?.user_metadata?.trial_ends_at as string | undefined) ?? null;
  const trialExpired = !isInternalWorkspace && hasTrialExpired(trialEndsAt);

  if (!user && !isPublicPath(pathname)) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
    applyLanguageCookie(request, redirectResponse);
    return redirectResponse;
  }

  if (user && (pathname === "/" || pathname === "/login" || pathname === "/signup")) {
    const redirectResponse = NextResponse.redirect(
      new URL(trialExpired ? "/billing" : "/dashboard", request.url),
    );
    applyLanguageCookie(request, redirectResponse);
    return redirectResponse;
  }

  if (user && trialExpired && pathname !== "/billing" && pathname !== "/auth/signout") {
    const redirectResponse = NextResponse.redirect(new URL("/billing", request.url));
    applyLanguageCookie(request, redirectResponse);
    return redirectResponse;
  }

  if (user && isInternalWorkspace && pathname === "/billing") {
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url));
    applyLanguageCookie(request, redirectResponse);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/((?!.*\\..*|_next/static|_next/image).*)"],
};
