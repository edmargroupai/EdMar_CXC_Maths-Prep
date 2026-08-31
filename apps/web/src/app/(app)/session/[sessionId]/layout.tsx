import type { ReactNode } from "react";

export default function SessionLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-full bg-[#F4F7FB] dark:bg-navy">{children}</div>;
}
