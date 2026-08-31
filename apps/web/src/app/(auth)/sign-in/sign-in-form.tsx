"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { resolvePostAuthPath } from "@/lib/auth/post-auth-destination";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      setError("Sign-in is not configured yet. Contact support.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const userId = signInData.user?.id;
    if (!userId) {
      setError("Sign-in succeeded but no user session was returned. Try again.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      return;
    }

    const destination = resolvePostAuthPath(profile, {
      isAnonymous: signInData.user?.is_anonymous ?? false,
      nextPath: searchParams.get("next"),
    });

    router.push(destination);
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setError(null);

    if (!isSupabaseConfigured()) {
      setError("Sign-in is not configured yet. Contact support.");
      return;
    }

    setOauthLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/home`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    setOauthLoading(false);

    if (oauthError) {
      setError(oauthError.message);
    }
  }

  return (
    <>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        {error ? (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-navy">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm text-navy outline-none ring-royal/30 placeholder:text-navy/40 focus:border-royal focus:ring-2"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-navy">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm text-navy outline-none ring-royal/30 placeholder:text-navy/40 focus:border-royal focus:ring-2"
            placeholder="••••••••"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-navy/70">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-navy/20 text-royal focus:ring-royal"
            />
            Remember me
          </label>
          <Link href="/reset-password" className="font-medium text-royal hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="secondary" className="w-full" size="lg" disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-navy/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-navy/50">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleGoogleSignIn()}
        disabled={oauthLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-navy/15 px-4 py-3 text-sm font-medium text-navy transition-colors hover:bg-sky/50 disabled:opacity-50"
      >
        {oauthLoading ? "Redirecting…" : "Continue with Google"}
      </button>
    </>
  );
}
