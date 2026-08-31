"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEntitlement } from "@/hooks/useEntitlement";

interface PremiumGateProps {
  children: ReactNode;
  featureLabel?: string;
}

/** The only UI surface that may gate premium features (§23.6). */
export function PremiumGate({ children, featureLabel = "This feature" }: PremiumGateProps) {
  const { isPremium, loading } = useEntitlement();

  if (loading) {
    return (
      <p className="text-sm text-navy/60 dark:text-white/60">Checking your plan…</p>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/10 p-6 text-center">
      <h2 className="text-lg font-semibold text-navy dark:text-white">Premium feature</h2>
      <p className="mt-2 text-sm text-navy/70 dark:text-white/70">
        {featureLabel} is included with EdMar Premium — unlimited practice, simulations, and
        governed grade projections.
      </p>
      <Link
        href="/account/subscription"
        className="mt-4 inline-flex rounded-full bg-royal px-5 py-2.5 text-sm font-semibold text-white hover:bg-royal/90"
      >
        View plans
      </Link>
    </div>
  );
}
