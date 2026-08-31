"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountDataPanel() {
  const router = useRouter();
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleExport() {
    setBusy("export");
    setError(null);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) {
        throw new Error((await res.json()).error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "edmar-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (!res.ok) {
        throw new Error((await res.json()).error ?? "Deletion failed");
      }
      router.push("/sign-in");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deletion failed");
      setConfirmDelete(false);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_4px_24px_rgba(13,27,62,0.06)] dark:bg-navy">
      <p className="font-medium text-navy dark:text-white">Data & privacy</p>
      <p className="mt-1 text-sm text-navy/50 dark:text-white/60">
        Export your practice data or delete your account.
      </p>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void handleExport()}
          className="rounded-full bg-royal px-4 py-2 text-sm font-semibold text-white hover:bg-royal/90 disabled:opacity-50"
        >
          {busy === "export" ? "Exporting…" : "Download my data"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void handleDelete()}
          className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {busy === "delete"
            ? "Deleting…"
            : confirmDelete
              ? "Confirm delete account"
              : "Delete account"}
        </button>
        {confirmDelete && busy !== "delete" ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="text-sm text-navy/50 hover:underline"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </section>
  );
}
