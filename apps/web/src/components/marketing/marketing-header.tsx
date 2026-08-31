import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Plans" },
  { href: "/about", label: "About" },
  { href: "/#contact", label: "Contact" },
] as const;

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-navy/5 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-navy/70 transition-colors hover:text-navy"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Button href="/sign-in" size="sm">
          Login
        </Button>
      </div>
    </header>
  );
}
