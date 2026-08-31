import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Sign up",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-12">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-bold text-navy">Create your account</h1>
        <p className="mt-3 text-navy/70">
          Account registration is coming in the next phase. For now, explore the platform
          from the landing page.
        </p>
        <Button href="/" className="mt-8">
          Back to home
        </Button>
        <p className="mt-4 text-sm text-navy/50">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-royal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
