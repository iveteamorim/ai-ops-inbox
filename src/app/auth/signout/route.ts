import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEMO_AUTH_COOKIE } from "@/lib/auth/constants";

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  const redirectUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(DEMO_AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
