import Link from "next/link";

export const metadata = {
  title: "Terms of use",
  description: "Terms governing use of EdMar CXC Maths.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-navy">Terms of use</h1>
      <p className="mt-2 text-sm text-navy/60">Last updated: August 2026</p>

      <div className="prose prose-navy mt-8 max-w-none text-navy/80">
        <p>
          By using EdMar CXC Maths you agree to these terms. If you do not agree, do not use the
          service.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-navy">Educational purpose</h2>
        <p className="mt-4">
          EdMar is an independent examination-readiness platform. It is{" "}
          <strong>not affiliated with or endorsed by CXC</strong>. Projected grade bands are
          evidence-based estimates from your EdMar practice — not CXC results or guarantees. See our{" "}
          <Link href="/readiness/explainer" className="text-royal hover:underline">
            readiness explainer
          </Link>{" "}
          for disclosure details.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-navy">Subscriptions</h2>
        <p className="mt-4">
          Premium plans are billed through our web payment processor. Price, billing period, and
          cancellation terms are shown before purchase. You may cancel from{" "}
          <Link href="/account/subscription" className="text-royal hover:underline">
            Subscription
          </Link>{" "}
          without emailing support once billing is live.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-navy">Acceptable use</h2>
        <p className="mt-4">
          Do not scrape, redistribute, or attempt to extract unpublished question content. Do not
          interfere with assessment integrity or attempt to bypass entitlement limits.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-navy">Minimum age</h2>
        <p className="mt-4">
          You must be at least 13 years old to create an account. Users under 18 should use EdMar
          with a parent or guardian&apos;s knowledge.
        </p>
      </div>
    </div>
  );
}
