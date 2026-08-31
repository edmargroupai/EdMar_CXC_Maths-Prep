import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { SignInForm } from "./sign-in-form";

export const metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <div className="grid min-h-full flex-1 lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between bg-navy p-10 text-white lg:flex">
        <Logo variant="light" />
        <div>
          <h1 className="text-3xl font-bold leading-tight">Welcome back!</h1>
          <p className="mt-3 max-w-sm text-white/70">
            Continue your CSEC Mathematics journey — practice, simulate, and track your
            progress.
          </p>
          <div className="mt-10 flex gap-4 text-4xl" aria-hidden>
            <span className="rounded-2xl bg-white/10 p-4">📚</span>
            <span className="rounded-2xl bg-white/10 p-4">🧭</span>
            <span className="rounded-2xl bg-white/10 p-4">📐</span>
          </div>
        </div>
        <p className="text-xs text-white/40">© EdMar Group</p>
      </aside>

      <main className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-2xl font-bold text-navy">Sign in to your account</h2>
          <p className="mt-2 text-sm text-navy/60">
            New here?{" "}
            <Link href="/sign-up" className="font-medium text-royal hover:underline">
              Create an account
            </Link>
          </p>

          <SignInForm />

          <p className="mt-8 text-center text-sm text-navy/50">
            <Link href="/" className="text-royal hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
