import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "./env";

const PUBLIC_PREFIXES = [
  "/about",
  "/pricing",
  "/sign-in",
  "/sign-up",
  "/reset-password",
  "/auth/callback",
  "/onboarding",
];

const APP_PREFIXES = [
  "/home",
  "/practice",
  "/progress",
  "/simulate",
  "/diagnostic",
  "/account",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAppPath(pathname: string): boolean {
  return APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  const { url, key } = getSupabasePublicEnv();
  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isPublicPath(pathname)) {
    if (
      user &&
      !user.is_anonymous &&
      (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))
    ) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed_at")
        .eq("id", user.id)
        .maybeSingle();

      const destination = profile?.onboarding_completed_at
        ? "/home"
        : "/onboarding/value";
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return response;
  }

  if (!isAppPath(pathname)) {
    return response;
  }

  if (!user) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) {
    if (user.is_anonymous) {
      return NextResponse.redirect(new URL("/onboarding/first-question", request.url));
    }
    return NextResponse.redirect(new URL("/onboarding/value", request.url));
  }

  return response;
}
