import { Logo } from "@/components/ui/logo";

export function MarketingFooter() {
  return (
    <footer id="contact" className="border-t border-navy/8 bg-white py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Logo />
        <p className="max-w-md text-sm text-navy/60">
          EdMar CXC Maths is an independent preparation platform. Not affiliated with or
          endorsed by CXC.
        </p>
        <p className="text-sm text-navy/50">© {new Date().getFullYear()} EdMar Group</p>
      </div>
    </footer>
  );
}
