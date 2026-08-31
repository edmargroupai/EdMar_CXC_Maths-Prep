"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavItems } from "@/lib/mock/app-shell";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-navy/10 bg-white px-2 py-2 lg:hidden"
      aria-label="Mobile"
    >
      {appNavItems.slice(0, 5).map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] font-medium ${
              active ? "text-royal" : "text-navy/50"
            }`}
          >
            <span className="text-lg" aria-hidden>
              {item.icon}
            </span>
            {item.label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
