"use client";

import Link from "next/link";
import { PremiumGate } from "@/components/PremiumGate";
import { useEntitlement } from "@/hooks/useEntitlement";

export function SubscriptionPanel() {
  const { tier, isPremium, allowanceRemaining, dailyLimit, daysRemaining, loading } =
    useEntitlement();

  if (loading) {
    return <p className="text-sm text-navy/60">Loading subscription…</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.06)] dark:bg-navy">
        <h2 className="text-lg font-semibold text-navy dark:text-white">Current plan</h2>
        <p className="mt-2 text-navy/70 dark:text-white/70">
          {isPremium ? "Premium — full bank, simulations, and projections." : "Free — limited daily practice."}
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-navy/50">Tier</dt>
            <dd className="font-medium capitalize text-navy dark:text-white">{tier}</dd>
          </div>
          {!isPremium && dailyLimit != null ? (
            <div>
              <dt className="text-navy/50">Questions left today</dt>
              <dd className="font-medium text-navy dark:text-white">
                {allowanceRemaining ?? 0} of {dailyLimit}
              </dd>
            </div>
          ) : null}
          {isPremium && daysRemaining != null ? (
            <div>
              <dt className="text-navy/50">Days remaining</dt>
              <dd className="font-medium text-navy dark:text-white">{daysRemaining}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {!isPremium ? (
        <section className="rounded-2xl border border-royal/20 bg-sky/30 p-6">
          <h3 className="font-semibold text-navy">Upgrade to Premium</h3>
          <p className="mt-2 text-sm text-navy/70">
            Unlimited practice, full simulations, and governed grade-band projections with
            confidence levels.
          </p>
          <p className="mt-4 text-sm text-navy/50">
            Billing checkout ships in the next release. Contact support to enable Premium on your
            account for testing.
          </p>
        </section>
      ) : null}

      <PremiumGate featureLabel="Grade projection preview">
        <p className="text-sm text-navy/70">
          Your account is entitled to grade projections. Open{" "}
          <Link href="/progress" className="text-royal hover:underline">
            Progress
          </Link>{" "}
          to view your latest reading.
        </p>
      </PremiumGate>

      {isPremium ? (
        <section className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.06)] dark:bg-navy">
          <h3 className="font-semibold text-navy dark:text-white">Cancel subscription</h3>
          <p className="mt-2 text-sm text-navy/60 dark:text-white/60">
            Two clicks, no email required — cancel any time from this screen once billing is live.
          </p>
          <button
            type="button"
            disabled
            className="mt-4 text-sm font-medium text-red-700 opacity-60"
          >
            Cancel subscription (available after billing goes live)
          </button>
        </section>
      ) : null}
    </div>
  );
}
