import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Simulation" };

export default async function SimulationSessionPage({
  params,
}: {
  params: Promise<{ examSessionId: string }>;
}) {
  const { examSessionId } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-navy">Paper 01 simulation</h1>
      <p className="mt-2 text-sm text-navy/60">Session {examSessionId}</p>
      <p className="mt-6 text-navy/70">
        Timed runner UI continues in the next iteration — your session is created and anchored on
        the server. Use the demo runner to preview navigation while the full timed flow is wired.
      </p>
      <div className="mt-8 flex gap-4">
        <Button href="/simulate/demo/q/1">Open demo runner</Button>
        <Link href="/simulate" className="text-sm text-royal hover:underline">
          ← Back to simulations
        </Link>
      </div>
    </div>
  );
}
