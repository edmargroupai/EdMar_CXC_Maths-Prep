import Link from "next/link";

type LogoProps = {
  variant?: "light" | "dark";
  className?: string;
};

export function Logo({ variant = "dark", className = "" }: LogoProps) {
  const titleClass = variant === "light" ? "text-white" : "text-navy";
  const subtitleClass = variant === "light" ? "text-gold" : "text-royal";

  return (
    <Link href="/" className={`inline-flex flex-col leading-none ${className}`}>
      <span className={`text-lg font-bold tracking-tight ${titleClass}`}>EdMar</span>
      <span className={`text-[0.65rem] font-semibold tracking-[0.2em] ${subtitleClass}`}>
        CXC MATHS
      </span>
    </Link>
  );
}
