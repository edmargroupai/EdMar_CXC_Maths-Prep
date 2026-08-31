import Link from "next/link";

export const metadata = { title: "Review workspace" };

export default async function ReviewWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/review" className="text-sm text-blue-700 hover:underline">
        ← Review queue
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Question {id}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Ten-block editor, live student preview, and answer-spec harness ship in the next admin
        pass. This workspace reserves the route and staff gate.
      </p>
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Editor placeholder — all ten presentation blocks required before publish (§40).
      </div>
    </div>
  );
}
