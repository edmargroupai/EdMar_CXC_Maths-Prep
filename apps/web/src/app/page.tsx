import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { brandPrimary, FREE_ENTITLEMENT_VIEW } from "@/lib/entitlement";

export default async function Home() {
  const configured = isSupabaseConfigured();
  let reachable = false;

  if (configured) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.getSession();
      reachable = !error;
    } catch {
      reachable = false;
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-16">
      <main className="w-full max-w-xl rounded-2xl border border-black/8 bg-white p-8 shadow-sm dark:border-white/12 dark:bg-zinc-950">
        <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
          EdMar Group
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          CXC Maths Prep
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          GitHub, Supabase, and Vercel are wired for this project. Shared
          packages are live — daily limit {FREE_ENTITLEMENT_VIEW.dailyLimit}{" "}
          questions on the free tier.
        </p>
        <p className="mt-2 text-xs text-zinc-500" style={{ color: brandPrimary }}>
          @edmar/types · @edmar/design
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          <StatusRow
            label="Supabase env"
            ok={configured}
            detail="NEXT_PUBLIC_SUPABASE_URL and publishable key"
          />
          <StatusRow
            label="Supabase reachability"
            ok={reachable}
            detail="Auth session check against the linked project"
          />
          <StatusRow
            label="GitHub repo"
            ok
            detail="edmargroupai/EdMar_CXC_Maths-Prep"
          />
        </ul>
      </main>
    </div>
  );
}

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-black/6 px-4 py-3 dark:border-white/10">
      <span
        aria-hidden
        className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-500"}`}
      />
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-zinc-500">{detail}</p>
      </div>
    </li>
  );
}
