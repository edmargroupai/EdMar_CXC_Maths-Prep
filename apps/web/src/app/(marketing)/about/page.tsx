import Link from "next/link";

export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-4xl font-bold text-navy">About EdMar CXC Maths</h1>
        <p className="mt-6 text-lg leading-relaxed text-navy/70">
          EdMar Group builds preparation tools for Caribbean students sitting CSEC
          Mathematics. Our content is structured around the official syllabus, with
          diagnostics, practice, and simulations designed to build real exam confidence.
        </p>
        <div className="mt-8 rounded-2xl border border-warning/30 bg-[#FDEBD0] p-6">
          <p className="text-sm font-semibold text-navy">CXC non-affiliation notice</p>
          <p className="mt-2 text-sm leading-relaxed text-navy/80">
            EdMar CXC Maths is an independent educational platform. We are not affiliated
            with, endorsed by, or connected to the Caribbean Examinations Council (CXC).
          </p>
        </div>
        <p className="mt-8">
          <Link href="/" className="text-sm font-medium text-royal hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </section>
  );
}
