import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy">Account & settings</h1>
      <p className="mt-2 text-navy/60">Profile, subscription, and preferences.</p>

      <div className="mt-8 space-y-4">
        {[
          { title: "Profile", desc: "Display name, email, exam sitting" },
          { title: "Subscription", desc: "Free tier · 10 questions/day" },
          { title: "Theme", desc: "System" },
          { title: "Data & privacy", desc: "Export or delete your data" },
        ].map((item) => (
          <button
            key={item.title}
            type="button"
            className="flex w-full items-center justify-between rounded-2xl bg-white p-5 text-left shadow-[0_4px_24px_rgba(13,27,62,0.06)] transition-colors hover:bg-sky/30"
          >
            <div>
              <p className="font-medium text-navy">{item.title}</p>
              <p className="text-sm text-navy/50">{item.desc}</p>
            </div>
            <span className="text-navy/30">›</span>
          </button>
        ))}
      </div>

      <p className="mt-8 flex items-center gap-3">
        <SignOutButton />
        <span className="text-navy/30">·</span>
        <Link href="/" className="text-sm text-royal hover:underline">
          Marketing site
        </Link>
      </p>
    </div>
  );
}
