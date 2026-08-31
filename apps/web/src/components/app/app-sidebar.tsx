"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { appNavItems } from "@/lib/mock/app-shell";

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-navy text-white lg:flex">
      <div className="border-b border-white/10 px-6 py-5">
        <Logo variant="light" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="App">
        {appNavItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="w-5 text-center text-base" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl bg-gradient-to-br from-royal to-purple p-4">
          <p className="text-sm font-semibold">Upgrade to Premium</p>
          <p className="mt-1 text-xs text-white/80">
            Unlimited practice, timed simulations, and full progress insights.
          </p>
          <Button href="/pricing" size="sm" className="mt-3 w-full">
            Upgrade now
          </Button>
        </div>
        <Link
          href="/account"
          className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          <span aria-hidden>⚙</span> Settings
        </Link>
      </div>
    </aside>
  );
}
