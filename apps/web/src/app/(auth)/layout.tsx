import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-full flex-1">{children}</div>;
}
