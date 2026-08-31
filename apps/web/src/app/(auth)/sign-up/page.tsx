import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { SignUpForm } from "./sign-up-form";

export const metadata = {
  title: "Sign up",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo className="mx-auto" />
        </div>
        <h1 className="text-center text-2xl font-bold text-navy">Create your account</h1>
        <p className="mt-3 text-center text-navy/70">
          Start your CSEC Mathematics prep with a free diagnostic.
        </p>
        <SignUpForm />
        <p className="mt-6 text-center text-sm text-navy/50">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-royal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
