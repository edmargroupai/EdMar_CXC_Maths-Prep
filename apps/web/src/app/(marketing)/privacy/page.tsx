import Link from "next/link";

export const metadata = {
  title: "Privacy policy",
  description: "How EdMar CXC Maths collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-navy">Privacy policy</h1>
      <p className="mt-2 text-sm text-navy/60">Last updated: August 2026</p>

      <div className="prose prose-navy mt-8 max-w-none text-navy/80">
        <p>
          EdMar Group operates EdMar CXC Maths (&quot;EdMar&quot;). This policy explains what we
          collect, why we collect it, and your rights.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-navy">What we collect</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>Account details (email, display name, exam sitting preferences)</li>
          <li>Practice attempts, diagnostic and simulation responses</li>
          <li>Readiness snapshots and grade projections (Premium, evidence-gated)</li>
          <li>Subscription and billing metadata (processed by our payment provider)</li>
          <li>Technical logs required to operate and secure the service</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-navy">Sensitive assessment data</h2>
        <p className="mt-4">
          Readiness indices and grade projections are among the most sensitive fields we hold. They
          are computed server-side from your practice evidence, never sold, and never shown to other
          students. Grade bands are withheld when evidence is insufficient or you are not entitled.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-navy">Your rights</h2>
        <p className="mt-4">
          You may export or delete your account from{" "}
          <Link href="/account" className="text-royal hover:underline">
            Account settings
          </Link>
          . Export produces a JSON download of your profile, attempts, and mastery. Deletion marks
          your profile deleted and signs you out — contact support if you need erasure of billing
          records we must retain for law.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-navy">Contact</h2>
        <p className="mt-4">
          Privacy requests:{" "}
          <a href="mailto:privacy@edmargroup.com" className="text-royal hover:underline">
            privacy@edmargroup.com
          </a>
        </p>
      </div>
    </div>
  );
}
