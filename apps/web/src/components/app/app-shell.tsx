"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app/app-sidebar";
import { MobileNav } from "@/components/app/mobile-nav";

type AppShellProps = {
  children: ReactNode;
  sessionStrip?: ReactNode;
};

function isSessionRoute(pathname: string) {
  return pathname.startsWith("/session/");
}

export function AppShell({ children, sessionStrip }: AppShellProps) {
  const pathname = usePathname();
  const collapseSidebar = isSessionRoute(pathname);

  if (collapseSidebar) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-[#F4F7FB] dark:bg-navy">
        {sessionStrip}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 bg-[#F4F7FB] dark:bg-navy">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {sessionStrip}
        <div className="flex-1 overflow-auto pb-20 lg:pb-0">{children}</div>
      </div>
      <MobileNav />
    </div>
  );
}
