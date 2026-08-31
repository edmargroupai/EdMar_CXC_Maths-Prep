/** Where to send a user immediately after sign-in or OAuth callback. */
export function resolvePostAuthPath(
  profile: { onboarding_completed_at: string | null } | null,
  options: { isAnonymous: boolean; nextPath?: string | null },
): string {
  if (profile?.onboarding_completed_at) {
    const next = options.nextPath?.trim();
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      return next;
    }
    return "/home";
  }

  if (options.isAnonymous) {
    return "/onboarding/first-question";
  }

  return "/onboarding/value";
}
