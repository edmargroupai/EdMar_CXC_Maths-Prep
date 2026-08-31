"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useOnboardingStore } from "@/stores/onboardingStore";

/** Ensures an anonymous Supabase session exists and persists the uid for later linking. */
export async function ensureAnonymousSession(
  supabase: SupabaseClient,
): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();

  if (userData.user) {
    if (userData.user.is_anonymous) {
      useOnboardingStore.getState().setAnonUserId(userData.user.id);
      return userData.user.id;
    }
    return userData.user.id;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw error ?? new Error("Anonymous sign-in failed");
  }

  useOnboardingStore.getState().setAnonUserId(data.user.id);
  return data.user.id;
}
