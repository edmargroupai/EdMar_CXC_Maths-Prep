import { DiagnosticRunner } from "@/features/diagnostic/DiagnosticRunner";

export const metadata = { title: "Diagnostic session" };

export default async function DiagnosticSessionPage({
  params,
}: {
  params: Promise<{ diagnosticSessionId: string }>;
}) {
  const { diagnosticSessionId } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-navy">Diagnostic</h1>
      <div className="mt-8">
        <DiagnosticRunner diagnosticSessionId={diagnosticSessionId} />
      </div>
    </div>
  );
}
