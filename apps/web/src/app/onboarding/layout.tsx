import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="border-b border-navy/10 px-6 py-4">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
        {children}
      </main>
    </div>
  );
}
