"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SittingMonth } from "@edmar/types";
import { useOnboardingStore } from "@/stores/onboardingStore";

interface CompleteRegistrationInput {
  userId: string;
  displayName: string;
  territory: string;
  examSittingYear: number | null;
  examSittingMonth: SittingMonth | null;
}

/** Links anonymous onboarding data to the permanent account and marks onboarding complete. */
export async function completeRegistration(
  supabase: SupabaseClient,
  input: CompleteRegistrationInput,
): Promise<void> {
  const { anonUserId, clearAnonUserId } = useOnboardingStore.getState();

  if (anonUserId && anonUserId !== input.userId) {
    const { error: linkError } = await supabase.rpc("fn_link_anonymous_account", {
      p_anon_uid: anonUserId,
    });
    if (linkError) {
      throw linkError;
    }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName,
      territory: input.territory,
      exam_sitting_year: input.examSittingYear,
      exam_sitting_month: input.examSittingMonth,
      age_confirmed_13_plus: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", input.userId);

  if (profileError) {
    throw profileError;
  }

  clearAnonUserId();
}
