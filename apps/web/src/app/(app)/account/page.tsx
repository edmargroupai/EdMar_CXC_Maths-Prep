import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy dark:text-white">Account & settings</h1>
      <p className="mt-2 text-navy/60 dark:text-white/70">Profile, subscription, and preferences.</p>

      <section className="mt-8 rounded-2xl bg-white p-5 shadow-[0_4px_24px_rgba(13,27,62,0.06)] dark:bg-navy">
        <p className="font-medium text-navy dark:text-white">Theme</p>
        <p className="mt-1 text-sm text-navy/50 dark:text-white/60">Light, dark, or match your system.</p>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </section>

      <div className="mt-4 space-y-4">
        {[
          { title: "Profile", desc: "Display name, email, exam sitting" },
          { title: "Subscription", desc: "Free tier · 10 questions/day" },
          { title: "Data & privacy", desc: "Export or delete your data" },
        ].map((item) => (
          <button
            key={item.title}
            type="button"
            className="flex w-full items-center justify-between rounded-2xl bg-white p-5 text-left shadow-[0_4px_24px_rgba(13,27,62,0.06)] transition-colors hover:bg-sky/30 dark:bg-navy dark:hover:bg-white/5"
          >
            <div>
              <p className="font-medium text-navy dark:text-white">{item.title}</p>
              <p className="text-sm text-navy/50 dark:text-white/60">{item.desc}</p>
            </div>
            <span className="text-navy/30 dark:text-white/30">›</span>
          </button>
        ))}
      </div>

      <p className="mt-8 flex items-center gap-3">
        <SignOutButton />
        <span className="text-navy/30 dark:text-white/30">·</span>
        <Link href="/" className="text-sm text-royal hover:underline">
          Marketing site
        </Link>
      </p>
    </div>
  );
}
