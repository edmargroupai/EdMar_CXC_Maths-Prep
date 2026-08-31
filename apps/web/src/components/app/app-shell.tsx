import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { MobileNav } from "@/components/app/mobile-nav";

type AppShellProps = {
  children: ReactNode;
  sessionStrip?: ReactNode;
};

export function AppShell({ children, sessionStrip }: AppShellProps) {
  return (
    <div className="flex min-h-full flex-1 bg-[#F4F7FB]">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {sessionStrip}
        <div className="flex-1 overflow-auto pb-20 lg:pb-0">{children}</div>
      </div>
      <MobileNav />
    </div>
  );
}
