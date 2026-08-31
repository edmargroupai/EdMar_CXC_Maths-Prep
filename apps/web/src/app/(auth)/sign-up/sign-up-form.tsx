"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { completeRegistration } from "@/lib/auth/complete-registration";
import { DEFAULT_TERRITORY, TERRITORY_OPTIONS } from "@/lib/auth/territories";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useOnboardingStore } from "@/stores/onboardingStore";

export function SignUpForm() {
  const router = useRouter();
  const examSittingYear = useOnboardingStore((s) => s.examSittingYear);
  const examSittingMonth = useOnboardingStore((s) => s.examSittingMonth);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [territory, setTerritory] = useState(DEFAULT_TERRITORY);
  const [is13Plus, setIs13Plus] = useState<boolean | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (blocked) {
    return (
      <div className="mt-8 space-y-5 text-left">
        <div className="rounded-xl border border-navy/10 bg-sky/40 px-5 py-6">
          <h2 className="text-lg font-bold text-navy">EdMar is for students aged 13 and over</h2>
          <p className="mt-3 text-sm text-navy/70">
            CSEC Mathematics preparation is designed for secondary students sitting the
            Caribbean Secondary Education Certificate. We cannot create an account for
            students under 13.
          </p>
          <p className="mt-3 text-sm text-navy/70">
            If you made a mistake, you can go back and confirm your age again.
          </p>
        </div>
        <Button type="button" variant="secondary" className="w-full" onClick={() => setBlocked(false)}>
          Go back
        </Button>
        <p className="text-center text-sm text-navy/50">
          <Link href="/" className="text-royal hover:underline">
            Return to home
          </Link>
        </p>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (is13Plus === false) {
      setBlocked(true);
      return;
    }

    if (is13Plus !== true) {
      setError("Please confirm that you are 13 or over.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("Registration is not configured yet. Contact support.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      setMessage("Check your email to confirm your account, then sign in.");
      return;
    }

    try {
      await completeRegistration(supabase, {
        userId,
        displayName: displayName.trim(),
        territory,
        examSittingYear,
        examSittingMonth,
      });
    } catch (profileError) {
      setLoading(false);
      setError(
        profileError instanceof Error
          ? profileError.message
          : "Account created but profile setup failed. Try signing in.",
      );
      return;
    }

    setLoading(false);

    if (data.session) {
      router.push("/home");
      router.refresh();
      return;
    }

    setMessage("Check your email to confirm your account, then sign in.");
  }

  return (
    <form className="mt-8 space-y-5 text-left" onSubmit={handleSubmit}>
      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
          {error.toLowerCase().includes("registered") ? (
            <>
              {" "}
              <Link href="/sign-in" className="font-medium underline">
                Sign in instead
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-sky-200 bg-sky/40 px-4 py-3 text-sm text-navy">
          {message}
        </p>
      ) : null}

      <div>
        <label htmlFor="display-name" className="block text-sm font-medium text-navy">
          Display name
        </label>
        <input
          id="display-name"
          name="displayName"
          type="text"
          autoComplete="name"
          required
          minLength={1}
          maxLength={40}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm text-navy outline-none ring-royal/30 placeholder:text-navy/40 focus:border-royal focus:ring-2"
          placeholder="What should we call you?"
        />
      </div>

      <div>
        <label htmlFor="territory" className="block text-sm font-medium text-navy">
          Territory
        </label>
        <select
          id="territory"
          name="territory"
          value={territory}
          onChange={(e) => setTerritory(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm text-navy outline-none ring-royal/30 focus:border-royal focus:ring-2"
        >
          {TERRITORY_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

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
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm text-navy outline-none ring-royal/30 placeholder:text-navy/40 focus:border-royal focus:ring-2"
          placeholder="At least 8 characters"
        />
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-navy">Are you 13 or over?</legend>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-navy/80">
            <input
              type="radio"
              name="age-gate"
              checked={is13Plus === true}
              onChange={() => setIs13Plus(true)}
              className="h-4 w-4 border-navy/20 text-royal focus:ring-royal"
            />
            Yes
          </label>
          <label className="flex items-center gap-2 text-sm text-navy/80">
            <input
              type="radio"
              name="age-gate"
              checked={is13Plus === false}
              onChange={() => setIs13Plus(false)}
              className="h-4 w-4 border-navy/20 text-royal focus:ring-royal"
            />
            No
          </label>
        </div>
      </fieldset>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
