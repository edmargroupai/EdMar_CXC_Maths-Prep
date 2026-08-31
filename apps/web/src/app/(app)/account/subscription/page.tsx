import Link from "next/link";
import { SubscriptionPanel } from "@/features/account/SubscriptionPanel";

export const metadata = { title: "Subscription" };

export default function SubscriptionPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/account" className="text-sm text-royal hover:underline">
        ← Account
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-navy dark:text-white">Subscription</h1>
      <p className="mt-2 text-navy/60 dark:text-white/70">
        Manage your plan, allowance, and billing.
      </p>
      <div className="mt-8">
        <SubscriptionPanel />
      </div>
    </div>
  );
}
